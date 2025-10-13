/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
import { Topology } from "topojson-specification";
import {
  Feature,
  FeatureCollection,
  Geometry,
  GeoJsonProperties,
} from "geojson";
import { FormattedValue } from "@/types/models/estat";
import { formatRankingValueDisplay } from "@/types/models/ranking";
import { PREFECTURE_MAP } from "@/lib/prefecture";

export interface MapVisualizationOptions {
  colorScheme: string;
  divergingMidpoint: "zero" | "mean" | "median" | number;
}

// 数値フォーマット用ヘルパー関数
function formatNumber(value: number): string {
  return value.toLocaleString("ja-JP");
}

interface ChoroplethMapProps {
  data: FormattedValue[];
  width?: number;
  height?: number;
  className?: string;
  options?: MapVisualizationOptions;
}

const defaultOptions: MapVisualizationOptions = {
  colorScheme: "interpolateBlues",
  divergingMidpoint: "zero",
};

export const ChoroplethMap: React.FC<ChoroplethMapProps> = ({
  data,
  width = 800,
  height = 600,
  className = "",
  options = defaultOptions,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredData, setHoveredData] = useState<{
    prefecture: string;
    value: string;
    x: number;
    y: number;
  } | null>(null);

  // ツールチップの位置更新を最適化するための参照
  const tooltipRef = useRef<{
    prefecture: string;
    value: string;
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const loadMapData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TopoJSONデータを読み込み
        const topojsonData = await d3.json<Topology>(
          "https://geoshape.ex.nii.ac.jp/city/topojson/20230101/jp_pref.l.topojson"
        );

        if (!topojsonData) {
          throw new Error("地図データの読み込みに失敗しました");
        }

        // SVGの設定
        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove(); // 既存の要素をクリア

        svg
          .attr("width", "100%")
          .attr("height", "auto")
          .attr("viewBox", `0 0 ${width} ${height}`)
          .attr("preserveAspectRatio", "xMidYMid meet")
          .style("display", "block");

        // TopoJSONからGeoJSONへの変換
        const objectKey = Object.keys(topojsonData.objects)[0];
        if (!objectKey) {
          throw new Error("地図データの形式が正しくありません");
        }

        const japanGeo = feature(topojsonData, topojsonData.objects[objectKey]);
        const japan = japanGeo as FeatureCollection<Geometry>;

        // データの結合 - 全国データ（areaCode=00000）を除外
        const prefectureData = new Map<string, FormattedValue>();
        data.forEach((d) => {
          if (d.areaCode && d.areaCode !== "00000" && d.numericValue !== null) {
            // areaCodeを2桁に正規化（先頭の0を削除してから2桁にパディング）
            const prefCode = d.areaCode.replace(/^0+/, "").padStart(2, "0");
            prefectureData.set(prefCode, d);

            // 地域名でもマッピング
            if (d.areaName) {
              prefectureData.set(d.areaName, d);
              // 都道府県を除いた名前でもマッピング
              const normalizedName = d.areaName.replace(/[都道府県]$/, "");
              prefectureData.set(normalizedName, d);
            }
          }
        });

        // 地図の投影法
        const projection = d3
          .geoMercator()
          .center([137, 38])
          .scale(1200)
          .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);

        // カラースケールを生成
        const validValues = data
          .filter((d) => d.areaCode !== "00000" && d.numericValue !== null)
          .map((d) => d.numericValue!);

        if (validValues.length === 0) {
          throw new Error("有効なデータがありません");
        }

        const [minValue, maxValue] = d3.extent(validValues) as [number, number];

        // カラースキーマタイプを判定
        const isDivergingScheme =
          options.colorScheme.includes("RdBu") ||
          options.colorScheme.includes("RdYlBu") ||
          options.colorScheme.includes("RdYlGn") ||
          options.colorScheme.includes("Spectral") ||
          options.colorScheme.includes("BrBG") ||
          options.colorScheme.includes("PiYG") ||
          options.colorScheme.includes("PRGn") ||
          options.colorScheme.includes("RdGy");

        let colorScale: any;

        if (isDivergingScheme) {
          // ダイバージングスケールの中央値を計算
          let midpoint: number;
          switch (options.divergingMidpoint) {
            case "zero":
              midpoint = 0;
              break;
            case "mean":
              midpoint =
                validValues.reduce((a, b) => a + b, 0) / validValues.length;
              break;
            case "median":
              const sorted = [...validValues].sort((a, b) => a - b);
              midpoint = sorted[Math.floor(sorted.length / 2)];
              break;
            default:
              midpoint =
                typeof options.divergingMidpoint === "number"
                  ? options.divergingMidpoint
                  : 0;
          }

          colorScale = d3
            .scaleDiverging()
            .domain([minValue, midpoint, maxValue])
            .interpolator(
              (d3 as any)[options.colorScheme] || d3.interpolateBlues
            );
        } else {
          // シーケンシャルスケール
          colorScale = d3
            .scaleSequential()
            .domain([minValue, maxValue])
            .interpolator(
              (d3 as any)[options.colorScheme] || d3.interpolateBlues
            );
        }

        // 都道府県を描画
        svg
          .selectAll("path")
          .data(japan.features)
          .enter()
          .append("path")
          .attr("d", path as any)
          .attr("fill", (d: any) => {
            const feature = d as Feature<Geometry, GeoJsonProperties>;
            const index = japan.features.indexOf(feature);
            const prefCode = String(index + 1).padStart(2, "0");

            // データを検索
            let dataPoint = prefectureData.get(prefCode);
            if (!dataPoint) {
              const prefName = PREFECTURE_MAP[prefCode];
              if (prefName) {
                dataPoint =
                  prefectureData.get(prefName) ||
                  prefectureData.get(prefName.replace(/[都道府県]$/, ""));
              }
            }

            if (dataPoint && dataPoint.numericValue !== null) {
              return colorScale(dataPoint.numericValue);
            }
            return "#e5e5e5"; // データがない場合は灰色
          })
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .style("cursor", "pointer")
          .on("mouseover", function (event, d: any) {
            const feature = d as Feature<Geometry, GeoJsonProperties>;
            const index = japan.features.indexOf(feature);
            const prefCode = String(index + 1).padStart(2, "0");
            const prefName = PREFECTURE_MAP[prefCode] || "不明";

            // データを検索
            let dataPoint = prefectureData.get(prefCode);
            if (!dataPoint) {
              if (prefName !== "不明") {
                dataPoint =
                  prefectureData.get(prefName) ||
                  prefectureData.get(prefName.replace(/[都道府県]$/, ""));
              }
            }

            const value = formatRankingValueDisplay(
              dataPoint?.numericValue ?? undefined,
              dataPoint?.unit ?? undefined
            );

            // SVGコンテナの位置を取得
            const svgRect = svgRef.current?.getBoundingClientRect();
            if (svgRect) {
              const tooltipData = {
                prefecture: prefName,
                value: `${value}`,
                x: event.clientX - svgRect.left,
                y: event.clientY - svgRect.top,
              };
              tooltipRef.current = tooltipData;
              setHoveredData(tooltipData);
            }

            // ハイライト効果
            d3.select(this).attr("stroke-width", 2).attr("stroke", "#333");
          })
          .on("mousemove", function (event) {
            if (tooltipRef.current) {
              // SVGコンテナの位置を取得
              const svgRect = svgRef.current?.getBoundingClientRect();
              if (svgRect) {
                const tooltipData = {
                  ...tooltipRef.current,
                  x: event.clientX - svgRect.left,
                  y: event.clientY - svgRect.top,
                };
                tooltipRef.current = tooltipData;
                setHoveredData(tooltipData);
              }
            }
          })
          .on("mouseout", function () {
            tooltipRef.current = null;
            setHoveredData(null);
            // ハイライト解除
            d3.select(this).attr("stroke-width", 0.5).attr("stroke", "#fff");
          });

        // 凡例を描画
        drawLegend(svg, colorScale, validValues, width, height);

        setIsLoading(false);
      } catch (err) {
        console.error("Map loading error:", err);
        setError(
          err instanceof Error ? err.message : "地図の読み込みに失敗しました"
        );
        setIsLoading(false);
      }
    };

    loadMapData();
  }, [data, width, height, options]); // optionsを依存配列に追加

  return (
    <div className={`relative ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 bg-white"
      />

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">地図を読み込み中...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50">
          <div className="text-center text-red-600">
            <p className="font-medium">エラーが発生しました</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {hoveredData && (
        <div
          className="absolute pointer-events-none bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-10 whitespace-nowrap"
          style={{
            left: Math.min(hoveredData.x + 10, width - 120), // コンテナ幅を考慮
            top: Math.max(hoveredData.y - 40, 10), // 上端を考慮
            transform:
              hoveredData.x > width - 120 ? "translateX(-100%)" : "none", // 右端で反転
          }}
        >
          <div className="font-medium">{hoveredData.prefecture}</div>
          <div>{hoveredData.value}</div>
        </div>
      )}
    </div>
  );
};

// 凡例を描画
function drawLegend(
  svg: d3.Selection<SVGSVGElement | null, unknown, null, undefined>,
  colorScale: d3.ScaleSequential<string>,
  validValues: number[],
  width: number,
  height: number
) {
  if (validValues.length === 0) return;

  const min = Math.min(...validValues);
  const max = Math.max(...validValues);

  const legendWidth = 200;
  const legendHeight = 20;
  const legendX = width - legendWidth - 20;
  const legendY = height - 60;

  const legend = svg
    .append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${legendX}, ${legendY})`);

  // グラデーションを定義
  const defs = svg.append("defs");
  const gradient = defs
    .append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "100%")
    .attr("y2", "0%");

  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const value = min + ratio * (max - min);
    gradient
      .append("stop")
      .attr("offset", `${ratio * 100}%`)
      .attr("stop-color", colorScale(value));
  }

  // 凡例の矩形
  legend
    .append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .attr("fill", "url(#legend-gradient)")
    .attr("stroke", "#ccc");

  // 凡例のラベル
  legend
    .append("text")
    .attr("x", 0)
    .attr("y", legendHeight + 15)
    .attr("text-anchor", "start")
    .attr("font-size", "12px")
    .attr("fill", "#666")
    .text(formatNumber(min));

  legend
    .append("text")
    .attr("x", legendWidth)
    .attr("y", legendHeight + 15)
    .attr("text-anchor", "end")
    .attr("font-size", "12px")
    .attr("fill", "#666")
    .text(formatNumber(max));
}
