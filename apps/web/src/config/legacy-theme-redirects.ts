/**
 * 廃止したページ・旧カテゴリ URL からテーマページへの恒久転送 (301) 表。
 *
 * middleware.ts の if ブロックに直書きしていた転送を表にまとめ、転送先テーマの実在を
 * `src/config/__tests__/legacy-theme-redirects.test.ts` が ALL_THEMES / AREA_THEME_SLUGS と照合する。
 * middleware はこの表を上から順に照合し、最初に一致した行の転送先へクエリを保ったまま 301 を返す。
 */

import { hrefFor } from '@stats47/data-configs/content/href';

export interface LegacyThemePathRedirect {
  /** 旧 URL の pathname */
  readonly pattern: RegExp;
  /** 転送先テーマの slug。空文字はテーマ一覧 `/themes` */
  readonly themeSlug: string;
  /** 廃止の経緯 */
  readonly note: string;
}

/** 照合順に並べる (具体 path を先、ハブのフォールバックを最後) */
export const LEGACY_THEME_PATH_REDIRECTS: readonly LegacyThemePathRedirect[] = [
  { pattern: /^\/ports\/?$/, themeSlug: 'ports', note: '2026-05-28 廃止。港湾テーマを新設' },
  { pattern: /^\/fishing-ports\/?$/, themeSlug: 'fishery-marine', note: '2026-05-28 廃止。漁港数を含む漁業テーマへ統合' },
  { pattern: /^\/station-passengers(?:\/.*)?$/, themeSlug: 'railway', note: '2026-05-28 廃止。駅別乗降客数の県別バブルマップを鉄道テーマへ集約' },
  { pattern: /^\/maps\/highway-timeline(?:\/.*)?$/, themeSlug: 'roads', note: '2026-05-28 廃止。高速道路時系列マップを道路テーマへ集約' },
  { pattern: /^\/gis-cross\/migration-flow(?:\/.*)?$/, themeSlug: 'population-dynamics', note: '2026-05-29 廃止。人口移動フローを人口動態テーマへ埋め込み' },
  { pattern: /^\/gis-cross\/depopulation-medical(?:\/.*)?$/, themeSlug: 'healthcare', note: '2026-05-29 廃止。過疎×医療マップを医療テーマへ埋め込み' },
  { pattern: /^\/gis-cross\/sunshine-map(?:\/.*)?$/, themeSlug: 'climate', note: '2026-05-29 廃止。日照地図を気候テーマへ埋め込み' },
  { pattern: /^\/gis-cross(?:\/.*)?$/, themeSlug: '', note: '2026-05-29 廃止。GIS 掛け合わせハブ' },
];

/** 一致した旧 URL の転送先 pathname (クエリは呼び元が付ける)。一致しなければ undefined */
export function resolveLegacyThemePathRedirect(pathname: string): string | undefined {
  const row = LEGACY_THEME_PATH_REDIRECTS.find(({ pattern }) => pattern.test(pathname));
  if (!row) return undefined;
  return row.themeSlug ? hrefFor('theme', { themeSlug: row.themeSlug }) : '/themes';
}

/**
 * `/areas/{prefCode}/{categoryKey}` (旧カテゴリ別ページ) → `/areas/{prefCode}/{themeSlug}` の対応。
 * 空文字は対応テーマなし → `/areas/{prefCode}` (エリアプロフィール) へ転送する。
 * tourism は旧 categoryKey と現行 themeSlug が同一なので含めない (含めると同一 URL への 301 ループ)。
 */
export const AREA_CATEGORY_TO_THEME: Readonly<Record<string, string>> = {
  population: 'population-dynamics',
  laborwage: 'labor-wages',
  economy: 'local-economy',
  agriculture: 'local-economy',
  miningindustry: 'manufacturing',
  construction: 'living-housing',
  commercial: 'local-economy',
  socialsecurity: 'healthcare',
  educationsports: 'education-culture',
  safetyenvironment: 'safety',
  landweather: 'climate',
  international: 'foreign-residents',
  administrativefinancial: 'local-finance',
  energy: '',
  ict: '',
  infrastructure: '',
};
