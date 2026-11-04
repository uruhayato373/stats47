/**
 * Article ranking/map data → the shared image types' input (apps/admin/lib/template-ranking-data.ts).
 *
 * The types need all 47 prefectures with finite values. Data that cannot give that (ports, partial
 * surveys, duplicates) returns a reason instead, and the caller keeps the svg-builder chart.
 */
import { DEFAULT_SEQUENTIAL_SCHEME, colorSchemeTypeOf, normalizeColorScheme } from '../../../../packages/types/src/color-scheme';
import { assertMetricPresentation, type MetricPresentation } from '../../../../packages/types/src/metric-presentation';
import { chartValueLabels, type RankingChart, type RankingChartRow } from '../../../../apps/admin/lib/template-ranking-data';
import type { ScatterChart } from '../../../../apps/admin/lib/template-relationship-scatter';

export interface ArticleMetric {
  title?: string;
  subtitle?: string;
  unit?: string;
  visualization?: unknown;
  display?: { conversionFactor?: number; decimalPlaces?: number };
}
type Row = { value?: unknown; areaCode?: unknown; area_code?: unknown; pref?: unknown; areaName?: unknown; label?: unknown; name?: unknown };

const SEQUENTIAL_DEFAULTS = {
  domain: { mode: 'extent' }, classification: { method: 'continuous' },
  trendDomain: { mode: 'extent' }, comparisonDomain: { mode: 'extent' },
} as const;

/**
 * The colour policy: an author's `scheme`/`colorScheme` in the data json wins (as with the earlier
 * blog charts), then the metric's authored presentation, then the default sequential blue.
 */
function presentationOf(data: Record<string, unknown>, metric?: ArticleMetric): MetricPresentation {
  const authored = normalizeColorScheme((data.scheme ?? data.colorScheme) as string | undefined);
  let base: MetricPresentation | undefined;
  try {
    if (metric?.visualization) {
      assertMetricPresentation(metric.visualization);
      base = metric.visualization;
    }
  } catch {
    base = undefined;
  }
  if (base && !authored) return base;
  const scheme = authored ?? DEFAULT_SEQUENTIAL_SCHEME;
  const diverging = colorSchemeTypeOf(scheme) === 'diverging';
  return {
    ...(base ?? SEQUENTIAL_DEFAULTS),
    colorScheme: scheme,
    colorSchemeType: diverging ? 'diverging' : 'sequential',
  } as MetricPresentation;
}

export function rankingChartFromArticleData(
  parsed: unknown,
  opts: { metric?: ArticleMetric; prefCodeOf: (name: string) => string; prefNameOf: (code: string) => string }
): RankingChart | { skip: string } {
  const data = (Array.isArray(parsed) ? { data: parsed } : parsed) as Record<string, unknown>;
  const items = (Array.isArray(data?.data) ? data.data : []) as Row[];
  const observed = items.filter((it) => typeof it.value === 'number' && Number.isFinite(it.value));
  const coded = observed.map((it) => {
    const raw = String(it.areaCode ?? it.area_code ?? it.pref ?? it.areaName ?? it.label ?? it.name ?? '');
    const code = /^\d{1,5}$/.test(raw) ? raw.slice(0, 2).padStart(2, '0') : opts.prefCodeOf(raw);
    return { code, value: it.value as number };
  });
  const codes = new Set(coded.map((it) => it.code));
  if (coded.length !== 47 || codes.size !== 47 || coded.some((it) => !/^\d{2}$/.test(it.code) || Number(it.code) < 1 || Number(it.code) > 47))
    return { skip: `47都道府県がそろっていない (有効値 ${coded.length} 件・県 ${codes.size} 件)` };
  // Ranks from values, ties share a rank (same rule as the ranking page and the earlier cards).
  const sorted = [...coded].sort((a, b) => b.value - a.value);
  const rows: RankingChartRow[] = sorted.map((it) => ({
    rank: sorted.findIndex((other) => other.value === it.value) + 1,
    area_code: `${it.code}000`,
    area_name: opts.prefNameOf(it.code),
    value: it.value,
  }));
  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const title = (text(data.title) || text(data.label) || opts.metric?.title || '').replace(/ランキング$/, '');
  // The subtitle carries the label as shown (「2022年度」); otherwise the year is a calendar year.
  const subtitleYear = /^\d{4}年度?$/.exec(text(data.subtitle))?.[0];
  const yearLabel = subtitleYear ?? (/^\d{4}$/.test(text(data.year)) ? `${text(data.year)}年` : '');
  if (!title || !yearLabel) return { skip: '指標名か年がデータに無い' };
  return {
    title,
    yearLabel,
    source: text(data.source),
    note: text(opts.metric?.subtitle) || undefined,
    presentation: presentationOf(data, opts.metric),
    rows,
    // Large quantities read in 万・億・兆 (one unit per chart, from the unit canon). Otherwise the
    // metric's decimal places apply when the article's unit is the metric's own unit.
    ...chartValueLabels(text(data.unit), rows.map((r) => r.value),
      text(opts.metric?.unit) === text(data.unit) ? opts.metric?.display?.decimalPlaces : undefined),
  };
}

type ScatterMetric = { title?: string; subtitle?: string; unit?: string; source?: { displayName?: string } };
type ValuesRow = { areaCode: string; yearCode: string; yearName?: string; value: number | null };

const decimalsOf = (v: number) => (String(v).split('.')[1] ?? '').length;
const roundTo = (v: number, d: number) => Number(v.toFixed(d));

/**
 * The year whose 47 observed values give exactly the article's points (each rounded as the point is
 * written). The article data carries no year, so this both finds it and proves the points came from
 * the metric. Null when no year matches (converted or hand-edited values keep the earlier chart).
 */
export function matchScatterYear(values: number[], codes: string[], rows: ValuesRow[]): string | null {
  const byYear = new Map<string, Map<string, number>>();
  const names = new Map<string, string>();
  for (const r of rows) {
    if (r.value === null || !Number.isFinite(r.value)) continue;
    if (!byYear.has(r.yearCode)) byYear.set(r.yearCode, new Map());
    byYear.get(r.yearCode)!.set(r.areaCode, r.value);
    names.set(r.yearCode, r.yearName || `${r.yearCode}年`);
  }
  const hits = [...byYear].filter(([, area]) => codes.every((code, i) => {
    const v = area.get(code);
    return v !== undefined && roundTo(v, decimalsOf(values[i])) === values[i];
  }));
  // Two years with identical values cannot tell which one the article used.
  return hits.length === 1 ? names.get(hits[0][0])! : null;
}

/** Article scatter data + its source manifest → the shared scatter type's input, or why not. */
export function scatterChartFromArticleData(
  parsed: unknown,
  opts: {
    x: { metric?: ScatterMetric; year: string | null }; y: { metric?: ScatterMetric; year: string | null };
    prefCodeOf: (name: string) => string; unitLabel: (unit: string) => string;
  }
): ScatterChart | { skip: string } {
  const data = (parsed ?? {}) as Record<string, unknown>;
  const raw = (Array.isArray(data.points) ? data.points : []) as { x?: unknown; y?: unknown; label?: unknown; code?: unknown }[];
  const points = raw.filter((p) => typeof p.x === 'number' && typeof p.y === 'number').map((p) => {
    const name = String(p.label ?? '');
    return { code: `${String(p.code ?? opts.prefCodeOf(name)).slice(0, 2)}000`, name, x: p.x as number, y: p.y as number };
  });
  if (points.length !== 47 || new Set(points.map((p) => p.code)).size !== 47 || points.some((p) => !/^(0[1-9]|[1-3]\d|4[0-7])000$/.test(p.code)))
    return { skip: `47都道府県がそろっていない (有効点 ${points.length} 件)` };
  if (!opts.x.year || !opts.y.year) return { skip: '観測値と一致する年が決まらない' };
  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const xName = text(data.xLabel) || text(opts.x.metric?.title), yName = text(data.yLabel) || text(opts.y.metric?.title);
  if (!xName || !yName) return { skip: '軸の指標名が無い' };
  // Large quantities read in 万・億 on the axis too (one display unit per axis, from the unit canon).
  const axis = (name: string, unit: string, values: number[]) => {
    const scaled = chartValueLabels(unit, values);
    return {
      label: scaled.unit ? `${name}（${opts.unitLabel(scaled.unit)}）` : name,
      format: scaled.display?.conversionFactor ? (v: number) => scaled.formatValue(v).replace(/\.0+$/, '') : undefined,
    };
  };
  const xAxis = axis(xName, text(data.xUnit) || text(opts.x.metric?.unit), points.map((p) => p.x));
  const yAxis = axis(yName, text(data.yUnit) || text(opts.y.metric?.unit), points.map((p) => p.y));
  // A per-capita or capital-city basis changes the reading; a subtitle that only states a year does not.
  const basis = (m?: ScatterMetric) => (/^\d{4}年/.test(text(m?.subtitle)) ? '' : text(m?.subtitle));
  const note = [basis(opts.x.metric) && `横軸：${basis(opts.x.metric)}`, basis(opts.y.metric) && `縦軸：${basis(opts.y.metric)}`]
    .filter(Boolean).join('・');
  const sources = [...new Set([opts.x.metric?.source?.displayName, opts.y.metric?.source?.displayName].map(text).filter(Boolean))];
  return {
    title: `${xName}と${yName}`,
    meta: opts.x.year === opts.y.year ? opts.x.year : `横軸 ${opts.x.year}・縦軸 ${opts.y.year}`,
    note: note || undefined,
    source: sources.join('・'),
    xLabel: xAxis.label, yLabel: yAxis.label, formatX: xAxis.format, formatY: yAxis.format,
    points,
    labelNames: Array.isArray(data.labelPoints) ? (data.labelPoints as unknown[]).map(String) : undefined,
  };
}
