# commands/

Slash commands for opencode. Two kinds: the five personas, and lightweight
commands that are not personas and have no wrap-up ritual.

## Personas

| Command | Agent | Role |
|---|---|---|
| `/quarterback` | quarterback | Senior: structural faults, security, data integrity, tradeoffs |
| `/intake` | intake | Builds cards |
| `/driver` | driver | Works ONE card end to end |
| `/fast-lane` | fast-lane | Process bugs, screenshots, memory cleanup; patches permission holes |
| `/cleanup-crew` | cleanup-crew | Keeps the queue, memory, and persona logs tidy |

Each persona writes ONE LINE at wrap-up into
`reports/personas/<name>/turns.md` — a pointer at the card report or rule
file holding the detail, never a second copy. Cleanup Crew is the only
writer of `reports/personas/_LOG.md`. Format and fold triggers:
`reports/personas/README.md`.

## Lightweight commands (no wrap-up)

| Command | What it does |
|---|---|
| `/debug` | Diagnose a specific failure and give the fix |
| `/explain` | Explain a file/function in the current codebase |
| `/find` | Find something in the owner's personal docs, not the web |
| `/research` | Research on the open web, report sources |
| `/scaffold` | Structure and stubs ONLY, never implementations |

## QA / review tools

| Command | Agent | Role |
|---|---|---|
| `/qa-crawl` | web-qa-crawler | Drive a deployed app with playwright, report friction per flow |
| `/qa-cleanup` | qa-cleanup-crew | Apply only owner-approved fixes from a crawler report |
| `/audit-ux` | ux-auditor | Audit a screen against its audience's UX pattern; never blocks styling |
| `/review-abstraction` | abstraction-pattern-reviewer | Review class/module design against the house pattern |
| `/review-api-wrapper` | api-wrapper-reviewer | Review an API wrapper against the house loader shape |

## Conventions

- Frontmatter: `description` (what the command does) plus `agent:` when the
  command delegates to a subagent. No `name:` field needed.
- `$ARGUMENTS` is where the invocation text lands. Every command uses it so
  the prompt stays in the command file, not the click.
- Commands are generalized for public use. The memory bank holds the
  personal receipts; this workbench holds the general form.