"use client";

import { type ReactNode } from "react";

import { LazySelect } from "@stats47/components/molecules/lazy-select";
import { normalizationOptionId } from "@stats47/types";

import { SingleSelectToggleGroup } from "@/components/molecules/SingleSelectToggleGroup";


import type { NormalizationOption } from "@stats47/ranking";

interface RankingHeaderControlsProps {
  /** 正規化オプション（無い場合はピル群を非表示） */
  normalizationOptions?: NormalizationOption[];
  /** 現在の見方（"original" か、選択肢の識別子 normalizationOptionId） */
  normalizationValue: string;
  /** 元の値のボタンの名前。別の指標の見方 (series) と並ぶときは指標の副題 (例: 総額)。既定は「総数」 */
  originalLabel?: string;
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
  originalLabel = "総数",
}: RankingHeaderControlsProps) {
  // 同じ指標の見方はこの 1 列だけに並べる (2026-11-25 オーナー決定。見方違いの別ページと下段のボタンはやめた)
  const pills = [
    { value: "original", label: originalLabel },
    ...(normalizationOptions ?? []).map((opt) => ({
      value: normalizationOptionId(opt),
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
