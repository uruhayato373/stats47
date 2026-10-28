import { describe, expect, it } from "vitest";

// @ts-expect-error — .claude 配下の決定的ゲート (型定義を持たない .mjs)
import { findChartTextIssues } from "../../../../../.claude/scripts/lib/svg-lint.mjs";
import { generateStackedBarSvg, STACKED_MOBILE_WIDTH } from "../stacked-bar";
import type { StatsSchema } from "../../shared/stats-schema";

function rows(groups: string[], series: string[], value: (gi: number, si: number) => number): StatsSchema[] {
  return groups.flatMap((g, gi) =>
    series.map((s, si) => ({
      metricKey: "value",
      areaCode: String(si + 1).padStart(2, "0"),
      areaName: s,
      yearCode: g,
      yearName: g,
      value: value(gi, si),
      unit: "千kL",
    })),
  );
}

const segmentLabels = (svg: string) =>
  [...svg.matchAll(/fill="#fff">([^<]+)<\/text>/g)].map((m) => m[1]);

const legendSwatchColors = (svg: string) =>
  [...svg.matchAll(/<rect [^>]*width="12" height="10" fill="(#[0-9a-f]{6})"/g)].map((m) => m[1]);

describe("generateStackedBarSvg (横・100%)", () => {
  it("横向きでも棒の中は生値ではなく構成比を出す", () => {
    const svg = generateStackedBarSvg(rows(["北海道"], ["畜産", "米"], (_g, si) => (si === 0 ? 7347 : 5253)), {
      title: "構成比",
      xKey: "yearCode",
      seriesKey: "areaCode",
      normalized: true,
      horizontal: true,
    });
    expect(segmentLabels(svg)).toEqual(["58.3%", "41.7%"]);
  });
});

describe("generateStackedBarSvg (縦・100%)", () => {
  it("縦軸が構成比なので、棒の中も生値ではなく構成比を出す", () => {
    const svg = generateStackedBarSvg(rows(["2018年度"], ["ビール", "焼酎"], (_g, si) => (si === 0 ? 3000 : 1000)), {
      title: "構成比",
      xKey: "yearCode",
      seriesKey: "areaCode",
      normalized: true,
    });
    expect(segmentLabels(svg)).toEqual(["75.0%", "25.0%"]);
  });

  it("100% でない積み上げは従来どおり生値を出す", () => {
    const svg = generateStackedBarSvg(rows(["2018年度"], ["ビール", "焼酎"], (_g, si) => (si === 0 ? 3000 : 1000)), {
      title: "数量",
      xKey: "yearCode",
      seriesKey: "areaCode",
    });
    expect(segmentLabels(svg)).not.toContain("75.0%");
  });

  it("8 系列でも凡例の色が重複しない", () => {
    const series = ["a", "b", "c", "d", "e", "f", "g", "h"];
    const svg = generateStackedBarSvg(rows(["2018年度"], series, () => 100), {
      title: "8 区分",
      xKey: "yearCode",
      seriesKey: "areaCode",
      normalized: true,
    });
    const colors = legendSwatchColors(svg);
    expect(colors).toHaveLength(8);
    expect(new Set(colors).size).toBe(8);
  });
});

// BLOG-STACKED-BAR-LABEL-MOBILE-01: 狭い区分の値が図のどこにも出ない (北海道のシェアの図で採卵鶏 3.5%)、
// 基準線 (全国平均) が引けない、スマホ用 SVG が無い、の 3 点を固定する。
const expectCleanText = (svg: string) => expect(findChartTextIssues(svg)).toEqual({ overflows: [], overlaps: [] });
/** 棒の外の注記 (白抜きでない「区分名 値」の文字) */
const noteTexts = (svg: string) => [...svg.matchAll(/class="svg-axis">([^<]+ -?[\d.]+%?)<\/text>/g)].map((m) => m[1]);
const fontSizes = (svg: string) => [...svg.matchAll(/font-size="([\d.]+)"/g)].map((m) => Number(m[1]));
const hokkaidoShare = rows(["北海道"], ["乳用牛", "肉用牛", "豚", "採卵鶏", "ブロイラー"], (_g, si) => [55.2, 21.0, 12.4, 3.5, 7.9][si]);
const shareOptions = { title: "北海道の畜産産出額の構成", xKey: "yearCode" as const, seriesKey: "areaCode" as const, horizontal: true, normalized: true };

describe("generateStackedBarSvg: 狭い区分の値", () => {
  it("横向きで棒の中に収まらない区分の値を、棒の外に数字で出す", () => {
    const svg = generateStackedBarSvg(hokkaidoShare, shareOptions);
    expect(segmentLabels(svg)).not.toContain("3.5%");
    expect(noteTexts(svg)).toContain("採卵鶏 3.5%");
    // 中に出た区分は注記に重ねて出さない
    expect(noteTexts(svg)).not.toContain("乳用牛 55.2%");
    expectCleanText(svg);
  });

  it("どの区分の値も図に 1 回は数字で出る (棒の中か外のどちらか)", () => {
    const svg = generateStackedBarSvg(hokkaidoShare, shareOptions);
    const shown = [...segmentLabels(svg), ...noteTexts(svg).map((t) => t.split(" ").slice(-1)[0])];
    expect(shown.sort()).toEqual(["12.4%", "21.0%", "3.5%", "55.2%", "7.9%"]);
  });

  it("縦向きでも狭い区分の値を凡例の下に出す", () => {
    const svg = generateStackedBarSvg(rows(["2018年度"], ["ビール", "焼酎"], (_g, si) => (si === 0 ? 980 : 20)), {
      title: "構成比",
      xKey: "yearCode",
      seriesKey: "areaCode",
      normalized: true,
    });
    expect(segmentLabels(svg)).toEqual(["98.0%"]);
    expect(noteTexts(svg)).toEqual(["焼酎 2.0%"]);
    expectCleanText(svg);
  });

  it("どの区分も棒に収まらない細い棒 (値を読ませない図) には注記を付けない", () => {
    const prefs = Array.from({ length: 47 }, (_, i) => `県${i + 1}`);
    const svg = generateStackedBarSvg(rows(prefs, ["男性", "女性"], () => 1_000_000), { title: "人口", xKey: "yearCode", seriesKey: "areaCode" });
    expect(noteTexts(svg)).toEqual([]);
  });
});

describe("generateStackedBarSvg: 基準線", () => {
  it("横向きは横軸の位置に縦の破線を引き、説明を出す", () => {
    const svg = generateStackedBarSvg(hokkaidoShare, { ...shareOptions, referenceLine: { value: 26.6, label: "全国平均 26.6%" } });
    // plotLeft 84 + 26.6% × plotWidth 576 = 237.2
    expect(svg).toMatch(/<line x1="237\.2" y1="[\d.]+" x2="237\.2" y2="[\d.]+" stroke="#111827"[^>]*stroke-dasharray/);
    expect(svg).toContain(">全国平均 26.6%</text>");
    expectCleanText(svg);
  });

  it("縦向きは縦軸の位置に横の破線を引く", () => {
    const svg = generateStackedBarSvg(rows(["2018", "2019"], ["a", "b"], (_g, si) => (si ? 30 : 70)), {
      title: "構成比",
      xKey: "yearCode",
      seriesKey: "areaCode",
      normalized: true,
      referenceLine: { value: 50, label: "半分" },
    });
    const line = svg.match(/<line x1="55\.0" y1="([\d.]+)" x2="656\.0" y2="([\d.]+)" stroke="#111827"/);
    expect(line).not.toBeNull();
    // plot 58〜322 の中央 (50%) = 190
    expect(Number(line![1])).toBe(190);
    expect(svg).toContain(">半分</text>");
    expectCleanText(svg);
  });

  it("軸の範囲外の値や説明の無い基準線は描かずに例外にする", () => {
    expect(() => generateStackedBarSvg(hokkaidoShare, { ...shareOptions, referenceLine: { value: 120, label: "x" } })).toThrow();
    expect(() => generateStackedBarSvg(hokkaidoShare, { ...shareOptions, referenceLine: { value: 20, label: " " } })).toThrow();
  });
});

describe("generateStackedBarSvg: スマホ用 (layout mobile)", () => {
  const regions = rows(["北海道", "東北", "関東", "中部", "近畿"], ["乳用牛", "肉用牛", "豚", "採卵鶏"], (gi, si) => [50, 25, 20, 5][si] + gi);

  it("横向きは幅 640 で、最小の文字が 20px 以上、区分名と値がすべて出る", () => {
    const svg = generateStackedBarSvg(regions, { ...shareOptions, title: "地方別の畜産産出額の構成", subtitle: "2023年", layout: "mobile", referenceLine: { value: 26.6, label: "全国平均" } });
    expect(svg).toMatch(new RegExp(`^<svg width="${STACKED_MOBILE_WIDTH}" height="\\d+" viewBox="0 0 ${STACKED_MOBILE_WIDTH} \\d+"`));
    expect(Math.min(...fontSizes(svg))).toBeGreaterThanOrEqual(20);
    for (const name of ["北海道", "東北", "関東", "中部", "近畿"]) expect(svg).toContain(`>${name}</text>`);
    expect(noteTexts(svg).length + segmentLabels(svg).length).toBe(20);
    expectCleanText(svg);
  });

  it("縦向きも幅 640・最小 20px で、文字が重ならない", () => {
    const svg = generateStackedBarSvg(rows(["2015", "2020", "2025"], ["ビール", "焼酎", "清酒"], (gi, si) => 100 + gi * 10 + si * 40), {
      title: "酒類の支出額",
      unit: "円",
      xKey: "yearCode",
      seriesKey: "areaCode",
      layout: "mobile",
    });
    expect(svg).toContain(`viewBox="0 0 ${STACKED_MOBILE_WIDTH} `);
    expect(Math.min(...fontSizes(svg))).toBeGreaterThanOrEqual(20);
    expectCleanText(svg);
  });

  it("スマホの読める範囲に収まらない長い見出しは縮めずに例外にする", () => {
    expect(() => generateStackedBarSvg(regions, { ...shareOptions, title: "長".repeat(60), layout: "mobile" })).toThrow();
  });

  it("desktop の出力は layout 未指定と default で同じ", () => {
    expect(generateStackedBarSvg(regions, { ...shareOptions, layout: "default" })).toBe(generateStackedBarSvg(regions, shareOptions));
  });
});
