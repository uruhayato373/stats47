import { describe, expect, it } from "vitest";

import { filterActiveRefreshTargets, isIngestableCityCode } from "../../scripts/page-data-batch";
import type { MetricConfig } from "../types";

const active = { key: "active", isActive: true } as MetricConfig;
const inactive = { key: "inactive", isActive: false } as MetricConfig;
const legacyActive = { key: "legacy-active" } as MetricConfig;

describe("page-data-batch の全量更新対象", () => {
  it("全量更新では退役済み metric を除外する", () => {
    expect(filterActiveRefreshTargets([active, inactive, legacyActive], false).map((c) => c.key)).toEqual([
      "active",
      "legacy-active",
    ]);
  });

  it("--metric 明示時は退役済み metric も個別診断できる", () => {
    expect(filterActiveRefreshTargets([inactive], true).map((c) => c.key)).toEqual(["inactive"]);
  });
});

describe("page-data-batch の市区町村コード判定", () => {
  const current = new Map([
    ["28201", "兵庫県 姫路市"],
    ["28101", "兵庫県 神戸市 東灘区"],
  ]);

  it("現行の市区町村マスタにあるコードは取り込む", () => {
    expect(isIngestableCityCode("28201", current)).toBe(true);
    expect(isIngestableCityCode("28101", current)).toBe(true);
  });

  it("国勢調査の表が返す合併前の旧町村 (旧：家島町 28421) は 5 桁でも取り込まない", () => {
    expect(isIngestableCityCode("28421", current)).toBe(false);
  });

  it("都道府県コードは市区町村として取り込まない", () => {
    expect(isIngestableCityCode("28000", new Map([["28000", "兵庫県"]]))).toBe(false);
  });
});
