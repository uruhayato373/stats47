/**
 * 市区町村表の cdCat01 を指標名で解決するロジックのテスト。
 *
 * ## なぜ厳しく固定するか
 *
 * 取り違えると **47 行そろって値も妥当な、別指標のデータ** が配信される。
 * 「15歳未満人口割合」を「65歳以上人口割合」として出しても形状ゲートは通ってしまう。
 * 空のままの方がはるかに安全なので、完全一致以外は必ず null になることを固定する。
 *
 * 実データ: 2026-07-31 に e-Stat getMetaInfo で実測した SSDS 人口・世帯の cat01。
 */

import { describe, expect, it } from "vitest";

import {
  resolveCat01ByName,
  stripCatCodePrefix,
} from "../../scripts/page-data-batch";

/** 都道府県表 0000010201 (実測値) */
const PREF = [
  { code: "#A03501", name: "#A03501_15歳未満人口割合" },
  { code: "#A03502", name: "#A03502_15～64歳人口割合" },
  { code: "#A03503", name: "#A03503_65歳以上人口割合" },
  { code: "#A01202", name: "#A01202_可住地面積１km2当たり人口密度" },
];

/** 市区町村表 0000020301 (実測値)。同じ指標に別コードが振られている */
const CITY = [
  { code: "#A01202", name: "#A01202_可住地面積１km2当たり人口密度" },
  { code: "#A03504", name: "#A03504_15歳未満人口割合" },
  { code: "#A03505", name: "#A03505_15～64歳人口割合" },
  { code: "#A03506", name: "#A03506_65歳以上人口割合" },
];

describe("stripCatCodePrefix", () => {
  it("★コード接頭辞だけを落とす", () => {
    expect(stripCatCodePrefix("#A03503_65歳以上人口割合")).toBe("65歳以上人口割合");
    expect(stripCatCodePrefix("#A03506_65歳以上人口割合")).toBe("65歳以上人口割合");
  });

  it("接頭辞が無ければそのまま", () => {
    expect(stripCatCodePrefix("65歳以上人口割合")).toBe("65歳以上人口割合");
  });

  it("指標名の中の _ は残す (先頭の 1 回だけ落とす)", () => {
    expect(stripCatCodePrefix("#A01_産業_第一次")).toBe("産業_第一次");
  });
});

describe("resolveCat01ByName", () => {
  it("★実測データで 3 指標とも正しい city コードに解決する", () => {
    expect(resolveCat01ByName(PREF, CITY, "#A03503")).toBe("#A03506"); // 65歳以上
    expect(resolveCat01ByName(PREF, CITY, "#A03502")).toBe("#A03505"); // 15〜64歳
    expect(resolveCat01ByName(PREF, CITY, "#A03501")).toBe("#A03504"); // 15歳未満
  });

  it("★取り違えていないこと (65歳以上 → 15歳未満 のコードにならない)", () => {
    expect(resolveCat01ByName(PREF, CITY, "#A03503")).not.toBe("#A03504");
    expect(resolveCat01ByName(PREF, CITY, "#A03501")).not.toBe("#A03506");
  });

  it("コードが同じ指標はそのまま解決する (既存の前提が成り立つ表)", () => {
    expect(resolveCat01ByName(PREF, CITY, "#A01202")).toBe("#A01202");
  });

  it("★city 側に同名が無ければ null (推測で近い指標に当てない)", () => {
    const cityWithout = CITY.filter((c) => !c.name.includes("65歳以上"));
    expect(resolveCat01ByName(PREF, cityWithout, "#A03503")).toBeNull();
  });

  it("★同名が複数あれば null (1 件に定まらなければ当てない)", () => {
    const dup = [...CITY, { code: "#A99999", name: "#A99999_65歳以上人口割合" }];
    expect(resolveCat01ByName(PREF, dup, "#A03503")).toBeNull();
  });

  it("pref 側に該当コードが無ければ null", () => {
    expect(resolveCat01ByName(PREF, CITY, "#ZZZZZ")).toBeNull();
  });

  it("空の一覧でも落ちない", () => {
    expect(resolveCat01ByName([], [], "#A03503")).toBeNull();
    expect(resolveCat01ByName(PREF, [], "#A03503")).toBeNull();
  });
});
