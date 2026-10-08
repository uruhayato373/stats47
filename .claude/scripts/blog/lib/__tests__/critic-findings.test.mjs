/**
 * critic-findings の境界を固定する。実行: node --test .claude/scripts/blog/lib/__tests__/critic-findings.test.mjs
 *
 * ★「繰り返した型だけを起票する」「同じ review.md を二重に数えない」「格上げ済みの型は格上げ後の再発だけを見る」
 *   の 3 つが崩れると、カードが毎日増えるか、逆に何も起票されない無検査の仕組みになる。
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  aggregateByType,
  cardIdForType,
  parseReview,
  planPatternCards,
  reviewProblems,
  toLedgerRows,
} from "../critic-findings.mjs";

const RECORDER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "record-critic-findings.mjs");

const TYPES = { "related-link": { label: "関連記事の紹介" }, region: { label: "地域のくくり" }, other: { label: "その他" } };
const review = (slug, date, findings, heading = "## 指摘") =>
  [
    "---",
    `slug: ${slug}`,
    "reviewer: blog-critic",
    "mode: full",
    "verdict: REVISE",
    `date: ${date}`,
    "---",
    "## 評価サマリ",
    "要約。",
    heading,
    ...findings,
    "## 判定理由",
    "- [MAJOR][型:region] 判定理由の箇条書きは指摘として数えない。",
  ].join("\n");

test("指摘の重さと型を読み、判定理由の節は数えない", () => {
  const parsed = parseReview(
    review("a", "2026-10-07", [
      "- [BLOCK][型:related-link] 関連記事の紹介が古いタイトルのままです。修正案は…",
      "- [MAJOR] 型の無い指摘です。",
      "- [minor][型:unknown-type] 語彙に無い型は型無しとして扱う。",
    ]),
    { knownTypes: Object.keys(TYPES) },
  );
  assert.equal(parsed.slug, "a");
  assert.equal(parsed.verdict, "REVISE");
  assert.deepEqual(
    parsed.findings.map((f) => [f.severity, f.type]),
    [["BLOCK", "related-link"], ["MAJOR", "unclassified"], ["MINOR", "unclassified"]],
  );
  assert.equal(parsed.findings[0].summary, "関連記事の紹介が古いタイトルのままです。");
});

test("同じ review.md からは同じ key が出る (二重に記録しない)", () => {
  const md = review("a", "2026-10-07", ["- [MAJOR][型:region] 近畿のくくりが支えられない。"]);
  const first = toLedgerRows(parseReview(md, { knownTypes: Object.keys(TYPES) }));
  const second = toLedgerRows(parseReview(md, { knownTypes: Object.keys(TYPES) }));
  assert.equal(first[0].key, second[0].key);
});

const rowsFor = (type, slugs, severity = "MAJOR", date = "2026-10-01") =>
  slugs.map((slug, i) => ({ key: `${type}${i}`, date, slug, mode: "full", verdict: "REVISE", severity, type, summary: "s" }));
const settings = { today: "2026-10-07", windowDays: 56, minArticles: 3, types: TYPES };

test("しきい値以上の記事で繰り返した型だけを起票し、MINOR と窓の外は数えない", () => {
  const rows = [
    ...rowsFor("related-link", ["a", "b", "c"]),
    ...rowsFor("region", ["a", "b"]),
    ...rowsFor("region", ["c", "d"], "MINOR"),
    ...rowsFor("region", ["e"], "MAJOR", "2026-01-01"),
  ];
  const aggregate = aggregateByType(rows, settings);
  const cards = planPatternCards(aggregate, { ...settings, openIds: [], ledgerPath: "ledger.jsonl" });
  assert.deepEqual(cards.map((c) => c.id), ["CRITIC-PATTERN-RELATED-LINK"]);
  assert.equal(cards[0].tier, "🟡");
  assert.match(cards[0].markdown, /^### \[CRITIC-PATTERN-RELATED-LINK\]/);
  assert.match(cards[0].markdown, /タグ: \[コンテンツ品質\] \[種類:改善\] \[実行:対話\] \[起票:2026-10-07\]/);
});

test("同じ型のカードが開いていれば起票しない", () => {
  const aggregate = aggregateByType(rowsFor("related-link", ["a", "b", "c"]), settings);
  const cards = planPatternCards(aggregate, { ...settings, openIds: [cardIdForType("related-link")], ledgerPath: "x" });
  assert.equal(cards.length, 0);
});

test("格上げ済みの型は格上げ日より後の指摘だけを数える", () => {
  const promoted = { ...TYPES, "related-link": { label: "関連記事の紹介", promotedAt: "2026-10-01" } };
  const rows = [...rowsFor("related-link", ["a", "b", "c"], "MAJOR", "2026-10-01"), ...rowsFor("related-link", ["d"], "MAJOR", "2026-10-05")];
  const aggregate = aggregateByType(rows, { ...settings, types: promoted });
  assert.equal(aggregate[0].articles, 1);
  assert.equal(planPatternCards(aggregate, { ...settings, types: promoted, openIds: [], ledgerPath: "x" }).length, 0);
});

test("型の無い指摘と「その他」は起票しない", () => {
  const rows = [...rowsFor("unclassified", ["a", "b", "c"]), ...rowsFor("other", ["a", "b", "c"])];
  const cards = planPatternCards(aggregateByType(rows, settings), { ...settings, openIds: [], ledgerPath: "x" });
  assert.equal(cards.length, 0);
});

test("「## 指摘(残るもの)」のように後ろに語が付いた見出しも指摘の節として読む", () => {
  const parsed = parseReview(
    review("a", "2026-10-07", ["- [MAJOR][型:region] 近畿のくくりが支えられない。"], "## 指摘(残るもの)"),
    { knownTypes: Object.keys(TYPES) },
  );
  assert.deepEqual(parsed.findings.map((f) => [f.severity, f.type]), [["MAJOR", "region"]]);
  assert.deepEqual(reviewProblems(parsed), []);
});

test("REVISE なのに指摘を 1 件も読めない review は問題として返し、PASS の 0 件は通す", () => {
  const revise = parseReview(review("a", "2026-10-07", ["型も重さも書いていない行"]), { knownTypes: Object.keys(TYPES) });
  assert.equal(revise.findings.length, 0);
  assert.equal(reviewProblems(revise).length, 1);
  const pass = parseReview(review("a", "2026-10-07", []).replace("verdict: REVISE", "verdict: PASS"));
  assert.deepEqual(reviewProblems(pass), []);
});

test("record-critic-findings は REVISE で指摘 0 件の review.md を exit 1 で止め、台帳に書かない", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "critic-findings-"));
  const file = path.join(dir, "review.md");
  fs.writeFileSync(file, review("silent-zero", "2026-10-07", ["本文だけで箇条書きの書式になっていない。"], "## 指摘事項なし?"));
  const result = spawnSync(process.execPath, [RECORDER, file], { encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.match(result.stderr, /REVISE なのに指摘を 1 件も読めない/);
  assert.match(result.stdout, /追記 0 件/);
});
