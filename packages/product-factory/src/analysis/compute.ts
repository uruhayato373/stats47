import type { AnalysisObservation, AnalysisSource } from './fetch-estat';

export interface ResearchReference {
  id: string; title: string; url: string; section: string; finding: string; checkedAt: string;
}
export interface AnalysisRecipe {
  id: string; heading: string; lead: string; sourceId: string; metricIds: string[];
  method: 'index' | 'share' | 'series' | 'balance' | 'change';
  balances?: { id: string; label: string; positiveId: string; negativeId: string }[];
  areaCode?: string; prefectureCode?: string; denominatorId?: string; from?: number; to?: number;
  template: 'line' | 'bar'; references: string[]; limitation: string;
}
export interface AnalysisRevision {
  version: string; title: string; description: string;
  useCases: { title: string; description: string }[];
  sources: (AnalysisSource & { url: string; definition: string; boundary: string })[];
  research: { method: string; references: ResearchReference[] };
  recipes: AnalysisRecipe[];
}
export interface AnalysisResult {
  analysisId: string; areaCode: string; areaName: string; year: number;
  seriesId: string; seriesLabel: string; value: number | null; unit: string;
}

/** 計算・図表・納品CSVが同じ行を使う。欠測・定義違いを0や他統計で埋めない。 */
export function computeAnalyses(plan: AnalysisRevision, rows: AnalysisObservation[]): AnalysisResult[] {
  const sourceMap = new Map(plan.sources.map(source => [source.id, source]));
  if (sourceMap.size !== plan.sources.length) throw Error('取得元IDが重複しています');
  if (new Set(plan.recipes.map(recipe => recipe.id)).size !== plan.recipes.length) throw Error('分析IDが重複しています');
  const referenceIds = new Set(plan.research.references.map(reference => reference.id));
  const byKey = new Map<string, AnalysisObservation>();
  const key = (source: string, metric: string, area: string, year: number) => `${source}/${metric}/${area}/${year}`;
  for (const row of rows) {
    const source = sourceMap.get(row.sourceId);
    const metric = source?.metrics.find(item => item.id === row.metricId);
    if (!source || !metric || !source.years.includes(row.year) || metric.unit !== row.unit)
      throw Error('観測値の取得元・指標・年・単位が台帳と一致しません');
    if (row.value !== null && !Number.isFinite(row.value)) throw Error('有限でない観測値です');
    const id = key(row.sourceId, row.metricId, row.areaCode, row.year);
    if (byKey.has(id)) throw Error(`観測値が重複しています: ${id}`);
    byKey.set(id, row);
  }
  const lookup = (source: string, metric: string, area: string, year: number) => byKey.get(key(source, metric, area, year));
  return plan.recipes.flatMap(recipe => {
    const source = sourceMap.get(recipe.sourceId);
    if (!source || recipe.references.length === 0 || recipe.references.some(id => !referenceIds.has(id)))
      throw Error(`分析の取得元または参考資料がありません: ${recipe.id}`);
    if (recipe.template !== (recipe.method === 'change' ? 'bar' : 'line')) throw Error('分析と画像型が一致しません');
    const metrics = recipe.metricIds.map(id => {
      const metric = source.metrics.find(item => item.id === id);
      if (!metric) throw Error(`未収録の指標: ${id}`);
      return metric;
    });
    const years = [...source.years].sort((a, b) => a - b);
    if (years.length < 2) throw Error('推移の分析には2時点以上が必要です');
    const input = rows.filter(row => row.sourceId === source.id);
    const areas = new Map(input.map(row => [row.areaCode, row.areaName]));
    if (recipe.method === 'change') {
      if (source.grain !== 'municipality' || !recipe.prefectureCode || metrics.length !== 1 ||
          recipe.from === undefined || recipe.to === undefined || recipe.from >= recipe.to ||
          !years.includes(recipe.from) || !years.includes(recipe.to)) throw Error('市区町村比較の地域・期間が不正です');
      return [...areas].filter(([code]) => code.startsWith(recipe.prefectureCode!)).map(([areaCode, areaName]) => {
        const start = lookup(source.id, metrics[0].id, areaCode, recipe.from!)?.value ?? null;
        const end = lookup(source.id, metrics[0].id, areaCode, recipe.to!)?.value ?? null;
        return { analysisId: recipe.id, areaCode, areaName, year: recipe.to!, seriesId: metrics[0].id,
          seriesLabel: metrics[0].label, value: start === null || end === null || start <= 0 ? null : (end / start - 1) * 100, unit: '％' };
      });
    }
    const areaCode = recipe.areaCode;
    if (!areaCode || !areas.has(areaCode)) throw Error(`指定地域がありません: ${recipe.id}`);
    const denominator = source.metrics.find(metric => metric.id === recipe.denominatorId);
    if (recipe.method === 'share' && !denominator) throw Error('割合の分母が未収録です');
    if (recipe.method === 'series' && new Set(metrics.map(metric => metric.unit)).size !== 1)
      throw Error('折れ線の単位が異なります');
    if (recipe.method === 'balance') {
      if (!recipe.balances?.length || new Set(metrics.map(metric => metric.unit)).size !== 1) throw Error('増減の組または単位が不正です');
      return recipe.balances.flatMap(balance => {
        if (![balance.positiveId, balance.negativeId].every(id => recipe.metricIds.includes(id))) throw Error('増減の入力が未収録です');
        return years.map(year => {
          const positive = lookup(source.id, balance.positiveId, areaCode, year)?.value ?? null;
          const negative = lookup(source.id, balance.negativeId, areaCode, year)?.value ?? null;
          return { analysisId: recipe.id, areaCode, areaName: areas.get(areaCode)!, year,
            seriesId: balance.id, seriesLabel: balance.label, value: positive === null || negative === null ? null : positive - negative, unit: metrics[0].unit };
        });
      });
    }
    return metrics.flatMap(metric => {
      if (denominator && metric.unit !== denominator.unit) throw Error('割合の分子・分母の単位が異なります');
      const baseline = lookup(source.id, metric.id, areaCode, years[0])?.value ?? null;
      if (recipe.method === 'index' && (baseline === null || baseline <= 0)) throw Error('指数の基準年が欠測または0以下です');
      return years.map(year => {
        const value = lookup(source.id, metric.id, areaCode, year)?.value ?? null;
        const divisor = denominator ? lookup(source.id, denominator.id, areaCode, year)?.value ?? null : null;
        if (recipe.method === 'share' && value !== null && divisor !== null && (value < 0 || value > divisor))
          throw Error('部分が全体を超えています');
        const computed = value === null ? null : recipe.method === 'index' ? value / baseline! * 100
          : recipe.method === 'share' ? divisor === null || divisor <= 0 ? null : value / divisor * 100 : value;
        return { analysisId: recipe.id, areaCode, areaName: areas.get(areaCode)!, year, seriesId: metric.id,
          seriesLabel: metric.label, value: computed, unit: recipe.method === 'index' ? `${years[0]}年＝100` : recipe.method === 'share' ? '％' : metric.unit };
      });
    });
  });
}

export function describeAnalysis(recipe: AnalysisRecipe, rows: AnalysisResult[]): string {
  const valid = rows.filter(row => row.value !== null);
  if (!valid.length) throw Error(`分析結果がありません: ${recipe.id}`);
  const format = (value: number) => value.toLocaleString('ja-JP', { maximumFractionDigits: 1 });
  if (recipe.method === 'change') {
    const plus = valid.filter(row => row.value! > 0).length;
    const minus = valid.filter(row => row.value! < 0).length;
    return `${recipe.from}〜${recipe.to}年の比較可能な${valid.length}自治体のうち、増加は${plus}、減少は${minus}です。`;
  }
  return [...new Set(rows.map(row => row.seriesId))].map(id => {
    const series = rows.filter(row => row.seriesId === id).sort((a, b) => a.year - b.year);
    const first = series[0], last = series.at(-1)!;
    if (first.value === null || last.value === null) return `${first.seriesLabel}は端点に欠測があります。`;
    return `${first.areaName}の${first.seriesLabel}は${first.year}年の${format(first.value)}から${last.year}年の${format(last.value)}へ変化しています（${last.unit}）。`;
  }).join('');
}
