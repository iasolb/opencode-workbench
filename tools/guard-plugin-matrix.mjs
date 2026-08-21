// Test matrix for the opencode shell-form guard. The counterpart to the
// Claude-side tools/guard-matrix.sh, and the reason this plugin is allowed to
// exist: machinery ships with its test.
//
// Run:  node tools/guard-plugin-matrix.mjs
// Pass: the last line reads failures=0
//
// Each case is [expected, command]. "deny" means analyze() must return at least
// one reason; "allow" means it must return NONE. An "allow" here is only ever a
// statement about THIS module having no opinion, never about permission.

import { analyze } from "../lib/shell-form-rules.mjs";

let failures = 0;
let count = 0;

function run(expected, command) {
  count++;
  let reasons;
  try {
    reasons = analyze(command);
  } catch (e) {
    failures++;
    console.log(`FAIL  threw  ${expected.padEnd(5)} ${command}\n      ${e.message}`);
    return;
  }
  const actual = reasons.length ? "deny" : "allow";
  if (actual === expected) {
    console.log(`ok    ${expected.padEnd(5)} ${command}`);
  } else {
    failures++;
    console.log(`FAIL  want=${expected} got=${actual}  ${command}`);
    if (reasons.length) console.log(`      ${reasons[0]}`);
  }
}

console.log("--- the three forms that actually reached the owner, 2026-08-21 ---");
run("deny", 'wsl grep -c "\\\\\\\\" /mnt/c/Users/you/repo/tools/lint-baseline.json ; echo "exit code $?"');
run("deny", 'wsl grep "\\\\\\\\" /mnt/c/Users/you/repo/tools/lint-baseline.json ; Write-Output "found backslash" ; Write-Output "zero backslash - good"');
run("deny", 'Select-String -Path "C:/Users/you/repo/tools/lint.py" -Pattern "replace" | ForEach-Object { "$($_.LineNumber)" }');

console.log("--- rule 1/2/6/7: separators the matcher splits on ---");
run("deny", "ls /home/you\necho done");
run("deny", "cd /home/you/repo && npm run build");
run("deny", "git status ; ls");
run("deny", "/home/you/repo/script.sh & ");

console.log("--- rule 4 and 21: interpreters ---");
run("deny", 'python -c "print(1)"');
run("deny", "pytest tests/");
run("deny", "pip install requests");
run("deny", 'C:\\Users\\you\\AppData\\Local\\Programs\\Python\\Python313\\python.exe -c "import json; print(1)"');
run("deny", '/c/Users/you/repo/.venv/bin/python -c "print(1)"');
run("deny", 'sh -c "ls /home/you"');
run("allow", "python3 -m venv .venv");
run("allow", "/home/you/repo/.venv/bin/python -m pytest /home/you/repo/tests");
run("allow", "C:\\Users\\you\\AppData\\Local\\Programs\\Python\\Python313\\python.exe C:\\Users\\you\\repo\\tools\\lint.py");
run("allow", 'node -e "console.log(1)"');

console.log("--- rule 5: npm ---");
run("deny", "npm run build:css");
run("allow", "npm --prefix /home/you/repo run build:css");

console.log("--- rule 10/11: escapes the matcher cannot resolve ---");
run("deny", 'git -C /home/you/repo log -1 --format="\\$x"');
run("deny", "/c/Program\\ Files/Git/usr/bin/tail -n 30 /home/you/notes.md");

console.log("--- rule 18: output redirect to a file ---");
run("deny", "git -C /home/you/repo diff > /tmp/diff.txt");
run("deny", "git -C /home/you/repo diff >> /tmp/diff.txt");
run("allow", "ls /home/you 2>/dev/null");
run("allow", "grep -rn cd /home/you/repo/hooks 2>&1");

console.log("--- rule 15: in-place stream edit ---");
run("deny", 'sed -i "1,5d" /home/you/repo/queue/inbox.md');
run("deny", "perl -pi -e s/a/b/ /home/you/notes.md");
run("allow", 'sed -n "1,20p" /home/you/notes.md');

console.log("--- rule 12/22: a question about file CONTENTS, piped ---");
run("deny", "cat /home/you/notes.md | head -5");
run("deny", 'grep -h "^order:" /home/you/repo/queue/*.md | sort');
run("deny", "wsl cat /home/you/.zshrc | head -5");
run("allow", 'grep -rn "origin" /home/you/repo/hooks');
run("allow", 'Select-String -Path "C:/Users/you/repo/tools/lint.py" -Pattern "replace"');

console.log("--- rule 17: bash <script> instead of the bare path ---");
run("deny", "bash /home/you/repo/tools/matrix.sh");
run("allow", "bash -n /home/you/repo/hooks/env-report.sh");
run("allow", "/home/you/repo/tools/matrix.sh");

console.log("--- rule 13: git commit with no pathspec ---");
run("deny", 'git -C /home/you/repo commit -m "queue: claim a card"');
run("allow", 'git -C /home/you/repo commit -m "queue: claim a card" -- queue/inbox.md');
run("allow", "git -C /home/you/repo commit --amend -F /tmp/msg.txt");

console.log("--- rule 20: git inside wsl against /mnt ---");
run("deny", "wsl git -C /mnt/c/Users/you/repo status --short");
run("allow", "wsl git -C /home/you/.config/nvim status --short");

console.log("--- allowed forms stay allowed (no false blocks) ---");
run("allow", "git -C /home/you/repo status --short");
run("allow", "ls /home/you/repo/queue");
run("allow", "wsl python3 -m pytest /home/you/proj");
run("allow", "wsl chmod -R 644 /home/you/.config/nvim");
run("allow", "docker compose up -d app");
run("allow", "curl -sS https://example.com");
run("allow", 'git -C /home/you/repo commit -m "fix && polish" -- app/main.py');
run("allow", 'git -C /home/you/repo log --format="commit %H" -- hooks/');

console.log("--- the guard must have NO opinion on a non-bash tool or empty input ---");
run("allow", "");
run("allow", "   ");

console.log(`\ncases=${count}`);
console.log(`failures=${failures}`);
process.exit(failures ? 1 : 0);
