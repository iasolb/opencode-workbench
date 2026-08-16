# Git / GitHub (opencode)

The ownership split, adapted for the opencode `permission` block. The
owner's memory bank carries the full incident history and provenance for
everything below; this file settles how the same rules land in opencode.

## GitHub writes are the owner's

`gh pr create`, `gh pr merge`, `gh issue create`/`comment`,
`gh release create`, any other remote-mutating `gh` call: always the
owner's, everywhere, no exceptions. Enforced by the `permission` block in
`opencode.jsonc`, which this workbench ships with `Bash(gh pr create:*)`
etc. denied.

**Sessions may OPEN PRs, merging stays the owner's.** A session that pushes
a feature branch OPENS the PR itself and hands over the real
`https://github.com/<owner>/<repo>/pull/<n>` URL. `gh pr merge` stays
denied. The memory bank repo does not use PRs at all — direct
commit-and-push.

**The `permission` block's only writer is Fast Lane.** A session that hits a
permission hole logs one line in `reports/personas/fast-lane/INBOX.md` and
keeps working; Fast Lane edits the `permission` block, nobody else.

## Repos a session owns (commit AND push)

- The memory bank repo: full sync loop — merge sibling branches, resolve
  conflicts, commit, push.
- The config workbench it is deployed from: creation, commit, push granted;
  PUBLIC repo, so check every diff for PII and secrets (usernames,
  hostnames, IPs, emails, employer/school names, absolute paths) before
  pushing.
- Everything else: `git commit`/`git push` are the owner's. Stop short and
  hand over the command.

## App repos: feature branch -> PR -> main

Every card works on a feature branch cut off `main`, pushes it, opens the
PR, and stops. Never commit to `main` directly. Base is `main` unless the
card says otherwise; check the base is current before branching. One
branch per card while the owner is at the machine; an authorized
unattended lane uses ONE branch for the whole night and one PR at the end.

## Two sessions, one working tree

Assume another live session on the working tree at all times.

- **Commit by pathspec**: `git -C <repo> commit -m "<one line>" -- <path>`.
  Never plain `git commit` (takes the whole index, including what the other
  session staged) and never `git add -A`.
- **A pass that CREATES a file runs `git -C <repo> add <path>` first**;
  `commit -- <path>` silently skips untracked files. `git status --short`
  before claiming done: a `??` line is the tell.
- Re-read any config file immediately before editing it.

## Branches

Each machine lives on its own branch. A SessionStart sync (hook or
instructions step) fetches and merges the sibling branches so memory
converges every session. Conflicts resolve by keeping BOTH sides' facts.
Never leave things staged or unpushed.