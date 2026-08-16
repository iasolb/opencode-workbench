# rules/

Standing rules, one file per topic, organized by which model consumes them.
This workbench ships its `shared/` copy plus its own `opencode/` subset,
generalized for a public audience. The owner's memory bank is the single
source for all of them.

## Layout

| Dir | Holds | Read by |
|---|---|---|
| `shared/` | memory-integrity, style, documentation, dev-practices, planning-mode | both Claude and opencode, from the memory bank by path |
| `opencode/` | opencode mechanics: git+push, the permission block, jobs | opencode sessions |

Rules in `shared/` are generalized mirrors of the memory bank's canonical
copies (the bank holds the personal incident receipts; this workbench holds
the general form). Rules in `opencode/` are this tool's model-specific
mechanics.

## shared/

| File | What it settles |
|---|---|
| `memory-integrity.md` | How a memory repo stays honest: the owner outranks memory, capability claims carry their evidence, one fact lives in one place, finished work is deleted rather than annotated. |
| `style.md` | How the tool talks to the owner: no internal ids standing in for meaning, questions asked in forms, links given directly, every turn ending in one concrete action. |
| `documentation.md` | Docstring and comment depth, and where long-form rationale belongs instead. |
| `dev-practices.md` | The tooling decisions that are decisions rather than defaults, and why they need writing down. |
| `planning-mode.md` | What changes when the owner says "enter planning": no edits, delegate exploration, decisions not narration, then one batched implementation pass. |

## opencode/

| File | What it settles |
|---|---|
| `git-github.md` | The ownership split (sessions open PRs, merging stays the owner's), repos a session owns, the feature-branch flow, and pathspec commits, adapted for the `permission` block. |
| `permission-block.md` | The `permission` block as the opencode allowlist, Fast Lane's exclusive write, and how MCP-routed commands bypass the bash matcher. |
| `jobs.md` | The card pipeline adapted for opencode: hard rule, observe->report->approve->execute, the driver's job, model preference, wrap-up lines. |