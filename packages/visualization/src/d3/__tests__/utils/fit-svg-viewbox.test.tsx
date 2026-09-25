import { render } from "@testing-library/react";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { computeFontSize, computeMarginsByRatio } from "../../../shared/layout";
import { StackedAreaChart } from "../../components/StackedAreaChart/StackedAreaChart";
import { CHART_STYLES } from "../../constants";
import {
  computeFittedViewBox,
  fitSvgViewBox,
  transformBox,
  VIEWBOX_FIT_PADDING,
  type ViewBoxRect,
} from "../../utils/fit-svg-viewbox";

/** 等幅近似: ASCII 0.6em、それ以外 (万・億・漢字) 1em */
function estimateTextWidth(text: string, fontSize: number): number {
  return [...text].reduce((w, ch) => w + (ch.charCodeAt(0) < 128 ? 0.6 : 1) * fontSize, 0);
}

/**
 * StackedAreaChart (年齢3区分人口の推移) の y 目盛ラベルの外接矩形を、
 * コンポーネントと同じレイアウト計算から再現する。
 * axisLeft の text は x = -(tickSize 6 + padding 3)、さらに dx=-4、text-anchor end。
 */
function stackedAreaYLabelBox(label: string, width = 800, height = 500): ViewBoxRect {
  const { marginLeft } = computeMarginsByRatio(width, height, CHART_STYLES.margin.timeSeries);
  const fontSize = computeFontSize(width, height, CHART_STYLES.font.sizeRatio);
  const right = marginLeft - 9 - 4;
  const labelWidth = estimateTextWidth(label, fontSize);
  return { x: right - labelWidth, y: 100, width: labelWidth, height: fontSize * 1.2 };
}

const IDENTITY = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 };

describe("computeFittedViewBox", () => {
  it("StackedAreaChart の「1,400.0万」は比率マージンより長く、左へ広げて全体を含める", () => {
    const box = stackedAreaYLabelBox("1,400.0万");
    // 前提: 比率マージンでは収まらず負の x にはみ出している (これが見切れの原因)
    expect(box.x).toBeLessThan(0);

    const fitted = computeFittedViewBox(800, 500, [box]);
    expect(fitted.x).toBeLessThanOrEqual(box.x - VIEWBOX_FIT_PADDING);
    expect(fitted.x + fitted.width).toBeGreaterThanOrEqual(800);
    // はみ出していない辺は動かさない
    expect(fitted.y).toBe(0);
    expect(fitted.height).toBe(500);
  });

  it("はみ出しが無ければ viewBox は 0 0 width height のまま", () => {
    const inside: ViewBoxRect[] = [
      { x: 10, y: 10, width: 40, height: 12 },
      { x: 700, y: 470, width: 90, height: 20 },
    ];
    expect(computeFittedViewBox(800, 500, inside)).toEqual({ x: 0, y: 0, width: 800, height: 500 });
    expect(computeFittedViewBox(800, 500, [])).toEqual({ x: 0, y: 0, width: 800, height: 500 });
  });

  it("右へ伸びる長い凡例・軸タイトルは右辺だけを広げる", () => {
    const fitted = computeFittedViewBox(800, 500, [{ x: 600, y: 480, width: 260, height: 14 }]);
    expect(fitted.x).toBe(0);
    expect(fitted.width).toBeGreaterThanOrEqual(860 + VIEWBOX_FIT_PADDING);
    expect(fitted.y).toBe(0);
    expect(fitted.height).toBe(500);
  });

  it("回転した x ラベルは回転後の外接矩形で下辺を広げる", () => {
    // translate(400, 490) rotate(-45deg): 長いラベルが左下へ伸びる
    const r = -Math.PI / 4;
    const rotate = {
      a: Math.cos(r),
      b: Math.sin(r),
      c: -Math.sin(r),
      d: Math.cos(r),
      e: 400,
      f: 490,
    };
    const local = { x: -120, y: 0, width: 120, height: 14 };
    const box = transformBox(local, rotate);
    const fitted = computeFittedViewBox(800, 500, [box]);
    expect(box.y + box.height).toBeGreaterThan(500);
    expect(fitted.y + fitted.height).toBeGreaterThanOrEqual(box.y + box.height);
  });

  it("幅 0 / 非有限の矩形 (空 text・未描画) は無視する", () => {
    const junk: ViewBoxRect[] = [
      { x: -500, y: -500, width: 0, height: 0 },
      { x: Number.NaN, y: 0, width: 10, height: 10 },
    ];
    expect(computeFittedViewBox(800, 500, junk)).toEqual({ x: 0, y: 0, width: 800, height: 500 });
  });

  it("transformBox は恒等行列で元の矩形を返す", () => {
    expect(transformBox({ x: 1, y: 2, width: 3, height: 4 }, IDENTITY)).toEqual({ x: 1, y: 2, width: 3, height: 4 });
  });
});

describe("fitSvgViewBox (DOM)", () => {
  const proto = SVGElement.prototype as unknown as Record<string, unknown>;
  const originalCtm = Object.getOwnPropertyDescriptor(proto, "getScreenCTM");
  const originalBBox = Object.getOwnPropertyDescriptor(proto, "getBBox");

  afterEach(() => {
    if (originalCtm) Object.defineProperty(proto, "getScreenCTM", originalCtm);
    else delete proto.getScreenCTM;
    if (originalBBox) Object.defineProperty(proto, "getBBox", originalBBox);
  });

  function installMeasurement(boxFor: (el: SVGElement) => ViewBoxRect) {
    const matrix = {
      ...IDENTITY,
      inverse() {
        return matrix;
      },
      multiply() {
        return matrix;
      },
    };
    Object.defineProperty(proto, "getScreenCTM", { configurable: true, writable: true, value: () => matrix });
    Object.defineProperty(proto, "getBBox", {
      configurable: true,
      writable: true,
      value(this: SVGElement) {
        return boxFor(this);
      },
    });
  }

  it("測定 API が無い環境 (jsdom) では viewBox に触れない", () => {
    delete proto.getScreenCTM;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 800 500");
    svg.appendChild(document.createElementNS("http://www.w3.org/2000/svg", "text"));
    expect(() => fitSvgViewBox(svg, 800, 500)).not.toThrow();
    expect(svg.getAttribute("viewBox")).toBe("0 0 800 500");
    expect(() => fitSvgViewBox(null, 800, 500)).not.toThrow();
  });

  it("StackedAreaChart は描画後に「1,400.0万」の見切れ分だけ viewBox を左へ広げる", () => {
    const labelBox = stackedAreaYLabelBox("1,400.0万");
    installMeasurement((el) =>
      el.tagName.toLowerCase() === "text" && el.textContent === "1,400.0万"
        ? labelBox
        : { x: 0, y: 0, width: 0, height: 0 },
    );

    const { container } = render(
      <StackedAreaChart
        width={800}
        height={500}
        showLegend={false}
        series={[
          { key: "young", label: "年少", color: "#1" },
          { key: "working", label: "生産年齢", color: "#2" },
          { key: "old", label: "老年", color: "#3" },
        ]}
        data={[
          { category: "2000", label: "2000年", young: 2_000_000, working: 8_600_000, old: 2_200_000 },
          { category: "2020", label: "2020年", young: 1_500_000, working: 7_500_000, old: 3_600_000 },
        ]}
        yDomain={[0, 14_000_000]}
        // ページ側と同じ桁区切り付きの万表記 ("1,400.0万")
        yAxisFormatter={(v) =>
          `${(v / 10_000).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}万`
        }
      />,
    );

    const svg = container.querySelector("svg")!;
    const texts = Array.from(svg.querySelectorAll("text")).map((t) => t.textContent);
    expect(texts).toContain("1,400.0万");

    const [x, y, w, h] = svg.getAttribute("viewBox")!.split(" ").map(Number);
    expect(x).toBeLessThan(labelBox.x);
    expect(x + w).toBeGreaterThanOrEqual(800);
    expect(y).toBe(0);
    expect(h).toBe(500);
  });
});

describe("contract: 軸・凡例を描く D3 チャートは fitSvgViewBox を呼ぶ", () => {
  const componentsDir = join(__dirname, "../../components");
  const AXIS_USAGE = /\baxis(Left|Right|Top|Bottom)\b|computeMarginsByRatio\(/;

  const files = readdirSync(componentsDir)
    .filter((name) => statSync(join(componentsDir, name)).isDirectory() && !name.startsWith("__") && name !== "shared")
    .flatMap((dir) =>
      readdirSync(join(componentsDir, dir))
        .filter((f) => f.endsWith(".tsx"))
        .map((f) => join(componentsDir, dir, f)),
    )
    .filter((file) => AXIS_USAGE.test(readFileSync(file, "utf8")));

  it("対象コンポーネントを検出できている", () => {
    expect(files.length).toBeGreaterThanOrEqual(12);
  });

  it.each(files)("%s", (file) => {
    expect(readFileSync(file, "utf8")).toMatch(/fitSvgViewBox\(/);
  });
});
