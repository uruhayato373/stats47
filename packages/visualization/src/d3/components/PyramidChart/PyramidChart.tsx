"use client";

/**
 * d3.jsベースのピラミッドチャートコンポーネント
 * 
 * d3.jsを使用したdiverging stacked bar chartを実装。
 * 男性を左側（負の値）、女性を右側（正の値）に表示します。
 */

import { useEffect, useRef, useState } from "react";

import type { D3PyramidChartProps } from "../../types/d3";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import * as d3 from "d3";
import { computeChartLayout, computeFontSize, computeMarginsByRatio } from "../../../shared/layout";



/**
 * d3.jsベースのピラミッドチャート
 */
export function PyramidChart({
  chartData,
  width = 928,
  height = 300,
  marginTop: propsMarginTop,
  marginRight: propsMarginRight,
  marginBottom: propsMarginBottom,
  marginLeft: propsMarginLeft,
  valueFormatter = (value: number) =>
    new Intl.NumberFormat("ja-JP").format(Math.abs(value)),
}: D3PyramidChartProps) {
  const maleColor = "hsl(221, 83%, 53%)";
  const femaleColor = "hsl(340, 82%, 52%)";
  const unit = "人";
  const svgRef = useRef<SVGSVGElement>(null);
  const [isClient, setIsClient] = useState(false);
  const { showTooltip, updateTooltipPosition, hideTooltip } = useD3Tooltip();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const marginsByRatio = computeMarginsByRatio(width, height, {
    top: 20 / 450,     // 0.044
    right: 10 / 928,   // 0.011
    bottom: 0 / 450,   // 0
    left: 10 / 928,    // 0.011
  });

  const layout = computeChartLayout(width, height, {
    marginTop: propsMarginTop ?? marginsByRatio.marginTop,
    marginRight: propsMarginRight ?? marginsByRatio.marginRight,
    marginBottom: propsMarginBottom ?? marginsByRatio.marginBottom,
    marginLeft: propsMarginLeft ?? marginsByRatio.marginLeft,
  });

  const { innerWidth, innerHeight, marginTop, marginLeft, marginRight, marginBottom } = layout;
  const baseFontSize = computeFontSize(width, height, 0.033); // 10 / 300 = 0.033

  useEffect(() => {
    if (!isClient || !svgRef.current || !chartData || chartData.length === 0) {
      return;
    }

    // SVGをクリア
    d3.select(svgRef.current).selectAll("*").remove();

    // データをd3.js用の形式に変換
    // 男性は既に負の値、女性は既に正の値として渡される
    const data: Array<{ name: string; category: string; value: number }> = [];
    chartData.forEach((d) => {
      data.push(
        { name: d.ageGroup, category: "男性", value: d.male }, // 既に負の値
        { name: d.ageGroup, category: "女性", value: d.female } // 既に正の値
      );
    });

    // カテゴリのバランスを計算（男性を負、女性を正として）
    const signs = new Map([
      ["男性", -1],
      ["女性", +1],
    ]);

    // 各年齢階級のバイアス（負の値の合計）を計算
    const biasMap = d3.rollup(
      data,
      (v) =>
        d3.sum(
          v,
          (d) => d.value * Math.min(0, signs.get(d.category) || 0)
        ),
      (d) => d.name
    );

    // 年齢階級のラベルから最初の数値を抽出してソート（年齢の低い順）
    const extractAgeNumber = (label: string): number => {
      // 「0～4歳」「100歳以上」などの形式から最初の数値を抽出
      const match = label.match(/^(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
      // 「100歳以上」の場合は1000として扱う（最上位に配置）
      if (label.includes("100歳以上")) {
        return 1000;
      }
      return 0;
    };

    // 年齢の高い順（上から下）にソート
    const bias = Array.from(biasMap.entries()).sort(([nameA], [nameB]) => {
      const ageA = extractAgeNumber(nameA);
      const ageB = extractAgeNumber(nameB);
      return ageB - ageA; // 降順にソート
    });

    // スタックを準備（内側から外側へ積み上げ、男性→女性の順）
    // d3.rollupでnameをキーとしてグループ化し、各グループ内でcategoryをキーとしてvalueを集約
    // データは既に正負の値として渡されているので、そのまま使用
    const rollupData = d3.rollup(
      data,
      (data) =>
        d3.rollup(
          data,
          ([d]) => d.value,
          (d) => d.category
        ),
      (d) => d.name
    );

    // InternMapをオブジェクトの配列に変換（d3.stackが期待する形式）
    interface StackDataItem {
      name: string;
      男性: number;
      女性: number;
    }

    const stackData: StackDataItem[] = Array.from(
      rollupData.entries()
    ).map(([name, valueMap]) => {
      const obj: StackDataItem = {
        name,
        男性: valueMap.get("男性") || 0,
        女性: valueMap.get("女性") || 0,
      };
      return obj;
    });

    const series = d3
      .stack<StackDataItem>()
      .keys(["男性", "女性"])
      .value((d, category) => {
        // データは既に正負の値として渡されているので、そのまま返す
        return d[category as keyof StackDataItem] as number || 0;
      })
      .offset(d3.stackOffsetDiverging)(stackData);

    // スケールを構築（男女対称にするため絶対値の最大でドメインを設定）
    const allValues: number[] = [];
    series.forEach((s) => {
      s.forEach((point) => {
        allValues.push(point[0], point[1]);
      });
    });
    const maxAbs = d3.max(allValues, (v) => Math.abs(v)) ?? 0;
    const x = d3
      .scaleLinear()
      .domain([-maxAbs, maxAbs])
      .rangeRound([marginLeft, width - marginRight]);

    // y軸のdomainは上から下の順序なので、年齢の高い方が上になるようにそのまま使用
    const y = d3
      .scaleBand()
      .domain(bias.map(([name]) => name))
      .rangeRound([marginTop, height - marginBottom])
      .padding(0.1);

    const color = d3
      .scaleOrdinal()
      .domain(["男性", "女性"])
      .range([maleColor, femaleColor]);

    // パーセンテージフォーマッター（値の絶対値をフォーマット）
    const formatValue = ((format) => (x: number) => format(Math.abs(x)))(
      d3.format(",")
    );

    // SVGコンテナを作成
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("class", "w-full h-auto")
      .attr("style", `max-width: 100%; height: auto; font: ${baseFontSize}px sans-serif;`);

    // 各値のrectを追加（ツールチップ付き）
    svg
      .append("g")
      .selectAll("g")
      .data(series)
      .join("g")
      .attr("fill", (d) => color(d.key) as string)
      .selectAll("rect")
      .data((d) => d.map((v) => Object.assign(v, { key: d.key })))
      .join("rect")
      .attr("x", (d) => x(d[0]))
      .attr("y", (d) => {
        const dataObj = d.data as StackDataItem;
        return y(dataObj.name) || 0;
      })
      .attr("width", (d) => x(d[1]) - x(d[0]))
      .attr("height", y.bandwidth())
      .style("cursor", "pointer")
      .on("mouseenter", function (event: MouseEvent, d: any) {
        const dataObj = d.data as StackDataItem;
        const name = dataObj.name;
        const value = dataObj[d.key as keyof StackDataItem] as number || 0;
        const category = d.key;
        showTooltip(event, name, {
          value: Math.abs(value),
          categoryName: category,
          unit,
        });
      })
      .on("mousemove", function (event: MouseEvent) {
        updateTooltipPosition(event);
      })
      .on("mouseleave", function () {
        hideTooltip();
      });

    // 軸・ラベルなし（男性=青、女性=ピンクの色で判別）

    // クリーンアップ関数
    return () => {
      if (svgRef.current) {
        d3.select(svgRef.current).selectAll("*").remove();
      }
    };
  }, [isClient, chartData, width, height, valueFormatter, marginTop, marginRight, marginBottom, marginLeft, baseFontSize, showTooltip, updateTooltipPosition, hideTooltip]);

  if (!isClient) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full">
      <svg ref={svgRef} className="w-full" />
    </div>
  );
}

/** @deprecated Use PyramidChart */
export { PyramidChart as D3PyramidChart };

