"use client";

import { type ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";
import { Sigma, Users, LandPlot } from "lucide-react";

import type { NormalizationOption } from "@stats47/ranking";

interface RankingHeaderControlsProps {
  /** 正規化オプション（無い場合はピル群を非表示） */
  normalizationOptions?: NormalizationOption[];
  /** 現在の正規化タイプ（"original" or option.type） */
  normalizationValue: string;
  onNormalizationChange: (value: string) => void;
  normalizationDisabled?: boolean;
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

/**
 * 計算方法の切替と共有。
 *
 * 年度セレクタとエリア切替はここには置かない。地図・テーブルのカードヘッダーに
 * 同じものが出ており、画面に 2 回現れていたため操作対象の直上だけに寄せた。
 */
export function RankingHeaderControls({
  normalizationOptions,
  normalizationValue,
  onNormalizationChange,
  normalizationDisabled,
  shareButton,
}: RankingHeaderControlsProps) {
  const pills: { type: string; label: string }[] = [
    { type: "original", label: "総数" },
    ...(normalizationOptions ?? []).map((opt) => ({
      type: opt.type,
      label: opt.label,
    })),
  ];
  const showPills = (normalizationOptions?.length ?? 0) > 0;

  if (!showPills && !shareButton) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {showPills ? (
        <div className="min-w-0">
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
      ) : (
        <div />
      )}
      {shareButton}
    </div>
  );
}
