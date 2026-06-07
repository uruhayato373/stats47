"use client";

import { Button } from "@stats47/components/atoms/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@stats47/components/atoms/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@stats47/components/atoms/ui/tooltip";
import { Download } from "lucide-react";

import type { AreaType } from "@/features/area";

import { trackCsvDownload } from "@/lib/analytics/events";

interface DataDownloadButtonProps {
  rankingKey: string;
  areaType: AreaType;
  displayInfo: {
    title: string;
    subtitle: string;
    demographicAttr: string | null;
    normalizationBasis: string | null;
  };
  /**
   * 現在表示中の正規化タイプ (per_population / per_area)。
   * 指定された場合、その基準で計算済みの値をダウンロードする。
   * 未指定なら総数 (basis=original)。
   */
  normalizationType?: string;
  /**
   * 「全基準まとめて」オプションを Dropdown に追加するか。
   * true の場合、対象 metric が normalizationOptions を 1 つ以上持つことが前提。
   */
  hasAllBases?: boolean;
}

function buildHref(
  rankingKey: string,
  basis: string,
  format: "csv" | "json",
  encoding: "utf8" | "sjis" = "utf8",
): string {
  const sp = new URLSearchParams({ format, basis });
  if (format === "csv" && encoding === "sjis") sp.set("encoding", "sjis");
  return `/api/ranking/${encodeURIComponent(rankingKey)}/download?${sp.toString()}`;
}

/**
 * アイコンのみのダウンロードボタン（地図・テーブルの右上に配置）
 *
 * R2 に事前生成済みの CSV/JSON を Route Handler 経由で stream するため、
 * クライアントでの CSV 組み立ては不要。Cloudflare CDN cache 対応。
 */
export function DataDownloadIconButton({
  rankingKey,
  normalizationType,
}: DataDownloadButtonProps) {
  const basis = normalizationType ?? "original";

  return (
    <TooltipProvider>
      <Tooltip>
        <DropdownMenu>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Download className="h-4 w-4" />
                <span className="sr-only">データダウンロード</span>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <a
                href={buildHref(rankingKey, basis, "csv", "utf8")}
                onClick={() => trackCsvDownload({ rankingKey, yearCode: "all" })}
              >
                CSV 形式
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a
                href={buildHref(rankingKey, basis, "json")}
                onClick={() => trackCsvDownload({ rankingKey, yearCode: "all" })}
              >
                JSON 形式
              </a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipContent>データダウンロード</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * ラベル付き CSV/JSON ダウンロード menu ボタン（DataUsageCard 用）
 *
 * Dropdown で CSV (UTF-8) / CSV (Shift_JIS) / JSON / 全基準まとめて の中から
 * 選択させる。R2 事前生成ファイルを Route Handler 経由で stream。
 */
export function DataDownloadMenuButton({
  rankingKey,
  normalizationType,
  hasAllBases,
  label = "ダウンロード",
  variant = "default",
}: DataDownloadButtonProps & {
  label?: string;
  variant?: "default" | "outline";
}) {
  const basis = normalizationType ?? "original";
  const track = () => trackCsvDownload({ rankingKey, yearCode: "all" });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className="gap-1.5">
          <Download className="h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[220px]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          現在の基準でダウンロード
        </DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <a href={buildHref(rankingKey, basis, "csv", "utf8")} onClick={track}>
            CSV (Excel 互換 / UTF-8)
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={buildHref(rankingKey, basis, "csv", "sjis")} onClick={track}>
            CSV (古い Excel / Shift_JIS)
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={buildHref(rankingKey, basis, "json")} onClick={track}>
            JSON (開発者向け)
          </a>
        </DropdownMenuItem>
        {hasAllBases && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              全基準を 1 ファイルに
            </DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <a href={buildHref(rankingKey, "all-bases", "csv", "utf8")} onClick={track}>
                全基準まとめて CSV (UTF-8)
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href={buildHref(rankingKey, "all-bases", "csv", "sjis")} onClick={track}>
                全基準まとめて CSV (Shift_JIS)
              </a>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
