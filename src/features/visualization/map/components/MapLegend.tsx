/**
 * 地図凡例コンポーネント
 * コロプレス地図のカラースケールを表示
 */

"use client";

import { useMemo } from "react";

import { createLegendData } from "../utils/color-scale";

import type { ChoroplethData } from "../types/index";

interface MapLegendProps {
  /** コロプレス地図用のデータ */
  data: ChoroplethData[];
  /** カラースキーム */
  colorScheme?: string;
  /** 分岐点設定 */
  divergingMidpoint?: "zero" | "mean" | "median" | number;
  /** データがない地域の色 */
  noDataColor?: string;
  /** 凡例のタイトル */
  title?: string;
  /** 単位 */
  unit?: string;
  /** 凡例のステップ数（デフォルト: 5） */
  steps?: number;
  /** CSSクラス名 */
  className?: string;
}

/**
 * 地図凡例コンポーネント
 */
export function MapLegend({
  data,
  colorScheme = "interpolateBlues",
  divergingMidpoint,
  noDataColor = "#e0e0e0",
  title = "凡例",
  unit,
  steps = 5,
  className = "",
}: MapLegendProps) {
  // 凡例データを生成
  const legendItems = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }

    return createLegendData(
      {
        data,
        colorScheme,
        divergingMidpoint,
        noDataColor,
      },
      steps
    );
  }, [data, colorScheme, divergingMidpoint, noDataColor, steps]);

  if (legendItems.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border p-3 ${className}`}>
      {/* タイトル */}
      {title && (
        <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
      )}

      {/* グラデーションバー */}
      <div className="relative h-6 mb-2 rounded overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to right, ${legendItems.map((item, index) => `${item.color} ${(index / (legendItems.length - 1)) * 100}%`).join(", ")})`,
          }}
        />
      </div>

      {/* 値のラベル */}
      <div className="flex justify-between text-xs text-gray-600">
        <span>
          {legendItems[0].label}
          {unit && ` ${unit}`}
        </span>
        <span>
          {legendItems[legendItems.length - 1].label}
          {unit && ` ${unit}`}
        </span>
      </div>

      {/* データなし表示 */}
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
        <div
          className="w-4 h-4 rounded border"
          style={{ backgroundColor: noDataColor }}
        />
        <span>データなし</span>
      </div>
    </div>
  );
}
