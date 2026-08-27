import { describe, expect, it } from "vitest";

import { EDUCATION_CULTURE_CATALOG } from "../theme-catalog/education-culture";

const SCHOOL_KEYS = [
  "elementary-school-count-per-100km2-habitable",
  "junior-high-school-count-per-100km2-habitable",
  "high-school-count-per-100km2-habitable",
];

const CULTURE_KEYS = [
  "library-count-per-million",
  "public-hall-count-per-million",
];

describe("education-culture visualization composition", () => {
  it("施設指標を学校と文化の2群に分け、各群の推移をパネル内で表示する", () => {
    expect(EDUCATION_CULTURE_CATALOG.metricGroups).toEqual([
      {
        key: "school-facilities",
        title: "学校施設",
        rankingKeys: SCHOOL_KEYS,
        defaultCheckedKeys: SCHOOL_KEYS,
      },
      {
        key: "cultural-facilities",
        title: "文化施設",
        rankingKeys: CULTURE_KEYS,
        defaultCheckedKeys: CULTURE_KEYS,
      },
    ]);
  });

  it("指標パネルと重複する学校・文化の独立チャートを持たない", () => {
    const chartKeys = EDUCATION_CULTURE_CATALOG.charts.map(
      (chart) => chart.componentKey,
    );

    expect(chartKeys).toEqual([
      "theme-edu-higher-education-trend",
      "theme-edu-school-type-breakdown",
    ]);
    expect(chartKeys).not.toContain("theme-edu-school-trend");
    expect(chartKeys).not.toContain("theme-edu-culture-trend");
  });

  it("高等教育の割合2系列を1つの比較チャートに統合する", () => {
    const chart = EDUCATION_CULTURE_CATALOG.charts.find(
      ({ componentKey }) => componentKey === "theme-edu-higher-education-trend",
    );

    expect(chart?.componentProps.seriesRefs).toEqual([
      { metricKey: "final-education-university-graduate-school-ratio" },
      { metricKey: "in-pref-university-entrance-ratio-by-highschool-origin" },
    ]);
    expect(chart?.componentProps.estatParams).toBeUndefined();
    expect(chart?.componentProps.labels).toEqual([
      "大学・大学院卒の割合",
      "県内大学進学率",
    ]);
    expect(chart?.relatedRankingKeys).toEqual([
      "final-education-university-graduate-school-ratio",
      "in-pref-university-entrance-ratio-by-highschool-origin",
    ]);
  });

  it("白書論点から統合後の高等教育チャートへ辿れる", () => {
    const topic = EDUCATION_CULTURE_CATALOG.evidenceTopics?.find(
      ({ key }) => key === "higher-education-mobility",
    );

    expect(topic?.relatedChartKeys).toEqual([
      "theme-edu-higher-education-trend",
    ]);
  });
});
