/**
 * 最新年を values.json の並びではなく yearCode の最大で選ぶことを固定する (ARTICLE-WRITER-PARTITION-ORDER-01)。
 * 実行: node --test packages/ops/src/ranking/__tests__/latest-partition.test.mjs
 */
import assert from "node:assert/strict";
import test from "node:test";

import { latestPartition } from "../latest-partition.mjs";

const partition = (yearCode) => ({ yearCode, values: [{ areaCode: "13000", areaName: "東京都", value: Number(yearCode) }] });

test("新しい順の values.json (末尾が最古) でも最新年を選ぶ", () => {
  // soba-udon-dining-consumption-expenditure の実例: 末尾が 2007 年だった
  const partitions = ["2024", "2019", "2014", "2007"].map(partition);
  assert.equal(partitions[partitions.length - 1].yearCode, "2007"); // 旧手順はこれを最新年としていた
  assert.equal(latestPartition(partitions).yearCode, "2024");
});

test("古い順・並びが崩れた values.json でも最新年を選ぶ", () => {
  assert.equal(latestPartition(["2007", "2014", "2024"].map(partition)).yearCode, "2024");
  assert.equal(latestPartition(["2014", "2024", "2007", "2019"].map(partition)).yearCode, "2024");
});

test("yearCode は数値として比べ、空・不正な年は飛ばす", () => {
  assert.equal(latestPartition([partition(2009), partition("2010"), { yearCode: "", values: [] }]).yearCode, "2010");
  assert.equal(latestPartition([]), null);
  assert.equal(latestPartition(undefined), null);
});
