/**
 * 生成時検査 (checkAreaHighlights) が違反の注入で落ちることを固定する。
 * 選定関数を「規則を 1 つ壊した版」に差し替え、検査が選定の出力と databook の生値から
 * 独立に違反を見つけることを確かめる (選定と検査が同じ誤りを共有しないため)。
 */
import { describe, expect, it } from "vitest";

import type { AreaDatabookSnapshot, DatabookMetricValue } from "../../types/databook-snapshot";
import { checkAreaHighlights } from "../check-area-highlights";
import { selectAreaHighlights, type AreaHighlight } from "../select-area-highlights";

function metric(rank: number, category: string, year = "2023年"): DatabookMetricValue {
  return {
    value: 100 - rank,
    rank,
    year,
    unit: "人",
    nationalAvg: 50,
    highlight: {
      label: `${category}-${rank}`,
      category,
      source: "社会・人口統計体系",
      isKakei: false,
      margin: 1,
      prominence: 0,
      polarity: null,
      published: true,
      rankedCount: 47,
      rankDirection: "desc",
    },
  };
}

/** 上位 4・下位 4 が分野重複なく埋まる健全な databook。 */
function healthyDatabook(areaCode: string): AreaDatabookSnapshot {
  const metrics: Record<string, DatabookMetricValue> = {};
  ["a", "b", "c", "d"].forEach((cat, i) => {
    metrics[`top-${cat}`] = metric(i + 1, cat);
    metrics[`bottom-${cat}`] = metric(47 - i, cat);
  });
  metrics["old-stat"] = metric(1, "e", "2014年度");
  metrics["dup-cat"] = metric(5, "a");
  metrics["unlisted"] = { ...metric(1, "f"), highlight: { ...metric(1, "f").highlight!, published: false } };
  return { areaCode, areaName: "テスト県", metrics, agriTop10: [], generatedAt: "2026-09-27T00:00:00Z" };
}

const snapshots = ["01000", "02000"].map(healthyDatabook);
// 検査は KNOWN_RANKING_KEYS 相当を独立に持つ。unlisted は含めない。
const publishedKeys = new Set(Object.keys(snapshots[0].metrics).filter((k) => k !== "unlisted"));

function toHighlight(databook: AreaDatabookSnapshot, key: string, direction: "top" | "bottom"): AreaHighlight {
  const m = databook.metrics[key];
  return {
    rankingKey: key,
    label: `${key}-label`,
    value: m.value,
    unit: m.unit,
    rank: m.rank,
    year: m.year,
    yearNumber: Number(m.year.slice(0, 4)),
    category: m.highlight!.category,
    source: m.highlight!.source,
    isKakei: false,
    direction,
    tone: "neutral",
  };
}

/** 本物の選定結果の上位の最後の 1 件を injectKey に差し替える選定関数を作る。 */
function injecting(injectKey: string): typeof selectAreaHighlights {
  return (databook, options) => {
    const real = selectAreaHighlights(databook, options);
    const snap = databook as AreaDatabookSnapshot;
    return { ...real, top: [...real.top.slice(0, -1), toHighlight(snap, injectKey, "top")] };
  };
}

describe("checkAreaHighlights", () => {
  it("健全な選定では違反 0", () => {
    expect(checkAreaHighlights(snapshots, { publishedKeys }).violations).toEqual([]);
  });

  it("古い年の値を選ぶと old-year で落ちる", () => {
    const { violations } = checkAreaHighlights(snapshots, { publishedKeys, select: injecting("old-stat") });
    expect(violations.map((v) => v.kind)).toContain("old-year");
  });

  it("片側で分野が重複すると duplicate-category で落ちる", () => {
    const { violations } = checkAreaHighlights(snapshots, { publishedKeys, select: injecting("dup-cat") });
    expect(violations.map((v) => v.kind)).toContain("duplicate-category");
  });

  it("非公開の指標を選ぶと unpublished で落ちる", () => {
    const { violations } = checkAreaHighlights(snapshots, { publishedKeys, select: injecting("unlisted") });
    expect(violations.map((v) => v.kind)).toContain("unpublished");
  });

  it("件数が足りないと fill で落ちる", () => {
    const { violations } = checkAreaHighlights(snapshots, { publishedKeys, requiredPerGroup: 5 });
    expect(violations.filter((v) => v.kind === "fill")).toHaveLength(4);
  });
});
