import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, join } from "node:path";

const changesetDirectory = ".changeset";
const allowedBumps = new Set(["major", "minor", "patch"]);

function git(args) {
  return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function getChangedFiles() {
  const baseSha = process.env.BASE_SHA;
  const headSha = process.env.HEAD_SHA;

  if (!baseSha || !headSha) {
    throw new Error("BASE_SHA and HEAD_SHA are required.");
  }

  return git(["diff", "--name-only", baseSha, headSha])
    .split("\n")
    .filter(Boolean);
}

function parseChangesetBumps(filePath) {
  const content = readFileSync(filePath, "utf8");
  const match = content.match(/^---\n([\s\S]*?)\n---/);

  if (!match) {
    return [];
  }

  return match[1]
    .split("\n")
    .map((line) => line.match(/:\s*(major|minor|patch)\s*$/)?.[1])
    .filter(Boolean);
}

const changedFiles = getChangedFiles();
const changedChangesets = changedFiles.filter((file) => {
  return (
    file.startsWith(`${changesetDirectory}/`) &&
    file.endsWith(".md") &&
    basename(file) !== "README.md"
  );
});

if (changedChangesets.length === 0) {
  throw new Error(
    "Every PR must include a Changeset marked major, minor, or patch.",
  );
}

const validChangesets = changedChangesets.filter((file) => {
  const path = join(process.cwd(), file);
  return (
    existsSync(path) &&
    parseChangesetBumps(path).some((bump) => allowedBumps.has(bump))
  );
});

if (validChangesets.length === 0) {
  throw new Error(
    "Changeset files must mark the PR as major, minor, or patch.",
  );
}

console.log(`Found valid Changeset marker: ${validChangesets.join(", ")}`);
