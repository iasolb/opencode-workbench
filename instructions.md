# Your global opencode module

This file is loaded into every opencode session on every machine you install
the workbench on. Replace each section with your own content and delete
these instructions. Relative paths below (e.g. `rules/memory-integrity.md`)
are relative to your memory bank root; absolute paths are written in full.

## Layout
- Memory bank: `<your memory bank root>` — the single source of truth.
  - `rules/` — standing rules, one file per topic, split into `shared/`
    (both models read these here, never copied into a workbench),
    `claude/` (Claude's mechanics), and `opencode/` (this tool's: git+push,
    the permission block, jobs).
  - `docs/` — specs (the operating model, the command-forms allowlist,
    observe-report-approve, scoped-by-declaration).
  - `queue/` — inbox.md, current.md, global.md, jobs/
  - `memory/` — MEMORY.md + per-project files
  - `reports/` — checklists + `reports/personas/<name>/turns.md` + `_LOG.md`
  - `urgent/` — the phone fast lane; CHECK FIRST every session
- This workbench: `<absolute path to this repo>` — the config that deploys
  here (`opencode.jsonc`, this file, `agents/`, `commands/`).
- Projects: `<your projects root>`

## Session start (every session, before anything else)
1. Read `<your memory bank root>\urgent\` first. Acting on an item includes
   folding it into its permanent home and deleting it, same session
   (`urgent/README.md`).
2. If this is a persona session, state which persona and why at the start of
   your first reply, so the owner can see it loaded from a phone.
3. Read `<your memory bank root>\docs\command-forms.md` before your first
   shell call — it is the allowed-command list.

## Operating model
observe (read-only) -> report to a markdown checklist in `reports/` -> the
owner answers `question`-tool forms, chunked 4 at a time, written into the
report as `- [x] APPROVED` -> a separate executor acts on approved items
only. Spec: `<your memory bank root>\docs\observe-report-approve.md`.
Forms are how the owner is asked anything.

Five personas, a session is exactly one: `/quarterback`, `/fast-lane`,
`/intake`, `/driver`, `/cleanup-crew`. Lightweight commands `/debug`,
`/explain`, `/find`, `/research`, `/scaffold` are not personas and have no
wrap-up. Each persona writes ONE LINE at wrap-up into
`reports/personas/<name>/turns.md` — a pointer at the card report or rule
file holding the detail, never a second copy. Cleanup Crew is the only
writer of `reports/personas/_LOG.md`. Format and fold triggers:
`reports/personas/README.md`. Those files are tool-facing, never the
owner's reading.

## Two golden rules
1. If it can be a pointer it should be — `rules/shared/memory-integrity.md` rule 3.
2. Everything the owner reads is decoded, named by what it is, never by
   internal ids — `rules/shared/style.md`.

## Concurrent sessions and permissions
Assume another live session on the working tree at all times. Commit by
PATHSPEC (`git -C <repo> commit -m "..." -- <path>`), never plain
`git commit`. Report permission holes as one line in
`reports/personas/fast-lane/INBOX.md` and keep working. Fast Lane is the
only writer of the `permission` block in `opencode.jsonc`; the quarterback
is the only persona that may self-invoke a Fast Lane.
`docs/permission-incidents.md` has the case history.

## Model
ONE model, declared once as the top-level `model` in `opencode.jsonc`. No
agent file names a model, so every persona inherits it (per the opencode
docs, a primary agent with no `model` uses the global one and a subagent
inherits from its caller). Never restate the id in an agent or in prose:
pinning it in ten agent files is how a whole persona set ended up naming a
provider that had been deleted. A model choice is a cost preference, never
a gate: never stall a card or ask the owner to restart over model usage.

## Who the owner is (short)
Who they are, what they work on, and the recurring projects you should
recognize without re-explanation. A few paragraphs pays for itself quickly.

## How to work with them
- Workdays Mon–Thu 9-5: phone only — the assistant app, the GitHub app,
  email. No browser-based flows, never the web UI. Fridays they are at the
  computer all day; browser fine. They still "just want to focus on work" —
  keep asks minimal, batched, prefer work that needs nothing from them.
- When they are away: read only what the task requires. The card's Context
  list or task text is the whole reading list.
- Fewest words that stay unambiguous, in chat and in every file. Compression
  is part of quality; sprawl is how corrections get lost.
- Casual, direct tone back is fine. Don't hedge.
- One pointed clarifying question at a decision point is useful; never
  re-ask what they have answered a different way.
- Default to implementing things directly unless a project says otherwise.

## Tooling defaults
Languages, formatters, libraries, and patterns you always want. The stack
you reach for by default, and anything you never want suggested.

## Rules
Standing rules live in `<your memory bank root>\rules\*.md`. Read the ones
relevant to the current work. The opencode-specific mechanics are in
`rules/opencode/`: git-github (ownership split, pathspec commits),
permission-block (Fast Lane owns the allow/deny list, MCP bypass),
jobs (the card pipeline, owner-initiates hard rule).

## MCPs
Configured in `opencode.jsonc`: github (local server), context7 (remote),
playwright, sequential-thinking, memory (graph at this repo's `data/`),
fetch, filesystem, plus any credential-bearing servers you add locally.
MCP-routed commands bypass opencode's bash permission matching — same rule
as the shell tools; see `rules/opencode/permission-block.md`.

## opencode-native mapping (differences from a Claude setup)
- `/persona` and `/command` are real slash commands here; no "Unknown
  command" entry point.
- AskUserQuestion maps to the `question` tool.
- The settings.json allowlist maps to the `permission` block in
  `opencode.jsonc`; Fast Lane owns it.
- Claude hooks map to the behavior ports in this file (session start,
  wrap-up) and in the persona agents.
- A shell-form guard maps to opencode's bash permission rules plus
  `docs/command-forms.md`.