"use client";

import React from "react";

import { cn, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@stats47/components";

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
  const { columns, rows, unit } = data;

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="text-left p-2" />
          {columns.map((col) => (
            <TableHead
              key={col}
              className="text-center p-2 whitespace-nowrap"
            >
              {col}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCell className="p-2 font-medium whitespace-nowrap">{row.label}</TableCell>
            {row.values.map((value, i) => (
              <TableCell
                key={columns[i]}
                className={cn(
                  "text-center p-2 tabular-nums transition-colors",
                  value !== null && "font-medium"
                )}
                style={value !== null ? { backgroundColor: getCellBg(value) } : undefined}
              >
                {value !== null
                  ? `${value.toLocaleString()}${unit ? ` ${unit}` : ""}`
                  : "-"}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
