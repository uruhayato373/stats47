// 収益の集計の生成物 (data/revenue/rollup/*.json) を書く処理の約束を固定する。
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { datasetDir } from "../../../../../config/datasets.mjs";
import { buildRollupFiles, writeRevenueRollup } from "../write-revenue-rollup.mjs";

const observedAt = "2026-11-14T00:00:00Z";
const kdpDoc = {
  schemaVersion: 1,
  channel: "kdp",
  month: "2026-11",
  coverage: [{ start: "2026-11-02", end: "2026-11-08", observedAt }],
  rows: [
    { date: "2026-11-03", channel: "kdp", productId: "K-S1-01", kind: "paid-orders", quantity: 2, finality: "provisional", marketplace: "Amazon.co.jp", observedAt },
    { date: "2026-11-03", channel: "kdp", productId: "K-S1-01", kind: "royalty-estimate", amountYen: 300, finality: "provisional", marketplace: "Amazon.co.jp", observedAt },
  ],
};

function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), "revenue-rollup-"));
  return { root, done: () => rmSync(root, { recursive: true, force: true }) };
}

function seedDaily(root, docs) {
  const dir = join(root, datasetDir("revenue.daily"));
  mkdirSync(dir, { recursive: true });
  for (const d of docs) writeFileSync(join(dir, `${d.channel}-${d.month}.json`), JSON.stringify(d));
}

test("明細が無い環境では何も書かない (空の集計で生成物を作らない)", () => {
  const { root, done } = tempRoot();
  try {
    assert.deepEqual(buildRollupFiles([]), []);
    assert.deepEqual(writeRevenueRollup({ root }), { written: [] });
    assert.equal(existsSync(join(root, datasetDir("revenue.rollup"))), false);

    // 明細の置き場はあるが 0 件でも同じ
    mkdirSync(join(root, datasetDir("revenue.daily")), { recursive: true });
    assert.deepEqual(writeRevenueRollup({ root }), { written: [] });
    assert.equal(existsSync(join(root, datasetDir("revenue.rollup"))), false);
  } finally {
    done();
  }
});

test("明細があれば週・月・年の 3 ファイルを書き、取得範囲に欠けのある期間の合計は null のまま", () => {
  const { root, done } = tempRoot();
  try {
    seedDaily(root, [kdpDoc]);
    const { written } = writeRevenueRollup({ root });
    assert.deepEqual(written.map((p) => p.split("/").at(-1)), ["weekly.json", "monthly.json", "yearly.json"]);

    const dir = join(root, datasetDir("revenue.rollup"));
    const weekly = JSON.parse(readFileSync(join(dir, "weekly.json"), "utf8"));
    assert.equal(weekly.grain, "week");
    assert.equal(weekly.rows.length, 1);
    assert.equal(weekly.rows[0].period, "2026-W45");
    assert.equal(weekly.rows[0].status, "ok");
    assert.equal(weekly.rows[0].revenueYen, 300);
    assert.equal(weekly.rows[0].orders, 2);

    // 月は 11/2〜11/8 しか取れていないので 11 月の合計は出さない (0 にしない)
    const monthly = JSON.parse(readFileSync(join(dir, "monthly.json"), "utf8"));
    assert.equal(monthly.rows[0].status, "partial");
    assert.equal(monthly.rows[0].revenueYen, null);
    assert.equal(monthly.rows[0].orders, null);
    const yearly = JSON.parse(readFileSync(join(dir, "yearly.json"), "utf8"));
    assert.equal(yearly.rows[0].revenueYen, null);
  } finally {
    done();
  }
});

test("同じ明細からは同じ内容ができる (生成時刻を持たない)", () => {
  assert.deepEqual(buildRollupFiles([kdpDoc]), buildRollupFiles([structuredClone(kdpDoc)]));
});
