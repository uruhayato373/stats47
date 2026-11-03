"use client";

import React from "react";

import { formatUnitForDisplay } from "@stats47/data-configs/unit";

import { ValueTable } from "@/components/surface";

import type { AttributeMatrixData } from "../../../types/visualization";

interface AttributeMatrixClientProps {
  data: AttributeMatrixData;
}

/**
 * 属性マトリクスのクライアントコンポーネント
 * 値の大きさに応じた背景色で表示するヒートマップ風テーブル
 */
export const AttributeMatrixClient: React.FC<AttributeMatrixClientProps> = ({
  data,
}) => {
  const { columns, rows } = data;
  const unit = formatUnitForDisplay(data.unit);

  // Compute min/max for color intensity
  const allValues = rows.flatMap((r) => r.values).filter((v): v is number => v !== null);
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;

  const getCellBg = (value: number | null): string => {
    if (value === null) return "";
    const ratio = (value - minVal) / range;
    // Blue intensity: lighter for low values, darker for high values
    const opacity = 0.1 + ratio * 0.35;
    return `rgba(59, 130, 246, ${opacity})`;
  };

  return (
    <ValueTable
      columns={[
        { key: "__label", header: null, rowHeader: true, className: "whitespace-nowrap!" },
        ...columns.map((col) => ({ key: col, header: col, className: "whitespace-nowrap" })),
      ]}
      rows={rows.map((row) => ({
        key: row.label,
        cells: [
          row.label,
          ...row.values.map((value) => ({
            content:
              value !== null
                ? `${value.toLocaleString()}${unit ? ` ${unit}` : ""}`
                : "-",
            attrs: value !== null ? { style: { backgroundColor: getCellBg(value) } } : undefined,
          })),
        ],
      }))}
    />
  );
};
