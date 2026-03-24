"use client";

import { fetchPrefectures } from "@stats47/area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components";
import { useRouter } from "next/navigation";
import type { TransitionStartFunction } from "react";
import { REGION_A_COLOR, REGION_B_COLOR } from "../types";

interface RegionSelectorProps {
  selectedAreaCodes: string[];
  categoryKey: string;
  startTransition: TransitionStartFunction;
}

interface PrefectureSelectProps {
  /** 現在選択中のprefCode */
  value: string;
  /** 選択変更ハンドラ */
  onChange: (code: string) => void;
  /** 相手側で選択済みのコード（重複防止） */
  excludeCode: string;
  /** ドット表示色 */
  color: string;
  /** 「地域 A」「地域 B」など */
  label: string;
}

/**
 * 都道府県選択ドロップダウン（地域A・B共通サブコンポーネント）
 */
function PrefectureSelect({ value, onChange, excludeCode, color, label }: PrefectureSelectProps) {
  const allPrefectures = fetchPrefectures();
  const available = allPrefectures.filter((p) => p.prefCode !== excludeCode);
  const selected = allPrefectures.find((p) => p.prefCode === value);

  return (
    <div className="flex flex-col gap-2">
      {/* ラベル行 */}
      <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </div>
      {/* ドロップダウン */}
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger className="h-12 w-full rounded-xl border-2 text-base font-bold text-foreground focus:ring-2"
          style={{ borderColor: value ? color : undefined }}>
          <SelectValue placeholder="都道府県を選択">
            {selected ? selected.prefName : "都道府県を選択"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {available.map((pref) => (
            <SelectItem key={pref.prefCode} value={pref.prefCode}>
              {pref.prefName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * 地域A・Bを選択するメインコンポーネント
 */
export function RegionSelector({ selectedAreaCodes, categoryKey, startTransition }: RegionSelectorProps) {
  const router = useRouter();

  const codeA = selectedAreaCodes[0] ?? "";
  const codeB = selectedAreaCodes[1] ?? "";

  /** URLを更新して再レンダリング */
  const updateUrl = (codes: string[]) => {
    const validCodes = codes.filter(Boolean);
    const query = validCodes.length > 0 ? `?areas=${validCodes.join(",")}` : "";
    startTransition(() => {
      router.push(`/compare/${categoryKey}${query}`);
    });
  };

  const handleSelectA = (code: string) => updateUrl([code, codeB]);
  const handleSelectB = (code: string) => updateUrl([codeA, code]);

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
        {/* 地域A */}
        <PrefectureSelect
          value={codeA}
          onChange={handleSelectA}
          excludeCode={codeB}
          color={REGION_A_COLOR}
          label="地域 A"
        />

        {/* VS バッジ */}
        <div className="flex h-12 items-center justify-center">
          <span className="text-2xl font-black tracking-widest text-muted-foreground/50">VS</span>
        </div>

        {/* 地域B */}
        <PrefectureSelect
          value={codeB}
          onChange={handleSelectB}
          excludeCode={codeA}
          color={REGION_B_COLOR}
          label="地域 B"
        />
      </div>

      {/* 未選択時のガイドテキスト */}
      {(!codeA || !codeB) && (
        <p className="mt-4 text-center text-sm text-amber-600">
          {!codeA && !codeB
            ? "地域AとBをそれぞれ選択してください"
            : !codeA
            ? "地域Aを選択してください"
            : "地域Bを選択してください"}
        </p>
      )}
    </div>
  );
}
