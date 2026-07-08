import type {
  FigjamSnapshot,
  FigjamSummaryNode,
  FigmaComment,
} from "./types.js";

const maxSummaryNodes = 120;

export function summarizeSnapshot(snapshot: FigjamSnapshot): {
  markdown: string;
  nodes: FigjamSummaryNode[];
} {
  const file = asRecord(snapshot.file) ?? {};
  const name = stringValue(file.name) ?? "Untitled Figma/FigJam file";
  const lastModified = stringValue(file.lastModified);
  const document = file.document;
  const nodes = collectSummaryNodes(document);
  const comments = snapshot.comments ?? [];
  const lines = [
    `# ${name}`,
    "",
    `- File key: ${snapshot.fileKey}`,
    `- Fetched at: ${snapshot.fetchedAt}`,
  ];

  if (lastModified) {
    lines.push(`- Last modified: ${lastModified}`);
  }

  lines.push("", "## Notable Nodes");

  for (const node of nodes.slice(0, maxSummaryNodes)) {
    const text = node.characters ? ` - ${singleLine(node.characters)}` : "";
    lines.push(`- ${node.type} ${node.id}: ${node.name ?? "Untitled"}${text}`);
  }

  if (nodes.length > maxSummaryNodes) {
    lines.push(`- ${nodes.length - maxSummaryNodes} additional nodes omitted.`);
  }

  lines.push("", "## Recent Comments");

  for (const comment of comments.slice(0, 25)) {
    lines.push(formatComment(comment));
  }

  if (comments.length === 0) {
    lines.push("- No comments returned.");
  }

  return {
    markdown: `${lines.join("\n")}\n`,
    nodes,
  };
}

function collectSummaryNodes(input: unknown): FigjamSummaryNode[] {
  const nodes: FigjamSummaryNode[] = [];
  const queue = [input];

  while (queue.length > 0) {
    const current = asRecord(queue.shift());
    if (!current) {
      continue;
    }

    const id = stringValue(current.id);
    const type = stringValue(current.type);

    if (id && type) {
      const characters =
        stringValue(current.characters) ??
        stringValue(asRecord(current.text)?.characters);

      if (shouldIncludeNode(type, current, characters)) {
        nodes.push({
          characters,
          id,
          name: stringValue(current.name),
          type,
        });
      }
    }

    const children = current.children;
    if (Array.isArray(children)) {
      queue.push(...children);
    }
  }

  return nodes;
}

function shouldIncludeNode(
  type: string,
  node: Record<string, unknown>,
  characters: string | undefined,
): boolean {
  if (characters) {
    return true;
  }

  if (type.includes("STICKY") || type.includes("SECTION")) {
    return true;
  }

  const name = stringValue(node.name);
  return Boolean(name && name !== "Page 1" && name !== "Untitled");
}

function formatComment(comment: FigmaComment): string {
  const author = comment.user?.handle ?? "Unknown";
  const createdAt = comment.created_at ? ` (${comment.created_at})` : "";
  const message = singleLine(comment.message ?? "");
  return `- ${author}${createdAt}: ${message}`;
}

function asRecord(input: unknown): Record<string, unknown> | undefined {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return undefined;
  }

  return input as Record<string, unknown>;
}

function stringValue(input: unknown): string | undefined {
  return typeof input === "string" && input.trim() ? input : undefined;
}

function singleLine(input: string): string {
  return input.replaceAll(/\s+/g, " ").trim();
}
