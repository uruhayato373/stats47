/**
 * 家計調査の分析単位の台帳。既存指標の出典・値は metric config / R2 が正本。
 * ここには「どの表のどの軸 (都市・年・年収階級など) を、どのページで答えるか」だけを置く。
 * 切り口 (数量と単価に分ける・年収階級で比べる など) そのものは調査の切り口台帳
 * data/surveys/lenses/kakei-chousa.json が正本で、各行は lensId でそこを参照する。
 * published は全国のページの図として公開済み、staged は値と図をローカル生成済み (未公開)、proposed は候補。
 * proposed の行を published へ進めるのは、e-Stat の実値 (表・分類コード・単位・年・行数) を確かめた後に限る。
 */
export interface KakeiAnalysis {
  id: string;
  /** 調査の切り口 (data/surveys/lenses/kakei-chousa.json の lenses[].id)。参照の実在は npm run surveys:lenses:check が見る */
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
    /** 実際の metric config と対応する場合だけ固定する。 */
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

export const KAKEI_ANALYSES: readonly KakeiAnalysis[] = [
  {
    id: 'natto-city-spending',
    lensId: 'kakei-city-comparison',
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
    lensId: 'kakei-city-comparison',
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
    lensId: 'kakei-city-comparison',
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
    lensId: 'kakei-city-comparison',
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
    lensId: 'kakei-city-comparison',
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
    lensId: 'kakei-long-term-trend',
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
    evidence: 'value-checked',
    placement: {
      pageId: 'japan-theme:household-food-spending',
      form: 'line-chart',
      state: 'published',
    },
  },
  {
    id: 'rice-national-quantity-trend',
    lensId: 'kakei-long-term-trend',
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
    evidence: 'value-checked',
    placement: {
      pageId: 'japan-theme:household-food-spending',
      form: 'line-chart',
      state: 'published',
    },
  },
  {
    id: 'food-income-quintile',
    lensId: 'kakei-income-class',
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
      pageId: 'japan-theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'item-spending-income-quintile',
    lensId: 'kakei-income-class',
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
      pageId: 'japan-theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'item-quantity-income-quintile',
    lensId: 'kakei-income-class',
    question: '同じ品目の購入量は年収層でどう違うか',
    source: {
      statsDataId: '0004023608',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'income-quintile',
      year: 2025,
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'japan-theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'item-spending-age',
    lensId: 'kakei-household-attributes',
    question: '同じ品目の支出は世帯主年齢でどう違うか',
    source: {
      statsDataId: '0004023609',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'age',
      year: 2025,
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'japan-theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'food-household-size',
    lensId: 'kakei-household-attributes',
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
      pageId: 'japan-theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'food-all-households',
    lensId: 'kakei-household-attributes',
    question: '総世帯の品目支出は二人以上世帯とどう違うか',
    source: {
      statsDataId: '0004023612',
      frequency: 'annual',
      household: 'all',
      geography: 'national',
      axis: 'household-type',
      year: 2025,
      filters: { cdCat01: '010110001', cdCat02: '11' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'japan-theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'food-single-households',
    lensId: 'kakei-household-attributes',
    question: '単身世帯の品目支出は二人以上世帯とどう違うか',
    source: {
      statsDataId: '0004023614',
      frequency: 'annual',
      household: 'single',
      geography: 'national',
      axis: 'household-type',
      year: 2025,
      filters: { cdCat01: '010110001', cdCat02: '21' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'japan-theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'savings-city',
    lensId: 'kakei-savings-debt',
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
    lensId: 'kakei-savings-debt',
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
      pageId: 'japan-theme:household-assets-debt',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'savings-income-quintile',
    lensId: 'kakei-savings-debt',
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
      pageId: 'japan-theme:household-assets-debt',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'budget-share-city',
    lensId: 'kakei-budget-structure',
    question: '消費支出に占める費目の割合は都市でどう違うか',
    source: {
      statsDataId: '0002070003',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'capital-cities',
      axis: 'city',
      year: 2025,
      filters: { cdCat02: '03' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'consumption-housing-tenure',
    lensId: 'kakei-household-attributes',
    question: '消費支出は持家と借家でどう違うか',
    source: {
      statsDataId: '0002070017',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'housing-tenure',
      year: 2025,
      filters: { cdCat01: '059', cdCat02: '03' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'japan-theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'housing-cost-housing-tenure',
    lensId: 'kakei-household-attributes',
    question: '住居への支出は持家と借家でどう違うか',
    source: {
      statsDataId: '0002070017',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'housing-tenure',
      year: 2025,
      filters: { cdCat01: '102', cdCat02: '03' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'japan-theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'food-single-age-sex',
    lensId: 'kakei-household-attributes',
    question: '単身世帯の食費は年齢と性別でどう違うか',
    source: {
      statsDataId: '0002190004',
      frequency: 'annual',
      household: 'single',
      geography: 'national',
      axis: 'age',
      year: 2025,
      filters: { cdCat01: '060', cdCat02: '21' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'japan-theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'item-quantity-age',
    lensId: 'kakei-household-attributes',
    question: '同じ品目の購入量は世帯主年齢でどう違うか',
    source: {
      statsDataId: '0004023610',
      frequency: 'annual',
      household: 'two-plus',
      geography: 'national',
      axis: 'age',
      year: 2025,
      filters: { cdCat01: '010110001', cdCat02: '03' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'japan-theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'beer-monthly-spending',
    lensId: 'kakei-seasonality',
    question: 'ビールへの支出は月でどう変わるか',
    source: {
      statsDataId: '0004023601',
      frequency: 'monthly',
      household: 'two-plus',
      geography: 'national',
      axis: 'month',
      year: 2025,
      filters: { cdCat01: '011100030', cdCat02: '03' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'japan-theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
    },
  },
  {
    id: 'beer-monthly-quantity',
    lensId: 'kakei-seasonality',
    question: 'ビールの購入量は月でどう変わるか',
    source: {
      statsDataId: '0004023602',
      frequency: 'monthly',
      household: 'two-plus',
      geography: 'national',
      axis: 'month',
      year: 2025,
      filters: { cdCat01: '011100030', cdCat02: '03' },
    },
    evidence: 'value-checked',
    placement: {
      pageId: 'japan-theme:household-food-spending',
      form: 'bar-chart',
      state: 'published',
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
