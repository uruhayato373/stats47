import { describe, expect, it } from "vitest";
import { THEME_CATALOGS } from "../theme-catalog";

const EDUCATION_CULTURE_CATALOG = THEME_CATALOGS["education-culture"];


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
  it("学校密度・学習環境・進路・文化施設・鑑賞行動を分母ごとの5群に分ける", () => {
    // 人が問いを決めた章のカードだけを見る。読者の悩みから組み直した章 (concern を持つ。2026-10-31) は
    // expansion-semantics.test.ts が指標の到達を見る
    const designed = new Set(
      (EDUCATION_CULTURE_CATALOG.sections ?? []).filter((section) => !section.concern).flatMap((section) => section.metricGroupKeys),
    );
    const groups = (EDUCATION_CULTURE_CATALOG.metricGroups ?? []).filter(({ key }) => designed.has(key));
    expect(groups.map(({ key, rankingKeys }) => ({ key, rankingKeys }))).toEqual([
      { key: "schools-1", rankingKeys: SCHOOL_KEYS },
      { key: "schools-2", rankingKeys: ["elementary-school-students-per-teacher"] },
      { key: "higher-education", rankingKeys: ["in-pref-university-entrance-ratio-by-highschool-origin"] },
      { key: "culture-1", rankingKeys: CULTURE_KEYS },
      { key: "culture-2", rankingKeys: ["hobby-participation-rate-theater"] },
    ]);
    for (const group of groups) {
      expect(group.defaultCheckedKeys.length).toBeGreaterThan(0);
      expect(group.defaultCheckedKeys.length).toBeLessThanOrEqual(3);
      expect(group.rankingKeys).toEqual(expect.arrayContaining(group.defaultCheckedKeys));
    }
  });

  it("指標パネルと重複する学校・文化の独立チャートを持たない", () => {
    const chartKeys = EDUCATION_CULTURE_CATALOG.charts.map(
      (chart) => chart.componentKey,
    );

    // 博物館等の入館者の施設別の構成比 (2026-10-31) は値のカードと別の事実 (割合) を見せるので重複に当たらない
    expect(chartKeys).toEqual([
      "theme-edu-higher-education-trend",
      "theme-edu-higher-education-trend-attainment",
      "education-culture-cultural-facilities-and-arts-composition-1",
    ]);
    expect(chartKeys).not.toContain("theme-edu-school-trend");
    expect(chartKeys).not.toContain("theme-edu-culture-trend");
  });

  it("大学入学者と卒業者総数の割合を別チャートで表示し、分母を明記する", () => {
    const cases = [
      ["theme-edu-higher-education-trend", "in-pref-university-entrance-ratio-by-highschool-origin", "同県出身入学者中", "大学入学者が分母"],
      ["theme-edu-higher-education-trend-attainment", "final-education-university-graduate-school-ratio", "卒業者総数中", "卒業者総数が分母"],
    ];
    for (const [componentKey, metricKey, denominator, annotation] of cases) {
      const chart = EDUCATION_CULTURE_CATALOG.charts.find((item) => item.componentKey === componentKey);
      expect(chart?.componentProps.seriesRefs).toEqual([
        { metricKey, label: expect.stringContaining(denominator), colorRole: "series-1" },
      ]);
      expect(chart?.componentProps.estatParams).toBeUndefined();
      expect(chart?.relatedRankingKeys).toEqual([metricKey]);
      expect(chart?.annotation).toContain(annotation);
    }
  });

  it("白書論点から大学入学者の進路チャートへ辿れる", () => {
    const topic = EDUCATION_CULTURE_CATALOG.evidenceTopics?.find(
      ({ key }) => key === "higher-education-mobility",
    );

    expect(topic?.relatedChartKeys).toEqual([
      "theme-edu-higher-education-trend",
    ]);
  });
});
