import { describe, expect, it } from "vitest";
import {
  computeChartLayout,
  computeFontSize,
  computeMarginsByRatio,
  bottomMarginForTickLabels,
  estimateTextWidth,
  fitCategoryAxis,
  leftMarginForTickLabels,
  MIN_READABLE_TEXT_PX,
  readableFontSize,
  selectCategoryTicks,
  thinTickLabels,
  tickLabelsFit,
  topMarginForAxisUnit,
  xTickLabelDy,
  yTickCount,
} from "../layout";

describe("layout utilities", () => {
  describe("computeChartLayout", () => {
    it("should calculate correct inner dimensions", () => {
      const margins = { marginTop: 10, marginRight: 20, marginBottom: 30, marginLeft: 40 };
      const layout = computeChartLayout(800, 500, margins);
      
      expect(layout.innerWidth).toBe(800 - 40 - 20);
      expect(layout.innerHeight).toBe(500 - 10 - 30);
      expect(layout.width).toBe(800);
      expect(layout.height).toBe(500);
    });

    it("should handle zero dimensions gracefully", () => {
      const margins = { marginTop: 300, marginRight: 0, marginBottom: 300, marginLeft: 0 };
      const layout = computeChartLayout(800, 500, margins);
      
      expect(layout.innerHeight).toBe(0); // 500 - 600 -> 0
    });
  });

  describe("computeMarginsByRatio", () => {
    it("should calculate margins based on ratios", () => {
      const ratios = {
        top: 30 / 500,    // 0.06
        right: 30 / 800,  // 0.0375
        bottom: 30 / 500, // 0.06
        left: 100 / 800,  // 0.125
      };
      
      const margins = computeMarginsByRatio(1920, 1080, ratios);
      
      expect(margins.marginTop).toBe(Math.round(1080 * 0.06)); // 65
      expect(margins.marginRight).toBe(Math.round(1920 * 0.0375)); // 72
      expect(margins.marginBottom).toBe(Math.round(1080 * 0.06)); // 65
      expect(margins.marginLeft).toBe(Math.round(1920 * 0.125)); // 240
    });
  });

  describe("computeFontSize", () => {
    it("should calculate font size based on min dimension", () => {
      // ratio: 48 / 500 (D3BarChartRace date label ratio)
      const ratio = 48 / 500;
      
      // landscape: min(1920, 1080) = 1080
      expect(computeFontSize(1920, 1080, ratio)).toBe(Math.round(1080 * ratio)); // 104
      
      // portrait: min(1080, 1920) = 1080
      expect(computeFontSize(1080, 1920, ratio)).toBe(Math.round(1080 * ratio)); // 104
    });

    it("should respect minFontSize", () => {
      const ratio = 1 / 10000; // micro ratio
      expect(computeFontSize(100, 100, ratio, 12)).toBe(12);
    });
  });
});

describe("leftMarginForTickLabels (縦軸ラベルが切れない左余白)", () => {
  // 幅の狭い県データブックのグラフで「1,400万」の先頭が切れ「400万」と読めた (2026-09-25)
  it("比率の余白より長いラベルがあれば、ラベル幅に合わせて広げる", () => {
    const margin = leftMarginForTickLabels(["0", "1,400万", "1,600万"], 12, 20);
    expect(margin).toBeGreaterThanOrEqual(Math.ceil(estimateTextWidth("1,600万", 12)));
    expect(margin).toBeGreaterThan(20);
  });

  it("比率の余白で足りる短いラベルなら余白を変えない", () => {
    expect(leftMarginForTickLabels(["0", "5", "10"], 12, 55)).toBe(55);
  });

  it("全角の単位は英数字より広く見積もる", () => {
    expect(estimateTextWidth("万", 10)).toBeGreaterThan(estimateTextWidth("1", 10));
  });
});

describe("readableFontSize (縮小表示しても読める文字サイズ)", () => {
  // 幅 800 の viewBox を 390px の画面 (表示幅 約 293〜340px) に縮めると 12 の文字が約 5px になった (2026-09-25)
  it("幅 800 の図を 340px に縮めても、画面上で 10px 以上になる大きさを返す", () => {
    const scale = 340 / 800;
    const size = readableFontSize(12, scale);
    expect(size * scale).toBeGreaterThanOrEqual(10);
    expect(size * scale).toBeGreaterThanOrEqual(MIN_READABLE_TEXT_PX);
  });

  it("縮小されていない図は基準の大きさのまま", () => {
    expect(readableFontSize(13, 1)).toBe(13);
    expect(readableFontSize(13, 1.4)).toBe(13);
  });

  it("表示幅を測れていない (0・非有限) ときは基準の大きさのまま", () => {
    expect(readableFontSize(12, 0)).toBe(12);
    expect(readableFontSize(12, Number.NaN)).toBe(12);
    expect(readableFontSize(12, Number.POSITIVE_INFINITY)).toBe(12);
  });
});

describe("文字の大きさに合わせた上下の余白と目盛りの数", () => {
  it("基準の文字 (12) では横軸ラベルの位置と下の余白を変えない", () => {
    expect(xTickLabelDy(12)).toBe(8);
    expect(bottomMarginForTickLabels(12, 25)).toBe(25);
  });

  it("文字を大きくしたら、横軸ラベルが軸の線に重ならず、下端でも切れない", () => {
    const fontSize = 26;
    const baseline = 9 + xTickLabelDy(fontSize);
    // 文字の上端 (ベースラインから約 0.8em 上) が軸の線 (y=0) より下
    expect(baseline - fontSize * 0.8).toBeGreaterThanOrEqual(0);
    expect(bottomMarginForTickLabels(fontSize, 25)).toBeGreaterThanOrEqual(baseline + fontSize * 0.25);
  });

  it("軸の頭に置く単位の文字が上端で切れない余白を返す", () => {
    expect(topMarginForAxisUnit(12, 20)).toBe(20);
    expect(topMarginForAxisUnit(26, 20)).toBeGreaterThanOrEqual(8 + 26 * 0.85);
  });

  it("文字が大きいときは縦軸の目盛りを減らし、隣の目盛りと重ねない", () => {
    expect(yTickCount(200, 12)).toBe(5);
    const count = yTickCount(200, 26);
    expect(200 / count).toBeGreaterThanOrEqual(26 * 1.5);
  });
});

describe("横軸ラベルの間引き", () => {
  const yearly = (from: number, to: number, left: number, right: number, suffix = "年度") => {
    const years = Array.from({ length: to - from + 1 }, (_, i) => from + i);
    return years.map((year, index) => ({
      value: String(year),
      label: `${year}${suffix}`,
      position: left + ((right - left) * index) / (years.length - 1),
    }));
  };

  it("tickLabelsFit は隣のラベルと重なる並びを検出する", () => {
    const ticks = [
      { value: "a", label: "2020年度", position: 100 },
      { value: "b", label: "2025年度", position: 130 },
    ];
    expect(tickLabelsFit(ticks, 12)).toBe(false);
    expect(tickLabelsFit([ticks[0], { ...ticks[1], position: 400 }], 12)).toBe(true);
  });

  it("thinTickLabels は等間隔に間引き、最後の目盛りを残す", () => {
    const ticks = yearly(2000, 2020, 100, 780).filter((_, i) => i % 5 === 0);
    const kept = thinTickLabels(ticks, 40);
    expect(tickLabelsFit(kept, 40)).toBe(true);
    expect(kept[kept.length - 1]?.value).toBe("2020");
    const steps = kept.slice(1).map((tick, i) => Number(tick.value) - Number(kept[i].value));
    expect(new Set(steps).size).toBeLessThanOrEqual(1);
  });

  it("基準の文字なら 5 年ごとのまま (幅 800 の従来の表示を変えない)", () => {
    const picked = selectCategoryTicks(yearly(1975, 2024, 60, 780), 12, { fallback: "ends" });
    expect(picked).toEqual(["1975", "1980", "1985", "1990", "1995", "2000", "2005", "2010", "2015", "2020"]);
  });

  it("文字が大きいと 5 年ごとでは重なるので、10 年・20 年と切りのよい間隔へ広げる", () => {
    const categories = yearly(1975, 2024, 130, 760);
    const picked = selectCategoryTicks(categories, 26, { fallback: "ends" });
    const kept = categories.filter((c) => picked.includes(c.value));
    expect(tickLabelsFit(kept, 26)).toBe(true);
    expect(picked.length).toBeGreaterThanOrEqual(2);
    const steps = picked.slice(1).map((value, i) => Number(value) - Number(picked[i]));
    expect(new Set(steps).size).toBe(1);
    expect(steps[0] % 10).toBe(0);
  });

  it("5 件以下の系列は全て表示し、5 年刻みから外れる調査年も残す (showAllUpTo)", () => {
    const categories = [
      { value: "2019", label: "2019", position: 100 },
      { value: "2024", label: "2024", position: 700 },
    ];
    expect(selectCategoryTicks(categories, 12, { fallback: "ends", showAllUpTo: 5 })).toEqual(["2019", "2024"]);
  });

  it("明示した目盛りは、重なるときだけ等間隔に間引く", () => {
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      value: `2024-${String(i + 1).padStart(2, "0")}`,
      label: `2024-${String(i + 1).padStart(2, "0")}`,
      position: 100 + i * 60,
    }));
    const explicit = ["2024-01", "2024-07", "2024-12"];
    expect(selectCategoryTicks(monthly, 12, { fallback: "ends", explicit })).toEqual(explicit);
    const all = monthly.map((m) => m.value);
    const thinned = selectCategoryTicks(monthly, 26, { fallback: "ends", explicit: all });
    expect(thinned.length).toBeLessThan(all.length);
    expect(thinned[thinned.length - 1]).toBe("2024-12");
  });

  it("年でない区分は fallback に従う (ends = 両端 / all = 全件 / none = 出さない)", () => {
    const categories = ["A", "B", "C", "D", "E", "F"].map((value, i) => ({ value, label: value, position: 100 + i * 100 }));
    expect(selectCategoryTicks(categories, 12, { fallback: "ends" })).toEqual(["A", "F"]);
    expect(selectCategoryTicks(categories, 12, { fallback: "all" })).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(selectCategoryTicks(categories, 12, { fallback: "none" })).toEqual([]);
  });

  it("yearCode があれば表示ラベルでなく年コードで間隔を決める", () => {
    const categories = [2018, 2019, 2020, 2021, 2022, 2023].map((year, i) => ({
      value: `R${i}`,
      label: `令和${i}年`,
      yearCode: String(year),
      position: 100 + i * 120,
    }));
    expect(selectCategoryTicks(categories, 12, { fallback: "ends" })).toEqual(["R2"]);
  });
});

describe("fitCategoryAxis (両端のラベルを viewBox に収める)", () => {
  const labels = ["2021年4月1日現在", "2022年4月1日現在", "2023年4月1日現在"];
  const positionsFor = (left: number, right: number) =>
    labels.map((label, index) => ({
      value: String(2021 + index),
      label,
      position: left + ((right - left) * index) / (labels.length - 1),
    }));
  const edges = (fontSize: number) => {
    const fitted = fitCategoryAxis(800, 55, 780, fontSize, positionsFor, { fallback: "ends", showAllUpTo: 5 });
    const shown = positionsFor(fitted.plotLeft, fitted.plotRight).filter((c) => fitted.tickValues.includes(c.value));
    const first = shown[0];
    const last = shown[shown.length - 1];
    return {
      fitted,
      left: first.position - estimateTextWidth(first.label, fontSize) / 2,
      right: last.position + estimateTextWidth(last.label, fontSize) / 2,
    };
  };

  it("長いラベルが左右の端からはみ出すときは、viewBox を広げずに描画領域を詰める", () => {
    const { fitted, left, right } = edges(26);
    expect(left).toBeGreaterThanOrEqual(0);
    expect(right).toBeLessThanOrEqual(800);
    expect(fitted.plotLeft).toBeGreaterThan(55);
    expect(fitted.plotRight).toBeLessThan(780);
    expect(fitted.tickValues[fitted.tickValues.length - 1]).toBe("2023");
  });

  it("収まっているときは描画領域を動かさない", () => {
    const short = (left: number, right: number) =>
      ["2019", "2024"].map((label, index) => ({ value: label, label, position: index === 0 ? left : right }));
    expect(fitCategoryAxis(800, 55, 780, 12, short, { fallback: "ends", showAllUpTo: 5 })).toEqual({
      plotLeft: 55,
      plotRight: 780,
      tickValues: ["2019", "2024"],
    });
  });
});
