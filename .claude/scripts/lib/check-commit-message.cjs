#!/usr/bin/env node
/**
 * commit メッセージに CI skip トークンが紛れ込むのを止める commit-msg ガード。
 *
 * ★なぜ機械で止めるか (同じ事故が 2 回起きた):
 *   GitHub は **commit メッセージ内のどこにあっても** skip トークンを拾う。
 *   「引用のつもり」でもワークフローは 1 本も走らず、しかも**成功と区別がつかない**
 *   (run が作られないので「まだ実行中」に見える)。
 *
 *   - 2026-08-05: この罠を文書化する commit の件名にトークンを引用し、その commit 自身が CI を止めた。
 *   - 2026-08-20: `.claude/rules/branch-workflow.md` の該当節を**読んだ直後の** commit で
 *     まったく同じことをした (「[skip ci] の主張を実測に合わせて是正」)。push した 6 commit に
 *     対して run が 0 件になった。
 *
 *   2 回とも「トークンを話題にする commit」で起きている。**文章で注意を促すだけでは防げない**
 *   ことが実測で分かったので、ここで機械的に弾く。
 *
 * ★意図的に skip したいときは `--no-verify` ではなく本文へ明示的に許可を書く:
 *     ALLOW-SKIP-CI: <理由>
 *   これは grep で追える監査可能な逃げ道で、うっかりでは書けない。
 *   (CI 自身の commit-back はローカルフックを通らないので影響を受けない)
 *
 * 使い方: node check-commit-message.cjs <commit-msg ファイル>
 */
const fs = require("node:fs");

// GitHub が解釈する skip トークン。大小文字は無視される。
// 正典: https://docs.github.com/actions/managing-workflow-runs/skipping-workflow-runs
const SKIP_TOKENS = [
  /\[skip[ _-]ci\]/i,
  /\[ci[ _-]skip\]/i,
  /\[no[ _-]ci\]/i,
  /\[skip[ _-]actions\]/i,
  /\[actions[ _-]skip\]/i,
  /\*\*\*NO_CI\*\*\*/i,
];

/** 明示的な許可宣言。行頭 (インデント可) の ALLOW-SKIP-CI: <理由> のみ有効。 */
const ALLOW_RE = /^\s*ALLOW-SKIP-CI:\s*\S/mi;

/** コメント行 (`#` 始まり) は git が捨てるので判定から外す。 */
function stripComments(message) {
  return message
    .split(/\r?\n/)
    .filter((line) => !/^\s*#/.test(line))
    .join("\n");
}

/**
 * @returns {{ ok: boolean, matched: string[], allowed: boolean }}
 */
function inspectCommitMessage(rawMessage) {
  const message = stripComments(rawMessage);
  const matched = SKIP_TOKENS.map((re) => message.match(re))
    .filter(Boolean)
    .map((m) => m[0]);
  const allowed = ALLOW_RE.test(message);
  return { ok: matched.length === 0 || allowed, matched, allowed };
}

module.exports = { inspectCommitMessage, SKIP_TOKENS };

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: check-commit-message.cjs <commit-msg file>");
    process.exit(2);
  }
  const raw = fs.readFileSync(file, "utf8");
  const { ok, matched, allowed } = inspectCommitMessage(raw);
  if (ok) {
    if (allowed && matched.length > 0) {
      console.log(`⚠️  CI skip トークン (${matched.join(", ")}) を ALLOW-SKIP-CI 宣言により許可しました。`);
    }
    process.exit(0);
  }
  console.error("");
  console.error(`❌ commit メッセージに CI skip トークンが含まれています: ${matched.join(", ")}`);
  console.error("");
  console.error("   GitHub はメッセージ内のどこにあっても拾うため、この commit を push しても");
  console.error("   ワークフローが 1 本も走りません。しかも run が作られないので成功と区別がつきません。");
  console.error("   (同じ事故が 2026-08-05 と 2026-08-20 に発生。どちらもトークンを話題にする commit でした)");
  console.error("");
  console.error("   ▸ トークンに言及したいだけなら別表記にする: skip-ci / ci-skip");
  console.error("   ▸ 本当に skip したいなら本文に理由付きで宣言する:");
  console.error("       ALLOW-SKIP-CI: <理由>");
  console.error("");
  console.error("   正典: .claude/rules/branch-workflow.md「commit 件名にトークンを書かない」");
  console.error("");
  process.exit(1);
}
