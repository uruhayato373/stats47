import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { HEADER, aggregateRows, appendHistory, mergeHistory } from "../append-ga4-affiliate-history.mjs";

const snapshot = (date, rows) => ({
  date,
  days: 28,
  totals: { impressions: rows.reduce((n, r) => n + r.impressions, 0), clicks: rows.reduce((n, r) => n + r.clicks, 0) },
  overview: rows,
});

test("vertical × position で合算し、合計行を最後に置く", () => {
  const rows = aggregateRows(
    snapshot("2026-09-14", [
      { ad_id: "a", affiliate_vertical: "furusato", link_position: "sidebar", impressions: 10, clicks: 1 },
      { ad_id: "b", affiliate_vertical: "furusato", link_position: "sidebar", impressions: 30, clicks: 1 },
      { ad_id: "c", affiliate_vertical: "economy", link_position: "article-end", impressions: 5, clicks: 0 },
    ]),
  );
  assert.deepEqual(rows, [
    ["2026-09-14", 28, "economy", "article-end", 5, 0, "0.000000"],
    ["2026-09-14", 28, "furusato", "sidebar", 40, 2, "0.050000"],
    ["2026-09-14", 28, "_all", "_all", 45, 2, "0.044444"],
  ]);
});

test("旧形式 (rows) も同じ列として読む", () => {
  const legacy = { date: "2026-07-26", days: 28, totals: { impressions: 3, clicks: 0 }, rows: [{ affiliate_vertical: "(not set)", link_position: "(not set)", impressions: 3, clicks: 0 }] };
  assert.equal(aggregateRows(legacy).length, 2);
});

test("同じ date の再実行は置き換え、他の週は残す (二重計上しない)", () => {
  const w1 = aggregateRows(snapshot("2026-09-07", [{ affiliate_vertical: "x", link_position: "p", impressions: 1, clicks: 0 }]));
  const w2 = aggregateRows(snapshot("2026-09-14", [{ affiliate_vertical: "x", link_position: "p", impressions: 2, clicks: 0 }]));
  const csv = mergeHistory(mergeHistory("", w1), w2);
  assert.equal(csv.split("\n").filter(Boolean).length, 1 + 2 + 2);
  const again = mergeHistory(csv, aggregateRows(snapshot("2026-09-14", [{ affiliate_vertical: "x", link_position: "p", impressions: 9, clicks: 0 }])));
  assert.equal(again.split("\n").filter(Boolean).length, 5);
  assert.match(again, /2026-09-14,28,x,p,9,0/);
  assert.doesNotMatch(again, /2026-09-14,28,x,p,2,0/);
  assert.ok(again.startsWith(HEADER + "\n"));
});

test("date が無い snapshot は拒否する (壊れた行を追記しない)", () => {
  assert.throws(() => aggregateRows({ days: 28, overview: [] }), /date/);
});

test("appendHistory はファイルへ書き、ヘッダーを 1 回だけ持つ", () => {
  const dir = mkdtempSync(join(tmpdir(), "stats47-ga4-history-"));
  const snap = join(dir, "ga4-affiliate-2026-09-14.json");
  writeFileSync(snap, JSON.stringify(snapshot("2026-09-14", [{ affiliate_vertical: "x", link_position: "p", impressions: 1, clicks: 1 }])));
  const historyPath = join(dir, "history.csv");
  appendHistory(snap, { historyPath });
  appendHistory(snap, { historyPath });
  const text = readFileSync(historyPath, "utf8");
  assert.equal(text.split("\n").filter((l) => l === HEADER).length, 1);
  assert.equal(text.split("\n").filter(Boolean).length, 3);
});
