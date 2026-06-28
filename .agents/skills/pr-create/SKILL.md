---
name: pr-create
description: Create a GitHub pull request from the current branch and its commits. Use when the user asks to open, create, draft, or prepare a PR for the current branch. Immediately fail if the current branch is main.
---

# PR Create

Create a GitHub pull request for the current branch using `gh`. Base the title
and body on the commits that are present on the branch and not on the base
branch.

## Required Guard

Run this check first, before any fetch, status inspection, push, or PR lookup:

```bash
git branch --show-current
```

If the current branch is exactly `main`, stop immediately with an error. Do not
suggest a branch, create a branch, push, fetch, or create a PR from `main`.

## Workflow

1. Confirm the current branch is not `main`.
2. Determine the PR base branch. Default to `main` unless the user specifies a
   different base.
3. Inspect branch state:
   - `git status --short --branch`
   - `git log --oneline <base>..HEAD`
4. If there are no commits on the branch relative to the base branch, stop and
   report that there is nothing to open a PR for.
5. If there are uncommitted changes, mention them clearly. Do not include them
   in the PR description as completed work.
6. Push the branch when it has no upstream or the remote is behind:
   `git push -u origin <branch>`.
7. Check whether a PR already exists for the branch:
   `gh pr view --head <branch> --json url,title,state`.
8. If no PR exists, create one:
   `gh pr create --base <base> --head <branch> --title "<title>" --body "<body>"`.
9. Return the PR URL and a concise summary of the created PR.

## Title And Body

Write the PR title from the commit subjects and changed files:

- Use the single commit subject when the branch has one commit and it is clear.
- For multiple commits, write a concise imperative title that summarizes the
  branch.
- Do not include AI co-authorship or generated-by lines.

Write the PR body in this format:

```markdown
## Summary
- point form summary
- point form summary

## Testing
- command run, or "Not run (reason)"
```

Keep the body factual. Prefer commit messages, diffs, and test output over
guessing. If the user asks for a draft PR, pass `--draft`.

## Error Cases

- On `main`: error immediately and do nothing else.
- Missing `gh`: report that the GitHub CLI is required.
- No branch commits: report that the branch has no commits relative to the base.
- Existing PR: do not create a duplicate; return the existing PR URL.
