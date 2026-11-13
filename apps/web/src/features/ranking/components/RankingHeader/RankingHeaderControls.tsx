"use client";

import { type ReactNode } from "react";

import { LazySelect } from "@stats47/components/molecules/lazy-select";

import { SingleSelectToggleGroup } from "@/components/molecules/SingleSelectToggleGroup";

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
  const pills = [
    { value: "original", label: "総数" },
    ...(normalizationOptions ?? []).map((opt) => ({
      value: opt.type,
      label: opt.label,
    })),
  ];
  const showPills = (normalizationOptions?.length ?? 0) > 0;

  if (!showPills && !shareButton) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {showPills ? (
        <div className="min-w-0">
          {/* モバイル: Select / sm 以上: ToggleGroup。どちらもアイコンを付けず文字だけで揃える */}
          <div className="sm:hidden">
            <LazySelect
              value={normalizationValue}
              onValueChange={onNormalizationChange}
              items={pills}
              disabled={normalizationDisabled}
              aria-label="計算方法"
              triggerClassName="w-full"
            />
          </div>
          <SingleSelectToggleGroup
            aria-label="計算方法"
            value={normalizationValue}
            options={pills}
            onValueChange={onNormalizationChange}
            disabled={normalizationDisabled}
            className="hidden sm:flex"
          />
        </div>
      ) : (
        <div />
      )}
      {shareButton}
    </div>
  );
}
