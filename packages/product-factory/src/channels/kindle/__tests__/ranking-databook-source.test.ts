import { describe, expect, test } from "vitest";
import { METRICS_REGISTRY } from "@stats47/data-configs";
import { sourceForYear } from "../ranking-databook";
import { yearSuffixOf } from "../full-tables";

const cfg = (key: string) => (METRICS_REGISTRY as unknown as Record<string, Record<string, unknown>>)[key];

// 2026-11-18 K-S3 の全章レビュー: 図が年度の指標を「年」と書き、物価 2 指標の 2025 年の出典を
// 社会・人口統計体系と書いていた。図・表・出典の章は指標の定義から同じ値を引く。
describe("ランキング章の年と出典は指標の定義から決める", () => {
  test("補助の出典が持つ年は、その出典を返す (物価地域差指数の 2025 年 = 小売物価統計調査)", () => {
    const src = sourceForYear(cfg("consumer-price-difference-index-overall"), "2025");
    expect(String(src.displayName)).toContain("小売物価統計調査");
  });

  test("補助の出典に無い年は、本来の出典を返す", () => {
    const src = sourceForYear(cfg("consumer-price-difference-index-overall"), "2024");
    expect(src.displayName).toBe("社会・人口統計体系");
  });

  test("年度の指標は「年度」、暦年の指標は「年」", () => {
    expect(yearSuffixOf("active-job-opening-ratio")).toBe("年度");
    expect(yearSuffixOf("minimum-wage-by-region")).toBe("年度");
    expect(yearSuffixOf("physicians-in-medical-facilities-per-100k")).toBe("年");
    expect(yearSuffixOf("residential-land-price-change-rate")).toBe("年");
  });
});
