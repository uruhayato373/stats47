import { assertAnalysisFigureShape, type AnalysisResult, type AnalysisRevision } from './compute';

interface LineFigureInput {
  title: string; meta: string; source: string; decimals: number;
  series: { label: string; points: { x: string; value: number | null }[] }[];
}
interface BarFigureInput {
  metricKey: string; grain: 'prefecture' | 'municipality'; title: string;
  yearLabel: string; unit: string; note?: string; source: string;
  rows: { name: string; value: number }[];
}
interface MunicipalityMapInput extends Omit<BarFigureInput, 'rows'> {
  scope: { level: 'municipality'; wardMode: 'merged'; within: NonNullable<AnalysisRevision['recipes'][number]['within']> };
  values: { areaCode: string; value: number | null }[];
}
export type AnalysisFigure =
  | { file: string; template: 'line'; input: LineFigureInput }
  | { file: string; template: 'bar'; input: BarFigureInput }
  | { file: string; template: 'choropleth'; input: { area: MunicipalityMapInput } };
export interface AnalysisShowcase {
  kind: 'chart'; heading: string; lead: string; note?: string; figures: { file: string; alt: string }[];
}
type FigureRevision = Omit<AnalysisRevision, 'sources'> & {
  sources: (AnalysisRevision['sources'][number] & { inputs?: readonly { yearFormat: 'calendar' | 'fiscal' | 'plain' }[] })[];
};

/** 納品CSVと同じ分析結果を、登録済みの画像型と媒体共通の説明へ変換する。 */
export function buildAnalysisFigures(plan: FigureRevision, results: AnalysisResult[]): {
  figures: AnalysisFigure[]; showcase: AnalysisShowcase[];
} {
  if (new Set(plan.recipes.map(recipe => recipe.id)).size !== plan.recipes.length ||
      results.some(row => !plan.recipes.some(recipe => recipe.id === row.analysisId)))
    throw Error('分析結果と台帳のIDが一致しません');
  const figures: AnalysisFigure[] = [];
  const showcase: AnalysisShowcase[] = plan.recipes.map(recipe => {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(recipe.id)) throw Error('画像の分析IDが不正です');
    const rows = results.filter(row => row.analysisId === recipe.id);
    const source = plan.sources.find(item => item.id === recipe.sourceId);
    if (!source) throw Error(`分析の取得元がありません: ${recipe.id}`);
    assertAnalysisFigureShape(recipe, rows);
    if (!rows.some(row => row.value !== null)) throw Error(`分析結果がありません: ${recipe.id}`);
    const file = `${recipe.id}.png`;
    const title = recipe.chartTitle ?? recipe.heading;
    const years = [...new Set(rows.map(row => row.year))].sort((a, b) => a - b);
    const yearFormats = new Set(source.inputs?.map(input => input.yearFormat));
    if (yearFormats.size > 1) throw Error('図の暦年・年度が混在しています');
    const yearFormat = source.inputs?.[0]?.yearFormat ?? 'calendar';
    const suffix = yearFormat === 'fiscal' ? '年度' : yearFormat === 'plain' ? '' : '年';
    const period = recipe.method === 'change' ? `${recipe.from}〜${recipe.to}${suffix}`
      : years.length === 1 ? `${years[0]}${suffix}` : `${years[0]}〜${years[years.length - 1]}${suffix}`;
    const areas = [...new Set(rows.map(row => row.areaCode))];
    const scope = recipe.scopeLabel ?? (areas.length === 1 ? rows[0].areaName : `${areas.length}地域`);
    if (recipe.template === 'choropleth') {
      if (source.grain !== 'municipality') throw Error('市区町村地図の取得元の地域単位が一致しません');
      figures.push({ file, template: 'choropleth', input: { area: {
        metricKey: recipe.presentationMetricKey!, grain: source.grain, title, yearLabel: period,
        unit: rows[0].unit, note: recipe.scopeLabel, source: source.label,
        scope: { level: 'municipality', wardMode: 'merged', within: recipe.within! },
        values: rows.map(row => ({ areaCode: row.areaCode, value: row.value })),
      } } });
    } else if (recipe.template === 'bar') {
      figures.push({ file, template: 'bar', input: {
        metricKey: recipe.presentationMetricKey!, grain: source.grain, title, yearLabel: period,
        unit: rows[0].unit, note: recipe.scopeLabel, source: source.label,
        rows: rows.filter(row => row.value !== null).map(row => ({ name: row.areaName, value: row.value! })),
      } });
    } else {
      const seriesIds = [...new Set(rows.map(row => `${row.areaCode}/${row.seriesId}`))];
      figures.push({ file, template: 'line', input: {
        title, meta: `${scope}・${period}・${rows[0].unit}`, source: source.label,
        decimals: recipe.method === 'balance' ? 0 : 1,
        series: seriesIds.map(id => {
          const series = rows.filter(row => `${row.areaCode}/${row.seriesId}` === id).sort((a, b) => a.year - b.year);
          return { label: areas.length === 1 ? series[0].seriesLabel : `${series[0].areaName}・${series[0].seriesLabel}`,
            points: series.map(row => ({ x: String(row.year), value: row.value })) };
        }),
      } });
    }
    return { kind: 'chart', heading: recipe.heading, lead: recipe.lead, note: recipe.limitation,
      figures: [{ file, alt: `${title}（${recipe.template === 'bar' ? period : `${scope}・${period}`}）` }] };
  });
  return { figures, showcase };
}
