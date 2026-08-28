import { describe, expect, it } from "vitest";

import type { MetricConfig } from "../types";
import { resolveMetricProvenance } from "./resolve-metric-provenance";

// 実在の statsDataId (estat-provenance.generated.json 由来):
//   0000010103 = SSDS 都道府県テーブル / 0003445758 = 賃金構造基本統計調査 (非SSDS)
const SSDS_TABLE = "0000010103";

function metric(source: MetricConfig["source"]): MetricConfig {
  return {
    key: "test",
    title: "test",
    unit: "人",
    category: "population",
    source,
    entities: ["prefecture"],
    years: "all",
  };
}

const ids = (m: MetricConfig) => resolveMetricProvenance(m).map((s) => s.id).sort();

describe("resolveMetricProvenance (param 単一ルール)", () => {
  it("家計調査（品目別, kakei-chousa kind）は kakei-chousa survey へ", () => {
    expect(ids(metric({ kind: "kakei-chousa" }))).toEqual(["kakei-chousa"]);
  });

  it("一次統計 estat は statsDataId で survey へ", () => {
    const m = metric({ kind: "estat", statsDataId: "0003445758" });
    expect(ids(m)).toEqual(["wage-structure-survey"]);
  });

  it("SSDS 基礎項目は statsDataId(SSDS)+cdCat01 → 原典 (複数可)", () => {
    // A1101 総人口 → 国勢調査報告 + 人口推計
    const m = metric({ kind: "estat", statsDataId: SSDS_TABLE, cdCat01: "A1101" });
    expect(ids(m)).toEqual(["census", "population-estimates"]);
  });

  it("SSDS 指標は計算式を基礎項目へ分解し原典を union する", () => {
    // #A01202 可住地面積人口密度 = A1101/B1103 → census + population-estimates + area-survey
    const m = metric({ kind: "estat", statsDataId: SSDS_TABLE, cdCat01: "#A01202" });
    expect(ids(m)).toEqual(["area-survey", "census", "population-estimates"]);
  });

  it("CDCAT01_SOURCE_OVERRIDE: Excel に資料源が無い派生項目も解決する", () => {
    // #A03506 65歳以上人口割合 → census (override)
    const m = metric({ kind: "estat", statsDataId: SSDS_TABLE, cdCat01: "#A03506" });
    expect(ids(m)).toEqual(["census"]);
  });

  it("SSDS 市区町村テーブルも statsDataId で SSDS 判定される", () => {
    // 0000020301 は SSDS 市区町村テーブル
    const m = metric({ kind: "estat", statsDataId: "0000020301", cdCat01: "A1101" });
    expect(ids(m)).toEqual(["census", "population-estimates"]);
  });

  it("未登録 statsDataId (一次統計でも表に無い) は空配列 (偽 survey を作らない)", () => {
    const m = metric({ kind: "estat", statsDataId: "9999999999" });
    expect(resolveMetricProvenance(m)).toEqual([]);
  });

  it("external は正式な displayName 辞書があれば master survey id へ解決する", () => {
    const m = metric({
      kind: "external",
      fetcherKey: "local-public-employee-salary",
      config: {},
      displayName: "地方公務員給与実態調査",
    });
    expect(ids(m)).toEqual(["local-public-employee-salary"]);
  });

  it("external の未知 displayName は合成 id のまま保持する", () => {
    const m = metric({
      kind: "external",
      fetcherKey: "unknown",
      config: {},
      displayName: "未登録の外部資料",
    });
    expect(ids(m)).toEqual(["src:未登録の外部資料"]);
  });
});
