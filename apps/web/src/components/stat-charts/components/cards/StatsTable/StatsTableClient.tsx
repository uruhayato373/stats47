"use client";

import React, { useState } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ChartPanel } from "@stats47/components";
import { formatValueWithPrecision, resolveValuePrecision } from "@stats47/utils";

import { ChartFooter, type ChartFooterLink } from "@/components/charts/ChartFooter";
import { ChartEmptyState } from "@/components/charts/ChartState";
import { ValueTable } from "@/components/surface";

import type { StatsTableRowData } from "../../../types/visualization";

interface StatsTableClientProps {
  title: string;
  rankingLink?: string | null;
  description?: string;
  years: Array<{ yearCode: string; yearName: string }>;
  dataByYear: Record<string, StatsTableRowData[]>;
  sourceName?: string | null;
  sourceLink?: string | null;
  sourceLinks?: ChartFooterLink[];
}

export const StatsTableClient: React.FC<StatsTableClientProps> = ({
  title,
  rankingLink,
  description,
  years,
  dataByYear,
  sourceName,
  sourceLink,
  sourceLinks,
}) => {
  const [selectedYearCode, setSelectedYearCode] = useState(
    years[0]?.yearCode ?? ""
  );

  const rows = dataByYear[selectedYearCode] ?? [];
  const selectedYear = years.find((y) => y.yearCode === selectedYearCode);

  return (
    <ChartPanel
      title={title}
      description={description}
      footer={
        <ChartFooter
          source={sourceName ?? undefined}
          sourceLink={sourceLink}
          sourceLinks={sourceLinks}
          sourceDetail={selectedYear?.yearName ? `${selectedYear.yearName}時点` : undefined}
          rankingLink={rankingLink}
        />
      }
    >
      {years.length === 0 ? (
        <ChartEmptyState message="データがありません" height={250} />
      ) : (
        <>
          {years.length > 1 && (
            <div className="flex justify-end mb-2">
              <Select
                value={selectedYearCode}
                items={years.map((y) => ({ value: y.yearCode, label: y.yearName }))}
                onValueChange={(value) => {
                  if (value !== null) setSelectedYearCode(value);
                }}
              >
                <SelectTrigger className="h-8 w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y.yearCode} value={y.yearCode}>
                      {y.yearName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <ValueTable
            columns={[
              { key: "label", header: "指標名", rowHeader: true },
              { key: "value", header: "値" },
              { key: "unit", header: "単位", align: "left" },
            ]}
            rows={rows.map((row, i) => ({
              key: String(i),
              cells: [
                row.rankingLink ? <a key="label" href={row.rankingLink}>{row.label}</a> : row.label,
                // 行ごとに別の指標 (単位も違う) なので、桁は行の値から決める
                row.value !== null ? formatValueWithPrecision(row.value, resolveValuePrecision([row.value])) : "---",
                row.unit ?? "",
              ],
            }))}
          />
        </>
      )}
    </ChartPanel>
  );
};
