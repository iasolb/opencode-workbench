# Jobs (opencode)

The card pipeline, adapted for opencode.

## The hard rule

The owner initiates jobs, never the tool. A session does not author its own
cards and does not flip a gated card runnable. Finding that something needs
a card means saying so and stopping.

## The card pipeline

The observe -> report -> approve -> execute shape
(`docs/observe-report-approve.md`):

1. The owner starts a job (or a session observes a gap and reports it).
2. Intake shapes it into ONE question that produces a yes/no decision, with
   the context (the executor's whole reading list) and constraints, written
   into `queue/inbox.md` or `queue/jobs/` with a `- [ ] pending` approval
   checkbox.
3. The owner approves (`question`-tool forms, chunked four at a time,
   written into the report as `- [x] APPROVED`).
4. A separate driver session works exactly ONE card end to end and stops.
5. Cleanup Crew keeps the queue tidy: no dead cards, no duplicates, nothing
   dangling.

## The driver's job

- The card's Context list or task text IS the whole reading list. Read only
  what the task requires.
- One card per session. If the card asks for more than one thing, do the
  first and report the rest.
- Workday Mon-Thu the owner has only a phone: never propose a flow that
  needs a browser or a web UI. Fridays they are at the computer all day.
- Permission holes go to Fast Lane's INBOX, never fixed by the driver.
- When finished: report to the card's report file, paste real output into
  the Evidence block, then END. Never roll into the next card in the same
  context.

## Model preference

A card may carry `model: cheap` as a cost preference — well-specified work
on the small model — but the small/large split is never a gate. Never stall
a card or ask the owner to restart over model usage.

## Wrap-up

Each persona writes ONE LINE into `reports/personas/<name>/turns.md` — a
pointer at the card report or rule file holding the detail, never a second
copy. Cleanup Crew is the only writer of `reports/personas/_LOG.md`.
Format and fold triggers: `reports/personas/README.md`.