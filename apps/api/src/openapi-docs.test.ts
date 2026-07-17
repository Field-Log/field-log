import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { generateApiMarkdownFiles } from "./openapi-markdown.js";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "../../..");
const docsDirectory = path.join(repositoryRoot, "docs/api-docs");

describe("generated api docs", () => {
  it("keeps committed Markdown in sync with the OpenAPI document", async () => {
    const expectedFiles = await generateApiMarkdownFiles();
    const committedFiles = await readMarkdownFiles(docsDirectory);

    expect([...committedFiles.keys()].sort()).toEqual(
      [...expectedFiles.keys()].sort(),
    );

    for (const [relativePath, expectedMarkdown] of expectedFiles) {
      expect(committedFiles.get(relativePath)).toBe(expectedMarkdown);
    }
  });
});

async function readMarkdownFiles(directory: string, prefix = "") {
  const files = new Map<string, string>();
  const entries = await readdir(path.join(directory, prefix), {
    withFileTypes: true,
  });

  for (const entry of entries) {
    const relativePath = path.join(prefix, entry.name);

    if (entry.isDirectory()) {
      for (const [nestedPath, contents] of await readMarkdownFiles(
        directory,
        relativePath,
      )) {
        files.set(nestedPath, contents);
      }

      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      files.set(
        relativePath,
        await readFile(path.join(directory, relativePath), "utf8"),
      );
    }
  }

  return files;
}
