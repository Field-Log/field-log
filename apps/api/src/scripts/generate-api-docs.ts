import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateApiMarkdownFiles } from "../openapi-markdown.js";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "../../../..");
const docsDirectory = path.join(repositoryRoot, "docs/api-docs");

await rm(docsDirectory, { force: true, recursive: true });
await mkdir(docsDirectory, { recursive: true });

for (const [relativePath, markdown] of await generateApiMarkdownFiles()) {
  const outputPath = path.join(docsDirectory, relativePath);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, markdown, "utf8");
}
