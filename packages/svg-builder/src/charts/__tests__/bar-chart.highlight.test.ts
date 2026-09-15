import { describe, expect, it } from "vitest";
import { generateBarChartSvg, type BarItem } from "../bar-chart";

const items: BarItem[] = [
  { label: "1位 熊本県", name: "熊本県", rank: 1, value: 35.2 },
  { label: "2位 大分県", name: "大分県", rank: 2, value: 30.1 },
  { label: "…", value: 0, isSeparator: true },
  { label: "46位 青森県", name: "青森県", rank: 46, value: 5.1 },
  { label: "47位 秋田県", name: "秋田県", rank: 47, value: 4.2 },
];

const HIGHLIGHT_RE = /stroke="#111827" stroke-width="3"/g;

describe.each(["columns", "portrait", "single"] as const)("%s layout highlightName", (layout) => {
  it("一致する県のカード/バーにだけ輪郭を追加する", () => {
    const base = { title: "将来人口増減率", unit: "％", layout };
    const plain = generateBarChartSvg(items, base);
    const highlighted = generateBarChartSvg(items, { ...base, highlightName: "熊本県" });
    expect(plain.match(HIGHLIGHT_RE) ?? []).toHaveLength(0);
    expect(highlighted.match(HIGHLIGHT_RE) ?? []).toHaveLength(1);
  });

  it("一致しない名前を渡しても何も変わらない", () => {
    const base = { title: "将来人口増減率", unit: "％", layout };
    const plain = generateBarChartSvg(items, base);
    const noMatch = generateBarChartSvg(items, { ...base, highlightName: "東京都" });
    expect(noMatch.match(HIGHLIGHT_RE) ?? []).toHaveLength(0);
    expect(noMatch).toBe(plain);
  });
});

describe("focusNote (columns / single)", () => {
  it("columns: focusNote のテキストを描画し、幅960を保つ", () => {
    const svg = generateBarChartSvg(items, {
      title: "将来人口増減率",
      unit: "％",
      layout: "columns",
      focusNote: "熊本県: 1位 35.2%",
    });
    expect(svg).toContain('viewBox="0 0 960');
    expect(svg).toContain("熊本県: 1位 35.2%");
  });

  it("single: focusNote のテキストを描画し、幅680を保つ", () => {
    const svg = generateBarChartSvg(items, {
      title: "将来人口増減率",
      unit: "％",
      layout: "single",
      focusNote: "熊本県: 1位 35.2%",
    });
    expect(svg).toContain('viewBox="0 0 680');
    expect(svg).toContain("熊本県: 1位 35.2%");
  });

  it("columns: focusNote が無いときは描画前と高さが変わらない", () => {
    const base = generateBarChartSvg(items, { title: "t", unit: "％", layout: "columns" });
    const withoutNote = generateBarChartSvg(items, { title: "t", unit: "％", layout: "columns", focusNote: undefined });
    expect(withoutNote).toBe(base);
  });

  it("columns: 長い focusNote は2行に折り返しヘッダー領域を広げる (幅は960のまま)", () => {
    const shortNote = generateBarChartSvg(items, {
      title: "t",
      unit: "％",
      layout: "columns",
      focusNote: "短い注記",
    });
    const longNote = generateBarChartSvg(items, {
      title: "t",
      unit: "％",
      layout: "columns",
      focusNote:
        "これはとても長い注記でヘッダー領域を1行では収まらないほど広げる必要がある文章です。念のためさらに文字数を足してヘッダー幅960pxの1行に収まらないことを確実にします。",
    });
    const heightOf = (svg: string) => Number(/viewBox="0 0 960 (\d+)"/.exec(svg)?.[1]);
    expect(heightOf(longNote)).toBeGreaterThan(heightOf(shortNote));
    expect(longNote).toContain('viewBox="0 0 960');
  });

  it("portrait は focusNote 未対応 (無視して従来通り描画)", () => {
    const withNote = generateBarChartSvg(items, {
      title: "t",
      unit: "％",
      layout: "portrait",
      focusNote: "熊本県: 1位 35.2%",
    });
    const withoutNote = generateBarChartSvg(items, { title: "t", unit: "％", layout: "portrait" });
    expect(withNote).toBe(withoutNote);
  });
});
