"use client";

import { type ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@stats47/components/atoms/ui/toggle-group";

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
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            計算方法を切替
          </p>
          {/* モバイル: Select / sm 以上: ToggleGroup。どちらもアイコンを付けず文字だけで揃える */}
          <div className="sm:hidden">
            <Select
              value={normalizationValue}
              onValueChange={(value) => {
                if (value !== null) onNormalizationChange(value);
              }}
              items={pills.map((p) => ({ value: p.type, label: p.label }))}
              disabled={normalizationDisabled}
            >
              <SelectTrigger aria-label="計算方法" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pills.map((p) => (
                  <SelectItem key={p.type} value={p.type}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ToggleGroup
            aria-label="計算方法"
            variant="outline"
            spacing={0}
            value={[normalizationValue]}
            onValueChange={(groupValue) => {
              // 押下中の項目をもう一度押して空にする操作は無視する (常に 1 つ選ぶ)
              const next = groupValue.find((value) => value !== normalizationValue);
              if (next) onNormalizationChange(next);
            }}
            disabled={normalizationDisabled}
            className="hidden sm:flex"
          >
            {pills.map((p) => (
              <ToggleGroupItem key={p.type} value={p.type}>
                {p.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : (
        <div />
      )}
      {shareButton}
    </div>
  );
}
