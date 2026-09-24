import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";

import {
  BATCH_SIZE,
  insertCards,
  planCoverageCards,
  staleBatchFiles,
} from "../lib/coverage-backlog.mjs";

const require = createRequire(import.meta.url);
const { parseBacklog, ID_PATTERN, EXECUTORS, KINDS } = require("../../lib/backlog-lib.cjs");

const entry = (url, action, status = "pending") => ({
  url,
  action,
  status,
  current_http: 200,
  gsc_category: "crawled-not-indexed",
  in_sitemap: false,
  gsc_last_crawl: "2026-09-16",
});

const BACKLOG = [
  "# バックログ",
  "",
  "## 🔴 高 — 今月中に着手したい",
  "",
  "### [EXISTING-01] 既存",
  "タグ: [インフラ・計測] [種類:改善] [実行:対話]",
  "",
  "本文",
  "",
  "## 🟡 中 — 2〜3ヶ月以内",
  "",
  "### [EXISTING-02] 既存",
  "タグ: [インフラ・計測] [種類:改善] [実行:対話]",
  "",
  "本文",
  "",
].join("\n");

test("判断が要る action だけをカードにし、観測待ちや放置確定は載せない", () => {
  const queue = [
    entry("https://stats47.jp/ranking/b", "sitemap-gap"),
    entry("https://stats47.jp/ranking/a", "sitemap-gap"),
    entry("https://stats47.jp/blog/x", "observe-after-fix"),
    entry("https://stats47.jp/47", "none", "resolved-by-design"),
    entry("https://stats47.jp/ranking/c", "sitemap-gap", "in-progress"),
  ];
  const cards = planCoverageCards({ queue, openIds: [], today: "2026-09-24" });

  assert.deepEqual(cards.map((c) => c.id), ["GSC-COV-SITEMAP-20260924"]);
  assert.deepEqual(cards[0].urls, ["https://stats47.jp/ranking/a", "https://stats47.jp/ranking/b"]);
});

test("同じ action のカードが開いている間は次の batch を起票しない", () => {
  const queue = [entry("https://stats47.jp/ranking/a", "sitemap-gap")];
  const cards = planCoverageCards({ queue, openIds: ["GSC-COV-SITEMAP-20260920"], today: "2026-09-24" });
  assert.equal(cards.length, 0);
});

test("1 枚のカードは BATCH_SIZE 件まで", () => {
  const queue = Array.from({ length: BATCH_SIZE + 5 }, (_, i) => entry(`https://stats47.jp/r/${String(i).padStart(2, "0")}`, "content-check"));
  const [card] = planCoverageCards({ queue, openIds: [], today: "2026-09-24" });
  assert.equal(card.urls.length, BATCH_SIZE);
});

test("差し込んだカードは backlog-lib が読めて、CI ループが拾える宣言を持つ", () => {
  // backlog-loop は [実行:sweep|機械] で 🟣 以外のカードだけを処理する。
  // 生成カードがこの契約から外れると、起票されても誰も処理しない。
  const queue = [
    entry("https://stats47.jp/ranking/a", "sitemap-gap"),
    { ...entry("https://stats47.jp/blog/y", "fix-5xx"), current_http: 503 },
  ];
  const cards = planCoverageCards({ queue, openIds: [], today: "2026-09-24" });
  const { text, inserted } = insertCards(BACKLOG, cards);
  const parsed = parseBacklog(text);

  assert.deepEqual(inserted.sort(), ["GSC-COV-5XX-20260924", "GSC-COV-SITEMAP-20260924"]);
  for (const id of inserted) {
    const card = parsed.find((c) => c.id === id);
    assert.ok(card, `${id} がカードとして読めない`);
    assert.match(card.id, ID_PATTERN);
    assert.equal(card.executor, "sweep");
    assert.ok(EXECUTORS.includes(card.executor));
    assert.ok(KINDS.includes(card.kind));
    assert.match(card.verify, /--assert-handled \.claude\/state\/gsc\/backlog-batches\/GSC-COV-/);
    assert.equal(card.unknownKeys.length, 0);
  }
  assert.equal(parsed.find((c) => c.id === "GSC-COV-5XX-20260924").tier, parsed.find((c) => c.id === "EXISTING-01").tier);
  assert.equal(parsed.find((c) => c.id === "GSC-COV-SITEMAP-20260924").tier, parsed.find((c) => c.id === "EXISTING-02").tier);
  // 既存カードは壊さない
  assert.ok(parsed.find((c) => c.id === "EXISTING-01"));
  assert.ok(parsed.find((c) => c.id === "EXISTING-02"));
});

test("完了したカードの batch ファイルだけを掃除対象にする", () => {
  assert.deepEqual(
    staleBatchFiles(["GSC-COV-SITEMAP-20260920.txt", "GSC-COV-5XX-20260924.txt", "README.md"], ["GSC-COV-5XX-20260924"]),
    ["GSC-COV-SITEMAP-20260920.txt"],
  );
});
