/**
 * 家計調査の分析単位。既存指標の出典・値は metric config / R2 が正本。
 * ここには「同じ統計表のどの切り口を、どのページで答えるか」だけを置く。
 * proposed は公開・図の実装を意味しない。
 */
export interface KakeiAnalysis {
  id: string;
  question: string;
  source: {
    statsDataId: string;
    frequency: 'annual';
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
      | 'housing-tenure';
    year: 2025;
    /** 実際の metric config と対応する場合だけ固定する。 */
    filters?: Readonly<Record<string, string>>;
  };
  evidence: 'value-checked' | 'metadata-checked';
  placement: {
    pageId: string;
    form: 'ranking' | 'line-chart' | 'bar-chart' | 'article';
    state: 'configured' | 'proposed';
    metricKey?: string;
  };
}

export const KAKEI_ANALYSES: readonly KakeiAnalysis[] = [
  {
    id: 'natto-city-spending',
    question: '納豆への年間支出は都市でどう違うか',
    source: {
      statsDataId: '0004023605',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'capital-cities',
      axis: 'city',
      year: 2025,
      filters: { cdCat01: '010530030', cdCat02: '03' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'ranking:natto-consumption-expenditure',
      form: 'ranking',
      state: 'configured',
      metricKey: 'natto-consumption-expenditure',
    },
  },
  {
    id: 'rice-city-quantity',
    question: '米の年間購入量は都市でどう違うか',
    source: {
      statsDataId: '0004023606',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'capital-cities',
      axis: 'city',
      year: 2025,
      filters: { cdCat01: '010110001', cdCat02: '03' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'ranking:rice-consumption-quantity',
      form: 'ranking',
      state: 'configured',
      metricKey: 'rice-consumption-quantity',
    },
  },
  {
    id: 'green-tea-city-quantity',
    question: '緑茶の年間購入量は都市でどう違うか',
    source: {
      statsDataId: '0004023606',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'capital-cities',
      axis: 'city',
      year: 2025,
      filters: { cdCat01: '011010010', cdCat02: '03' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'ranking:green-tea-consumption-quantity',
      form: 'ranking',
      state: 'configured',
      metricKey: 'green-tea-consumption-quantity',
    },
  },
  {
    id: 'cup-noodles-city-spending',
    question: 'カップ麺への年間支出は都市でどう違うか',
    source: {
      statsDataId: '0004023605',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'capital-cities',
      axis: 'city',
      year: 2025,
      filters: { cdCat01: '010130050', cdCat02: '03' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'ranking:cup-noodles-consumption-expenditure',
      form: 'ranking',
      state: 'configured',
      metricKey: 'cup-noodles-consumption-expenditure',
    },
  },
  {
    id: 'beef-city-quantity',
    question: '牛肉の年間購入量は都市でどう違うか',
    source: {
      statsDataId: '0004023606',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'capital-cities',
      axis: 'city',
      year: 2025,
      filters: { cdCat01: '010310010', cdCat02: '03' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'ranking:beef-consumption-quantity',
      form: 'ranking',
      state: 'configured',
      metricKey: 'beef-consumption-quantity',
    },
  },
  {
    id: 'rice-national-spending-trend',
    question: '米への年間支出は全国でどう変化したか',
    source: {
      statsDataId: '0004023605',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'year',
      year: 2025,
      filters: { cdCat01: '010110001', cdCat02: '03' },
    },
    evidence: 'metadata-checked',
    placement: {
      pageId: 'theme:household-food-spending',
      form: 'line-chart',
      state: 'proposed',
    },
  },
  {
    id: 'rice-national-quantity-trend',
    question: '米の年間購入量は全国でどう変化したか',
    source: {
      statsDataId: '0004023606',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'year',
      year: 2025,
      filters: { cdCat01: '010110001', cdCat02: '03' },
    },
    evidence: 'metadata-checked',
    placement: {
      pageId: 'theme:household-food-spending',
      form: 'line-chart',
      state: 'proposed',
    },
  },
  {
    id: 'food-income-quintile',
    question: '食費は年収五分位でどう違うか',
    source: {
      statsDataId: '0002070005',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'income-quintile',
      year: 2025,
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'theme:household-food-spending',
      form: 'bar-chart',
      state: 'proposed',
    },
  },
  {
    id: 'item-spending-income-quintile',
    question: '同じ品目の支出は年収層でどう違うか',
    source: {
      statsDataId: '0004023607',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'income-quintile',
      year: 2025,
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'theme:household-food-spending',
      form: 'bar-chart',
      state: 'proposed',
    },
  },
  {
    id: 'item-quantity-income-quintile',
    question: '同じ品目の購入量は年収層でどう違うか',
    source: {
      statsDataId: '0004023608',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'income-quintile',
      year: 2025,
    },
    evidence: 'metadata-checked',
    placement: {
      pageId: 'theme:household-food-spending',
      form: 'bar-chart',
      state: 'proposed',
    },
  },
  {
    id: 'item-spending-age',
    question: '同じ品目の支出は世帯主年齢でどう違うか',
    source: {
      statsDataId: '0004023609',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'age',
      year: 2025,
    },
    evidence: 'metadata-checked',
    placement: {
      pageId: 'theme:household-food-spending',
      form: 'bar-chart',
      state: 'proposed',
    },
  },
  {
    id: 'food-household-size',
    question: '食費は世帯人数でどう違うか',
    source: {
      statsDataId: '0002070009',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'household-size',
      year: 2025,
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'theme:household-food-spending',
      form: 'bar-chart',
      state: 'proposed',
    },
  },
  {
    id: 'food-all-households',
    question: '総世帯の品目支出は二人以上世帯とどう違うか',
    source: {
      statsDataId: '0004023612',
      frequency: 'annual',
      household: 'all',
      geography: 'national',
      axis: 'item',
      year: 2025,
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'survey:kakei-chousa',
      form: 'article',
      state: 'proposed',
    },
  },
  {
    id: 'food-single-households',
    question: '単身世帯の品目支出は二人以上世帯とどう違うか',
    source: {
      statsDataId: '0004023614',
      frequency: 'annual',
      household: 'single',
      geography: 'national',
      axis: 'item',
      year: 2025,
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'survey:kakei-chousa',
      form: 'article',
      state: 'proposed',
    },
  },
  {
    id: 'savings-city',
    question: '二人以上世帯の貯蓄と負債は都市でどう違うか',
    source: {
      statsDataId: '0002210008',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'capital-cities',
      axis: 'city',
      year: 2025,
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'theme:household-assets-debt',
      form: 'bar-chart',
      state: 'proposed',
    },
  },
  {
    id: 'savings-income-18-class',
    question: '貯蓄と負債は年間収入18階級でどう違うか',
    source: {
      statsDataId: '0002210010',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'income-18-class',
      year: 2025,
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'theme:household-assets-debt',
      form: 'bar-chart',
      state: 'proposed',
    },
  },
  {
    id: 'savings-income-quintile',
    question: '貯蓄と負債は年間収入五分位でどう違うか',
    source: {
      statsDataId: '0002210012',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'income-quintile',
      year: 2025,
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'theme:household-assets-debt',
      form: 'bar-chart',
      state: 'proposed',
    },
  },
] as const;

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
    if (placement.state === 'proposed') {
      if (placement.metricKey)
        errors.push(`${analysis.id}: proposed output cannot claim a metric`);
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
