"use client";

import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { feature } from "topojson-client";
// 型定義をローカルで定義
interface MapDataPoint {
  prefectureCode: string;
  prefectureName: string;
  value: number;
  displayValue: string;
  unit: string | null;
}

interface MapDataset {
  title?: string;
  statName: string;
  dataPoints: MapDataPoint[];
  summary?: {
    totalCount: number;
    validCount: number;
    min: number | null;
    max: number | null;
    average: number | null;
  };
  categories?: Array<{
    code: string;
    name: string;
    count: number;
  }>;
  years?: Array<{
    code: string;
    year: number;
    displayName: string;
    count: number;
  }>;
}

interface ChoroplethMapProps {
  dataset: MapDataset;
  width?: number;
  height?: number;
  className?: string;
}

interface TopoJSONData {
  type: "Topology";
  objects: {
    [key: string]: {
      type: "GeometryCollection";
      geometries: Array<{
        type: "Polygon" | "MultiPolygon";
        properties: {
          [key: string]: any;
          nam?: string; // 都道府県名
          nam_ja?: string; // 都道府県名（日本語）
          code?: string; // 都道府県コード
          name?: string; // 代替名称フィールド
          name_ja?: string; // 代替日本語名称フィールド
          pref?: string; // 代替コードフィールド
          pref_code?: string; // 代替コードフィールド
        };
      }>;
    };
  };
  arcs: number[][][];
  transform?: {
    scale: [number, number];
    translate: [number, number];
  };
}

export const ChoroplethMap: React.FC<ChoroplethMapProps> = ({
  dataset,
  width = 800,
  height = 600,
  className = "",
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

  useEffect(() => {
    if (!svgRef.current || !dataset) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // 既存の要素をクリア

    const loadMapData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // TopoJSONデータを読み込み
        const topojsonData = await d3.json<TopoJSONData>(
          "https://geoshape.ex.nii.ac.jp/city/topojson/20230101/jp_pref.l.topojson"
        );

        if (!topojsonData) {
          throw new Error("地図データの読み込みに失敗しました");
        }

        // データマップを作成
        const dataMap = new Map<string, MapDataPoint>();
        dataset.dataPoints.forEach((point) => {
          dataMap.set(point.prefectureCode, point);
        });

        // カラースケールを設定
        const colorScale = createColorScale(dataset);

        // 地図を描画
        drawMap(
          svg,
          topojsonData,
          dataMap,
          colorScale,
          width,
          height,
          setHoveredData
        );

        // 凡例を描画
        drawLegend(svg, colorScale, dataset, width, height);

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
  }, [dataset, width, height]);

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
          className="absolute pointer-events-none bg-black text-white text-xs px-2 py-1 rounded shadow-lg z-10"
          style={{
            left: hoveredData.x + 10,
            top: hoveredData.y - 10,
          }}
        >
          <div className="font-medium">{hoveredData.prefecture}</div>
          <div>{hoveredData.value}</div>
        </div>
      )}

      {/* データセット情報 */}
      <div className="mt-4 p-4 bg-gray-50 rounded">
        <h3 className="font-medium text-gray-900 mb-2">{dataset.title || dataset.statName}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">データ数:</span>{" "}
            {dataset.summary?.validCount || 0}/{dataset.summary?.totalCount || 0}
          </div>
          {dataset.summary?.min !== null && dataset.summary?.min !== undefined && (
            <div>
              <span className="font-medium">最小値:</span>{" "}
              {dataset.summary.min.toLocaleString()}
            </div>
          )}
          {dataset.summary?.max !== null && dataset.summary?.max !== undefined && (
            <div>
              <span className="font-medium">最大値:</span>{" "}
              {dataset.summary.max.toLocaleString()}
            </div>
          )}
          {dataset.summary?.average !== null && dataset.summary?.average !== undefined && (
            <div>
              <span className="font-medium">平均値:</span>{" "}
              {dataset.summary.average.toLocaleString(undefined, {
                maximumFractionDigits: 1,
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// カラースケールを作成
function createColorScale(dataset: MapDataset): d3.ScaleSequential<string> {
  const validValues = dataset.dataPoints
    .map((d) => d.value)
    .filter((v): v is number => v !== null);

  if (validValues.length === 0) {
    return d3.scaleSequential(() => "#e5e5e5");
  }

  const extent = d3.extent(validValues) as [number, number];

  return d3.scaleSequential().domain(extent).interpolator(d3.interpolateBlues);
}

// 地図を描画
function drawMap(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  topojsonData: TopoJSONData,
  dataMap: Map<string, MapDataPoint>,
  colorScale: d3.ScaleSequential<string>,
  width: number,
  height: number,
  setHoveredData: (
    data: { prefecture: string; value: string; x: number; y: number } | null
  ) => void
) {
  // TopoJSONデータの構造をチェック
  console.log("TopoJSON data structure:", topojsonData);

  if (!topojsonData || !topojsonData.objects) {
    throw new Error("Invalid TopoJSON data structure");
  }

  // TopoJSONオブジェクトのキーを確認
  const objectKeys = Object.keys(topojsonData.objects);
  console.log("Available TopoJSON objects:", objectKeys);

  // 適切なオブジェクトキーを見つける
  let geoObject;
  if (topojsonData.objects.jp_pref) {
    geoObject = topojsonData.objects.jp_pref;
  } else if (objectKeys.length > 0) {
    // 最初のオブジェクトを使用
    geoObject = topojsonData.objects[objectKeys[0]];
    console.log(`Using object: ${objectKeys[0]}`);
  } else {
    throw new Error("No geographic objects found in TopoJSON data");
  }

  // GeoJSONに変換
  const geojson = feature(topojsonData, geoObject) as GeoJSON.FeatureCollection;

  // 投影法を設定（日本用）
  const projection = d3
    .geoMercator()
    .center([138, 38])
    .scale(1000)
    .translate([width / 2, height / 2]);

  const path = d3.geoPath().projection(projection);

  // マップグループを作成
  const mapGroup = svg.append("g").attr("class", "map-group");

  // 都道府県を描画
  mapGroup
    .selectAll("path")
    .data(geojson.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("class", "prefecture")
    .attr("stroke", "#fff")
    .attr("stroke-width", 0.5)
    .attr("fill", (d) => {
      const prefCode =
        d.properties?.code || d.properties?.pref || d.properties?.pref_code;
      if (!prefCode) return "#e5e5e5";

      const dataPoint = dataMap.get(prefCode);
      if (!dataPoint || dataPoint.value === null) {
        return "#e5e5e5";
      }

      return colorScale(dataPoint.value);
    })
    .style("cursor", "pointer")
    .on("mouseover", function (event, d) {
      // 複数の可能性のあるプロパティ名をチェック
      const prefCode =
        d.properties?.code || d.properties?.pref || d.properties?.pref_code;
      const prefName =
        d.properties?.nam_ja ||
        d.properties?.name_ja ||
        d.properties?.nam ||
        d.properties?.name;

      console.log("Prefecture properties:", d.properties); // デバッグ用

      if (prefCode && prefName) {
        const dataPoint = dataMap.get(prefCode);
        const value = dataPoint?.displayValue || "データなし";
        const unit = dataPoint?.unit ? ` ${dataPoint.unit}` : "";

        setHoveredData({
          prefecture: prefName,
          value: `${value}${unit}`,
          x: event.pageX,
          y: event.pageY,
        });
      } else {
        // フォールバック: 利用可能なプロパティを表示
        const fallbackName = prefName || `地域${prefCode || "不明"}`;
        setHoveredData({
          prefecture: fallbackName,
          value: "データなし",
          x: event.pageX,
          y: event.pageY,
        });
      }

      // ハイライト効果
      d3.select(this).attr("stroke-width", 2).attr("stroke", "#333");
    })
    .on("mousemove", function (event) {
      setHoveredData((prev) =>
        prev
          ? {
              ...prev,
              x: event.pageX,
              y: event.pageY,
            }
          : null
      );
    })
    .on("mouseout", function () {
      setHoveredData(null);

      // ハイライト解除
      d3.select(this).attr("stroke-width", 0.5).attr("stroke", "#fff");
    });
}

// 凡例を描画
function drawLegend(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  colorScale: d3.ScaleSequential<string>,
  dataset: MapDataset,
  width: number,
  height: number
) {
  if (dataset.summary.min === null || dataset.summary.max === null) return;

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
    const value =
      dataset.summary.min + ratio * (dataset.summary.max - dataset.summary.min);
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
    .text(dataset.summary.min.toLocaleString());

  legend
    .append("text")
    .attr("x", legendWidth)
    .attr("y", legendHeight + 15)
    .attr("text-anchor", "end")
    .attr("font-size", "12px")
    .attr("fill", "#666")
    .text(dataset.summary.max.toLocaleString());
}
