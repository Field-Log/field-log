import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import readline from "node:readline/promises";
import YAML from "yaml";

const repoRoot = process.cwd();
const metadataPath = path.join(repoRoot, "docs/infrastructure-diagram.yaml");
const packageRoots = ["apps", "packages"];
const sourceExtensions = new Set([
  ".cjs",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
]);
const workspaceDependencyPrefix = "workspace:";
const connector = ">";
const defaultDetections = [
  {
    id: "webLogProxy",
    source: "@app/web",
    target: "axiom",
    label: "source scan: browser log proxy -> /api/v0/logs",
    paths: ["apps/web/src/lib/logger.ts"],
    patterns: ["/api/v0/logs", "createProxyTransport"],
  },
  {
    id: "webClerk",
    source: "@app/web",
    target: "clerk",
    label: "source scan: Clerk web SDK",
    paths: ["apps/web/src"],
    patterns: ["@clerk/tanstack-react-start"],
  },
  {
    id: "webAxiom",
    source: "@app/web",
    target: "axiom",
    label: "source scan: createAxiomTransport",
    paths: ["apps/web"],
    patterns: ["createAxiomTransport", "AXIOM_TOKEN"],
  },
];

function assertArray(value, label) {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array.`);
  }

  return value;
}

function createSlug(value) {
  return value
    .replace(/^@/, "")
    .replaceAll("/", "_")
    .replaceAll("-", "_")
    .replaceAll(".", "_")
    .replace(/[^A-Za-z0-9_]/g, "_");
}

function quote(value) {
  return `"${String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "\\n")}"`;
}

function propertyValue(key, value) {
  if (key === "label" || key === "link") {
    return quote(value);
  }

  if (typeof value === "string" && /^[#A-Za-z0-9_<>-]+$/.test(value)) {
    return value;
  }

  return quote(value);
}

function properties(attributes) {
  const entries = Object.entries(attributes).filter(
    ([, value]) => value !== undefined && value !== "",
  );

  if (entries.length === 0) {
    return "";
  }

  return ` [${entries.map(([key, value]) => `${key}: ${propertyValue(key, value)}`).join(", ")}]`;
}

function line(indent, value) {
  return `${"  ".repeat(indent)}${value}`;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function pathExists(filePath) {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

async function findPackageJsonFiles() {
  const files = [];

  for (const root of packageRoots) {
    const rootPath = path.join(repoRoot, root);

    if (!(await pathExists(rootPath))) {
      continue;
    }

    const entries = await readdir(rootPath, { withFileTypes: true });

    for (const entry of entries.sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      if (!entry.isDirectory()) {
        continue;
      }

      const packagePath = path.join(rootPath, entry.name, "package.json");

      if (await pathExists(packagePath)) {
        files.push(packagePath);
      }
    }
  }

  return files.sort((left, right) =>
    path.relative(repoRoot, left).localeCompare(path.relative(repoRoot, right)),
  );
}

async function collectAllWorkspacePackageInfos() {
  const packageJsonFiles = await findPackageJsonFiles();
  const packages = [];

  for (const packageJsonFile of packageJsonFiles) {
    const packageJson = await readJson(packageJsonFile);

    packages.push({
      dependencies: {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      },
      directory: path.relative(repoRoot, path.dirname(packageJsonFile)),
      name: packageJson.name,
    });
  }

  return packages.sort((left, right) =>
    (left.name ?? "").localeCompare(right.name ?? ""),
  );
}

async function collectWorkspacePackages(metadata) {
  const packageJsonFiles = await findPackageJsonFiles();
  const includedNames = new Set([
    ...assertArray(metadata.scope.apps, "scope.apps"),
    ...assertArray(metadata.scope.packages, "scope.packages"),
  ]);
  const excludedNames = new Set([
    ...assertArray(metadata.scope.excludedApps, "scope.excludedApps"),
    ...assertArray(metadata.scope.excludedPackages, "scope.excludedPackages"),
  ]);
  const packages = new Map();

  for (const packageJsonFile of packageJsonFiles) {
    const packageJson = await readJson(packageJsonFile);
    const packageName = packageJson.name;

    if (!includedNames.has(packageName) || excludedNames.has(packageName)) {
      continue;
    }

    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    packages.set(packageName, {
      dependencies,
      directory: path.relative(repoRoot, path.dirname(packageJsonFile)),
      id: createSlug(packageName),
      name: packageName,
    });
  }

  return new Map(
    [...packages.entries()].sort(([leftName], [rightName]) =>
      leftName.localeCompare(rightName),
    ),
  );
}

function reachableWorkspacePackageNames(packageInfos, appNames, excludedNames) {
  const packageByName = new Map(
    packageInfos.map((packageInfo) => [packageInfo.name, packageInfo]),
  );
  const reachable = new Set(appNames);
  const pending = [...appNames];

  while (pending.length > 0) {
    const packageName = pending.pop();
    const packageInfo = packageByName.get(packageName);

    if (!packageInfo) {
      continue;
    }

    for (const [dependencyName, dependencyVersion] of Object.entries(
      packageInfo.dependencies,
    )) {
      if (
        !dependencyVersion.startsWith(workspaceDependencyPrefix) ||
        excludedNames.has(dependencyName) ||
        reachable.has(dependencyName)
      ) {
        continue;
      }

      reachable.add(dependencyName);
      pending.push(dependencyName);
    }
  }

  return reachable;
}

async function refreshMetadata(metadata) {
  const packageInfos = await collectAllWorkspacePackageInfos();
  const excludedApps = new Set(
    assertArray(metadata.scope.excludedApps, "scope.excludedApps"),
  );
  const excludedPackages = new Set(
    assertArray(metadata.scope.excludedPackages, "scope.excludedPackages"),
  );
  const appNames = packageInfos
    .filter((packageInfo) => packageInfo.name.startsWith("@app/"))
    .map((packageInfo) => packageInfo.name)
    .filter((packageName) => !excludedApps.has(packageName));
  const allExcludedNames = new Set([...excludedApps, ...excludedPackages]);
  const reachableNames = reachableWorkspacePackageNames(
    packageInfos,
    appNames,
    allExcludedNames,
  );
  const currentPackageNames = new Set(
    assertArray(metadata.scope.packages, "scope.packages"),
  );
  const packageNames = packageInfos
    .filter((packageInfo) => packageInfo.name.startsWith("@package/"))
    .map((packageInfo) => packageInfo.name)
    .filter(
      (packageName) =>
        !excludedPackages.has(packageName) &&
        (reachableNames.has(packageName) ||
          currentPackageNames.has(packageName)),
    );
  const currentDetectionIds = new Set(
    assertArray(metadata.detections, "detections").map(
      (detection) => detection.id,
    ),
  );
  const detections = [
    ...metadata.detections,
    ...defaultDetections.filter(
      (detection) => !currentDetectionIds.has(detection.id),
    ),
  ];

  return {
    ...metadata,
    generatedBy: "pnpm diagram:infra",
    output: "docs/infrastructure-diagram.eraser",
    source: "docs/infrastructure-diagram.yaml",
    scope: {
      ...metadata.scope,
      apps: appNames,
      packages: packageNames,
      excludedApps: [...excludedApps],
      excludedPackages: [...excludedPackages],
    },
    detections,
  };
}

function collectManifestEdges(packages) {
  const edges = [];

  for (const sourcePackage of packages.values()) {
    for (const [dependencyName, dependencyVersion] of Object.entries(
      sourcePackage.dependencies,
    )) {
      if (
        !dependencyVersion.startsWith(workspaceDependencyPrefix) ||
        !packages.has(dependencyName)
      ) {
        continue;
      }

      edges.push({
        from: sourcePackage.id,
        label: "workspace dependency",
        source: "package.json",
        to: packages.get(dependencyName).id,
      });
    }
  }

  return edges;
}

async function collectSourceFiles(targetPath) {
  const fullPath = path.join(repoRoot, targetPath);
  const stats = await stat(fullPath);

  if (stats.isFile()) {
    return [fullPath];
  }

  const entries = await readdir(fullPath, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((left, right) =>
    left.name.localeCompare(right.name),
  )) {
    if (
      entry.name === "node_modules" ||
      entry.name === "dist" ||
      entry.name === ".output"
    ) {
      continue;
    }

    const entryPath = path.join(fullPath, entry.name);

    if (entry.isDirectory()) {
      files.push(
        ...(await collectSourceFiles(path.relative(repoRoot, entryPath))),
      );
      continue;
    }

    if (sourceExtensions.has(path.extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files.sort((left, right) =>
    path.relative(repoRoot, left).localeCompare(path.relative(repoRoot, right)),
  );
}

async function detectionMatches(detection) {
  const patterns = assertArray(
    detection.patterns,
    `detections.${detection.id}.patterns`,
  );
  const remainingPatterns = new Set(patterns);

  for (const detectionPath of assertArray(
    detection.paths,
    `detections.${detection.id}.paths`,
  )) {
    if (!(await pathExists(path.join(repoRoot, detectionPath)))) {
      continue;
    }

    const files = await collectSourceFiles(detectionPath);

    for (const file of files) {
      const contents = await readFile(file, "utf8");

      for (const pattern of patterns) {
        if (contents.includes(pattern)) {
          remainingPatterns.delete(pattern);
        }
      }

      if (remainingPatterns.size === 0) {
        return true;
      }
    }
  }

  return false;
}

async function collectDetectionEdges(metadata, packages) {
  const edges = [];
  const serviceIds = new Set(
    assertArray(metadata.services, "services").map((service) => service.id),
  );
  const packageNames = new Set(packages.keys());

  for (const detection of assertArray(metadata.detections, "detections")) {
    if (!packageNames.has(detection.source)) {
      throw new Error(
        `detections.${detection.id}.source must reference an included workspace package.`,
      );
    }

    if (
      !packageNames.has(detection.target) &&
      !serviceIds.has(detection.target)
    ) {
      throw new Error(
        `detections.${detection.id}.target must reference an included workspace package or service.`,
      );
    }

    if (!(await detectionMatches(detection))) {
      continue;
    }

    const source = packages.get(detection.source);
    const target = packages.get(detection.target);
    const targetId =
      target?.id ??
      (serviceIds.has(detection.target)
        ? `service_${detection.target}`
        : undefined);

    edges.push({
      from: source.id,
      label: detection.label,
      source: "source scan",
      to: targetId,
    });
  }

  return edges;
}

function createServiceMap(metadata) {
  return new Map(
    assertArray(metadata.services, "services").map((service) => [
      service.id,
      service,
    ]),
  );
}

function createNodeDefinition(id, node, serviceMap) {
  const service = serviceMap.get(node.service);
  const attributes = {
    color: service?.color,
    icon: service?.icon ?? node.icon,
    label: node.label,
  };

  return `${id}${properties(attributes)}`;
}

function createEdgeDefinition(edge) {
  const labelText = edge.label ? `: ${edge.label}` : "";
  return `${edge.from} ${connector} ${edge.to}${labelText}`;
}

function uniqueEdges(edges) {
  const seen = new Set();
  const output = [];

  for (const edge of edges) {
    const key = `${edge.from}\t${edge.to}\t${edge.label}`;

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(edge);
  }

  return output;
}

function renderEnvironment(environment, serviceMap) {
  const output = [];
  const nodesByGroup = new Map();

  for (const node of assertArray(
    environment.nodes,
    `environments.${environment.id}.nodes`,
  )) {
    const group = node.group ?? "Services";
    const groupNodes = nodesByGroup.get(group) ?? [];
    groupNodes.push(node);
    nodesByGroup.set(group, groupNodes);
  }

  output.push(
    line(
      0,
      `${environment.id}${properties({ color: environment.color, label: environment.label })} {`,
    ),
  );

  for (const [group, nodes] of nodesByGroup) {
    const groupId = `${environment.id}_${createSlug(group)}`;
    output.push(line(1, `${groupId}${properties({ label: group })} {`));

    for (const node of nodes) {
      output.push(line(2, createNodeDefinition(node.id, node, serviceMap)));
    }

    output.push(line(1, "}"));
  }

  output.push(line(0, "}"));
  output.push("");

  for (const edge of assertArray(
    environment.edges,
    `environments.${environment.id}.edges`,
  )) {
    output.push(line(0, createEdgeDefinition(edge)));
  }

  return output;
}

function renderSharedPackages(
  packages,
  manifestEdges,
  detectionEdges,
  serviceMap,
) {
  const output = [];

  output.push(
    'shared_packages [label: "Shared packages and detected runtime links", color: "gray"] {',
  );

  for (const packageInfo of packages.values()) {
    output.push(
      line(
        1,
        `${packageInfo.id}${properties({
          icon: packageInfo.name.startsWith("@app/") ? "box" : "package",
          label: `${packageInfo.name}\n${packageInfo.directory}`,
        })}`,
      ),
    );
  }

  for (const service of serviceMap.values()) {
    output.push(
      line(
        1,
        `service_${service.id}${properties({
          color: service.color,
          icon: service.icon,
          label: service.label,
        })}`,
      ),
    );
  }

  output.push("}");
  output.push("");

  for (const edge of uniqueEdges([...manifestEdges, ...detectionEdges])) {
    output.push(createEdgeDefinition(edge));
  }

  return output;
}

function renderLegend() {
  return [
    "",
    `legend${properties({ position: "bottom-right" })} {`,
    `  ${properties({ connection: connector, label: "Runtime or deployment relationship" })}`,
    `  ${properties({ color: "gray", label: "Shared code or tooling" })}`,
    `  ${properties({ color: "green", label: "Production" })}`,
    `  ${properties({ color: "blue", label: "Preview" })}`,
    `  ${properties({ color: "yellow", label: "Development" })}`,
    "}",
  ];
}

function renderFeedbackOverlay(feedbackOverlay) {
  if (feedbackOverlay.length === 0) {
    return [];
  }

  return [
    "",
    "// Interactive feedback overlay. Move durable changes into docs/infrastructure-diagram.yaml.",
    ...feedbackOverlay,
  ];
}

async function generateDiagram(metadata, feedbackOverlay = []) {
  const packages = await collectWorkspacePackages(metadata);
  const serviceMap = createServiceMap(metadata);
  const manifestEdges = collectManifestEdges(packages);
  const detectionEdges = await collectDetectionEdges(metadata, packages);
  const output = [
    `// ${metadata.title}`,
    `// Generated by \`${metadata.generatedBy}\` from \`${metadata.source}\`.`,
    "// Edit the YAML metadata, then rerun the generator.",
    "direction right",
    "colorMode pastel",
    "styleMode plain",
    "typeface clean",
    "",
  ];

  for (const environment of assertArray(
    metadata.environments,
    "environments",
  )) {
    output.push(...renderEnvironment(environment, serviceMap), "");
  }

  output.push(
    ...renderSharedPackages(
      packages,
      manifestEdges,
      detectionEdges,
      serviceMap,
    ),
  );
  output.push(...renderFeedbackOverlay(feedbackOverlay));
  output.push(...renderLegend());

  return `${output.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

async function loadMetadata() {
  return YAML.parse(await readFile(metadataPath, "utf8"));
}

async function loadMetadataDocument() {
  const document = YAML.parseDocument(await readFile(metadataPath, "utf8"));

  if (document.errors.length > 0) {
    throw document.errors[0];
  }

  return document;
}

async function refreshMetadataFile() {
  const document = await loadMetadataDocument();
  const refreshedMetadata = await refreshMetadata(document.toJS());

  document.set("generatedBy", refreshedMetadata.generatedBy);
  document.set("output", refreshedMetadata.output);
  document.set("source", refreshedMetadata.source);
  document.setIn(["scope", "apps"], refreshedMetadata.scope.apps);
  document.setIn(["scope", "packages"], refreshedMetadata.scope.packages);
  document.setIn(
    ["scope", "excludedApps"],
    refreshedMetadata.scope.excludedApps,
  );
  document.setIn(
    ["scope", "excludedPackages"],
    refreshedMetadata.scope.excludedPackages,
  );

  const detectionsNode = document.get("detections", true);

  if (refreshedMetadata.detections.length !== detectionsNode.items.length) {
    document.set("detections", refreshedMetadata.detections);
  }

  await writeFile(metadataPath, String(document));
  process.stdout.write("Wrote docs/infrastructure-diagram.yaml\n");

  return refreshedMetadata;
}

function printDiagram(diagram) {
  process.stdout.write("\n--- Eraser diagram code ---\n\n");
  process.stdout.write(diagram);
  process.stdout.write("\n--- End diagram code ---\n\n");
}

async function writeDiagram(metadata, diagram) {
  await writeFile(path.join(repoRoot, metadata.output), diagram);
}

async function runOnce({ print = false, refresh = false } = {}) {
  const metadata = refresh ? await refreshMetadataFile() : await loadMetadata();
  const diagram = await generateDiagram(metadata);

  if (print) {
    printDiagram(diagram);
  }

  await writeDiagram(metadata, diagram);
  process.stdout.write(`Wrote ${metadata.output}\n`);
}

async function runInteractive() {
  const feedbackOverlay = [];
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    while (true) {
      const metadata = await loadMetadata();
      const diagram = await generateDiagram(metadata, feedbackOverlay);
      printDiagram(diagram);

      const answer = (
        await rl.question(
          "Type 'write', 'refresh', 'regen', 'quit', 'edge <from> > <to>: <label>', or 'append <Eraser code>': ",
        )
      ).trim();
      const normalizedAnswer = answer.toLowerCase();

      if (
        normalizedAnswer === "write" ||
        normalizedAnswer === "accept" ||
        normalizedAnswer === "yes"
      ) {
        await writeDiagram(metadata, diagram);
        process.stdout.write(`Wrote ${metadata.output}\n`);
        return;
      }

      if (
        normalizedAnswer === "quit" ||
        normalizedAnswer === "exit" ||
        normalizedAnswer === "q"
      ) {
        process.stdout.write("No diagram file written.\n");
        return;
      }

      if (normalizedAnswer === "regen" || normalizedAnswer === "") {
        continue;
      }

      if (normalizedAnswer === "refresh") {
        await refreshMetadataFile();
        continue;
      }

      if (answer.startsWith("edge ")) {
        feedbackOverlay.push(answer.slice("edge ".length));
        continue;
      }

      if (answer.startsWith("append ")) {
        feedbackOverlay.push(answer.slice("append ".length));
        continue;
      }

      feedbackOverlay.push(`// Feedback: ${answer}`);
    }
  } finally {
    rl.close();
  }
}

const args = new Set(process.argv.slice(2));

if (args.has("--once")) {
  await runOnce({
    print: args.has("--print"),
    refresh: args.has("--refresh-metadata"),
  });
} else if (args.has("--refresh-metadata")) {
  await refreshMetadataFile();
  await runInteractive();
} else if (!process.stdin.isTTY) {
  await runOnce();
} else {
  await runInteractive();
}
