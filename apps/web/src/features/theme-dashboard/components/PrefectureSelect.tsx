"use client";

import { PREFECTURE_LIST_2DIGIT, to5DigitPrefCode } from "@stats47/area";
import { cn } from "@stats47/components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";

import { THEME_PREFECTURE_SET_VALUE } from "../lib/theme-prefecture-preference";
import { PREFECTURE_SET_LABEL } from "../types";

import { useThemePrefecture } from "./ThemePrefectureContext";

/**
 * 未選択 (47都道府県一覧) を表す Select 用センチネル値。
 * e-Stat の全国コード "00000" ではない — HTML Select が空文字列を扱えないための
 * Cookie / URL 共通センチネル値を使う。
 *
 * テーマダッシュボードの都道府県セレクタ (context 消費型)。
 * デフォルト「47都道府県」(GEO-SCOPE-SEPARATION-01 WP2)。選択でその都道府県のデータに切り替わり、
 * URL `?pref=` も同期される (同期は ThemePrefectureContext 側)。value は 5桁コードに統一。
 */
export function PrefectureSelect({ className }: { className?: string } = {}) {
  const { selectedPrefectureCode, setSelected } = useThemePrefecture();
  return (
    <Select
      value={selectedPrefectureCode ?? THEME_PREFECTURE_SET_VALUE}
      onValueChange={(v) => setSelected(v === THEME_PREFECTURE_SET_VALUE ? null : v)}
    >
      <SelectTrigger className={cn("w-36", className)} aria-label="都道府県を選択">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={THEME_PREFECTURE_SET_VALUE}>{PREFECTURE_SET_LABEL}</SelectItem>
        {PREFECTURE_LIST_2DIGIT.map((p) => (
          <SelectItem key={p.code} value={to5DigitPrefCode(p.code)}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
