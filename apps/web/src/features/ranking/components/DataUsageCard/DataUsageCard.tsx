"use client";

import { Download } from "lucide-react";

import type { AreaType } from "@/features/area";

import { DataDownloadPrimaryButton } from "../DataDownloadButton";

/**
 * CSV 訴求カード「このデータを使う」（Option D / Phase 1）
 *
 * 地図 + 順位表の下に配置。CSV ダウンロードボタンのみを提供する
 * （JSON/Excel エクスポートは未実装機能のため出さない）。
 */

interface DataUsageCardProps {
  rankingKey: string;
  areaType: AreaType;
  displayInfo: {
    title: string;
    subtitle: string;
    demographicAttr: string | null;
    normalizationBasis: string | null;
  };
  /** 利用可能な年度数（説明文に表示） */
  yearCount?: number;
}

export function DataUsageCard({
  rankingKey,
  areaType,
  displayInfo,
  yearCount,
}: DataUsageCardProps) {
  const yearText = yearCount && yearCount > 0 ? `${yearCount}年分の時系列を含む` : "";

  return (
    <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-sm">
      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Download className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold text-primary">このデータを使う</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          47都道府県{yearText ? ` × ${yearText}` : "の"} CSV
          を、クレジット表記すれば無料で商用利用できます。
        </p>
      </div>
      <DataDownloadPrimaryButton
        rankingKey={rankingKey}
        areaType={areaType}
        displayInfo={displayInfo}
        label="CSV"
      />
    </div>
  );
}
