import assert from "node:assert/strict";
import test from "node:test";

import {
  type TileCandidate,
  MAP_CLASS_COUNT,
  MAP_RAMP,
  buildMapCaption,
  buildMapCoverQuestion,
  buildMapScopeNote,
  buildMapTiles,
  computeQuantileBins,
  computeTopBottom,
  pickTextColor,
  validateMapData,
} from "../lib/ig-map-props.ts";

function tile(prefCode2: string, areaName: string, value: number, rank: number): TileCandidate {
  return { prefCode2, areaName, value, rank };
}

/** 1..47 の等差数列を rank 順 (rank1=最大値) で 47件作る */
function make47(): TileCandidate[] {
  const values = Array.from({ length: 47 }, (_, i) => (i + 1) * 10); // 10,20,...,470
  // rank1 = 最大値 (470)
  return values.map((v, i) => tile(String(i + 1).padStart(2, "0"), `県${i + 1}`, v, 47 - i));
}

test("computeQuantileBins は決定的で、同じ入力なら常に同じ breaks/bin割当になる", () => {
  const values = make47().map((t) => t.value);
  const first = computeQuantileBins(values, MAP_CLASS_COUNT);
  const second = computeQuantileBins(values, MAP_CLASS_COUNT);
  assert.deepEqual(first.ranges, second.ranges);
  for (const v of values) {
    assert.equal(first.binOf(v), second.binOf(v));
  }
});

test("computeQuantileBins は最小値をbin0・最大値を最終binに割り当てる", () => {
  const values = make47().map((t) => t.value);
  const bins = computeQuantileBins(values, MAP_CLASS_COUNT);
  assert.equal(bins.binOf(Math.min(...values)), 0);
  assert.equal(bins.binOf(Math.max(...values)), MAP_CLASS_COUNT - 1);
});

test("computeQuantileBins は空配列で例外", () => {
  assert.throws(() => computeQuantileBins([]));
});

test("pickTextColor は明るい塗りに黒文字、暗い塗りに白文字を選ぶ", () => {
  assert.equal(pickTextColor("#FFFFFF"), "#111111");
  assert.equal(pickTextColor("#000000"), "#FFFFFF");
  assert.equal(pickTextColor(MAP_RAMP[0]), "#111111"); // 最も薄い紫
  assert.equal(pickTextColor(MAP_RAMP[MAP_RAMP.length - 1]), "#FFFFFF"); // 最も濃い紫
});

test("buildMapTiles は47件全てに bin/fill/textColor を付け、legend の count 合計が47になる", () => {
  const candidates = make47();
  const { tiles, legend } = buildMapTiles(candidates, 0);
  assert.equal(tiles.length, 47);
  for (const t of tiles) {
    assert.ok(t.bin >= 0 && t.bin < MAP_CLASS_COUNT);
    assert.ok(MAP_RAMP.includes(t.fill));
  }
  assert.equal(legend.length, MAP_CLASS_COUNT);
  const totalCount = legend.reduce((sum, l) => sum + l.count, 0);
  assert.equal(totalCount, 47);
});

test("computeTopBottom は rank1〜5 を top5、47位を先頭にした降順で bottom5 に返す (最下位が最初に目に入る)", () => {
  const candidates = make47();
  const { top5, bottom5 } = computeTopBottom(candidates);
  assert.deepEqual(top5.map((t) => t.rank), [1, 2, 3, 4, 5]);
  assert.deepEqual(bottom5.map((t) => t.rank), [47, 46, 45, 44, 43]);
});

test("buildMapCoverQuestion / buildMapScopeNote", () => {
  assert.match(buildMapCoverQuestion("焼酎消費支出額"), /焼酎消費支出額/);
  assert.equal(buildMapScopeNote(true), "都道府県庁所在市（東京都は都区部）の値");
  assert.equal(buildMapScopeNote(false), undefined);
});

test("validateMapData は47件そろわない・重複・source/year欠落を fail-closed で検出する", () => {
  const full = make47();
  assert.deepEqual(validateMapData(full, "総務省統計局", 2024), []);

  const short = full.slice(0, 46);
  assert.ok(validateMapData(short, "総務省統計局", 2024).some((e) => e.includes("47都道府県")));

  const dup = [...full.slice(0, 46), full[0]];
  assert.ok(validateMapData(dup, "総務省統計局", 2024).some((e) => e.includes("重複")));

  assert.ok(validateMapData(full, "", 2024).some((e) => e.includes("source")));
  assert.ok(validateMapData(full, "総務省統計局", 0).some((e) => e.includes("year")));
});

test("buildMapCaption は8〜13個のハッシュタグ・保存/プロフィール導線・URLを含み2200字以内", () => {
  const { top5, bottom5 } = computeTopBottom(make47());
  const caption = buildMapCaption({
    label: "焼酎消費支出額",
    unit: "円",
    year: 2024,
    source: "総務省統計局",
    top5,
    bottom5,
  });
  assert.ok(caption.length <= 2200, `caption length=${caption.length}`);
  const hashtagCount = (caption.match(/#[^\s#]+/g) ?? []).length;
  assert.ok(hashtagCount >= 8 && hashtagCount <= 13, `hashtagCount=${hashtagCount}`);
  assert.match(caption, /保存/);
  assert.match(caption, /プロフィール/);
  // 「47位」に表示される値は実際の最下位 (make47 の最小値=10) であること。
  // computeTopBottom の bottom5 は47位が先頭 (降順) のため、末尾を拾うと43位を誤表示する
  // 回帰バグがあった (2026-09-23 実render で発覚)。
  assert.match(caption, /47位: 県1 10円/);
  assert.match(caption, /1位: 県47 470円/);
});
