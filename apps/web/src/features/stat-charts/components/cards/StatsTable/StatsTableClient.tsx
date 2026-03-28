"use client";

import React, { useState } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@stats47/components";

import { DashboardCard } from "../../shared/DashboardCard";

import type { StatsTableRowData } from "../../../types/visualization";

interface StatsTableClientProps {
  title: string;
  rankingLink?: string | null;
  description?: string;
  years: Array<{ yearCode: string; yearName: string }>;
  dataByYear: Record<string, StatsTableRowData[]>;
  sourceName?: string | null;
  sourceLink?: string | null;
}

export const StatsTableClient: React.FC<StatsTableClientProps> = ({
  title,
  rankingLink,
  description,
  years,
  dataByYear,
  sourceName,
  sourceLink,
}) => {
  const [selectedYearCode, setSelectedYearCode] = useState(
    years[0]?.yearCode ?? ""
  );

  const rows = dataByYear[selectedYearCode] ?? [];
  const selectedYear = years.find((y) => y.yearCode === selectedYearCode);

  return (
    <DashboardCard
      title={title}
      rankingLink={rankingLink}
      description={description}
      source={sourceName ?? undefined}
      sourceLink={sourceLink}
      sourceDetail={selectedYear?.yearName ? `${selectedYear.yearName}時点` : undefined}
      loading={false}
      error={null}
      empty={years.length === 0}
    >
      {years.length > 1 && (
        <div className="flex justify-end mb-2">
          <select
            value={selectedYearCode}
            onChange={(e) => setSelectedYearCode(e.target.value)}
            className="text-sm border border-border rounded-md px-2 py-1 bg-background text-foreground"
          >
            {years.map((y) => (
              <option key={y.yearCode} value={y.yearCode}>
                {y.yearName}
              </option>
            ))}
          </select>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>指標名</TableHead>
            <TableHead className="text-right">値</TableHead>
            <TableHead>単位</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell>
                {row.rankingLink ? (
                  <a href={row.rankingLink} className="text-primary hover:underline">
                    {row.label}
                  </a>
                ) : (
                  row.label
                )}
              </TableCell>
              <TableCell className="text-right font-semibold tabular-nums">
                {row.value !== null ? row.value.toLocaleString() : "---"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {row.unit ?? ""}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DashboardCard>
  );
};
