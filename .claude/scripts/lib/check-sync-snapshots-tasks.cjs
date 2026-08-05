#!/usr/bin/env node
/**
 * sync-snapshots の task 定義 (run.sh の TASKS) と、それを人と agent が読む面
 * (SKILL.md の task 表) のドリフトを検出する。
 *
 * ## なぜ要るか (2026-08-05 に実際に起きた)
 *
 * `calculated-stats` task を run.sh に足したが SKILL.md の task 表に書かなかった。
 * run.sh は動くので CI は緑のまま、**「その task が存在すること」と「実行順」を
 * 人と agent が知る手段だけが欠落する**。今回はそれが「計算型 metric の producer が
 * ranking-values より前に要る」という順序知識の欠落になり、手で回すときに
 * 旧値が配信され続ける経路を残した。
 *
 * 既存の orphan 検査 (check-agent-skill-consistency.cjs) はこれを捕まえられない。
 * あれは `.claude/scripts/**` しか走査せず、`packages/<pkg>/src/scripts/` の producer は
 * 対象外だから。仮に走査範囲を広げても、既に 29 ある warning に紛れて強制力が出ない。
 * 「task 表と TASKS 配列は 1:1」という**厳密な不変量**なら誤検知ゼロで error にできる。
 *
 * ## 検査
 *
 *   [E1] run.sh の TASKS にあるのに SKILL.md の task 表に無い (= 書き忘れ)
 *   [E2] SKILL.md の task 表にあるのに run.sh の TASKS に無い (= 消し忘れ / typo)
 *
 * 使い方:
 *   node .claude/scripts/lib/check-sync-snapshots-tasks.cjs
 */
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const RUN_SH = path.join(ROOT, ".claude/skills/db/sync-snapshots/run.sh");
const SKILL_MD = path.join(ROOT, ".claude/skills/db/sync-snapshots/SKILL.md");

/** run.sh の `declare -a TASKS=( ... )` から "label|script" の label だけを取る。 */
function parseRunShTasks(text) {
  const start = text.indexOf("declare -a TASKS=(");
  if (start === -1) return null;
  const end = text.indexOf("\n)", start);
  if (end === -1) return null;
  const body = text.slice(start, end);
  const labels = [];
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) continue; // コメント行の例示を task と誤認しない
    const m = trimmed.match(/^"([a-z0-9-]+)\|/);
    if (m) labels.push(m[1]);
  }
  return labels;
}

/**
 * SKILL.md の task 表から label を取る。表のセルは
 * `| **ranking-values** (…の後) | …` や `| item-seo-refresh (master の直後) | …` の形。
 * 強調記号と補足の括弧を剥がして先頭トークンだけを見る。
 */
function parseSkillTasks(text) {
  const labels = new Set();
  for (const line of text.split("\n")) {
    if (!line.startsWith("|")) continue;
    const first = line.split("|")[1];
    if (first === undefined) continue;
    const cell = first.replace(/\*\*/g, "").trim();
    const m = cell.match(/^([a-z0-9-]+)(\s|$)/);
    if (m) labels.add(m[1]);
  }
  return labels;
}

function main() {
  const runSh = fs.readFileSync(RUN_SH, "utf8");
  const skillMd = fs.readFileSync(SKILL_MD, "utf8");

  const tasks = parseRunShTasks(runSh);
  if (tasks === null || tasks.length === 0) {
    // パースできない = run.sh の構造が変わった。黙って通すと検査が消えるので落とす。
    console.error("❌ run.sh の TASKS 配列をパースできません。この checker の parse を追従させてください。");
    process.exit(1);
  }
  const documented = parseSkillTasks(skillMd);

  const findings = [];
  for (const label of tasks) {
    if (!documented.has(label)) {
      findings.push(`[E1] run.sh の TASKS に '${label}' があるが SKILL.md の task 表に無い`);
    }
  }
  for (const label of documented) {
    // 表には task 以外の行 (見出し・別表) も混ざるので、run.sh 側を基準に
    // 「task 名の形をしていて TASKS に無い」ものだけを疑う。
    if (!tasks.includes(label) && /-/.test(label) && label !== "---") {
      findings.push(`[E2] SKILL.md の task 表に '${label}' があるが run.sh の TASKS に無い`);
    }
  }

  if (findings.length > 0) {
    for (const f of findings) console.error(`❌ ${f}`);
    console.error(
      "\nsync-snapshots の task 表は run.sh の TASKS と 1:1 に保つこと " +
        "(task の存在と実行順を人と agent が読む唯一の面のため)。",
    );
    process.exit(1);
  }
  console.log(`✓ sync-snapshots task 表と run.sh TASKS が一致 — ${tasks.length} tasks`);
}

main();
