// Shell-form rules for opencode, ported from the Claude-side
// hooks/shell-form-guard.{sh,ps1}. SAME RULE NUMBERS on purpose: the docs and
// docs/permission-incidents.md cite them by number, and renumbering would
// break roughly thirty citations to fix nothing.
//
// WHY THIS EXISTS: opencode had NO shell-form guard at all. Every form below
// costs the owner a click there, while Claude has refused them since
// 2026-08-05. Found 2026-08-21 from three screenshots in one hour, all of them
// compound commands whose SECOND stage matched no permission pattern
// (`... ; echo "exit code $?"`, `... ; Write-Output "found backslash"`).
//
// This module is PURE and DECIDES NOTHING ABOUT PERMISSION. It returns reasons.
// It can never approve, allow, or suppress a prompt: that pattern is
// permanently forbidden (it is how a whole fleet got flagged 2026-08-03).
// It lives OUTSIDE plugins/ so opencode does not try to load it as a plugin.

const INTERPRETERS = ["python", "python3", "py", "pytest", "pip", "pip3"];
const INLINE_CODE_INTERPRETERS = [
  "python", "python3", "py", "node", "ruby", "perl",
  "bash", "sh", "zsh", "powershell", "pwsh", "cmd",
];
// Rule 12 and rule 22 folded into one list: a question about file CONTENTS is
// the grep/read tool, whichever shell backs the bash tool. `select-string` is
// here because opencode on Windows runs PowerShell behind its bash tool, which
// is how `Select-String | ForEach-Object` reached the owner as a prompt.
const FILE_INSPECTION = [
  "grep", "rg", "cat", "head", "tail", "find", "ls", "select-string",
];
const WSL_VALUED_FLAGS = ["-d", "--distribution", "-u", "--user", "--cd", "--shell-type"];

/** Strip quoted spans so a `&&` or `;` inside a commit message is TEXT, not a chain. */
function stripQuoted(command) {
  return command.replace(/"[^"]*"/g, "").replace(/'[^']*'/g, "");
}

/** First word, after any leading VAR=value assignments. */
function firstWord(command) {
  const head = command.trim().replace(/^(\s*[A-Za-z_][A-Za-z0-9_]*=\S*\s+)+/, "");
  return head.split(/\s+/)[0] || "";
}

/** Basename with any .exe dropped, lowercased. `C:\...\python.exe` -> `python`. */
function baseName(token) {
  if (!token) return "";
  return token.split(/[/\\]/).pop().replace(/\.exe$/i, "").toLowerCase();
}

/** Bare name only: a token carrying a path separator is not a bare invocation. */
function bareName(token) {
  if (!token || /[/\\]/.test(token)) return "";
  return token.replace(/\.exe$/i, "").toLowerCase();
}

/**
 * `wsl` is a WRAPPER, so a rule keyed on the first word sees the launcher and
 * not what actually runs. Returns the inner tokens plus whether it unwrapped.
 */
function unwrapWsl(tokens) {
  if (!tokens.length || baseName(tokens[0]) !== "wsl") return { tokens, wrapped: false };
  let rest = tokens.slice(1);
  while (rest.length) {
    const t = rest[0];
    if (WSL_VALUED_FLAGS.includes(t)) rest = rest.slice(2);
    else if (t.startsWith("-")) rest = rest.slice(1);
    else if (t === "env" || /^[A-Za-z_][A-Za-z0-9_]*=/.test(t)) rest = rest.slice(1);
    else break;
  }
  return { tokens: rest, wrapped: true };
}

/**
 * Returns an array of reasons the command should be refused. Empty array means
 * this module has NO OPINION, which is not the same as approval.
 */
export function analyze(command) {
  if (typeof command !== "string" || !command.trim()) return [];

  const unquoted = stripQuoted(command);
  const first = firstWord(command);
  const bare = bareName(first);
  const base = baseName(first);
  const inner = unwrapWsl(command.trim().split(/\s+/));
  const innerBare = bareName(inner.tokens[0] || "");
  const reasons = [];

  // Rule 1.
  if (command.includes("\n")) {
    reasons.push("it spans multiple lines, and the permission matcher treats a newline as a command separator, so the trailing lines match no pattern");
  }
  // Rule 2.
  if (unquoted.includes("&&")) {
    reasons.push("it chains with && , so the matcher sees sub-commands that match no permission pattern");
  }
  // Rule 7. THE most common cause of an opencode prompt as of 2026-08-21: the
  // first stage is allowed and a trailing echo/Write-Output stage matches only
  // the default `*: ask`.
  if (unquoted.includes(";")) {
    reasons.push("it chains with ; , so the matcher sees sub-commands that match no permission pattern (one command per tool call). A trailing echo or Write-Output stage is the usual culprit, and it is never needed: the tool already returns stdout, stderr and the exit status");
  }
  // Rule 6. Strip chains and REDIRECTIONS first; what survives is a real
  // operator. `2>&1` and `&>file` must not be denied by this rule.
  const amp = unquoted.replace(/&&/g, "").replace(/>&/g, "").replace(/&>/g, "");
  if (amp.includes("&")) {
    reasons.push("it uses a single & , which the parser reads as an operator rather than part of a command string, so no permission pattern can match it");
  }
  // Rule 4. Not fired inside wsl: there the wrapper itself is allowed, so a
  // bare interpreter runs silent and denying it would be a FALSE block.
  if (INTERPRETERS.includes(bare) && !/-m\s+venv\b/.test(command)) {
    reasons.push(`it invokes a bare ${bare} , and the allowed form is the ABSOLUTE interpreter path (docs/command-forms.md)`);
  }
  // Rule 21.
  if (INLINE_CODE_INTERPRETERS.includes(base) && /(^|\s)-(c|command)(\s|$)/i.test(unquoted)) {
    reasons.push(`it hands INLINE CODE to ${base} with -c/-Command, which matches no pattern at any path spelling: the allowed interpreter forms are -m <module> and a named script. An inner ; chain also hides from the chain rule inside the quoted payload while the matcher still splits on it. A question about a file is the read or grep tool; if it is genuinely a script, put it in a file and invoke that file`);
  }
  // Rule 5.
  if (bare === "npm" && !command.includes("--prefix")) {
    reasons.push("it invokes npm with no --prefix , so it depends on the cwd and matches no pattern (use npm --prefix <absolute repo path> run <script>)");
  }
  // Rule 10. Whole command: the point is that it hides inside a quoted argument.
  if (command.includes("\\$")) {
    reasons.push("it contains a backslash-escaped dollar , which is the wrong escape in both shells and leaves a dollar sigil the matcher cannot resolve. Use single quotes, or drop the sigil from the text");
  }
  // Rule 11.
  if (/\\[ \t]/.test(command)) {
    reasons.push("it contains backslash-escaped whitespace, which no allowed form needs. Invoke read-only commands BARE rather than by an absolute path to a binary under a directory with a space in it");
  }
  // Rule 18. A null-device target and `2>&1` are deliberately NOT denied.
  const redirect = unquoted.replace(/\d?>&\d/g, "").replace(/&>/g, "");
  if (/>>?\s*(?!\/dev\/null|\$null|NUL\b)\S/.test(redirect)) {
    reasons.push("it REDIRECTS OUTPUT TO A FILE. A redirect prompts even when the bare command is allowed, and the tool already returns stdout and stderr to the session, so run it bare and read what comes back; writing a file is the write tool");
  }
  // Rule 15. Per PIPELINE SEGMENT, so a read-only `sed -n` piped into grep is
  // not a false positive: the -i must belong to the sed/perl/ruby call itself.
  for (const seg of command.split("|")) {
    const segTokens = unwrapWsl(seg.trim().split(/\s+/)).tokens;
    if (!segTokens.length) continue;
    if (!["sed", "perl", "ruby"].includes(baseName(segTokens[0]))) continue;
    if (segTokens.slice(1).some((t) => /^-[A-Za-z]*i/.test(t) || t.startsWith("--in-place"))) {
      reasons.push(`it edits a file IN PLACE with ${baseName(segTokens[0])} , which is the wrong tool: editing a file is the edit tool, and an in-place edit addressed by LINE NUMBER rewrites text nothing read`);
      break;
    }
  }
  // Rules 12 + 22. Fires inside wsl too: this one was never about clicks, it is
  // about reaching for the wrong tool and getting worse answers.
  if (FILE_INSPECTION.includes(innerBare) && unquoted.includes("|")) {
    reasons.push(`it pipes ${innerBare} into another command to answer a question about file CONTENTS. Every stage may be free alone and the pipeline still prompts, because each stage must match a pattern on its own. Use the grep tool (search inside files) or the read tool (one file): neither can prompt, and grep returns structured matches instead of text to reformat`);
  }
  // Rule 17.
  if (innerBare === "bash") {
    const next = inner.tokens[1];
    if (next && !next.startsWith("-")) {
      reasons.push("it runs a script as `bash <path>`, which matches no pattern: script permissions are written as the script PATH itself, so putting bash in front makes the command string start with bash. Invoke the script BARE by its absolute path. `bash -n <path>` is unaffected");
    }
  }
  // Rule 13. Several sessions share one working tree by design.
  if (/(^|\s)git(\s|$)/.test(unquoted) && /(^|\s)commit(\s|$)/.test(unquoted)
      && !/\s--(\s|$)/.test(unquoted) && !unquoted.includes("--amend")
      && !unquoted.includes("--no-edit")) {
    reasons.push('it runs git commit with no " -- <path>" pathspec separator. Plain git commit commits the whole INDEX, including files another session staged. Use git -C <repo> commit -m "<one line>" -- <path> <path>');
  }
  // Rule 20. The /mnt bridge serves STALE bytes to git.
  if (inner.wrapped && innerBare === "git" && /\s\/mnt\//.test(command)) {
    reasons.push("it runs git inside wsl against a /mnt path, where the bridge can serve STALE bytes. Run git on the Windows side against the native path instead");
  }

  return reasons;
}

export const RULE_SOURCE = "hooks/shell-form-guard.{sh,ps1} (Claude side), same rule numbers";
