# agents/

Subagents and persona agents for opencode.

## Personas (a session is exactly one)

| Agent | Role |
|---|---|
| `quarterback` | Senior persona: structural faults, security, data integrity, tradeoffs with the owner |
| `intake` | Builds cards (the queue records); never executes jobs |
| `driver` | Works exactly ONE card end to end, then stops |
| `fast-lane` | Process bugs, screenshots, memory cleanup; the only writer of the permission config |
| `cleanup-crew` | Keeps the queue, memory, and persona logs tidy; the only writer of `_LOG.md` |

## QA / review subagents

| Agent | Role |
|---|---|
| `web-qa-crawler` | Adversarially drives a deployed app in the sandboxed browser, reports friction per flow, never fixes |
| `qa-cleanup-crew` | Applies only owner-approved fixes from a crawler report |
| `ux-auditor` | Checks a screen against its audience's UX pattern; never blocks styling freedom |
| `abstraction-pattern-reviewer` | Reviews class/module design against the house abstraction pattern |
| `api-wrapper-reviewer` | Reviews an API wrapper/loader against the house loader shape |

## Conventions

- Frontmatter: `description` (when to use), `mode: primary` for personas,
  `mode: subagent` for the reviewers/QA agents, and `model` (the small,
  cheap model — well-specified work is never gated on the large model).
- The memory bank root is a placeholder (`<your memory bank root>`) that
  each install replaces with the owner's real path.
- Agents are generalized for public use. The memory bank holds the personal
  receipts; this workbench holds the general form.