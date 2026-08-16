# Troubleshooting

## Config is not being picked up

opencode does not hot-reload config. After installing or editing
`opencode.jsonc`, `instructions.md`, `agents/`, or `commands/`, restart
opencode.

## The memory graph is not syncing across machines

The `data/` directory must be a symlink (or, on Windows, a junction) into
the repo's `data/`. Check the link survived the install, and that you are
on the machine's own branch (see `rules/opencode/git-github.md`). If a
`.bak` was promoted from an earlier install, the graph is being written to
a file outside the repo: remove the stale copy and re-run the installer.

## The `permission` block is asking for everything

The `permission` block's `*` entries are `ask`, by design. If a command
you run every day is prompting, add a scoped `allow` entry. Fast Lane is
the only writer of the block; log the hole in
`reports/personas/fast-lane/INBOX.md` and it gets patched there.

## An MCP server fails to start

- **playwright / sequential-thinking / memory / filesystem**: these run via
  `npx -y`. First start downloads the package and can take a while; the
  `timeout` in `opencode.jsonc` is generous but not infinite. If it keeps
  timing out, run the `npx` command once by hand to warm the cache.
- **memory**: the server needs `cwd` to point at a directory that exists
  and is writable (the repo's `data/`). If the graph is empty after a
  start, check the `memory.json` file was created there.
- **github**: uses a local launcher script. Replace the placeholder path
  with your own launcher (the live config on your machine has one).
- **Credential-bearing servers** (gmail, google-workspace, a project
  database, Desktop Commander): not shipped in the public config. Copy
  their shape from your live config; they carry OAuth token files and
  secrets that must stay out of the repo.

## Symlink install fails on Windows

Creating symlinks needs Developer Mode or an elevated prompt. The installer
checks this before touching anything and exits without changes if it
cannot. Enable Developer Mode (Settings > Update & Security > For
developers) or run the installer elevated, then re-run.

## A persona command says "Unknown command"

If a `/command` or `/agent` you expect is not loading, the file is probably
not in the symlinked location, or opencode needs a restart (above). Check
the symlink in the config dir resolves into the repo, and that the
frontmatter has at least `description`.