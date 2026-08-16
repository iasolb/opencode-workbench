# opencode-workbench

A template for versioning your global opencode configuration in git:
instructions, the `opencode.jsonc` config, agents, commands, and the memory
MCP graph, with optional cross-machine sync so opencode remembers the same
things everywhere you work.

## What you get

- **Versioned `~/.config/opencode`**: your `opencode.jsonc`,
  `instructions.md`, `rules/`, `commands/`, and `agents/` live in a git repo
  and are symlinked into place, so every edit is tracked and portable.
  Credentials, caches, and session state stay out of the repo by
  construction: only the symlinked items are versioned.
- **A memory graph that survives machines**: the `data/` directory holds the
  memory MCP server's graph and is symlinked into the config dir, so facts
  saved on one machine reach the others through git.
- **The permission block**: `opencode.jsonc` carries the allow/deny list,
  the same thing a settings.json allowlist was for a Claude setup. Fast Lane
  is the only writer of it; see `rules/opencode/permission-block.md`.
- **Five personas and fifteen commands**: the same working division of
  labour as the sibling `claude-workbench`, adapted to opencode's native
  `/command` and `/persona` loading.

Everything works on macOS and Windows. `install/mac.sh` and
`install\windows.ps1` each symlink the tracked items into the config dir and
no-op gracefully on the other platform.

## Quick start (single machine)

1. Click **Use this template** on GitHub and create a **private** repo.
   Private matters: your instructions and the memory graph about you will
   live here.
2. Clone it wherever you keep long-lived tooling, for example
   `~/opencode/opencode-workbench`.
3. Run the installer:
   - macOS/Linux: `install/mac.sh`
   - Windows (needs Developer Mode or an elevated prompt): `install\windows.ps1`
4. Replace the `<you>`, `<your memory bank root>`, and `<your projects root>`
   placeholders in `opencode.jsonc` and `instructions.md`.
5. Edit `instructions.md`, read through `rules/` and keep the ones you want.

The installer symlinks each tracked item into the opencode config dir
(existing files are backed up with a `.bak` suffix, never silently
overwritten) and links `data/` so the memory MCP graph syncs. If you ever
move the repo, just re-run the installer. Restart opencode after installing;
it does not hot-reload config.

## Layout

- `opencode.jsonc`: models, permissions, and MCP servers
- `instructions.md`: global instructions, loaded in every session
- `rules/`: standing rules, one file per topic, split into `shared/` (every
  tool reads them) and `opencode/` (this tool's mechanics), see below
- `agents/`: persona agents and QA/review subagents
- `commands/`: slash commands, including the five personas and the
  lightweight + QA/review tools described below
- `data/`: the memory MCP graph (written by the memory server)
- `install/`: the per-platform installers
- `docs/`: troubleshooting

## The rules

`rules/` ships the same nine standing rules as the sibling claude-workbench,
split into `shared/` (memory integrity, style, documentation, dev-practices,
planning-mode) and `opencode/` (git-github, permission-block, jobs), each
adapted to opencode's config shape. `rules/README.md` has a one-line summary
of each.

They are **opinionated on purpose**: a rule file that hedges gives a session
nothing to act on. Read them as a starting position, keep what fits, edit
what does not, and delete the rest.

Every one of them is a rule that exists because something went wrong without
it. The incident is not in the file, but the failure SHAPE it prevents is,
because that is the part that transfers.

## The personas (optional)

The same five-persona division of labour as the claude-workbench, loaded as
native opencode agents. **A session is exactly ONE persona**, chosen when you
start it.

| Command | What it is for |
|---|---|
| `/quarterback` | The senior seat. Structural faults, security and data integrity, tradeoffs talked through with you. Runs the cleanup pass inline at the end of its turn. |
| `/intake` | Turns a request into a job card. Never works the card it writes. |
| `/driver` | Works ONE card end to end, then stops. |
| `/fast-lane` | Process bugs and permission holes. The only writer of the `permission` block, and the lane your screenshots go to. Meant to run in parallel with the others. |
| `/cleanup-crew` | Keeps the queue, the memory files and the persona logs honest: converge, prune, guard priority, fold yesterday's logs into one. |

Five lightweight commands sit alongside them and are NOT personas, so they
have no turn report and no wrap-up ritual: `/debug`, `/explain`, `/find`
(your own docs), `/research` (the open web), and `/scaffold` (structure and
stubs only, never implementations).

## The QA and review tools (optional)

`commands/` also ships five QA/review tools that delegate to the subagents
in `agents/`: `/qa-crawl` (drive a web app through its flows with the
playwright MCP, read-only), `/qa-cleanup` (apply only owner-approved
findings), `/review-abstraction` and `/review-api-wrapper` (house-convention
reviews), and `/audit-ux` (audit a screen against its audience's UX
pattern). See `commands/README.md` and `agents/README.md`. Two agents need
one-time setup before first use: `web-qa-crawler.md` wants your deployed
staging hosts in its authorized targets, and `qa-cleanup-crew.md` wants
your projects root.

## Multi-machine sync (advanced)

Same branch-per-machine model as the claude-workbench: each machine lives
permanently on its own branch, and sessions start by merging the other
machines' branches. Because opencode has no hooks, the merge step is a line
in `instructions.md`'s session start: fetch, merge the sibling branches,
resolve conflicts (keep both sides' facts). See `rules/opencode/git-github.md`.

## What stays out of the repo

The live config dir also holds credentials and session state. None of that is
symlinked from the repo, so none of it can be committed. The repo never
contains secrets unless you put them there; keep API keys, OAuth token files,
and database passwords in their usual homes, not in `opencode.jsonc`. The
credential-bearing MCP servers (gmail, google-workspace, a project database,
Desktop Commander) are deliberately left out of the shipped config — copy
their shape from your live config on the machine that already has them.

## Troubleshooting

See [docs/troubleshooting.md](docs/troubleshooting.md).

## License

MIT.