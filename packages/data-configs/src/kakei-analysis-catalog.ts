import kakeiChousa from '../../../data/surveys/analysis-units/kakei-chousa.json';

/**
 * 家計調査の分析単位。既存指標の出典・値は metric config / R2 が正本。
 * 記録の正本は data/surveys/analysis-units/kakei-chousa.json (カタログの surveys.analysis-units。JSON Schema 付き)。
 * ここは型・読み込み・整合検査だけを持つ。参照の実在 (切り口・ページ・指標) は check-datasets が refs で止める。
 */
export interface KakeiAnalysis {
  id: string;
  /** 調査の切り口 (data/surveys/lenses/kakei-chousa.json の lenses[].id)。参照の実在は check-datasets が見る */
  lensId: string;
  question: string;
  source: {
    statsDataId: string;
    frequency: 'annual' | 'monthly';
    household: 'two-plus' | 'all' | 'single';
    geography: 'capital-cities' | 'national';
    axis:
      | 'city'
      | 'item'
      | 'year'
      | 'income-quintile'
      | 'income-18-class'
      | 'age'
      | 'household-size'
      | 'household-type'
      | 'housing-tenure'
      | 'month';
    year: 2025;
    /**
     * 表の絞り込み (分類コード)。ranking の行は metric config と一致させる。全国の図の行は、その分析単位の図すべてに共通する絞り込みを書き、
     * 図ごとに違う分類 (貯蓄と負債の cdCat01・男女の cdCat04) だけを図の生成 (packages/stats-r2/src/scripts/generate-kakei-axis-charts.ts の extraFilters) が足す。
     */
    filters?: Readonly<Record<string, string>>;
  };
  evidence: 'value-checked' | 'metadata-checked';
  placement: {
    pageId: string;
    form: 'ranking' | 'line-chart' | 'bar-chart' | 'article';
    state: 'configured' | 'published' | 'staged' | 'proposed';
    metricKey?: string;
  };
}

export const KAKEI_ANALYSES: readonly KakeiAnalysis[] =
  kakeiChousa.units as unknown as readonly KakeiAnalysis[];

export interface KakeiAnalysisCheckInput {
  pages: ReadonlyMap<string, { published: boolean }>;
  metrics: ReadonlyMap<
    string,
    {
      statsDataId: string;
      filters: Readonly<Record<string, string>>;
      latestYear: number;
    }
  >;
}

/** Composite slice identity and foreign-key checks, without API or model calls. */
export function validateKakeiAnalyses(
  analyses: readonly KakeiAnalysis[],
  input: KakeiAnalysisCheckInput
): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const slices = new Set<string>();
  for (const analysis of analyses) {
    if (ids.has(analysis.id)) errors.push(`${analysis.id}: duplicate id`);
    ids.add(analysis.id);
    const { source, placement } = analysis;
    const slice = JSON.stringify([
      source.statsDataId,
      source.frequency,
      source.household,
      source.geography,
      source.axis,
      source.year,
      Object.entries(source.filters ?? {}).sort(([a], [b]) =>
        a.localeCompare(b)
      ),
    ]);
    if (slices.has(slice))
      errors.push(`${analysis.id}: duplicate source slice`);
    slices.add(slice);
    if (!/^kakei-[a-z0-9-]+$/.test(analysis.lensId))
      errors.push(`${analysis.id}: lensId must be a kakei-chousa lens id`);
    if (!/^\d{10}$/.test(source.statsDataId))
      errors.push(`${analysis.id}: invalid statsDataId`);
    if (source.axis.startsWith('income-') && source.geography !== 'national')
      errors.push(`${analysis.id}: income class must use national geography`);
    if (source.axis === 'city' && source.geography !== 'capital-cities')
      errors.push(`${analysis.id}: city comparison needs city observations`);
    if (!input.pages.get(placement.pageId)?.published)
      errors.push(
        `${analysis.id}: destination page is not published: ${placement.pageId}`
      );
    if (placement.state !== 'configured') {
      if (placement.metricKey)
        errors.push(`${analysis.id}: non-ranking output cannot claim a metric`);
      if (placement.state !== 'proposed' && (analysis.evidence !== 'value-checked' || placement.form === 'article'))
        errors.push(`${analysis.id}: ${placement.state} output needs checked values and a chart`);
      continue;
    }
    if (analysis.evidence !== 'value-checked')
      errors.push(`${analysis.id}: configured output needs observed values`);
    if (
      placement.form !== 'ranking' ||
      placement.pageId !== `ranking:${placement.metricKey}`
    )
      errors.push(
        `${analysis.id}: configured output must map to its ranking page`
      );
    if (!source.filters?.cdCat01 || !source.filters.cdCat02)
      errors.push(
        `${analysis.id}: configured ranking needs item and household codes`
      );
    const metric = placement.metricKey
      ? input.metrics.get(placement.metricKey)
      : undefined;
    if (!metric) {
      errors.push(`${analysis.id}: metric is not registered`);
      continue;
    }
    if (
      metric.statsDataId !== source.statsDataId ||
      metric.latestYear < source.year
    )
      errors.push(`${analysis.id}: metric table/year mismatch`);
    for (const [key, value] of Object.entries(source.filters ?? {}))
      if (metric.filters[key] !== value)
        errors.push(`${analysis.id}: metric ${key} mismatch`);
  }
  return errors;
}
