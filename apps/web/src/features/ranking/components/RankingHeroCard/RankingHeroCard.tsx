"use client";

import { useMemo, type ReactNode } from "react";

import { PageHeader } from "@/components/layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";
import { Sigma, Users, LandPlot } from "lucide-react";

import { RankingHeroStat } from "./RankingHeroStat";

import type { NormalizationOption, RankingValue } from "@stats47/ranking";

/**
 * ランキング詳細ページ ヒーロー（Phase 2: PageHeader + slot 合成）
 *
 * PageHeader を基盤に、
 * - aside: 暗色 KPI 面（RankingHeroStat、意図的な暗色 variant として維持）
 * - controls: 単位ピル切替（+モバイル Select）+ メタ操作行（年度/エリア/CSV/共有）
 * を合成する。白基調・グラデ/bg-white なしの PageHeader 本体は不変。
 *
 * インタラクティブな子要素（年度 select / エリア seg / CSV / 共有）は
 * Server Component から ReactNode props として注入される。
 */

interface RankingHeroCardProps {
  /** カテゴリ名（eyebrow 表示用、例: "人口・世帯"） */
  categoryName?: string;
  /** ランキングタイトル（h1） */
  title: string;
  /** h1 補足（サブタイトル等） */
  titleDetail?: string | null;
  /** 出典名 */
  sourceName?: string | null;
  /** データ年度表示名（例: "2024年"） */
  yearName?: string | null;
  /** 最終更新日（YYYY-MM-DD） */
  updatedAt?: string | null;
  /** ランキング値（スタット算出に使用） */
  rankingValues: RankingValue[];
  /** 表示単位（スタットカードの数値に付与） */
  unit?: string;
  /** 正規化オプション（無い場合はピル群を非表示） */
  normalizationOptions?: NormalizationOption[];
  /** 現在の正規化タイプ（"original" or option.type） */
  normalizationValue: string;
  /** 正規化切替ハンドラ */
  onNormalizationChange: (value: string) => void;
  /** 正規化切替の disabled 状態 */
  normalizationDisabled?: boolean;
  /** メタ操作行に注入する要素（年度 select + エリア seg） */
  metaControls?: ReactNode;
  /** CSV ダウンロードボタン（primary） */
  downloadButton?: ReactNode;
  /** 共有ボタン */
  shareButton?: ReactNode;
}

/** 単位ピルのアイコン対応（正規化タイプ名から推定、なければ Sigma） */
function pillIcon(type: string) {
  if (type === "original") return Sigma;
  if (type.includes("pop") || type.includes("person") || type.includes("capita")) {
    return Users;
  }
  if (type.includes("area")) return LandPlot;
  return Sigma;
}

const FMT = new Intl.NumberFormat("ja-JP");

/** 値を「○○億」「○○万」等に丸めて表示（単位はそのまま付与） */
function formatStatValue(value: number, unit: string): { num: string; suffix: string } {
  const abs = Math.abs(value);
  if (abs >= 100_000_000) {
    return { num: (value / 100_000_000).toFixed(2), suffix: `億${unit}` };
  }
  if (abs >= 10_000) {
    return { num: FMT.format(Math.round(value / 10_000)), suffix: `万${unit}` };
  }
  return { num: FMT.format(Math.round(value * 100) / 100), suffix: unit };
}

export function RankingHeroCard({
  categoryName,
  title,
  titleDetail,
  sourceName,
  yearName,
  updatedAt,
  rankingValues,
  unit = "",
  normalizationOptions,
  normalizationValue,
  onNormalizationChange,
  normalizationDisabled,
  metaControls,
  downloadButton,
  shareButton,
}: RankingHeroCardProps) {
  // --- スタット算出（00000 = 全国を除外して都道府県のみで集計） ---
  const stats = useMemo(() => {
    const prefValues = rankingValues.filter(
      (v) => v.areaCode !== "00000" && v.value !== null,
    );
    const top = prefValues.find((v) => v.rank === 1) ?? null;
    const numericValues = prefValues
      .map((v) => v.value)
      .filter((v): v is number => v !== null);

    const total = numericValues.reduce((acc, v) => acc + v, 0);
    const avg = numericValues.length > 0 ? total / numericValues.length : 0;
    const last =
      prefValues.length > 0
        ? prefValues.reduce((min, v) => (v.rank > min.rank ? v : min), prefValues[0])
        : null;

    return { top, total, avg, last, count: numericValues.length };
  }, [rankingValues]);

  const pills: { type: string; label: string }[] = [
    { type: "original", label: "総数" },
    ...(normalizationOptions ?? []).map((opt) => ({
      type: opt.type,
      label: opt.label,
    })),
  ];
  const showPills = (normalizationOptions?.length ?? 0) > 0;

  const topStat =
    stats.top?.value != null ? formatStatValue(stats.top.value, unit) : null;
  const totalStat = formatStatValue(stats.total, unit);
  const avgStat = formatStatValue(stats.avg, unit);
  const lastStat =
    stats.last?.value != null ? formatStatValue(stats.last.value, unit) : null;

  // 格差倍率 (1位 ÷ 最下位)。最下位が 0 以下なら算出不能 → 全国合計にフォールバック (#222 KPI サマリー)
  const gapRatio =
    stats.top?.value != null && stats.last?.value != null && stats.last.value > 0
      ? stats.top.value / stats.last.value
      : null;
  const gapText =
    gapRatio != null
      ? `${gapRatio >= 100 ? Math.round(gapRatio).toLocaleString() : gapRatio.toFixed(1)}倍`
      : null;

  // 暗色スタットの 3 項目 (#222): 格差倍率(なければ全国合計) / 全国平均 / 最少(=最下位)
  const statItems: Array<{
    label: string;
    stat?: { num: string; suffix: string } | null;
    text?: string;
    suffixName?: string | null;
    show: boolean;
  }> = [
    gapText != null
      ? { label: "格差", text: gapText, show: true }
      : { label: "全国合計", stat: totalStat, show: stats.count > 0 },
    { label: "全国平均", stat: avgStat, show: stats.count > 0 },
    {
      label: "最少",
      stat: lastStat,
      suffixName: stats.last?.areaName,
      show: lastStat !== null,
    },
  ];

  const metaLine =
    sourceName || yearName || updatedAt
      ? [
          sourceName,
          yearName ? `データ年度 ${yearName}` : null,
          updatedAt ? `最終更新 ${updatedAt}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  // controls スロット: 単位ピル切替 + メタ操作行（年度/エリア/CSV/共有）
  const controls = (
    <div className="flex flex-col gap-4">
      {showPills && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-normal text-muted-foreground">
            計算方法を切替
          </p>
          {/* モバイル: Select */}
          <div className="sm:hidden">
            <Select
              value={normalizationValue}
              onValueChange={onNormalizationChange}
              disabled={normalizationDisabled}
            >
              <SelectTrigger aria-label="計算方法" className="h-9 w-full text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pills.map((p) => {
                  const PillIcon = pillIcon(p.type);
                  return (
                    <SelectItem key={p.type} value={p.type}>
                      <span className="inline-flex items-center gap-1.5">
                        <PillIcon className="h-3.5 w-3.5" />
                        {p.label}
                      </span>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {/* デスクトップ: pills */}
          <div
            role="radiogroup"
            aria-label="計算方法"
            className="hidden sm:inline-flex rounded-full border border-border bg-background p-1 shadow-sm"
          >
            {pills.map((p) => {
              const active = normalizationValue === p.type;
              const PillIcon = pillIcon(p.type);
              return (
                <button
                  key={p.type}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={normalizationDisabled}
                  onClick={() => onNormalizationChange(p.type)}
                  className={
                    "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-50 " +
                    (active
                      ? "bg-primary font-semibold text-primary-foreground"
                      : "font-medium text-muted-foreground hover:text-foreground")
                  }
                >
                  <PillIcon className="h-3.5 w-3.5" />
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* メタ操作行: 年度 select + エリア seg + CSV + 共有 */}
      <div className="flex flex-wrap items-center gap-2">
        {metaControls}
        <div className="flex-1" />
        {downloadButton}
        {shareButton}
      </div>
    </div>
  );

  return (
    <PageHeader
      eyebrow={categoryName}
      title={title}
      description={titleDetail ?? undefined}
      meta={metaLine}
      controls={controls}
      aside={
        <RankingHeroStat
          topAreaName={stats.top?.areaName}
          yearName={yearName}
          topStat={topStat}
          statItems={statItems}
        />
      }
    />
  );
}
