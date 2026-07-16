import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const tag = process.env.TAG_NAME;
const platform = process.env.PLATFORM;
const build = process.env.BUILD_STATUS;
const submit = process.env.SUBMIT_STATUS;
const destination = process.env.DESTINATION;
const review = process.env.REVIEW_STATUS;

if (!tag || !platform || !build || !submit || !destination || !review) {
  throw new Error(
    "TAG_NAME, PLATFORM, BUILD_STATUS, SUBMIT_STATUS, DESTINATION, and REVIEW_STATUS are required.",
  );
}

function gh(args) {
  return execFileSync("gh", args, { encoding: "utf8" });
}

const tempDirectory = mkdtempSync(join(tmpdir(), "field-log-release-"));
const bodyPath = join(tempDirectory, "body.md");

try {
  const body = gh(["release", "view", tag, "--json", "body", "-q", ".body"]);
  const rowPattern = new RegExp(
    `\\| ${platform} \\| [^|]+ \\| [^|]+ \\| [^|]+ \\| [^|]+ \\|`,
  );
  const nextRow = `| ${platform} | ${build} | ${submit} | ${destination} | ${review} |`;
  const nextBody = rowPattern.test(body)
    ? body.replace(rowPattern, nextRow)
    : body;

  writeFileSync(bodyPath, nextBody);
  gh(["release", "edit", tag, "--notes-file", bodyPath]);
} finally {
  rmSync(tempDirectory, { force: true, recursive: true });
}
