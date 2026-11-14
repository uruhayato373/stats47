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

import { describe, expect, it, vi } from "vitest";

import {
  prefToCityStatsDataId,
  fetchCityData,
  resolveCat01ByName,
  shapeForCity,
  stripCatCodePrefix,
} from "../../scripts/page-data-batch";
import { buildRecipe } from "../recipe";
import type { MetricConfig, SourceConfig } from "../types";

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

describe("prefToCityStatsDataId", () => {
  it("県の基礎データ・社会生活統計指標の表を、廃置分合処理済の市区町村表へ写す", () => {
    expect(prefToCityStatsDataId("0000010101")).toBe("0000020201");
    expect(prefToCityStatsDataId("0000010211")).toBe("0000020311");
  });

  it("source が初めから市区町村表の市区町村専用 metric は、その表で取り込む", () => {
    // 以前は null を返し、current-balance-ratio-city (0000020204) 等が city=skip になっていた
    expect(prefToCityStatsDataId("0000020204")).toBe("0000020204");
    expect(prefToCityStatsDataId("0000020304")).toBe("0000020304");
  });

  it("市区町村表の無い家計・生活時間と、社会・人口統計体系以外の表は null", () => {
    expect(prefToCityStatsDataId("0000010112")).toBeNull();
    expect(prefToCityStatsDataId("0000010213")).toBeNull();
    expect(prefToCityStatsDataId("0004065882")).toBeNull();
  });
});

describe("市区町村の取得座標を観測値のrecipeへ保存", () => {
  const original: Extract<SourceConfig, { kind: "estat" }> = {
    kind: "estat", statsDataId: "0000010201", cdCat01: "#A03503",
  };
  const fixture = (extra: Partial<MetricConfig> = {}): MetricConfig => ({
    key: "city-provenance-test", title: "指標", unit: "人", category: "population",
    source: { ...original }, entities: ["prefecture", "city"], years: "all",
    visualization: { domain: { mode: "extent" }, colorScheme: "interpolateBlues", colorSchemeType: "sequential",
      trendDomain: { mode: "extent", padding: 0.08 }, comparisonDomain: { mode: "extent", padding: 0.05 } },
    ...extra,
  });
  const values = [{ "@area": "13101", "@time": "2020100000", $: "150" }];
  const response = { values, raw: { totalNumber: 1, toNumber: 1 }, sources: [] };

  it("県表から対応する市区町村表へ変えた座標を残し、configHashは正準configと照合できる", async () => {
    const config = fixture();
    const fetcher = vi.fn(async () => response), resolver = vi.fn(async () => null);
    const fetched = await fetchCityData("unused", config, original, fetcher, resolver);
    expect(fetcher).toHaveBeenCalledWith("unused", { ...original, statsDataId: "0000020301" });
    expect(resolver).not.toHaveBeenCalled();
    const payload = shapeForCity(config, fetched!.values, fetched!.source);
    expect(payload.meta.recipe.estatParams).toEqual({ statsDataId: "0000020301", cdCat01: "#A03503" });
    expect(payload.meta.recipe.configHash).toBe(buildRecipe(config).configHash);
    expect(payload.rows[0]).toMatchObject({ areaCode: "13101", value: 150 });
    expect(config.source).toEqual(original);
  });

  it("0件から指標名で再解決したcity cat01を実際の取得・recipeの双方に使う", async () => {
    const config = fixture();
    const fetcher = vi.fn(async () => response).mockResolvedValueOnce({ values: [], raw: { totalNumber: 0, toNumber: 0 }, sources: [] });
    const resolver = vi.fn(async () => "#A03506");
    const fetched = await fetchCityData("unused", config, original, fetcher, resolver);
    expect(resolver).toHaveBeenCalledWith("unused", "0000010201", "0000020301", "#A03503");
    expect(fetcher).toHaveBeenLastCalledWith("unused", { ...original, statsDataId: "0000020301", cdCat01: "#A03506" });
    expect(shapeForCity(config, fetched!.values, fetched!.source).meta.recipe).toMatchObject({
      estatParams: { statsDataId: "0000020301", cdCat01: "#A03506" }, configHash: buildRecipe(config).configHash,
    });
  });

  it("明示citySourceの表・軸・換算を使い、0件でも別コードを推測しない", async () => {
    const citySource = { kind: "estat" as const, statsDataId: "0004065882", cdCat01: "city-value", cdCat02: "total", valueScale: 0.1 };
    const config = fixture({ citySource, unit: "万円" });
    const fetcher = vi.fn(async () => response), resolver = vi.fn(async () => "not-used");
    const fetched = await fetchCityData("unused", config, original, fetcher, resolver);
    const payload = shapeForCity(config, fetched!.values, fetched!.source);
    expect(payload.meta.recipe).toMatchObject({ estatParams: { statsDataId: citySource.statsDataId, cdCat01: "city-value", cdCat02: "total" },
      ops: { valueScale: 0.1 }, configHash: buildRecipe(config).configHash });
    expect(payload.rows[0].value).toBe(15);
    fetcher.mockResolvedValueOnce({ values: [], raw: { totalNumber: 0, toNumber: 0 }, sources: [] });
    await fetchCityData("unused", config, original, fetcher, resolver);
    expect(resolver).not.toHaveBeenCalled();
  });

  it("正準configの取得条件を変更するとhashのdriftは残り、市区町村の取得座標とは分離される", () => {
    const config = fixture();
    const actual = { ...original, statsDataId: "0000020301", cdCat01: "#A03506" };
    const oldPayload = shapeForCity(config, values, actual);
    const changed = { ...config, source: { ...original, cdCat01: "#A03501" } };
    const newPayload = shapeForCity(changed, values, actual);
    expect(newPayload.meta.recipe.estatParams).toEqual(oldPayload.meta.recipe.estatParams);
    expect(newPayload.meta.recipe.configHash).not.toBe(oldPayload.meta.recipe.configHash);
    expect(newPayload.meta.recipe.configHash).toBe(buildRecipe(changed).configHash);
  });

  it("県がexternalでも市の実取得recipeと元configのhashを別々に保持する", () => {
    const citySource = { ...original, statsDataId: "0000020301" };
    const config = fixture({ source: { kind: "external", fetcherKey: "manual", config: {} }, citySource });
    const payload = shapeForCity(config, values, citySource);
    expect(payload.meta.recipe.kind).toBe("estat");
    expect(payload.meta.recipe.estatParams?.statsDataId).toBe(citySource.statsDataId);
    expect(payload.meta.recipe.configHash).toBe(buildRecipe(config).configHash);
  });
});
