"use client";

import { PREFECTURE_LIST_2DIGIT, to5DigitPrefCode } from "@stats47/area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";

import { useThemePrefecture } from "./ThemePrefectureContext";

/** 全国 (5桁 "00000") を表すセンチネル値 */
const NATIONAL = "00000";

/**
 * テーマダッシュボードの都道府県セレクタ (context 消費型)。
 * デフォルト「全国」。選択でその都道府県のデータに切り替わり、URL `?pref=` も同期される
 * (同期は ThemePrefectureContext 側)。value は 5桁コードに統一。
 */
export function PrefectureSelect() {
  const { selectedPrefectureCode, setSelected } = useThemePrefecture();
  return (
    <Select
      value={selectedPrefectureCode ?? NATIONAL}
      onValueChange={(v) => setSelected(v === NATIONAL ? null : v)}
    >
      <SelectTrigger className="w-36" aria-label="都道府県を選択">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NATIONAL}>全国</SelectItem>
        {PREFECTURE_LIST_2DIGIT.map((p) => (
          <SelectItem key={p.code} value={to5DigitPrefCode(p.code)}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
