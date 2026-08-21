#!/usr/bin/env node
/**
 * check-card-freshness — 変更したファイルを名指ししている backlog カードを知らせる。
 * ---------------------------------------------------------------------------
 * ★これは **blocker ではなく reminder**。
 *
 * 動機 (2026-08-21): 同じセッション中に「コードは直したがカードが古いまま」を 2 回やり、
 * どちらもオーナーの指摘で気づいた。
 *   1. 出典リンク化の犯人を訂正したのに、カードには誤った帰属が残っていた
 *   2. data-refresh を partial-publish にしたのに、カードは「empty 37 件の仕分けが本体」
 *      のままで、別 PC が見ると解消済みの問題に着手する状態だった
 * この 2 件はどちらも「カードが名指ししているファイルを触った commit」だったので、
 * 機械で気づける。
 *
 * 判定は**ファイル path の完全一致**と、**変更集合の中で一意な素のファイル名**の 2 つ。
 * ディレクトリ前方一致は使わない (最大 9 枚まで膨らみ雑音になる)。
 * 実測 (直近 14 commit): 平均 1.71 枚・最大 4 枚で、3 commit は 0 枚。
 * 当時のカード本文で再実行し、上の見逃し 2 件とも鳴ることを確認した
 * (素のファイル名を拾う規則が無いと 1 件しか拾えなかった)。
 *
 * 誤検知の考え方: カードが名指しするファイルを触っても、カードの更新が不要なことはある。
 * だから**止めない**。「見たか?」と聞くだけ。止める設計にすると必ず迂回される。
 *
 * usage:
 *   node .claude/scripts/lib/check-card-freshness.cjs                 # staged を見る
 *   node .claude/scripts/lib/check-card-freshness.cjs a.ts b.md       # path を明示
 *   node .claude/scripts/lib/check-card-freshness.cjs --json
 *
 * テスト: .claude/scripts/lib/__tests__/check-card-freshness.test.cjs
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "../../..");
const BACKLOG = path.join(ROOT, ".claude/todo/backlog.md");

/** 拡張子つき = ファイル。ディレクトリ言及は雑音になるので採らない。 */
const PATH_RE = /`((?:apps|packages|\.claude|\.github|docs|scripts)\/[A-Za-z0-9._/\-]+\.[A-Za-z0-9]+)`/g;

/**
 * ディレクトリを書かない素のファイル名 (例: `data-refresh.yml`)。
 * ★リポジトリ内で**一意に解決できるときだけ**採る。`README.md` のように何十個もある名前を
 *   採ると全 commit が全カードに当たって reminder が無意味になる。
 *   実際、この規則が無いと 2026-08-21 の data-refresh の見逃しを拾えなかった
 *   (当時のカードは `data-refresh.yml` としか書いていなかった)。
 */
const BARE_RE = /`([A-Za-z0-9._\-]+\.(?:ts|tsx|mjs|cjs|js|yml|yaml|json|sh|md))`/g;

/**
 * backlog 本文から「カード ID → 名指ししているファイル path」を作る (pure)。
 * @param {string} markdown
 * @returns {Map<string, Set<string>>}
 */
function buildCardPathIndex(markdown, resolveBare = () => null) {
  const index = new Map();
  const cards = markdown.split(/^### \[/m).slice(1);
  for (const card of cards) {
    const id = card.split("]")[0];
    if (!id) continue;
    const paths = new Set();
    for (const m of card.matchAll(PATH_RE)) {
      const p = m[1];
      // カード置き場そのものは除く (全カードが当たってしまう)
      if (p.startsWith(".claude/todo/")) continue;
      paths.add(p);
    }
    for (const m of card.matchAll(BARE_RE)) {
      const resolved = resolveBare(m[1]);
      if (resolved && !resolved.startsWith(".claude/todo/")) paths.add(resolved);
    }
    if (paths.size > 0) index.set(id, paths);
  }
  return index;
}

/**
 * 変更 path から、名指ししているカード ID を引く (pure)。
 * @param {Map<string, Set<string>>} index
 * @param {string[]} changed
 * @returns {Array<{id: string, files: string[]}>}
 */
function matchCards(index, changed) {
  const norm = new Set(changed.map((f) => f.split("\\").join("/")));
  const hits = [];
  for (const [id, paths] of index) {
    const files = [...paths].filter((p) => norm.has(p));
    if (files.length > 0) hits.push({ id, files: files.sort() });
  }
  return hits.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * 素のファイル名 → 変更 path。**変更集合の中で一意なときだけ**返す。
 * リポジトリ全体を走査しないので速く、かつ「触ってもいないファイル」に当たらない。
 */
function makeBareResolver(changed) {
  const byBase = new Map();
  for (const f of changed) {
    const base = f.split("\\").join("/").split("/").pop();
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push(f.split("\\").join("/"));
  }
  return (base) => {
    const hits = byBase.get(base);
    return hits && hits.length === 1 ? hits[0] : null;
  };
}

function stagedFiles() {
  try {
    return execFileSync("git", ["-C", ROOT, "diff", "--cached", "--name-only"], { encoding: "utf8" })
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes("--json");
  const explicit = argv.filter((a) => !a.startsWith("--"));
  const changed = explicit.length > 0 ? explicit : stagedFiles();

  if (changed.length === 0 || !fs.existsSync(BACKLOG)) return;

  const index = buildCardPathIndex(fs.readFileSync(BACKLOG, "utf8"), makeBareResolver(changed));
  const hits = matchCards(index, changed);

  if (asJson) {
    console.log(JSON.stringify({ changed: changed.length, hits }, null, 2));
    return;
  }
  if (hits.length === 0) return;

  console.log("");
  console.log("📌 この変更を名指ししている backlog カードがあります。内容は最新ですか?");
  for (const h of hits) {
    console.log(`   [${h.id}]  ← ${h.files.join(", ")}`);
  }
  console.log("   (止めません。カードが古いまま残ると、別 PC が解決済みの問題に着手します)");
}

module.exports = { buildCardPathIndex, matchCards, makeBareResolver, PATH_RE, BARE_RE };

if (require.main === module) main();
