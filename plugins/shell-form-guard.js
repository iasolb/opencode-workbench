// Shell-form guard for opencode. The counterpart to the Claude-side
// hooks/shell-form-guard.{sh,ps1}, which opencode had no equivalent of at all
// until 2026-08-21: every form the Claude guard refuses was costing the owner a
// click here instead.
//
// SCOPE, DECLARED AND NOT INFERRED (docs/scoped-by-declaration.md):
//   reads : output.args.command, for input.tool === "bash" ONLY
//   writes: NOTHING. No files, no config, no network.
//   effect: throws to REFUSE a call, or returns. That is the entire surface.
//
// IT CAN NEVER APPROVE, ALLOW, OR SUPPRESS A PROMPT. There is no code path
// here that returns "allowed": refusing and staying silent are the only two
// outcomes, and a permission prompt the runtime would have raised still gets
// raised. That pattern is permanently forbidden (2026-08-03 fleet flag).
//
// FAIL-OPEN BY CONSTRUCTION: every line runs inside a try/catch that swallows
// its own errors. A bug in the rules must never be able to wedge the bash tool,
// so a broken guard degrades to no guard, never to a blocked session.
//
// Install: this file in ~/.config/opencode/plugins/ (or .opencode/plugins/),
// with lib/shell-form-rules.mjs alongside the config root. The rules module
// lives OUTSIDE plugins/ so the loader does not treat it as a plugin.
// Test: node tools/guard-plugin-matrix.mjs  (expects failures=0)

import { analyze } from "../lib/shell-form-rules.mjs";

export const ShellFormGuard = async () => ({
  "tool.execute.before": async (input, output) => {
    let reasons = [];
    try {
      if (input?.tool !== "bash") return;
      const command = output?.args?.command;
      if (typeof command !== "string" || !command.trim()) return;
      reasons = analyze(command);
    } catch {
      // Fail open, deliberately and silently. See the header.
      return;
    }
    if (!reasons.length) return;

    // Throwing is how tool.execute.before refuses a call
    // (https://opencode.ai/docs/plugins). The message is the rewrite
    // instruction, because a block is never a reason to ask for permission:
    // rewriting the command is the session's own work.
    throw new Error(
      "BLOCKED by shell-form-guard: " + reasons.join(" ALSO ") +
      "\nThis form prompts and no permission pattern can fix it. Rewrite it from" +
      " the allowed-command table in docs/command-forms.md: one command per tool" +
      " call, absolute paths instead of a cd chain, and the read/grep/glob tools" +
      " for anything about a file, which can never prompt." +
      "\nDo NOT ask the owner to allow this command."
    );
  },
});
