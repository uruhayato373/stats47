import { describe, expect, test } from "vitest";

import { generateBarChartSvg } from "../charts/bar-chart";
import { generateScatterSvg } from "../charts/scatter";

import { svgThemeStyle } from "./theme";

describe("svgThemeStyle", () => {
  test("prefers-color-scheme: dark の media query を含む", () => {
    const style = svgThemeStyle();
    expect(style).toContain("@media (prefers-color-scheme:dark)");
  });

  test("テーマ依存 class をすべて定義する", () => {
    const style = svgThemeStyle();
    for (const cls of [
      "svg-bg",
      "svg-plot",
      "svg-plot-border",
      "svg-title",
      "svg-axis",
      "svg-tick",
      "svg-grid",
    ]) {
      expect(style).toContain(`.${cls}{`);
    }
  });

  test("light/dark 両方の値を持つ (svg-title の light と dark)", () => {
    const style = svgThemeStyle();
    // light: #1f2937, dark: #e2e8f0
    expect(style).toContain("#1f2937");
    expect(style).toContain("#e2e8f0");
  });
});

describe("chart SVG は dark mode 対応 (theme class + media query)", () => {
  test("scatter: テーマ依存色を inline 固定せず class 化している", () => {
    const svg = generateScatterSvg(
      [
        { name: "高知", code: "39", x: 2309, y: 5.9 },
        { name: "佐賀", code: "41", x: 2050, y: 10.8 },
      ],
      { title: "テスト", xLabel: "X", yLabel: "Y", colorByRegion: true },
    );
    expect(svg).toContain("@media (prefers-color-scheme:dark)");
    expect(svg).toContain('class="svg-bg"');
    // 背景・タイトルの固定色が残っていないこと
    expect(svg).not.toContain('fill="#ffffff"');
    expect(svg).not.toContain('fill="#333"');
    // データ色 (地方ブロック) は維持されること
    expect(svg).toContain("#42a5f5");
  });

  test("bar: 背景・タイトルが class 化され固定色が残らない", () => {
    const svg = generateBarChartSvg(
      [
        { label: "愛知", value: 58 },
        { label: "沖縄", value: 0.5 },
      ],
      { title: "製造品出荷額", unit: "兆円" },
    );
    expect(svg).toContain("@media (prefers-color-scheme:dark)");
    expect(svg).toContain('class="svg-bg"');
    expect(svg).not.toContain('fill="#fafafa"');
    expect(svg).not.toContain('fill="#333"');
  });
});
