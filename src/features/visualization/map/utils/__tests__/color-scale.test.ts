/**
 * カラースケールユーティリティのテスト
 */

import { describe, expect, it } from "vitest";

import type { ChoroplethData } from "../../types/index";
import {
  createChoroplethColorMapper,
  createColorScale,
  createLegendData,
} from "../color-scale";

describe("createColorScale", () => {
  const testData: ChoroplethData[] = [
    { areaCode: "01000", value: 10 },
    { areaCode: "13000", value: 50 },
    { areaCode: "27000", value: 90 },
  ];

  it("基本的なカラースケールを作成できる", () => {
    const colorScale = createColorScale({
      data: testData,
      colorScheme: "interpolateBlues",
    });

    // 最小値、中央値、最大値で色を取得
    const minColor = colorScale(10);
    const midColor = colorScale(50);
    const maxColor = colorScale(90);

    // 色が文字列であることを確認（rgb形式またはhex形式）
    expect(typeof minColor).toBe("string");
    expect(typeof midColor).toBe("string");
    expect(typeof maxColor).toBe("string");

    // 値が大きいほど濃い色になることを確認（Bluesの場合）
    // 厳密な色の比較は難しいので、色が異なることのみ確認
    expect(minColor).not.toBe(maxColor);
  });

  it("データが空の場合、デフォルト色を返す", () => {
    const colorScale = createColorScale({
      data: [],
      noDataColor: "#cccccc",
    });

    const color = colorScale(100);
    expect(color).toBe("#cccccc");
  });

  it("発散カラースケール（zero基準）を作成できる", () => {
    const divergingData: ChoroplethData[] = [
      { areaCode: "01000", value: -50 },
      { areaCode: "13000", value: 0 },
      { areaCode: "27000", value: 50 },
    ];

    const colorScale = createColorScale({
      data: divergingData,
      colorScheme: "interpolateRdBu",
      divergingMidpoint: "zero",
    });

    const negativeColor = colorScale(-50);
    const zeroColor = colorScale(0);
    const positiveColor = colorScale(50);

    // 全て異なる色であることを確認
    expect(negativeColor).not.toBe(zeroColor);
    expect(zeroColor).not.toBe(positiveColor);
    expect(negativeColor).not.toBe(positiveColor);
  });

  it("発散カラースケール（mean基準）を作成できる", () => {
    const colorScale = createColorScale({
      data: testData,
      colorScheme: "interpolateRdBu",
      divergingMidpoint: "mean",
    });

    // 平均値は (10 + 50 + 90) / 3 = 50
    const belowMean = colorScale(10);
    const atMean = colorScale(50);
    const aboveMean = colorScale(90);

    expect(belowMean).not.toBe(atMean);
    expect(atMean).not.toBe(aboveMean);
  });

  it("発散カラースケール（median基準）を作成できる", () => {
    const colorScale = createColorScale({
      data: testData,
      colorScheme: "interpolateRdBu",
      divergingMidpoint: "median",
    });

    // 中央値は 50
    const belowMedian = colorScale(10);
    const atMedian = colorScale(50);
    const aboveMedian = colorScale(90);

    expect(belowMedian).not.toBe(atMedian);
    expect(atMedian).not.toBe(aboveMedian);
  });

  it("発散カラースケール（数値指定）を作成できる", () => {
    const colorScale = createColorScale({
      data: testData,
      colorScheme: "interpolateRdBu",
      divergingMidpoint: 30,
    });

    const below30 = colorScale(10);
    const at30 = colorScale(30);
    const above30 = colorScale(90);

    expect(below30).not.toBe(at30);
    expect(at30).not.toBe(above30);
  });
});

describe("createChoroplethColorMapper", () => {
  const testData: ChoroplethData[] = [
    { areaCode: "01000", value: 10 },
    { areaCode: "13000", value: 50 },
    { areaCode: "27000", value: 90 },
  ];

  it("地域コードから色を取得できる", () => {
    const getColor = createChoroplethColorMapper({
      data: testData,
      colorScheme: "interpolateBlues",
    });

    const color01 = getColor("01000");
    const color13 = getColor("13000");
    const color27 = getColor("27000");

    // 全て有効な色文字列であることを確認
    expect(typeof color01).toBe("string");
    expect(typeof color13).toBe("string");
    expect(typeof color27).toBe("string");

    // 値が異なるので色も異なることを確認
    expect(color01).not.toBe(color27);
  });

  it("存在しない地域コードの場合、noDataColorを返す", () => {
    const getColor = createChoroplethColorMapper({
      data: testData,
      colorScheme: "interpolateBlues",
      noDataColor: "#eeeeee",
    });

    const unknownColor = getColor("99000");
    expect(unknownColor).toBe("#eeeeee");
  });

  it("データが空の場合、全てnoDataColorを返す", () => {
    const getColor = createChoroplethColorMapper({
      data: [],
      colorScheme: "interpolateBlues",
      noDataColor: "#dddddd",
    });

    const color = getColor("01000");
    expect(color).toBe("#dddddd");
  });
});

describe("createLegendData", () => {
  const testData: ChoroplethData[] = [
    { areaCode: "01000", value: 0 },
    { areaCode: "13000", value: 50 },
    { areaCode: "27000", value: 100 },
  ];

  it("指定されたステップ数の凡例データを生成できる", () => {
    const legendItems = createLegendData(
      {
        data: testData,
        colorScheme: "interpolateBlues",
      },
      5
    );

    expect(legendItems).toHaveLength(5);

    // 最初の値は最小値、最後の値は最大値
    expect(legendItems[0].value).toBe(0);
    expect(legendItems[4].value).toBe(100);

    // 全てのアイテムが必要なプロパティを持つ
    legendItems.forEach((item) => {
      expect(item).toHaveProperty("value");
      expect(item).toHaveProperty("color");
      expect(item).toHaveProperty("label");
      expect(typeof item.color).toBe("string");
      expect(typeof item.label).toBe("string");
    });
  });

  it("データが空の場合、空配列を返す", () => {
    const legendItems = createLegendData(
      {
        data: [],
        colorScheme: "interpolateBlues",
      },
      5
    );

    expect(legendItems).toHaveLength(0);
  });

  it("等間隔の値で凡例を生成する", () => {
    const legendItems = createLegendData(
      {
        data: testData,
        colorScheme: "interpolateBlues",
      },
      3
    );

    expect(legendItems).toHaveLength(3);
    expect(legendItems[0].value).toBe(0);
    expect(legendItems[1].value).toBe(50);
    expect(legendItems[2].value).toBe(100);
  });

  it("発散カラースケールで凡例を生成できる", () => {
    const divergingData: ChoroplethData[] = [
      { areaCode: "01000", value: -100 },
      { areaCode: "13000", value: 0 },
      { areaCode: "27000", value: 100 },
    ];

    const legendItems = createLegendData(
      {
        data: divergingData,
        colorScheme: "interpolateRdBu",
        divergingMidpoint: "zero",
      },
      5
    );

    expect(legendItems).toHaveLength(5);
    expect(legendItems[0].value).toBe(-100);
    expect(legendItems[2].value).toBe(0); // 中央が0
    expect(legendItems[4].value).toBe(100);
  });
});
