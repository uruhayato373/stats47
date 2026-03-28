"use client";

import { useState } from "react";

import { Button } from "@stats47/components/atoms/ui/button";
import { Card, CardContent } from "@stats47/components/atoms/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@stats47/components/atoms/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@stats47/components/atoms/ui/tooltip";
import { isOk } from "@stats47/types";
import { Download, Loader2 } from "lucide-react";

import type { AreaType } from "@/features/area";

import { trackCsvDownload } from "@/lib/analytics/events";

import { fetchAllYearsRankingValuesAction } from "../actions";

import type { RankingValue } from "@stats47/ranking";

interface DataDownloadButtonProps {
  rankingKey: string;
  areaType: AreaType;
  displayInfo: {
    title: string;
    subtitle: string;
    demographicAttr: string | null;
    normalizationBasis: string | null;
  };
}

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "_");
}

function buildFileName(
  displayInfo: DataDownloadButtonProps["displayInfo"],
  ext: string,
): string {
  const parts = [
    displayInfo.title,
    displayInfo.subtitle,
    displayInfo.demographicAttr,
    displayInfo.normalizationBasis,
  ].filter(Boolean);
  return sanitizeFileName(parts.join("_")) + `.${ext}`;
}

function generateCsvContent(rankingValues: RankingValue[]): string {
  const BOM = "\uFEFF";

  const yearsMap = new Map<string, string>();
  for (const v of rankingValues) {
    yearsMap.set(v.yearCode, v.yearName);
  }
  const yearCodes = [...yearsMap.keys()].sort((a, b) => a.localeCompare(b));

  const areaMap = new Map<
    string,
    { areaCode: string; areaName: string; values: Map<string, number> }
  >();
  for (const v of rankingValues) {
    let entry = areaMap.get(v.areaCode);
    if (!entry) {
      entry = {
        areaCode: v.areaCode,
        areaName: v.areaName,
        values: new Map(),
      };
      areaMap.set(v.areaCode, entry);
    }
    entry.values.set(v.yearCode, v.value);
  }

  const escapeCsv = (val: string | number): string => {
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const header = [
    "都道府県コード",
    "都道府県名",
    ...yearCodes.map((yc) => yearsMap.get(yc)!),
  ].map(escapeCsv).join(",");

  const areas = [...areaMap.values()].sort((a, b) =>
    a.areaCode.localeCompare(b.areaCode),
  );
  const rows = areas.map((area) => {
    const yearValues = yearCodes.map((yc) => area.values.get(yc) ?? "");
    return [area.areaCode, area.areaName, ...yearValues].map(escapeCsv).join(",");
  });

  return BOM + [header, ...rows].join("\n");
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * アイコンのみのダウンロードボタン（地図・テーブルの右上に配置）
 */
export function DataDownloadIconButton({
  rankingKey,
  areaType,
  displayInfo,
}: DataDownloadButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async (format: "csv" | "json") => {
    setIsLoading(true);
    try {
      const result = await fetchAllYearsRankingValuesAction(rankingKey, areaType);
      if (!isOk(result) || result.data.length === 0) return;
      trackCsvDownload({ rankingKey, yearCode: "all" });
      const fileName = buildFileName(displayInfo, format);
      if (format === "csv") {
        const csv = generateCsvContent(result.data);
        triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), fileName);
      } else {
        const json = JSON.stringify(result.data, null, 2);
        triggerDownload(new Blob([json], { type: "application/json;charset=utf-8" }), fileName);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                disabled={isLoading}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                <span className="sr-only">データダウンロード</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleDownload("csv")}>
              CSV 形式
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload("json")}>
              JSON 形式
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>データダウンロード</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface DataDownloadFooterCardProps extends DataDownloadButtonProps {
  /** プレビュー用のランキングデータ（上位表示用） */
  rankingValues: RankingValue[];
}

/**
 * 末尾配置用のダウンロードカード（ミニプレビュー付き）
 */
export function DataDownloadFooterCard({
  rankingKey,
  areaType,
  displayInfo,
  rankingValues,
}: DataDownloadFooterCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async (format: "csv" | "json") => {
    setIsLoading(true);
    try {
      const result = await fetchAllYearsRankingValuesAction(rankingKey, areaType);
      if (!isOk(result) || result.data.length === 0) return;
      trackCsvDownload({ rankingKey, yearCode: "all" });
      const fileName = buildFileName(displayInfo, format);
      if (format === "csv") {
        const csv = generateCsvContent(result.data);
        triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8" }), fileName);
      } else {
        const json = JSON.stringify(result.data, null, 2);
        triggerDownload(new Blob([json], { type: "application/json;charset=utf-8" }), fileName);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 上位5件をプレビュー表示
  const sorted = [...rankingValues]
    .filter((v) => v.areaCode !== "00000")
    .sort((a, b) => b.value - a.value);
  const preview = sorted.slice(0, 5);
  const remaining = sorted.length - 5;
  const unit = displayInfo.normalizationBasis
    ? ""
    : rankingValues[0]?.unit || "";

  return (
    <Card>
      <CardContent className="p-0">
        {/* ミニプレビューテーブル */}
        <div className="px-4 pt-4 pb-2">
          <div className="rounded-md border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left py-1.5 px-3 font-medium text-muted-foreground w-10">#</th>
                  <th className="text-left py-1.5 px-3 font-medium text-muted-foreground">都道府県</th>
                  <th className="text-right py-1.5 px-3 font-medium text-muted-foreground">値</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((v, i) => (
                  <tr key={v.areaCode} className="border-t border-border/50">
                    <td className="py-1.5 px-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-1.5 px-3">{v.areaName}</td>
                    <td className="py-1.5 px-3 text-right font-mono tabular-nums">
                      {v.value.toLocaleString("ja-JP")}
                      {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {remaining > 0 && (
              <div className="text-center py-1.5 text-xs text-muted-foreground border-t border-border/50 bg-muted/30">
                ⋮ 残り{remaining}都道府県
              </div>
            )}
          </div>
        </div>

        {/* ダウンロードボタン */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
          <span className="text-sm text-muted-foreground">全データをダウンロード</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                ダウンロード
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload("csv")}>
                CSV 形式
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload("json")}>
                JSON 形式
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
