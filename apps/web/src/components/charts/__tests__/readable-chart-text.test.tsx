import { estimateTextWidth } from "@stats47/visualization";
import { render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DistributionHistogram, type DistributionHistogramBin } from "../DistributionHistogram";
import { HubSankey } from "../HubSankey";
import { MiniBarChart, MiniLineChart } from "../MiniCharts";

/**
 * 図の中の文字がスマホの幅でも画面上で 10px 以上になる契約 (CHART-AXIS-READABILITY-01)。
 *
 * 固定幅の viewBox を `width: 100%` で縮める図は、表示幅 293px (390px の画面のカードの中) で
 * 文字が約 4〜5px になっていた。表示幅を ResizeObserver で測って文字サイズを逆算する。
 * ここでは ResizeObserver を「表示幅を 1 回知らせる」偽物に差し替えて確かめる。
 */

const MOBILE_WIDTH = 293;
const originalResizeObserver = globalThis.ResizeObserver;

function reportContainerWidth(width: number) {
  globalThis.ResizeObserver = class {
    private readonly callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    observe() {
      this.callback([{ contentRect: { width } } as ResizeObserverEntry], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

function viewBoxOf(container: HTMLElement) {
  const [, , width, height] = (container.querySelector("svg")?.getAttribute("viewBox") ?? "").split(" ").map(Number);
  return { width, height };
}

function texts(container: HTMLElement) {
  return [...container.querySelectorAll("svg text")].map((node) => ({
    node,
    label: node.textContent ?? "",
    x: Number(node.getAttribute("x")),
    y: Number(node.getAttribute("y")),
    anchor: node.getAttribute("text-anchor") ?? "start",
    fontSize: Number(node.getAttribute("font-size")),
  }));
}

/** 文字の左右の端 (viewBox 上の x)。幅は見積もり */
function horizontalExtent(text: { label: string; x: number; anchor: string; fontSize: number }, label = text.label) {
  const width = estimateTextWidth(label, text.fontSize);
  if (text.anchor === "end") return { left: text.x - width, right: text.x };
  if (text.anchor === "middle") return { left: text.x - width / 2, right: text.x + width / 2 };
  return { left: text.x, right: text.x + width };
}

describe("DistributionHistogram — 縮小表示でも読める文字", () => {
  const bins: DistributionHistogramBin[] = Array.from({ length: 20 }, (_, index) => ({
    x0: 10 + index * 2,
    x1: 12 + index * 2,
    count: 20 + ((index * 37) % 90),
    countInPref: index === 4 ? 3 : 0,
    isOverflow: index === 19,
    isUnderflow: false,
  }));
  const props = { bins, precision: 1, unit: "％", ariaLabel: "65歳以上人口割合の全国分布ヒストグラム" };

  it(`表示幅 ${MOBILE_WIDTH}px では、中央値と軸の端の文字が画面上で 10px 以上になる`, () => {
    reportContainerWidth(MOBILE_WIDTH);
    const { container } = render(<DistributionHistogram {...props} median={30} />);
    const scale = MOBILE_WIDTH / viewBoxOf(container).width;
    const all = texts(container);
    expect(all).toHaveLength(3);
    for (const text of all) expect(text.fontSize * scale).toBeGreaterThanOrEqual(10);
  });

  it("文字を大きくしても、上下左右のどの端でも切れず、軸の端の文字どうしが重ならない", () => {
    reportContainerWidth(MOBILE_WIDTH);
    // 中央値が右端のビンにあるとき、ラベルを線の左へ回して右端で切らない
    const { container } = render(<DistributionHistogram {...props} median={47.5} />);
    const { width, height } = viewBoxOf(container);
    const all = texts(container);
    for (const text of all) {
      const { left, right } = horizontalExtent(text);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(width);
      expect(text.y - text.fontSize * 0.85).toBeGreaterThanOrEqual(0);
      expect(text.y + text.fontSize * 0.25).toBeLessThanOrEqual(height);
    }
    const [, minLabel, maxLabel] = all;
    expect(horizontalExtent(minLabel).right).toBeLessThan(horizontalExtent(maxLabel).left);
  });

  it("表示幅を測れない環境と等倍表示では、従来の大きさ (10・viewBox 640×170) のまま描く", () => {
    const { container } = render(<DistributionHistogram {...props} median={30} />);
    expect(viewBoxOf(container)).toEqual({ width: 640, height: 170 });
    expect(new Set(texts(container).map((text) => text.fontSize))).toEqual(new Set([10]));
  });
});

describe("HubSankey — 縮小表示でも読める文字", () => {
  const prefectures = ["神奈川県", "埼玉県", "千葉県", "大阪府", "愛知県", "福岡県", "北海道", "茨城県", "その他38県"];
  const nodes = (base: number) =>
    prefectures.map((name, index) => ({ name, value: index === 8 ? base * 1.7 : Math.round(base / (index + 1)) }));
  const props = {
    title: "東京都 人口移動フロー（2025年）",
    subtitle: "左: 転入元 → 中央: 東京都 → 右: 転出先",
    centerLabel: "東京都",
    centerSub: "純移動 +65,219",
    centerSubColor: "#2563eb",
    leftNodes: nodes(88_983),
    rightNodes: nodes(87_758),
    leftColor: "#2563eb",
    rightColor: "#f59e0b",
    formatValue: (n: number) => Math.round(n).toLocaleString("ja-JP"),
    chrome: "bare" as const,
    usableHeight: 340,
  };

  it(`表示幅 ${MOBILE_WIDTH}px では、県名・値・中央のラベルが画面上で 10px 以上になる`, () => {
    reportContainerWidth(MOBILE_WIDTH);
    const { container } = render(<HubSankey {...props} />);
    const scale = MOBILE_WIDTH / viewBoxOf(container).width;
    const all = texts(container);
    expect(all.length).toBe(2 + 18);
    for (const text of all) expect(text.fontSize * scale).toBeGreaterThanOrEqual(10);
  });

  it("狭い幅では県名と値を 2 行に分け、左右の端で切れず、上下の行と重ならない", () => {
    reportContainerWidth(MOBILE_WIDTH);
    const { container } = render(<HubSankey {...props} />);
    const { width, height } = viewBoxOf(container);
    const labels = texts(container).filter((text) => text.anchor !== "middle");
    for (const text of labels) {
      const lines = [...text.node.querySelectorAll("tspan")];
      expect(lines).toHaveLength(2);
      for (const line of lines) {
        const { left, right } = horizontalExtent(text, line.textContent ?? "");
        expect(left).toBeGreaterThanOrEqual(0);
        expect(right).toBeLessThanOrEqual(width);
      }
    }
    for (const anchor of ["end", "start"]) {
      const column = labels.filter((text) => text.anchor === anchor);
      for (let i = 1; i < column.length; i += 1) {
        // 2 行分 (1 行 = 文字サイズの 1.15 倍) の間隔が空いている
        expect(column[i].y - column[i - 1].y).toBeGreaterThanOrEqual(column[i].fontSize * 2.3);
      }
      const last = column[column.length - 1];
      expect(last.y + last.fontSize * 1.4).toBeLessThanOrEqual(height);
    }
  });

  it("狭い幅でも流れの帯を描く幅を残す (ラベルの列が中央のノードまで届かない)", () => {
    reportContainerWidth(MOBILE_WIDTH);
    const { container } = render(<HubSankey {...props} />);
    const [leftNode] = [...container.querySelectorAll("svg rect")].filter((rect) => rect.getAttribute("rx") === "2");
    const focus = container.querySelector('svg rect[rx="3"]');
    const ribbon = Number(focus?.getAttribute("x")) - (Number(leftNode.getAttribute("x")) + Number(leftNode.getAttribute("width")));
    expect(ribbon).toBeGreaterThanOrEqual(60);
  });

  it("表示幅を測れない環境と等倍表示では、従来どおり 1 行のラベルを 15 の文字で描く", () => {
    const { container } = render(<HubSankey {...props} />);
    const labels = texts(container).filter((text) => text.anchor !== "middle");
    expect(new Set(labels.map((text) => text.fontSize))).toEqual(new Set([15]));
    for (const text of labels) {
      expect(text.node.querySelectorAll("tspan")).toHaveLength(1);
      const { left, right } = horizontalExtent(text);
      expect(left).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(1000);
    }
  });
});

describe("MiniCharts — 年のラベル", () => {
  const points = Array.from({ length: 30 }, (_, index) => ({ year: 1996 + index, value: 100 + index }));

  it("折れ線の両端の年は 10px 以上で描く (viewBox は表示幅と同じなので等倍)", async () => {
    const { container } = render(<MiniLineChart points={points} />);
    await waitFor(() => expect(container.querySelectorAll("svg text").length).toBe(2));
    for (const text of texts(container)) expect(text.fontSize).toBeGreaterThanOrEqual(10);
  });

  it("棒ごとの年は 10px 以上で描き、棒が多いときは重ならないよう等間隔に間引いて最新の年を残す", async () => {
    const { container } = render(<MiniBarChart points={points} />);
    await waitFor(() => expect(container.querySelectorAll("svg text").length).toBeGreaterThan(0));
    const labels = [...container.querySelectorAll("svg g[transform]")]
      .map((group) => {
        const text = group.querySelector("text");
        const x = Number(/translate\(([\d.]+)/.exec(group.getAttribute("transform") ?? "")?.[1]);
        return text ? { x, label: text.textContent ?? "", fontSize: Number(text.getAttribute("font-size")) } : null;
      })
      .filter((label): label is { x: number; label: string; fontSize: number } => label !== null);
    expect(labels.length).toBeGreaterThanOrEqual(2);
    expect(labels.length).toBeLessThan(points.length);
    expect(labels[labels.length - 1].label).toBe("25");
    for (const label of labels) expect(label.fontSize).toBeGreaterThanOrEqual(10);
    for (let i = 1; i < labels.length; i += 1) {
      expect(labels[i].x - labels[i - 1].x).toBeGreaterThanOrEqual(estimateTextWidth(labels[i].label, labels[i].fontSize));
    }
  });
});
