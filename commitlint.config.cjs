const fs = require("node:fs");
const path = require("node:path");

const docsPath = path.join(__dirname, "docs", "commit-lint.md");

function getSectionLines(markdown, heading) {
  const lines = markdown.split(/\r?\n/);
  const sectionLines = [];
  let inSection = false;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      if (inSection) {
        break;
      }

      inSection = line.trim() === `## ${heading}`;
      continue;
    }

    if (inSection) {
      sectionLines.push(line);
    }
  }

  return sectionLines;
}

function extractCodesFromSection(markdown, heading) {
  return getSectionLines(markdown, heading)
    .map((line) => line.match(/^\|\s*`([^`]+)`\s*\|/)?.[1])
    .filter(Boolean);
}

const markdown = fs.readFileSync(docsPath, "utf8");
const types = extractCodesFromSection(markdown, "Types");
const scopes = extractCodesFromSection(markdown, "Scopes");

if (types.length === 0) {
  throw new Error(`No commit types found in ${docsPath}`);
}

if (scopes.length === 0) {
  throw new Error(`No commit scopes found in ${docsPath}`);
}

module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 72],
    "scope-enum": [2, "always", scopes],
    "subject-case": [2, "always", "lower-case"],
    "type-enum": [2, "always", types],
  },
};
