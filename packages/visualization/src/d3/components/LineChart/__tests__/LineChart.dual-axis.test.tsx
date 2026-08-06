import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LineChart } from "../LineChart";

import type { LineSeriesConfig, TimeSeriesDataNode } from "../types";

/**
 * 2 軸 (左右 Y 軸) の契約。
 *
 * 単位の異なる指標を 1 枚に重ねるために追加した (2026-08-06)。ここで固定したいのは:
 *  (a) `yAxis: "right"` の系列が 1 本でもあるときだけ右軸を描く
 *  (b) 未指定なら従来どおり単軸 = 既存の全チャートが挙動不変であること
 *  (c) 右軸系列は右のスケールで描かれる (左軸のドメインに引きずられない)
 */

const data: TimeSeriesDataNode[] = [
  { category: "2020", 円: 1000, 倍: 1.0 },
  { category: "2021", 円: 1200, 倍: 1.4 },
  { category: "2022", 円: 1400, 倍: 1.8 },
];

const SERIES: LineSeriesConfig[] = [
  { dataKey: "円", name: "賃金", color: "#111111" },
  { dataKey: "倍", name: "求人倍率", color: "#222222", yAxis: "right" },
];

/** 軸の目盛りテキストを集める。左右は translate の x で見分ける */
function tickTexts(container: HTMLElement) {
  return [...container.querySelectorAll("g.tick text")].map(
    (n) => n.textContent ?? "",
  );
}

describe("D3 LineChart — 2 軸", () => {
  it("right 系列があるとき右軸の目盛りが出る", () => {
    const { container } = render(
      <LineChart data={data} series={SERIES} unit="円" rightUnit="倍" />,
    );
    const texts = tickTexts(container);
    // 左軸は円のスケール (0〜1400 を「1.4千」等に略記)、右軸は倍のスケール (0〜1.8)。
    // 小数の目盛りは倍のスケールにしか現れないので、これが右軸が居る証拠になる
    expect(texts).toContain("1.4千");
    expect(texts).toContain("1.8");
    expect(texts).toContain("0.2");
  });

  it("右軸があるとき両方の単位ラベルを軸頭に出す", () => {
    const { container } = render(
      <LineChart data={data} series={SERIES} unit="円" rightUnit="倍" />,
    );
    const labels = [...container.querySelectorAll("text")].map(
      (n) => n.textContent ?? "",
    );
    expect(labels).toContain("円");
    expect(labels).toContain("倍");
  });

  it("★yAxis 未指定なら右軸を描かない (既存の単軸チャートは挙動不変)", () => {
    const singleAxis: LineSeriesConfig[] = [
      { dataKey: "円", name: "賃金", color: "#111111" },
      { dataKey: "倍", name: "求人倍率", color: "#222222" },
    ];
    const { container } = render(
      <LineChart data={data} series={singleAxis} unit="円" />,
    );
    const texts = tickTexts(container);
    // 倍 (0〜1.8) は円のスケール (0〜1400) に飲まれ、小数の目盛りは現れない
    expect(texts).toContain("1.4千");
    expect(texts).not.toContain("1.8");
    expect(texts).not.toContain("0.2");
  });

  it("右軸系列は右スケールで描かれる (左軸ドメインに潰されない)", () => {
    const { container } = render(
      <LineChart data={data} series={SERIES} unit="円" rightUnit="倍" />,
    );
    const paths = [...container.querySelectorAll("path")].filter((p) =>
      (p.getAttribute("d") ?? "").startsWith("M"),
    );
    expect(paths.length).toBeGreaterThanOrEqual(2);
    /** path の y 座標群 */
    const ysOf = (d: string) =>
      [...d.matchAll(/[ML,]\s*[\d.]+\s*,\s*([\d.]+)/g)].map((m) => Number(m[1]));
    // 右軸系列 (倍) も左軸系列と同じくプロット高いっぱいを使って上昇する。
    // 左軸のドメイン (1000-1400) に載せられていたら y はほぼ動かない
    const spans = paths.map((p) => {
      const ys = ysOf(p.getAttribute("d") ?? "");
      return Math.max(...ys) - Math.min(...ys);
    });
    expect(spans.every((s) => s > 10)).toBe(true);
  });
});
