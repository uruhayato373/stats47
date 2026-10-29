'use client';

import { useRouter } from 'next/navigation';

import { PREFECTURE_LIST_2DIGIT, to5DigitPrefCode } from '@stats47/area';
import { cn } from '@stats47/components';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stats47/components/atoms/ui/select';
import { hrefFor } from '@stats47/data-configs/content/href';


import { trackNavClick } from '@/lib/analytics/events';

import { themeHref } from '../config/theme-href';
import {
  resolveThemePrefectureCode,
  THEME_PREFECTURE_SET_VALUE,
} from '../lib/theme-prefecture-preference';
import { PREFECTURE_SET_LABEL } from '../types';

import { useThemePrefecture } from './ThemePrefectureContext';

/**
 * 未選択 (47都道府県一覧) を表す Select 用センチネル値。
 * e-Stat の全国コード "00000" ではない — HTML Select が空文字列を扱えないための
 * Cookie / URL 共通センチネル値を使う。
 *
 * テーマダッシュボードの都道府県セレクタ (context 消費型)。
 * デフォルト「47都道府県」(GEO-SCOPE-SEPARATION-01 WP2)。選択でその都道府県のデータに切り替わり、
 * URL `?pref=` も同期される (同期は ThemePrefectureContext 側)。value は 5桁コードに統一。
 *
 * areaPageThemeKey を渡したテーマ (県ごとのページ `/areas/{県}/{テーマ}` を持つテーマ) では、選んだ県の
 * そのページへ移り、「47都道府県」ならテーマのページへ戻る。県×テーマの交点は 1 つの URL に着く
 * (2026-10-30 オーナー決定。旧: 同じページのまま `?pref=` を書き換え、同じ内容が 2 つの URL にあった)。
 */
export function PrefectureSelect({
  className,
  areaPageThemeKey,
}: { className?: string; areaPageThemeKey?: string } = {}) {
  const { selectedPrefectureCode, selectedAreaName, setSelected } = useThemePrefecture();
  const router = useRouter();
  const selectedLabel = selectedPrefectureCode
    ? (selectedAreaName ?? resolveThemePrefectureCode(selectedPrefectureCode)?.areaName)
    : PREFECTURE_SET_LABEL;
  return (
    <Select
      value={selectedPrefectureCode ?? THEME_PREFECTURE_SET_VALUE}
      items={[
        { value: THEME_PREFECTURE_SET_VALUE, label: PREFECTURE_SET_LABEL },
        ...PREFECTURE_LIST_2DIGIT.map((p) => ({
          value: to5DigitPrefCode(p.code),
          label: p.name,
        })),
      ]}
      onValueChange={(v) => {
        if (v === null) return;
        const code = v === THEME_PREFECTURE_SET_VALUE ? null : v;
        const pageHref = areaPageThemeKey
          ? code
            ? hrefFor('area-theme', { areaCode: code, themeSlug: areaPageThemeKey })
            : themeHref(areaPageThemeKey)
          : null;
        trackNavClick({
          surface: 'theme_region',
          label: v,
          href: pageHref ?? `?pref=${v}`,
        });
        // 県ごとのページへ移るときは今のページの URL (`?pref=`) を書き換えない (戻ると同じ内容の別 URL に戻るため)
        if (pageHref) router.push(pageHref);
        else setSelected(code);
      }}
    >
      <SelectTrigger
        className={cn('w-36', className)}
        aria-label="都道府県を選択"
      >
        <SelectValue>{selectedLabel}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={THEME_PREFECTURE_SET_VALUE}>
          {PREFECTURE_SET_LABEL}
        </SelectItem>
        {PREFECTURE_LIST_2DIGIT.map((p) => (
          <SelectItem key={p.code} value={to5DigitPrefCode(p.code)}>
            {p.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
