#!/usr/bin/env node
/**
 * rebase / merge の途中で .claude/todo/backlog.md だけが衝突しているとき、カード単位の 3 方向マージで解く。
 *
 * 週次レビューの無人実行が develop へ push する前の `git pull --rebase` で使う
 * (.claude/skills/management/weekly-review/SKILL.md「無人で実行するとき」)。
 * 解けたら backlog.md を書いて `git add` し、続きは呼び元が `GIT_EDITOR=true git rebase --continue` で進める。
 * 解けなければ何も書かずに exit 1 で止まる (呼び元は `git rebase --abort` して報告する)。
 *
 * 使い方: node .claude/scripts/management/resolve-backlog-conflict.mjs
 * 終了コード: 0 = 解いて index に載せた / 1 = カードの衝突で解けない / 2 = backlog.md 以外も衝突している・衝突が無い
 * ロジックとテスト: packages/ops/src/management/backlog-merge.cjs
 */
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const { mergeBacklog } = require("../../../packages/ops/src/management/backlog-merge.cjs");
const { parseBacklog } = require("../../../packages/ops/src/management/backlog-lib.cjs");

const FILE = ".claude/todo/backlog.md";
const git = (...args) => execFileSync("git", args, { cwd: PROJECT_ROOT, encoding: "utf8", maxBuffer: 1e8 });

const unmerged = git("diff", "--name-only", "--diff-filter=U").split("\n").filter(Boolean);
if (unmerged.length === 0) {
  console.error("衝突しているファイルが無い。何もしない。");
  process.exit(2);
}
if (unmerged.length !== 1 || unmerged[0] !== FILE) {
  console.error(`backlog.md 以外も衝突しているので解かない: ${unmerged.join(", ")}`);
  process.exit(2);
}

const stage = (n) => git("show", `:${n}:${FILE}`);
const result = mergeBacklog(stage(1), stage(2), stage(3));
if (!result.ok) {
  console.error("カード単位でも解けない衝突がある。backlog.md は書いていない:");
  for (const c of result.conflicts) console.error(`  - ${c}`);
  process.exit(1);
}

// 書く前に、結果がカードとして読めて、衝突の印が無いことを確かめる
const cards = parseBacklog(result.text);
if (cards.length !== result.stats.cards || /^(<<<<<<<|=======|>>>>>>>)( |$)/m.test(result.text)) {
  console.error(`結果の検査に通らない (読めたカード ${cards.length} 枚 / マージの数 ${result.stats.cards} 枚)。backlog.md は書いていない。`);
  process.exit(1);
}

writeFileSync(path.join(PROJECT_ROOT, FILE), result.text);
git("add", FILE);
console.log(`backlog.md をカード単位で解いた: カード ${result.stats.cards} 枚 (相手から入れた ${result.stats.fromTheirs} 枚・消えた ${result.stats.removed} 枚)。index に載せた。`);
