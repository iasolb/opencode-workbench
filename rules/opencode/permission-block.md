# Permission block (opencode)

The `permission` block in `opencode.jsonc` is the allowlist for this tool —
the same thing a settings.json allowlist was for a Claude setup. Treat it as
load-bearing, not paperwork.

## Fast Lane owns the allow/deny list

- Fast Lane is the ONLY writer of the `permission` block in
  `opencode.jsonc`. A session that hits a hole logs one line in
  `reports/personas/fast-lane/INBOX.md`, quoting the command verbatim, and
  keeps working.
- The quarterback is the only persona that may self-invoke a Fast Lane.
- A block is never a reason to ask for permission: rewrite the command, or
  report the hole. The click was not the session's work; the form was.

## MCP-routed commands bypass the bash matcher

opencode routes MCP tool calls outside the `Bash(...)` pattern matching
entirely. A deny written as `Bash(gh pr merge:*)` does not match an
MCP-routed GitHub call. Two consequences:

- Keep `git` and `gh` on the plain bash tool so the gate can see them.
- When a rule needs a mechanical guarantee, the deny must cover the MCP
  tool too, not just the shell form. If it cannot, say so in prose and
  honor it there.

## Diagnosis order (abridged)

When a command prompts, in order: is it outside the allowlist's intent
(real hole -> Fast Lane line); is it a form the environment's allowed-list
table does not have (rewrite the command, never widen permissions); is the
matcher reading the pattern wrong (exact-match prefix quirks, quoted
arguments, a whole-word requirement on denied paths).

## Scoped by declaration, never inferred at runtime

Anything that can change state (Edit/Write/Bash and the MCP write tools)
declares its targets as an enumerated list in its own file
(`docs/scoped-by-declaration.md`). A rule or agent never works out at
runtime whether something is in bounds.