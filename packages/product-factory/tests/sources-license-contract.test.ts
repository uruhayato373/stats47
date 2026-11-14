/**
 * PRODUCT-PACK-CONTENT-MISMATCH-01 (2026-11-14): 納品物の出典表 (SOURCES.csv)・利用許諾 (LICENSE-ja.txt)・形式一覧が
 * 実物と食い違っていた件の回帰テスト。全パックの固定データ (公開 R2 から作る生成の入力) を、実際の生成関数に通して確かめる。
 *  1. 調査名欄に指標名・表名が入る (職種別平均年収・腎不全による死亡者数・「患者調査 第37表 …」)
 *  2. e-Stat の一次統計の表なのに URL が社会・人口統計体系の案内ページを指す (賃金構造基本統計調査 0003445758 ほか)
 *  3. 他の指標から計算した値・表章項目を合算した値の加工式が「R2 から抽出」だけで、式が無い (P-07 家賃差引の参考額)
 *  4. LICENSE が同じ調査名の資料 URL を 1 件しか載せない
 *  5. 有料パックの利用許諾が「購入者本人のみ」「教育機関内のみ」(2026-11-14 オーナー決定で全有料パックを組織内利用へ)
 *  6. data.csv を常に同梱するのに、商品定義の形式一覧に CSV が無い (P-11)
 */
import { describe, it, expect } from "vitest";
import { METRICS_REGISTRY, buildRecipe, isSsdsStatsDataId, resolveProvenanceByParams, type MetricConfig } from "@stats47/data-configs";
import { loadPackSnapshotDatasets } from "../src/data/pack-snapshot";
import { sourceOrigin } from "../src/data/sources";
import { renderLicenseText } from "../src/licenses/license-text";
import { PACKS } from "../src/catalog/products/packs";

const SSDS_GUIDE_URL = "https://www.stat.go.jp/data/ssds/index.htm";
const registry = METRICS_REGISTRY as unknown as Record<string, MetricConfig & Record<string, unknown>>;
const databookPacks = PACKS.filter((p) => p.price.initialYen > 0 && loadPackSnapshotDatasets(p.id) !== null);
const packs = new Map(databookPacks.map((p) => [p.id, loadPackSnapshotDatasets(p.id)!.datasets]));
const isCalculated = (key: string): boolean => {
  const src = registry[key].source as { kind: string; fetcherKey?: string };
  return src.kind === "external" && src.fetcherKey === "calculated";
};
const usesMainSource = (key: string, year: string): boolean =>
  !(registry[key].supplementalSources ?? []).some((s) => s.years.includes(Number(year)));

describe("SOURCES.csv の列が実物の出典と一致する", () => {
  it("全有料パックを検査している", () => {
    expect(databookPacks.map((p) => p.id)).toEqual(expect.arrayContaining(["P-01", "P-06", "P-07", "P-11", "P-12", "P-14"]));
  });

  it("調査名欄に指標名・表名を入れず、e-Stat の一次統計は調査マスタの調査名を書く", () => {
    for (const [id, datasets] of packs) {
      for (const d of datasets) {
        const where = `${id}:${d.rankingKey}`;
        expect(d.source.surveyName, where).not.toBe(d.indicator);
        expect(d.source.surveyName, where).not.toBe(d.source.tableName);
        expect(d.source.surveyName, where).not.toBe(registry[d.rankingKey!].title);
        const sid = d.source.statsDataId;
        if (isCalculated(d.rankingKey!) || !/^\d{10}$/.test(sid) || isSsdsStatsDataId(sid)) continue;
        const surveys = resolveProvenanceByParams(sid, undefined);
        if (surveys.length > 0) expect(d.source.surveyName, where).toBe(surveys.map((s) => s.name).join("・"));
      }
    }
    const cancer = packs.get("P-05")!.find((d) => d.rankingKey === "treatment-rate-cancer-outpatient");
    expect(cancer?.source.surveyName).toBe("患者調査");
  });

  it("e-Stat の一次統計の表の行は、社会・人口統計体系の案内ページを URL にしない", () => {
    let checked = 0;
    for (const [id, datasets] of packs) {
      for (const d of datasets) {
        const sid = d.source.statsDataId;
        if (isCalculated(d.rankingKey!) || !/^\d{10}$/.test(sid) || isSsdsStatsDataId(sid)) continue;
        checked += 1;
        expect(d.source.url, `${id}:${d.rankingKey}`).not.toBe(SSDS_GUIDE_URL);
      }
    }
    expect(checked).toBeGreaterThan(100);
    const professor = packs.get("P-09")!.find((d) => d.rankingKey === "associate-professor-annual-income");
    expect(professor?.source.url).toBe("https://www.e-stat.go.jp/dbview?sid=0003445758");
  });

  it("計算・合算で作った値の加工式は、抽出だけでなく式を書く", () => {
    let derived = 0;
    for (const [id, datasets] of packs) {
      for (const d of datasets) {
        if (!usesMainSource(d.rankingKey!, d.year)) continue;
        const ops = buildRecipe(registry[d.rankingKey!]).ops;
        if (!ops?.calc && !ops?.tabCombination && !ops?.axisRatio) continue;
        derived += 1;
        expect(d.source.transform, `${id}:${d.rankingKey}`).toContain("算出式：");
      }
    }
    expect(derived).toBeGreaterThan(30);
    const rent = packs.get("P-07")!.find((d) => d.rankingKey === "disposable-income-after-rent")!;
    expect(rent.source.transform).toContain("disposable-income-worker-households");
    expect(rent.source.transform).toContain("private-rent-consumption-expenditure）÷12");
    expect(rent.source.transform).toContain(" − ");
  });
});

describe("LICENSE-ja.txt と商品定義が実物と一致する", () => {
  it("e-Stat 以外の提供元は、SOURCES.csv の全 URL を出典表示に挙げる", () => {
    for (const p of databookPacks) {
      const sources = packs.get(p.id)!.map((d) => d.source);
      const text = renderLicenseText(p.licenseId, sources);
      for (const s of sources.filter((x) => sourceOrigin(x) === "other")) expect(text, `${p.id}:${s.surveyName}`).toContain(s.url);
    }
  });

  it("有料パックの利用許諾は購入した組織の中での利用以上 (本人のみ・教育機関内のみにしない)", () => {
    for (const p of PACKS.filter((x) => x.price.initialYen > 0)) {
      expect(["single-corporate", "client-work"], p.id).toContain(p.licenseId);
    }
  });

  it("data.csv を常に同梱するデータブックの形式一覧に CSV がある", () => {
    for (const p of databookPacks) expect(p.formats, p.id).toContain("csv");
  });
});
