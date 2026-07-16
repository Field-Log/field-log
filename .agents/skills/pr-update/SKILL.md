---
name: pr-update
description: Update an existing GitHub pull request for the current branch. Use when the user asks to refresh, revise, update, or sync a PR title or description based on current branch commits and changes. Immediately fail if the current branch is main.
---

# PR Update

Update the title and body of an existing GitHub pull request for the current
branch using `gh`. Base the proposed title and description on committed branch
changes, not on uncommitted work.

## Required Guard

Run this check first, before any fetch, status inspection, push, or PR lookup:

```bash
git branch --show-current
```

If the current branch is exactly `main`, stop immediately with an error. Do not
suggest a branch, create a branch, push, fetch, or update a PR from `main`.

## Workflow

1. Confirm the current branch is not `main`.
2. Inspect branch state:
   - `git status --short --branch`
3. Look up the existing PR for the current branch:
   - `gh pr list --head <branch> --json number,url,title,body,state,baseRefName`
4. If no PR exists for the branch, stop and tell the user to create one first.
5. Determine the base branch from `baseRefName`; default to `main` only if the
   PR lookup does not return a base.
6. Fetch the base branch if needed:
   - `git fetch origin <base>`
7. Inspect committed branch changes:
   - `git log --oneline origin/<base>..HEAD`
   - `git diff --stat origin/<base>...HEAD`
   - `git diff --name-only origin/<base>...HEAD`
8. Read `./docs/changesets.md`.
9. If there are no commits relative to the base branch, stop and report that
   there is nothing to summarize.
10. Create or update a branch Changeset:
    - Inspect changed `.changeset/*.md` files relative to the base.
    - If none exists, create one under `.changeset/`.
    - If one exists and no longer matches the branch, update it.
    - Use `"field-log.app"` as the package name.
    - Choose `patch`, `minor`, or `major` from the branch impact. Use `patch`
      for docs, tests, internal tooling, chores, and compatible fixes. Use
      `minor` for new compatible behavior. Use `major` for breaking API,
      database, or mobile compatibility changes.
    - Keep the Changeset description succinct, terse, human friendly, and
      changelog-ready.
11. Generate a proposed title and body from the commits, changed files, and any
   relevant test output already available in the conversation or shell history.
12. Compare the proposed title and body with the current PR values.
13. If neither value needs a meaningful update, report that the PR is already
    current and do not call `gh pr edit`.
14. If one or both values should change, update only those fields:
    - `gh pr edit <number-or-url> --title "<title>"`
    - `gh pr edit <number-or-url> --body "<body>"`
15. Return the PR URL and a concise summary of what changed.

## Title

Write the PR title using the same conventional commit subject format as
`$commit` and `$pr-create`:

```text
<type>(<scope>): <short summary>
```

- Use the current PR title unchanged if it already follows the format and still
  accurately summarizes the branch.
- For a branch with one conventional commit, use that commit subject when it is
  still accurate.
- If the current title or single commit subject is clear but not conventional,
  rewrite it into the conventional commit format.
- For multiple commits, write a concise conventional commit title that
  summarizes the whole branch.
- Use imperative mood, lowercase, no period, and keep the title at or under 72
  characters.
- Read `./docs/commit-lint.md` before choosing a type or scope. It is the
  source of truth for allowed conventional commit types and repository scopes.
- Omit the scope only for truly cross-cutting changes.
- Do not include AI co-authorship or generated-by lines.

## Body

Write the PR body in this format:

```markdown
## Summary
- point form summary
- point form summary

## Testing
- command run, or "Not run (reason)"
```

Keep the body factual. Prefer commit messages, diffs, changed file paths, and
test output over guessing.

When updating an existing body:

- Replace an empty body.
- Replace a body that already uses the standard `## Summary` and `## Testing`
  structure.
- Preserve custom sections that are not part of the standard template whenever
  practical.
- Do not include uncommitted changes as completed work; mention them separately
  in the final response.
- Do not include AI co-authorship or generated-by lines.

## Changeset

Each PR needs one release-impact marker:

```markdown
---
"field-log.app": patch
---

Add release automation.
```

Use the smallest accurate bump. Keep the description one short sentence when
possible. Prefer concrete human wording such as `Add release automation.` or
`Fix mobile update prompts.` Avoid long implementation detail, issue IDs, and
robotic phrasing.

## Error Cases

- On `main`: error immediately and do nothing else.
- Missing `gh`: report that the GitHub CLI is required.
- No existing PR: report that there is no PR for the current branch.
- No branch commits: report that the branch has no commits relative to the base.
- Closed PR: report the state and ask for direction before editing.
