// 収益の明細 (日 × 商品 × 種類) の書き込みと集計の約束を固定する。
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import Ajv from "ajv";

import { addCommonSchema } from "../../lib/dataset-shape.mjs";
import { mergeDaily, partitionByMonth, rollup, summarizePeriod } from "../lib/revenue-rollup.mjs";

const observedAt = "2026-11-14T00:00:00Z";
const kdp = (date, productId, kind, value) => ({
  date, channel: "kdp", productId, kind, finality: "provisional", marketplace: "Amazon.co.jp", observedAt,
  ...(kind === "royalty-estimate" ? { amountYen: value } : { quantity: value }),
});

function ingest(docs, batch) {
  const byMonth = new Map(docs.map((d) => [d.month, d]));
  for (const part of partitionByMonth(batch)) byMonth.set(part.month, mergeDaily(byMonth.get(part.month) ?? null, part));
  return [...byMonth.values()];
}

test("取得した範囲の中で行が無い日は 0、範囲の外がある期間は合計を出さない", () => {
  const docs = ingest([], {
    channel: "kdp", start: "2026-11-02", end: "2026-11-08", observedAt,
    rows: [kdp("2026-11-03", "K-S1-01", "paid-orders", 2), kdp("2026-11-03", "K-S1-01", "royalty-estimate", 300)],
  });
  const full = summarizePeriod(docs, { channel: "kdp", start: "2026-11-02", end: "2026-11-08" });
  assert.equal(full.status, "ok");
  assert.equal(full.orders, 2);
  assert.equal(full.revenueYen, 300);
  assert.equal(full.provisional, true);
  assert.deepEqual(full.products, { "K-S1-01": { revenueYen: 300, orders: 2 } });

  const wider = summarizePeriod(docs, { channel: "kdp", start: "2026-11-01", end: "2026-11-08" });
  assert.equal(wider.status, "partial");
  assert.equal(wider.revenueYen, null);
  assert.equal(wider.orders, null);

  assert.equal(summarizePeriod(docs, { channel: "note", start: "2026-11-02", end: "2026-11-08" }).status, "unmeasurable");
});

test("取り直した範囲は入れ替える (行が重複せず、レポートから消えた行も残らない)", () => {
  let docs = ingest([], {
    channel: "kdp", start: "2026-11-02", end: "2026-11-08", observedAt,
    rows: [kdp("2026-11-03", "K-S1-01", "paid-orders", 2), kdp("2026-11-04", "K-S1-02", "paid-orders", 1)],
  });
  docs = ingest(docs, {
    channel: "kdp", start: "2026-11-03", end: "2026-11-10", observedAt: "2026-11-21T00:00:00Z",
    rows: [kdp("2026-11-03", "K-S1-01", "paid-orders", 3)],
  });
  assert.equal(docs.length, 1);
  assert.deepEqual(docs[0].rows.map((r) => [r.date, r.productId, r.quantity]), [["2026-11-03", "K-S1-01", 3]]);
  assert.deepEqual(docs[0].coverage.map((c) => [c.start, c.end]), [["2026-11-02", "2026-11-10"]]);
});

test("月をまたぐ取得は月ごとのファイルに分かれ、週の集計は両方を読む", () => {
  const docs = ingest([], {
    channel: "kdp", start: "2026-10-26", end: "2026-11-01", observedAt,
    rows: [kdp("2026-10-31", "K-S1-01", "royalty-estimate", 100), kdp("2026-11-01", "K-S1-01", "royalty-estimate", 50)],
  });
  assert.deepEqual(docs.map((d) => d.month).sort(), ["2026-10", "2026-11"]);
  const weeks = rollup(docs, "week");
  assert.deepEqual(weeks.map((w) => [w.period, w.status, w.revenueYen]), [["2026-W44", "ok", 150]]);
  // 月は 10 月も 11 月も一部しか取れていないので合計を出さない
  assert.deepEqual(rollup(docs, "month").map((m) => [m.period, m.status, m.revenueYen]), [["2026-10", "partial", null], ["2026-11", "partial", null]]);
});

test("同じ回に同じキーの行が 2 つあれば止める", () => {
  const row = kdp("2026-11-03", "K-S1-01", "paid-orders", 2);
  assert.throws(() => ingest([], { channel: "kdp", start: "2026-11-02", end: "2026-11-08", observedAt, rows: [row, row] }), /duplicate row/);
});

test("書いた明細は Schema に合い、チャネルに無い種類・金額の無い売上の行は Schema が落とす", () => {
  const schema = JSON.parse(readFileSync(new URL("../../../../config/schema/revenue.daily.schema.json", import.meta.url), "utf8"));
  const validate = addCommonSchema(new Ajv({ allErrors: true })).compile(schema);
  const [doc] = ingest([], {
    channel: "kdp", start: "2026-11-02", end: "2026-11-08", observedAt,
    rows: [kdp("2026-11-03", "K-S1-01", "paid-orders", 2), kdp("2026-11-03", "K-S1-01", "royalty-estimate", 300)],
  });
  assert.equal(validate(doc), true, JSON.stringify(validate.errors));
  const bad = (row) => validate({ ...doc, rows: [row] });
  assert.equal(bad({ ...kdp("2026-11-03", "K-S1-01", "paid-orders", 2), kind: "sales" }), false);
  assert.equal(bad({ ...kdp("2026-11-03", "K-S1-01", "royalty-estimate", 300), amountYen: undefined, quantity: 1 }), false);
  assert.equal(bad({ ...kdp("2026-11-03", "not-a-book", "paid-orders", 2) }), false);
});
