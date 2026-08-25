"use client";

import React, { useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@stats47/components";

import { ChartFooter, type ChartFooterLink } from "@/components/charts/ChartFooter";
import { ChartPanel } from "@/components/charts/ChartPanel";
import { ChartEmptyState } from "@/components/charts/ChartState";

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
        <ChartEmptyState message="データがありません" height={250} className="bg-muted/10" />
      ) : (
        <>
          {years.length > 1 && (
            <div className="flex justify-end mb-2">
              <Select value={selectedYearCode} onValueChange={setSelectedYearCode}>
                <SelectTrigger className="h-8 w-[140px] text-sm">
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
        </>
      )}
    </ChartPanel>
  );
};
