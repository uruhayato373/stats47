/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import * as d3 from "d3";
import { RefreshCw, AlertCircle } from "lucide-react";
import { EstatStatsDataService } from "@/lib/estat/statsdata/EstatStatsDataService";
import { GetStatsDataParams } from "@/types/models/estat/parameters";

export interface EstatGenderDonutChartProps {
  /**
   * e-stat API パラメータ
   * statsDataId は必須
   */
  params: Omit<GetStatsDataParams, "appId">;

  /**
   * 男性人口のカテゴリコード
   */
  maleCategoryCode: string;

  /**
   * 女性人口のカテゴリコード
   */
  femaleCategoryCode: string;

  /**
   * 都道府県コード（指定しない場合は全国データ "00000" を使用）
   */
  areaCode?: string;

  /**
   * 幅（ピクセル）
   */
  width?: number;

  /**
   * 高さ（ピクセル）
   */
  height?: number;

  /**
   * CSSクラス名
   */
  className?: string;

  /**
   * グラフタイトル
   */
  title?: string;

  /**
   * データ取得成功時のコールバック
   */
  onDataLoaded?: (data: { male: number; female: number }) => void;

  /**
   * エラー発生時のコールバック
   */
  onError?: (error: Error) => void;
}

interface GenderData {
  label: string;
  value: number;
  color: string;
}

/**
 * e-stat APIから男性・女性人口データを取得してドーナツチャートを表示するコンポーネント
 */
export const EstatGenderDonutChart: React.FC<EstatGenderDonutChartProps> = ({
  params,
  maleCategoryCode,
  femaleCategoryCode,
  areaCode = "00000",
  width = 400,
  height = 400,
  className = "",
  title = "男女人口比率",
  onDataLoaded,
  onError,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [maleValue, setMaleValue] = useState<number>(0);
  const [femaleValue, setFemaleValue] = useState<number>(0);
  const chartRef = useRef<HTMLDivElement>(null);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log("[EstatGenderDonutChart] Fetching data with params:", params);

        // e-stat APIからデータを取得
        const response = await EstatStatsDataService.getAndFormatStatsData(
          params.statsDataId,
          {
            limit: params.limit || 100000,
          }
        );

        console.log("[EstatGenderDonutChart] Data fetched:", {
          totalValues: response.values.length,
        });

        // 指定されたエリアコードと最新年度のデータをフィルタリング
        const filteredValues = response.values.filter(
          (v) => v.areaCode === areaCode && v.numericValue !== null
        );

        if (filteredValues.length === 0) {
          throw new Error(`指定された地域（${areaCode}）のデータが見つかりませんでした`);
        }

        // 最新年度を取得
        const latestYear = filteredValues.reduce((max, v) => {
          return v.timeCode > max ? v.timeCode : max;
        }, filteredValues[0].timeCode);

        console.log("[EstatGenderDonutChart] Latest year:", latestYear);

        // 最新年度の男性・女性データを取得
        const latestData = filteredValues.filter((v) => v.timeCode === latestYear);

        const maleData = latestData.find((v) => v.categoryCode === maleCategoryCode);
        const femaleData = latestData.find((v) => v.categoryCode === femaleCategoryCode);

        if (!maleData || !femaleData) {
          throw new Error("男性または女性のデータが見つかりませんでした");
        }

        const maleVal = maleData.numericValue || 0;
        const femaleVal = femaleData.numericValue || 0;

        setMaleValue(maleVal);
        setFemaleValue(femaleVal);

        if (onDataLoaded) {
          onDataLoaded({ male: maleVal, female: femaleVal });
        }
      } catch (err) {
        console.error("[EstatGenderDonutChart] Error fetching data:", err);
        const errorMessage =
          err instanceof Error ? err.message : "データの取得に失敗しました";
        setError(errorMessage);

        if (onError && err instanceof Error) {
          onError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.statsDataId, params.limit, areaCode, maleCategoryCode, femaleCategoryCode]);

  // チャートデータ
  const chartData: GenderData[] = useMemo(() => {
    return [
      { label: "男性", value: maleValue, color: "#3b82f6" },
      { label: "女性", value: femaleValue, color: "#ec4899" },
    ];
  }, [maleValue, femaleValue]);

  // D3.jsでチャートを描画
  useEffect(() => {
    if (!chartRef.current || loading || error || (maleValue === 0 && femaleValue === 0)) {
      return;
    }

    // 既存のSVGをクリア
    d3.select(chartRef.current).selectAll("*").remove();

    const margin = 20;
    const radius = Math.min(width, height) / 2 - margin;
    const innerRadius = radius * 0.6; // ドーナツの内側の半径

    // SVGを作成
    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    // パイレイアウト
    const pie = d3
      .pie<GenderData>()
      .value((d) => d.value)
      .sort(null);

    // アークジェネレーター
    const arc = d3
      .arc<d3.PieArcDatum<GenderData>>()
      .innerRadius(innerRadius)
      .outerRadius(radius);

    // ツールチップ用のdiv
    const tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "donut-tooltip")
      .style("position", "absolute")
      .style("background", "#ffffff")
      .style("border", "1px solid #e5e7eb")
      .style("border-radius", "4px")
      .style("padding", "8px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", "1000")
      .style("color", "#374151")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.1)");

    const total = maleValue + femaleValue;

    // アークを描画
    const arcs = svg
      .selectAll("arc")
      .data(pie(chartData))
      .enter()
      .append("g")
      .attr("class", "arc");

    arcs
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => d.data.color)
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        d3.select(this).attr("opacity", 0.8);

        const percentage = ((d.data.value / total) * 100).toFixed(1);
        const formatValue = (value: number) => {
          if (value >= 1000000) {
            return `${(value / 1000000).toFixed(1)}百万人`;
          } else if (value >= 10000) {
            return `${(value / 10000).toFixed(1)}万人`;
          } else {
            return `${value.toLocaleString()}人`;
          }
        };

        tooltip
          .style("opacity", 1)
          .html(`
            <div><strong>${d.data.label}</strong></div>
            <div>${formatValue(d.data.value)}</div>
            <div>${percentage}%</div>
          `);
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 10 + "px");
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 1);
        tooltip.style("opacity", 0);
      });

    // ラベルを追加
    arcs
      .append("text")
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .attr("text-anchor", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .attr("fill", "#ffffff")
      .text((d) => {
        const percentage = ((d.data.value / total) * 100).toFixed(1);
        return `${percentage}%`;
      });

    // 中央にテキストを追加
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "20px")
      .attr("font-weight", "bold")
      .attr("fill", "#374151")
      .attr("y", -10)
      .text("総人口");

    const formatTotal = (value: number) => {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}百万人`;
      } else if (value >= 10000) {
        return `${(value / 10000).toFixed(1)}万人`;
      } else {
        return `${value.toLocaleString()}人`;
      }
    };

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", "16px")
      .attr("fill", "#6b7280")
      .attr("y", 15)
      .text(formatTotal(total));

    // クリーンアップ
    return () => {
      tooltip.remove();
    };
  }, [chartData, loading, error, maleValue, femaleValue, width, height]);

  // ローディング状態
  if (loading) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
          style={{ width: width || "100%", height: height || "400px" }}
        >
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-indigo-600 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
              データを読み込み中...
            </h3>
            <p className="text-gray-600 dark:text-neutral-400 text-sm">
              e-stat APIからデータを取得しています
            </p>
          </div>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
          style={{ width: width || "100%", height: height || "400px" }}
        >
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
              データの取得に失敗しました
            </h3>
            <p className="text-red-600 dark:text-red-400 mb-4 text-sm">{error}</p>
            <div className="text-xs text-gray-600 dark:text-neutral-400 mt-4">
              <p>統計表ID: {params.statsDataId}</p>
              <p>地域コード: {areaCode}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // データがない場合
  if (maleValue === 0 && femaleValue === 0) {
    return (
      <div className={`relative ${className}`}>
        <div
          className="flex items-center justify-center bg-gray-50 dark:bg-neutral-900 rounded-lg border border-gray-200 dark:border-neutral-700"
          style={{ width: width || "100%", height: height || "400px" }}
        >
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-neutral-100 mb-2">
              データがありません
            </h3>
            <p className="text-gray-600 dark:text-neutral-400 text-sm">
              指定された条件に一致するデータが見つかりませんでした
            </p>
          </div>
        </div>
      </div>
    );
  }

  // グラフ表示
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        {title}
      </h3>
      <div
        ref={chartRef}
        style={{ width, height }}
        className="flex items-center justify-center"
      ></div>

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#3b82f6]"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">男性</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-[#ec4899]"></div>
          <span className="text-sm text-gray-700 dark:text-gray-300">女性</span>
        </div>
      </div>

      <div className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
        出典:{" "}
        <a
          href="https://www.e-stat.go.jp/dbview?sid=0000010101"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline"
        >
          政府統計の総合窓口 e-Stat
        </a>
      </div>
    </div>
  );
};
