/**
 * Article ranking/map data → the shared image types' input (apps/admin/lib/template-ranking-data.ts).
 *
 * The types need all 47 prefectures with finite values. Data that cannot give that (ports, partial
 * surveys, duplicates) returns a reason instead, and the caller keeps the svg-builder chart.
 */
import { DEFAULT_SEQUENTIAL_SCHEME, colorSchemeTypeOf, normalizeColorScheme } from '../../../../packages/types/src/color-scheme';
import { assertMetricPresentation, type MetricPresentation } from '../../../../packages/types/src/metric-presentation';
import { chartValueLabels, type RankingChart, type RankingChartRow } from '../../../../apps/admin/lib/template-ranking-data';

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
