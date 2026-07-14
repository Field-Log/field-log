# Linear MCP Setup

Linear exposes a remote MCP server at:

```text
https://mcp.linear.app/mcp
```

Use this setup when Codex or Claude Code needs to read Linear issues, inspect
issue metadata such as branch names, or create/update Linear issues without
copying ticket text into chat.

## Codex

Codex CLI, the Codex IDE extension, and the ChatGPT desktop app share MCP
configuration through Codex `config.toml`.

Preferred setup:

```sh
codex mcp add linear --url https://mcp.linear.app/mcp
```

This starts the Linear sign-in flow. After authenticating, verify the server:

```sh
codex mcp list
```

In the Codex TUI, run:

```text
/mcp
```

Manual setup:

1. Open `~/.codex/config.toml`.
2. Add:

```toml
[mcp_servers.linear]
url = "https://mcp.linear.app/mcp"
```

3. Authenticate:

```sh
codex mcp login linear
```

Compatibility note: current Codex docs show the setup above without a feature
flag. Some Linear docs for older Codex versions mention enabling remote MCP
first. If Codex reports that remote MCP is disabled, add the feature flag your
installed Codex version asks for in `~/.codex/config.toml`, then retry the
login.

## Claude Code

Claude Code supports remote HTTP MCP servers. Add Linear with:

```sh
claude mcp add --transport http linear https://mcp.linear.app/mcp
```

Authenticate from inside Claude Code:

```text
/mcp
```

Then verify from the shell:

```sh
claude mcp list
claude mcp get linear
```

By default, `claude mcp add` stores the server for the current project only in
`~/.claude.json`. To make it available in every project, use user scope:

```sh
claude mcp add --transport http --scope user linear https://mcp.linear.app/mcp
```

Use project scope only when the team intentionally wants a checked-in
`.mcp.json`:

```sh
claude mcp add --transport http --scope project linear https://mcp.linear.app/mcp
```

Project-scoped MCP servers require each user to approve the server after they
trust the workspace.

## Troubleshooting

- If authentication gets stuck or Linear returns an internal server error, clear
  saved MCP auth and reconnect:

```sh
rm -rf ~/.mcp-auth
```

- If Claude Code reports that a server with a `url` has no `type`, make sure the
  config uses `type: "http"` or add the server again with `--transport http`.
- If Codex or Claude cannot see Linear tools after setup, restart the client and
  check `/mcp`.

## References

- OpenAI Codex manual: `https://learn.chatgpt.com/docs/extend/mcp.md`
- OpenAI Codex in Linear: `https://learn.chatgpt.com/docs/third-party/linear.md`
- Linear Codex MCP integration: `https://linear.app/integrations/codex-mcp`
- Linear MCP docs: `https://linear.app/docs/mcp`
- Claude Code MCP docs: `https://code.claude.com/docs/en/mcp`
