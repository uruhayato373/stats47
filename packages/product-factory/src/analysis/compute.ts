import type { AnalysisObservation } from './fetch-estat';
import type { ProductThemeReference } from './theme-references';
import { buildMunicipalityEntityPolicy, listPublishableMunicipalities } from '@stats47/area';

export interface ResearchReference {
  id: string; title: string; url: string; section: string; finding: string; checkedAt: string;
}
export interface AnalysisRecipe {
  id: string; heading: string; lead: string; sourceId: string; metricIds: string[];
  method: 'index' | 'share' | 'series' | 'balance' | 'change' | 'compare' | 'ratio' | 'composition';
  /** 重複しない内訳を全体から引いた残差。親項目と子項目は同時に指定しない。 */
  remainder?: { id: string; label: string };
  balances?: { id: string; label: string; positiveId: string; negativeId: string }[];
  areaCode?: string; areaCodes?: string[];
  within?: { kind: 'nation' } | { kind: 'prefecture'; prefCode: string };
  denominatorId?: string; from?: number; to?: number; year?: number;
  /** 分子 / 分母 × scale。率の単位を推測せず台帳に明記する。 */
  scale?: number; unit?: string;
  template: 'line' | 'bar' | 'choropleth' | 'stacked-bar'; references: string[]; limitation: string;
  presentationMetricKey?: string; chartTitle?: string; scopeLabel?: string;
  themeRefs?: ProductThemeReference[];
}
export interface AnalysisRevision {
  version: string; title: string; description: string;
  useCases: { title: string; description: string }[]; notes: string[];
  /** 原典取得と分離した論理的な入力。異なる表も、地域・年・定義を照合したloaderが結合する。 */
  sources: {
    id: string; statsDataId?: string; grain: 'prefecture' | 'municipality' | 'capital-city'; years: number[];
    metrics: { id: string; code: string; label: string; unit: string }[];
    title: string; label: string; url: string; definition: string; boundary: string;
  }[];
  research: { method: string; references: ResearchReference[] };
  recipes: AnalysisRecipe[];
}
export interface AnalysisResult {
  analysisId: string; areaCode: string; areaName: string; year: number;
  seriesId: string; seriesLabel: string; value: number | null; unit: string;
  missingReason?: string;
}

/** 計算方法ではなく、計算結果の次元と共通画像型の互換性を検査する。 */
export function assertAnalysisFigureShape(recipe: AnalysisRecipe, rows: AnalysisResult[]): void {
  if (!rows.length) throw Error(`分析の対象地域がありません: ${recipe.id}`);
  if (new Set(rows.map(row => row.unit)).size !== 1) throw Error('図に並べる値の単位が異なります');
  const coordinates = new Set(rows.map(row => `${row.areaCode}/${row.seriesId}/${row.year}`));
  if (coordinates.size !== rows.length) throw Error('分析結果の座標が重複しています');
  if (rows.some(row => row.value !== null && !Number.isFinite(row.value))) throw Error('有限でない分析結果です');
  if (recipe.template === 'stacked-bar') {
    if (recipe.method !== 'composition' || !recipe.remainder) throw Error('積み上げ図には構成分析が必要です');
    const expected = [...recipe.metricIds, recipe.remainder.id];
    const groups = new Map<string, AnalysisResult[]>();
    for (const row of rows) {
      const key = `${row.areaCode}/${row.year}`;
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    for (const group of groups.values()) {
      if (group.length !== expected.length || group.some(row => !expected.includes(row.seriesId)))
        throw Error('構成の内訳が揃っていません');
      // 共通描画型が欠測を0に置換・再正規化しないよう、描画前に止める。
      if (group.some(row => row.value === null)) throw Error('構成図に欠測または0以下の分母があります');
      if (group.some(row => row.unit !== '％' || row.value! < 0) || Math.abs(group.reduce((sum, row) => sum + row.value!, 0) - 100) > 1e-8)
        throw Error('構成の合計が100％になりません');
    }
    return;
  }
  if (recipe.template === 'bar' || recipe.template === 'choropleth') {
    if (new Set(rows.map(row => row.year)).size !== 1 || new Set(rows.map(row => row.seriesId)).size !== 1)
      throw Error('棒グラフ・地図は1時点・1指標の地域比較に使います');
    if (!recipe.presentationMetricKey) throw Error('棒グラフ・地図の配色を参照する指標がありません');
    if (recipe.template === 'choropleth') {
      if (!recipe.within || recipe.areaCode || recipe.areaCodes)
        throw Error('市区町村地図は全国または県内全域を指定してください');
      const prefCode = recipe.within.kind === 'prefecture' ? recipe.within.prefCode : undefined;
      const expected = new Set(listPublishableMunicipalities(buildMunicipalityEntityPolicy())
        .filter(area => !prefCode || area.code.startsWith(prefCode)).map(area => area.code));
      if (!expected.size || expected.size !== rows.length || rows.some(row => !expected.has(row.areaCode)))
        throw Error('市区町村地図の地域コードが指定範囲の市町村・特別区と一致しません');
      if (rows.some(row => row.value === null && !row.missingReason?.trim())) throw Error('地図の欠測理由がありません');
    }
    return;
  }
  if (recipe.template !== 'line') throw Error('未対応の分析画像型です');
  const series = new Map<string, number[]>();
  for (const row of rows) {
    const id = `${row.areaCode}/${row.seriesId}`;
    series.set(id, [...(series.get(id) ?? []), row.year]);
  }
  const years = [...new Set(rows.map(row => row.year))];
  if (years.length < 2 || [...series.values()].some(items => items.length !== years.length))
    throw Error('折れ線には各系列で共通の2時点以上が必要です');
}

/** 計算・図表・納品CSVが同じ行を使う。欠測・定義違いを0や他統計で埋めない。 */
export function computeAnalyses(plan: AnalysisRevision, rows: AnalysisObservation[]): AnalysisResult[] {
  const sourceMap = new Map(plan.sources.map(source => [source.id, source]));
  if (sourceMap.size !== plan.sources.length) throw Error('取得元IDが重複しています');
  for (const source of plan.sources) {
    if (!source.years.length || new Set(source.years).size !== source.years.length ||
        !source.metrics.length || new Set(source.metrics.map(metric => metric.id)).size !== source.metrics.length)
      throw Error(`取得元の年または指標が空・重複しています: ${source.id}`);
  }
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
  // APIに無い座標も検出する。原票が欠測を明示した値はnullのまま許容する。
  for (const source of plan.sources) {
    const areas = new Set(rows.filter(row => row.sourceId === source.id).map(row => row.areaCode));
    if (!areas.size) throw Error(`取得元が空です: ${source.id}`);
    for (const area of areas) for (const metric of source.metrics) for (const year of source.years) {
      const row = lookup(source.id, metric.id, area, year);
      if (!row) throw Error(`観測値の座標が欠落: ${source.id}/${metric.id}/${area}/${year}`);
      if (row.value === null && !row.missingReason) throw Error('欠測理由がありません');
    }
  }
  return plan.recipes.flatMap(recipe => {
    const source = sourceMap.get(recipe.sourceId);
    if (!source || recipe.references.length === 0 || recipe.references.some(id => !referenceIds.has(id)))
      throw Error(`分析の取得元または参考資料がありません: ${recipe.id}`);
    if (recipe.template === 'choropleth' && source.grain !== 'municipality')
      throw Error('市区町村地図の取得元の地域単位が一致しません');
    if (!['index', 'share', 'series', 'balance', 'change', 'compare', 'ratio', 'composition'].includes(recipe.method)) throw Error('未対応の分析方法です');
    if (!recipe.metricIds.length || new Set(recipe.metricIds).size !== recipe.metricIds.length) throw Error('分析の指標が空または重複しています');
    const metrics = recipe.metricIds.map(id => {
      const metric = source.metrics.find(item => item.id === id);
      if (!metric) throw Error(`未収録の指標: ${id}`);
      return metric;
    });
    if (recipe.year !== undefined && (recipe.from !== undefined || recipe.to !== undefined)) throw Error('単年と期間を同時に指定できません');
    for (const year of [recipe.year, recipe.from, recipe.to]) {
      if (year !== undefined && !source.years.includes(year)) throw Error(`未収録の年です: ${year}`);
    }
    if (recipe.from !== undefined && recipe.to !== undefined && recipe.from >= recipe.to) throw Error('分析期間が不正です');
    const years = [...source.years].sort((a, b) => a - b).filter(year =>
      (recipe.year === undefined || year === recipe.year) &&
      (recipe.from === undefined || year >= recipe.from) && (recipe.to === undefined || year <= recipe.to));
    if (recipe.method === 'compare' && recipe.year === undefined) throw Error('地域比較の年を明示してください');
    if (recipe.method === 'index' && years.length < 2) throw Error('指数の分析には2時点以上が必要です');
    const input = rows.filter(row => row.sourceId === source.id);
    const areas = new Map(input.map(row => [row.areaCode, row.areaName]));
    if (recipe.areaCode && recipe.areaCodes) throw Error('地域指定が重複しています');
    const selectedCodes = recipe.areaCodes ?? (recipe.areaCode ? [recipe.areaCode] : [...areas.keys()]);
    if (!selectedCodes.length || new Set(selectedCodes).size !== selectedCodes.length || selectedCodes.some(code => !areas.has(code)))
      throw Error(`指定地域がないか重複しています: ${recipe.id}`);
    const prefCode = recipe.within?.kind === 'prefecture' ? recipe.within.prefCode : undefined;
    if (recipe.within && (source.grain !== 'municipality' || !['nation', 'prefecture'].includes(recipe.within.kind) ||
        (recipe.within.kind === 'prefecture' && !/^(0[1-9]|[1-3][0-9]|4[0-7])$/.test(prefCode!))))
      throw Error('県内の市区町村を選ぶ地域指定が不正です');
    const selectedAreas = selectedCodes.filter(code => !prefCode || code.startsWith(prefCode));
    const finish = (result: AnalysisResult[]) => { assertAnalysisFigureShape(recipe, result); return result; };
    if (recipe.method === 'change') {
      if (metrics.length !== 1 || recipe.from === undefined || recipe.to === undefined)
        throw Error('増減率には1指標と開始年・終了年が必要です');
      return finish(selectedAreas.map(areaCode => {
        const start = lookup(source.id, metrics[0].id, areaCode, recipe.from!)?.value ?? null;
        const end = lookup(source.id, metrics[0].id, areaCode, recipe.to!)?.value ?? null;
        return { analysisId: recipe.id, areaCode, areaName: areas.get(areaCode)!, year: recipe.to!, seriesId: metrics[0].id,
          seriesLabel: metrics[0].label, value: start === null || end === null || start <= 0 ? null : (end / start - 1) * 100, unit: '％',
          ...(start === null || end === null ? { missingReason: '入力値が欠測' } : start <= 0 ? { missingReason: '基準年が0以下' } : {}) };
      }));
    }
    const denominator = source.metrics.find(metric => metric.id === recipe.denominatorId);
    const divides = recipe.method === 'share' || recipe.method === 'ratio' || recipe.method === 'composition';
    if (divides && !denominator) throw Error('割合・比率の分母が未収録です');
    if (recipe.method === 'ratio' && (!Number.isFinite(recipe.scale) || recipe.scale! <= 0 || !recipe.unit?.trim()))
      throw Error('比率には正の倍率と出力単位が必要です');
    if (recipe.method !== 'index' && new Set(metrics.map(metric => metric.unit)).size !== 1)
      throw Error('分析する指標の単位が異なります');
    if ((recipe.method === 'share' || recipe.method === 'composition') && metrics.some(metric => metric.unit !== denominator!.unit))
      throw Error('割合の分子・分母の単位が異なります');
    if (recipe.method === 'share' && recipe.metricIds.includes(recipe.denominatorId!))
      throw Error('部分の割合に全体自身を指定できません');
    if (recipe.method === 'composition') {
      if (recipe.template !== 'stacked-bar' || !recipe.remainder?.id || !recipe.remainder.label?.trim() ||
          source.metrics.some(metric => metric.id === recipe.remainder!.id) || recipe.metricIds.includes(denominator!.id))
        throw Error('構成には独立した内訳・全体・残差と積み上げ図が必要です');
      return finish(selectedAreas.flatMap(areaCode => years.flatMap(year => {
        const values = metrics.map(metric => lookup(source.id, metric.id, areaCode, year)!.value);
        const total = lookup(source.id, denominator!.id, areaCode, year)!.value;
        if (total === null || total <= 0 || values.some(value => value === null))
          throw Error(`構成図に欠測または0以下の分母があります: ${recipe.id}/${areaCode}/${year}`);
        const sum = values.reduce<number>((sum, value) => sum + value!, 0);
        if (values.some(value => value! < 0) || sum > total) throw Error('構成の部分が全体を超えるか負値です');
        return [...metrics.map((metric, i) => ({ id: metric.id, label: metric.label, value: values[i]! })),
          { ...recipe.remainder!, value: total - sum }].map(item => ({ analysisId: recipe.id, areaCode,
          areaName: areas.get(areaCode)!, year, seriesId: item.id, seriesLabel: item.label, value: item.value / total * 100, unit: '％' }));
      })));
    }
    if (recipe.method === 'balance') {
      if (!recipe.balances?.length || new Set(recipe.balances.map(balance => balance.id)).size !== recipe.balances.length)
        throw Error('増減の組が空または重複しています');
      return finish(selectedAreas.flatMap(areaCode => recipe.balances!.flatMap(balance => {
        if (![balance.positiveId, balance.negativeId].every(id => recipe.metricIds.includes(id))) throw Error('増減の入力が未収録です');
        return years.map(year => {
          const positive = lookup(source.id, balance.positiveId, areaCode, year)?.value ?? null;
          const negative = lookup(source.id, balance.negativeId, areaCode, year)?.value ?? null;
          return { analysisId: recipe.id, areaCode, areaName: areas.get(areaCode)!, year,
            seriesId: balance.id, seriesLabel: balance.label, value: positive === null || negative === null ? null : positive - negative, unit: metrics[0].unit,
            ...(positive === null || negative === null ? { missingReason: '入力値が欠測' } : {}) };
        });
      })));
    }
    return finish(selectedAreas.flatMap(areaCode => metrics.flatMap(metric => {
      const baseline = lookup(source.id, metric.id, areaCode, years[0])?.value ?? null;
      if (recipe.method === 'index' && (baseline === null || baseline <= 0)) throw Error('指数の基準年が欠測または0以下です');
      return years.map(year => {
        const value = lookup(source.id, metric.id, areaCode, year)?.value ?? null;
        const divisor = divides ? lookup(source.id, denominator!.id, areaCode, year)?.value ?? null : null;
        if (recipe.method === 'share' && value !== null && (value < 0 || (divisor !== null && divisor > 0 && value > divisor)))
          throw Error('部分が全体を超えています');
        const computed = value === null ? null : recipe.method === 'index' ? value / baseline! * 100
          : divides ? divisor === null || divisor <= 0 ? null : value / divisor * (recipe.method === 'share' ? 100 : recipe.scale!) : value;
        return { analysisId: recipe.id, areaCode, areaName: areas.get(areaCode)!, year, seriesId: metric.id,
          seriesLabel: metric.label, value: computed, unit: recipe.method === 'index' ? `${years[0]}年＝100`
            : recipe.method === 'share' ? '％' : recipe.method === 'ratio' ? recipe.unit! : metric.unit,
          ...(computed === null ? { missingReason: value === null || divisor === null ? '入力値が欠測' : '分母が0以下' } : {}) };
      });
    })));
  });
}

export function describeAnalysis(recipe: AnalysisRecipe, rows: AnalysisResult[], yearFormat: 'calendar' | 'fiscal' | 'plain' = 'calendar'): string {
  rows = rows.filter(row => row.analysisId === recipe.id);
  const yearSuffix = yearFormat === 'fiscal' ? '年度' : yearFormat === 'plain' ? '' : '年';
  const valid = rows.filter(row => row.value !== null);
  if (!valid.length) throw Error(`分析結果がありません: ${recipe.id}`);
  const format = (value: number) => value.toLocaleString('ja-JP', { maximumFractionDigits: 1 });
  if (recipe.method === 'composition') {
    const latest = Math.max(...rows.map(row => row.year));
    return rows.filter(row => row.year === latest).map(row => `${row.areaName}・${row.seriesLabel} ${format(row.value!)}％`).join('、') + `（${latest}${yearSuffix}）。`;
  }
  if (recipe.method === 'change') {
    const plus = valid.filter(row => row.value! > 0).length;
    const minus = valid.filter(row => row.value! < 0).length;
    return `${recipe.from}〜${recipe.to}${yearSuffix}の比較可能な${valid.length}自治体のうち、増加は${plus}、減少は${minus}です。`;
  }
  if (new Set(rows.map(row => row.year)).size === 1) {
    const sorted = [...valid].sort((a, b) => a.value! - b.value!);
    const first = sorted[0], last = sorted[sorted.length - 1];
    return `${first.year}${yearSuffix}の比較可能な${valid.length}地域で、${first.seriesLabel}は${format(first.value!)}〜${format(last.value!)}${first.unit}です。`;
  }
  const multipleAreas = new Set(rows.map(row => row.areaCode)).size > 1;
  return [...new Set(rows.map(row => `${row.areaCode}/${row.seriesId}`))].map(id => {
    const series = rows.filter(row => `${row.areaCode}/${row.seriesId}` === id).sort((a, b) => a.year - b.year);
    const first = series[0], last = series[series.length - 1];
    const label = multipleAreas ? `${first.areaName}・${first.seriesLabel}` : first.seriesLabel;
    if (first.value === null || last.value === null) return `${label}は端点に欠測があります。`;
    return `${label}：${format(first.value)} → ${format(last.value)}（${first.year}→${last.year}${yearSuffix}、${last.unit}）。`;
  }).join('');
}
