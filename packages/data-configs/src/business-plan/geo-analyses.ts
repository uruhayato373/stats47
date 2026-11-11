import data from '../../../../data/geo/analyses/analyses.json';
import {
  GEO_ANALYSIS_THEME_SOURCES,
  type GeoAnalysisThemeSource,
} from './geo-analysis-theme-sources';
import type { BusinessPlanM1Analysis } from './types';

/**
 * Geo 分析の読み込み口。記録の正本は台帳 `geo.analyses` (data/geo/analyses/analyses.json + Schema)。
 * ここは型を付けて export するだけで、記録を持たない。出典を theme-catalog に持つ分析 (themeSource) の
 * 7 項目だけ geo-analysis-theme-sources.ts の結合の関数で埋める。
 */
export type GeoAnalysisSlug = keyof typeof data.analyses;

const THEME_DERIVED_KEYS = [
  'r2Key',
  'evidenceManifestKey',
  'detailR2KeyPattern',
  'dataVersion',
  'sourceName',
  'sourceUrl',
  'caveats',
] as const;

type ThemeDerivedKey = (typeof THEME_DERIVED_KEYS)[number];

type GeoAnalysisBase = Omit<
  BusinessPlanM1Analysis,
  'slug' | 'relatedRankingKey' | 'r2Key' | 'evidenceManifestKey' | 'detailR2KeyPattern'
> & {
  readonly slug: GeoAnalysisSlug;
  readonly r2Key: string;
  readonly evidenceManifestKey: string;
  readonly detailR2KeyPattern: string;
};

/** relatedRankingKey を持つ分析だけが、`in` で絞り込める型を持つ */
export type GeoAnalysis =
  | GeoAnalysisBase
  | (GeoAnalysisBase & { readonly relatedRankingKey: string });

type RawGeoAnalysis = Omit<GeoAnalysisBase, 'slug' | ThemeDerivedKey> &
  Partial<Pick<BusinessPlanM1Analysis, ThemeDerivedKey>> & {
    readonly themeSource?: GeoAnalysisThemeSource;
    readonly relatedRankingKey?: string;
  };

const RECORDS = data.analyses as Record<GeoAnalysisSlug, RawGeoAnalysis>;

function buildGeoAnalysis(slug: GeoAnalysisSlug): GeoAnalysis {
  const { themeSource, ...raw } = RECORDS[slug];
  if (!themeSource) return { ...raw, slug } as GeoAnalysis;
  const { slug: sourceSlug, ...derived } = GEO_ANALYSIS_THEME_SOURCES[themeSource]();
  if (sourceSlug !== slug) {
    throw new Error(
      `Geo分析 ${slug} の themeSource ${themeSource} の slug (${sourceSlug}) が台帳のキーと一致しません`
    );
  }
  return { ...raw, slug, ...derived } as GeoAnalysis;
}

/** Site analyses include theme extensions; the M1 publication campaign keeps its own scope. */
export const GEO_ANALYSES: readonly GeoAnalysis[] = (
  Object.keys(RECORDS) as GeoAnalysisSlug[]
).map(buildGeoAnalysis);

/** 台帳の slug から分析を引く。M1 の公開キャンペーン (m1.ts) が自分の範囲の分析を選ぶのに使う。 */
export function getGeoAnalysis(slug: GeoAnalysisSlug): GeoAnalysis {
  const analysis = GEO_ANALYSES.find((item) => item.slug === slug);
  if (!analysis) throw new Error(`Geo分析がありません: ${slug}`);
  return analysis;
}

/** 主指標を単独のランキングとしても公開している分析。ランキングページから分析の canonical 着地へ接続する。 */
export function findGeoAnalysisByRankingKey(rankingKey: string) {
  return GEO_ANALYSES.find(
    (analysis) =>
      'relatedRankingKey' in analysis && analysis.relatedRankingKey === rankingKey
  );
}
