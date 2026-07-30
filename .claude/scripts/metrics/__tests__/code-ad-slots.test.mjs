/**
 * code-ad-slots.mjs のテスト — constants.ts の決定的パースと索引。
 *
 * 実ファイル (apps/web/src/lib/google-adsense/constants.ts) もパースして件数を固定する。
 * これが 0 件になる = パーサが構造変化で空振りしている、を検出する (沈黙させない)。
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseCodeAdSlots,
  indexCodeAdSlots,
  loadCodeAdSlots,
} from "../lib/code-ad-slots.mjs";

const SAMPLE = `
import type { AdFormat } from "./types";

export interface AdSlotConfig {
  slotId: string;
  format: AdFormat;
}

/** ランキングページ: テーブル横 */
export const RANKING_PAGE_TABLE_SIDE: AdSlotConfig = {
  slotId: "3604399166",
  format: "rectangle",
};

/** A2 後の形: adUnitName と pending を持つ */
export const HUB_INCONTENT: AdSlotConfig = {
  slotId: "8185387982",
  adUnitName: "stats47-hub-incontent",
  format: "article",
};

/** 未発行プレースホルダ */
export const FUTURE_UNIT: AdSlotConfig = {
  slotId: "",
  adUnitName: "stats47-future",
  format: "rectangle",
  pending: true,
};

/** slot を共用する 2 定数 */
export const RANKING_PAGE_FOOTER: AdSlotConfig = {
  slotId: "6137206504",
  adUnitName: "stats47-content-footer-multiplex",
  format: "multiplex",
};
export const CONTENT_FOOTER: AdSlotConfig = {
  slotId: "6137206504",
  adUnitName: "stats47-content-footer-multiplex",
  format: "multiplex",
};

/** slot 定数ではないもの (拾ってはいけない) */
export const SOMETHING_ELSE = { foo: "bar" };
`;

test("parseCodeAdSlots: slotId / format / adUnitName / pending を抽出する", () => {
  const slots = parseCodeAdSlots(SAMPLE);
  assert.equal(slots.length, 5);

  const table = slots.find((s) => s.exportName === "RANKING_PAGE_TABLE_SIDE");
  assert.equal(table.slotId, "3604399166");
  assert.equal(table.format, "rectangle");
  assert.equal(table.adUnitName, null, "adUnitName 未記載は null (推測で埋めない)");
  assert.equal(table.pending, false);

  const hub = slots.find((s) => s.exportName === "HUB_INCONTENT");
  assert.equal(hub.adUnitName, "stats47-hub-incontent");
  assert.equal(hub.pending, false);

  const future = slots.find((s) => s.exportName === "FUTURE_UNIT");
  assert.equal(future.slotId, "", "未発行は空文字");
  assert.equal(future.pending, true);
});

test("parseCodeAdSlots: AdSlotConfig 型注釈が無い export は拾わない", () => {
  const slots = parseCodeAdSlots(SAMPLE);
  assert.equal(slots.some((s) => s.exportName === "SOMETHING_ELSE"), false);
});

test("parseCodeAdSlots: 空・非文字列は空配列 (throw しない)", () => {
  assert.deepEqual(parseCodeAdSlots(""), []);
  assert.deepEqual(parseCodeAdSlots(null), []);
  assert.deepEqual(parseCodeAdSlots(undefined), []);
});

test("indexCodeAdSlots: slot 共用は配列で持つ (どちらの export も失わない)", () => {
  const idx = indexCodeAdSlots(parseCodeAdSlots(SAMPLE));
  const shared = idx.bySlotId.get("6137206504");
  assert.equal(shared.length, 2);
  assert.deepEqual(
    shared.map((s) => s.exportName).sort(),
    ["CONTENT_FOOTER", "RANKING_PAGE_FOOTER"],
  );
  // adUnitName 索引も同様に 2 件
  assert.equal(idx.byAdUnitName.get("stats47-content-footer-multiplex").length, 2);
  // adUnitName が null の定数は byAdUnitName に入らない
  assert.equal(idx.byAdUnitName.has(null), false);
  assert.equal(idx.byAdUnitName.has(""), false);
});

test("indexCodeAdSlots: 空 slotId は bySlotId に入れない (未発行が誤マッチしない)", () => {
  const idx = indexCodeAdSlots(parseCodeAdSlots(SAMPLE));
  assert.equal(idx.bySlotId.has(""), false);
});

test("実 constants.ts をパースできる (0 件ならパーサが空振りしている)", () => {
  const idx = loadCodeAdSlots();
  assert.ok(idx.slots.length >= 8, `実 constants.ts の slot が少なすぎる: ${idx.slots.length} 件`);
  // 全 slot が export 名を持ち、slotId は 10 桁数字か空文字 (プレースホルダ) のいずれか
  for (const s of idx.slots) {
    assert.match(s.exportName, /^[A-Z0-9_]+$/);
    assert.ok(
      s.slotId === "" || /^\d{10}$/.test(s.slotId),
      `${s.exportName} の slotId が想定形でない: ${JSON.stringify(s.slotId)}`,
    );
  }
  // 実データで共用 slot (6137206504) が 2 件あることを固定する
  const shared = idx.bySlotId.get("6137206504");
  assert.ok(shared && shared.length === 2, "RANKING_PAGE_FOOTER と CONTENT_FOOTER の slot 共用が崩れている");
});
