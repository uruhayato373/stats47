import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { estimateTextWidth } from "../../shared/layout";
import { CategoryHeatmap } from "../components/CategoryHeatmap/CategoryHeatmap";
import { HorizontalDivergingBarChart } from "../components/HorizontalDivergingBarChart/HorizontalDivergingBarChart";
import { LineChart } from "../components/LineChart/LineChart";
import { MixedChart } from "../components/MixedChart/MixedChart";
import { StackedAreaChart } from "../components/StackedAreaChart/StackedAreaChart";

/**
 * 軸の文字が縮小表示でも読める大きさになる契約 (CHART-AXIS-READABILITY-01)。
 *
 * D3 の図は幅 800 の viewBox で描いて `w-full` で縮めるので、スマホ (表示幅 約 293〜340px) では
 * 12 の文字が約 5px になっていた。表示幅を ResizeObserver で測り、viewBox 単位の文字サイズを
 * 逆算する。ここでは ResizeObserver を「表示幅を 1 回知らせる」偽物に差し替えて確かめる。
 */

const MOBILE_WIDTH = 340;
const VIEW_WIDTH = 800;
const MOBILE_SCALE = MOBILE_WIDTH / VIEW_WIDTH;

const originalResizeObserver = globalThis.ResizeObserver;

function reportContainerWidth(width: number) {
  globalThis.ResizeObserver = class {
    private readonly callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe() {
      this.callback(
        [{ contentRect: { width } } as ResizeObserverEntry],
        this as unknown as ResizeObserver,
      );
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

const years = Array.from({ length: 50 }, (_, i) => 1975 + i);
const yearly = years.map((year) => ({
  category: String(year),
  label: `${year}年度`,
  value: 12_000_000 + (year - 1975) * 40_000,
  young: 2_000_000 - (year - 1975) * 10_000,
  working: 8_000_000 + (year - 1975) * 20_000,
  rate: 1 + (year - 1975) * 0.01,
}));

const areaSeries = [
  { key: "young", label: "15歳未満", color: "#6674d8" },
  { key: "working", label: "15〜64歳", color: "#67aaa8" },
];
const columns = [{ dataKey: "value", name: "人口", color: "#6674d8" }];
const lines = [{ dataKey: "rate", name: "倍率", color: "#d86666" }];

function tickFontSizes(container: HTMLElement): number[] {
  return [...container.querySelectorAll("g.tick text")].map((node) =>
    Number(node.getAttribute("font-size")),
  );
}

/** 横軸の目盛り (translate(x,0) の g.tick) の位置とラベル */
function xTicks(container: HTMLElement) {
  return [...container.querySelectorAll("g.tick")]
    .map((tick) => {
      const match = /translate\(([\d.]+),0\)/.exec(tick.getAttribute("transform") ?? "");
      const text = tick.querySelector("text");
      return match && text
        ? { x: Number(match[1]), label: text.textContent ?? "", fontSize: Number(text.getAttribute("font-size")) }
        : null;
    })
    .filter((tick): tick is { x: number; label: string; fontSize: number } => tick !== null);
}

function viewBoxOf(container: HTMLElement) {
  const [, , width, height] = (container.querySelector("svg")?.getAttribute("viewBox") ?? "").split(" ").map(Number);
  return { width, height };
}

const charts = [
  ["LineChart", () => <LineChart data={yearly} unit="人" height={250} />],
  ["StackedAreaChart", () => <StackedAreaChart data={yearly} series={areaSeries} unit="人" height={280} />],
  ["MixedChart", () => <MixedChart data={yearly} columns={columns} lines={lines} leftUnit="人" rightUnit="倍" height={280} />],
] as const;

describe.each(charts)("%s — 縮小表示でも読める軸の文字", (_name, renderChart) => {
  it(`表示幅 ${MOBILE_WIDTH}px では、軸の文字が画面上で 10px 以上になる`, () => {
    reportContainerWidth(MOBILE_WIDTH);
    const { container } = render(renderChart());
    const sizes = tickFontSizes(container);
    expect(sizes.length).toBeGreaterThan(0);
    for (const size of sizes) expect(size * MOBILE_SCALE).toBeGreaterThanOrEqual(10);
  });

  it("表示幅を測れない環境 (SSR・jsdom) と等倍表示では、基準の文字サイズのまま描く", () => {
    const unmeasured = tickFontSizes(render(renderChart()).container);
    reportContainerWidth(VIEW_WIDTH);
    const fullSize = tickFontSizes(render(renderChart()).container);
    expect(new Set(unmeasured)).toEqual(new Set([12]));
    expect(new Set(fullSize)).toEqual(new Set([12]));
  });

  it("文字を大きくしても横軸の年ラベルどうしが重ならず、等間隔に並ぶ", () => {
    reportContainerWidth(MOBILE_WIDTH);
    const { container } = render(renderChart());
    const ticks = xTicks(container);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < ticks.length; i += 1) {
      const needed =
        (estimateTextWidth(ticks[i - 1].label, ticks[i - 1].fontSize) +
          estimateTextWidth(ticks[i].label, ticks[i].fontSize)) / 2;
      expect(ticks[i].x - ticks[i - 1].x).toBeGreaterThanOrEqual(needed);
    }
    const yearsShown = ticks.map((tick) => parseInt(tick.label, 10));
    const steps = yearsShown.slice(1).map((year, i) => year - yearsShown[i]);
    expect(new Set(steps).size).toBe(1);
  });

  it("右端の年ラベルと下端の文字が viewBox からはみ出さない", () => {
    reportContainerWidth(MOBILE_WIDTH);
    const { container } = render(renderChart());
    const { width, height } = viewBoxOf(container);
    expect(width).toBe(VIEW_WIDTH);
    const ticks = xTicks(container);
    const last = ticks[ticks.length - 1];
    expect(last.x + estimateTextWidth(last.label, last.fontSize) / 2).toBeLessThanOrEqual(width);

    const axis = [...container.querySelectorAll("svg > g")].find((group) =>
      /translate\(0,[\d.]+\)/.test(group.getAttribute("transform") ?? "") && group.querySelector("g.tick"),
    );
    const axisY = Number(/translate\(0,([\d.]+)\)/.exec(axis?.getAttribute("transform") ?? "")?.[1]);
    const text = axis?.querySelector("g.tick text");
    const baseline = axisY + Number(text?.getAttribute("y")) + Number(text?.getAttribute("dy"));
    expect(baseline + last.fontSize * 0.25).toBeLessThanOrEqual(height);
    // 文字の上端は軸の線より下 (プロット領域に食い込まない)
    expect(baseline - last.fontSize * 0.8).toBeGreaterThanOrEqual(axisY);
  });
});

describe("縦軸の単位", () => {
  function unitLabels(container: HTMLElement): string[] {
    return [...container.querySelectorAll("text.axis-unit")].map((node) => node.textContent ?? "");
  }

  it("単軸の折れ線にも縦軸の頭に単位を出す", () => {
    const { container } = render(<LineChart data={yearly} unit="人" height={250} />);
    expect(unitLabels(container)).toEqual(["人"]);
  });

  it("単位が無い折れ線には単位の文字を足さない", () => {
    const { container } = render(<LineChart data={yearly} height={250} />);
    expect(unitLabels(container)).toEqual([]);
  });

  it("積み上げ面は実数のとき単位を出し、100% 積み上げでは目盛りの % に任せる", () => {
    const actual = render(<StackedAreaChart data={yearly} series={areaSeries} unit="人" />);
    expect(unitLabels(actual.container)).toEqual(["人"]);
    const normalized = render(<StackedAreaChart data={yearly} series={areaSeries} unit="人" normalize />);
    expect(unitLabels(normalized.container)).toEqual([]);
  });

  it("複合グラフは左右の軸それぞれに単位を出す", () => {
    const { container } = render(
      <MixedChart data={yearly} columns={columns} lines={lines} leftUnit="人" rightUnit="倍" />,
    );
    expect(unitLabels(container)).toEqual(["人", "倍"]);
  });

  it("単位の文字も画面上で 10px 以上になり、上端で切れない", () => {
    reportContainerWidth(MOBILE_WIDTH);
    const { container } = render(<LineChart data={yearly} unit="人" height={250} />);
    const unit = container.querySelector("text.axis-unit");
    const fontSize = Number(unit?.getAttribute("font-size"));
    expect(fontSize * MOBILE_SCALE).toBeGreaterThanOrEqual(10);
    expect(Number(unit?.getAttribute("y")) - fontSize * 0.85).toBeGreaterThanOrEqual(0);
  });
});

/**
 * 消費者物価のページ (/areas/13000/consumer-prices) の 2 つの図。375px の画面 (表示幅 293px) で
 * 文字が 5.9px と 3.9px だった (2026-11-14 CHART-AXIS-READABILITY-01)。
 */
describe("物価の図 — 縮小表示でも読める文字", () => {
  const PHONE_WIDTH = 293;
  const items = ["食料", "住居", "光熱・水道", "家具", "被服", "保健医療", "交通・通信", "教育", "教養娯楽", "諸雑費", "総合", "家賃除く総合"];
  const allSizes = (container: HTMLElement) =>
    [...container.querySelectorAll("text")].map((node) => Number(node.getAttribute("font-size")));

  it("基準からの乖離の横棒は、文字が画面上で 10px 以上になり、行が文字より低くならない", () => {
    reportContainerWidth(PHONE_WIDTH);
    const data = items.map((label, i) => ({ label, value: 94 + i }));
    const { container } = render(<HorizontalDivergingBarChart data={data} baseline={100} />);
    const scale = PHONE_WIDTH / 500;
    const sizes = allSizes(container);
    expect(sizes.length).toBeGreaterThan(items.length);
    for (const size of sizes) expect(size * scale).toBeGreaterThanOrEqual(10);
    const rowPitch = viewBoxOf(container).height / items.length;
    expect(rowPitch).toBeGreaterThan(Math.max(...sizes));
  });

  it("ヒートマップは、文字が画面上で 10px 以上になり、値が入らない狭いセルには値を書かない", () => {
    const years = Array.from({ length: 13 }, (_, i) => `${2013 + i}年`);
    const data = items.flatMap((y, r) => years.map((x, c) => ({ x, y, value: 95 + ((r + c) % 10) + 0.6 })));
    reportContainerWidth(PHONE_WIDTH);
    const narrow = render(<CategoryHeatmap data={data} baseline={100} />).container;
    const scale = PHONE_WIDTH / 600;
    for (const size of allSizes(narrow)) expect(size * scale).toBeGreaterThanOrEqual(10);
    expect(narrow.querySelectorAll("text.cell-text")).toHaveLength(0);
    // 年の目盛りは重ならないよう間引き、最新の年は残す
    const yearLabels = [...narrow.querySelectorAll("text")].map((node) => node.textContent).filter((t) => /^\d{4}$/.test(t ?? ""));
    expect(yearLabels.length).toBeLessThan(years.length);
    expect(yearLabels[yearLabels.length - 1]).toBe("2025");
    // PC の幅 (1280px の画面で表示幅 950px) ではセルに値を書く
    reportContainerWidth(950);
    const full = render(<CategoryHeatmap data={data} baseline={100} />).container;
    expect(full.querySelectorAll("text.cell-text").length).toBe(data.length);
  });
});
