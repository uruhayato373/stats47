/**
 * Article ranking/map data → the shared image types' input (apps/admin/lib/template-ranking-data.ts).
 *
 * The types need all 47 prefectures with finite values. Data that cannot give that (ports, partial
 * surveys, duplicates) returns a reason instead, and the caller keeps the svg-builder chart.
 */
import { prefectureShortName } from '../../../../packages/area/src/utils/prefecture-short-name';
import { DEFAULT_SEQUENTIAL_SCHEME, colorSchemeTypeOf, normalizeColorScheme } from '../../../../packages/types/src/color-scheme';
import { assertMetricPresentation, type MetricPresentation } from '../../../../packages/types/src/metric-presentation';
import { chartValueLabels, type RankingChart, type RankingChartRow } from '../../../../apps/admin/lib/template-ranking-data';
import type { ScatterChart } from '../../../../apps/admin/lib/template-relationship-scatter';
import type { LineChart, LineSeries } from '../../../../apps/admin/lib/template-trend-line';
import type { StackedChart } from '../../../../apps/admin/lib/template-composition-stacked';
import type { GroupedBarChart } from '../../../../apps/admin/lib/template-grouped-bars';
import type { AreaChartInput, AreaScope } from '../../../../apps/admin/lib/template-area-scope';

export interface ArticleMetric {
  title?: string;
  subtitle?: string;
  unit?: string;
  visualization?: unknown;
  category?: string;
  display?: { conversionFactor?: number; decimalPlaces?: number };
}
type Row = { value?: unknown; areaCode?: unknown; area_code?: unknown; pref?: unknown; areaName?: unknown; label?: unknown; name?: unknown };

const MIGRATION_METRIC_KEY = 'population-migration-inter-prefecture';
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
  opts: { metric?: ArticleMetric; prefCodeOf: (name: string) => string; prefNameOf: (code: string) => string; allowBaseArea?: boolean }
): RankingChart | { skip: string } {
  const data = (Array.isArray(parsed) ? { data: parsed } : parsed) as Record<string, unknown>;
  const items = (Array.isArray(data?.data) ? data.data : []) as Row[];
  const observed = items.filter((it) => typeof it.value === 'number' && Number.isFinite(it.value));
  const coded = observed.map((it) => {
    const raw = String(it.areaCode ?? it.area_code ?? it.pref ?? it.areaName ?? it.label ?? it.name ?? '');
    const code = /^\d{1,5}$/.test(raw) ? raw.slice(0, 2).padStart(2, '0') : opts.prefCodeOf(raw);
    return { code, value: it.value as number };
  });
  // A prefecture's moves list its 46 partners: the missing prefecture is the base, not a gap in the data.
  const partnerOfBase = opts.allowBaseArea && coded.length === 46 && data.rankingKey === MIGRATION_METRIC_KEY;
  const baseCode = partnerOfBase ? Array.from({ length: 47 }, (_, i) => String(i + 1).padStart(2, '0')).find((c) => !coded.some((it) => it.code === c)) : undefined;
  if (baseCode) coded.push({ code: baseCode, value: 0 });
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
    baseAreaCode: baseCode ? `${baseCode}000` : undefined,
    // Large quantities read in 万・億・兆 (one unit per chart, from the unit canon). Otherwise the
    // metric's decimal places apply when the article's unit is the metric's own unit.
    ...chartValueLabels(text(data.unit), rows.map((r) => r.value),
      text(opts.metric?.unit) === text(data.unit) ? opts.metric?.display?.decimalPlaces : undefined),
  };
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const numberOr = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const TITLE_MAX_CHARS = 21;
const REDUNDANT_CONDITION = /\d{4}\s*[-–〜~]\s*\d{4}|\svs\s/;
const YEAR_ONLY = /^\d{4}年度?$/;
/** The survey's name without its table and edition: 「家計調査 家計収支編 …」→「家計調査」. */
const shortSurveyName = (name: string) => name.split(/[\s（(]/)[0];
const xOf = (p: Record<string, unknown>) => String(p.year ?? p.x ?? p.label ?? '');

/**
 * The short source an image shows: the article data's own, the survey the manifest names, or the metric's.
 * The manifest's `source` is an R2 path for most derived charts, which still names the metric.
 */
export function chartSourceName(data: unknown, manifest: Record<string, unknown>, metricSource: (key: string) => string | undefined) {
  const written = data && !Array.isArray(data) ? text((data as Record<string, unknown>).source) : '';
  if (written) return written;
  if (text(manifest.statsName)) return shortSurveyName(text(manifest.statsName));
  const key = text(manifest.rankingKey) || text(manifest.metricKey) || /^r2:app\/(?:ranking|stats)\/([^/]+)\//.exec(text(manifest.source))?.[1];
  return (key && metricSource(key)) || '';
}

/** A trailing （…） of a title reads as a condition: it moves to the line under the title. */
export function splitTitle(title: string) {
  const m = /^(.+?)[\s　]*[（(]([^（()）]+)[)）]$/.exec(title.trim());
  const named = m ? { title: m[1], condition: m[2] } : { title: title.trim(), condition: '' };
  // A title too long for one line keeps its first phrase: the rest repeats what the chart's labels show.
  const spaced = named.title.length > TITLE_MAX_CHARS ? /^(\S+)\s+.+$/.exec(named.title) : null;
  // Only a condition that changes what a number means stays (chart-image-copy.md): a period or a comparison
  // the chart already shows does not.
  const condition = named.condition.split(/[、,]/).map((part) => part.trim()).filter((part) => part && !REDUNDANT_CONDITION.test(part)).join('・');
  return { title: spaced ? spaced[1] : named.title, condition };
}
const decimalsIn = (values: number[]) => Math.min(2, Math.max(0, ...values.map((v) => (String(v).split('.')[1] ?? '').length)));

/** The series of an article's line json, in any of its written forms. */
function articleSeries(parsed: unknown): LineSeries[] | { skip: string } {
  const data = (Array.isArray(parsed) ? { data: parsed } : parsed) as Record<string, unknown>;
  if (data?.series != null && !Array.isArray(data.series)) return { skip: 'series が配列でない (取得結果の控え)' };
  const toPoints = (rows: Record<string, unknown>[]) => rows.map((p) => ({ x: xOf(p), value: numberOr(p.value ?? p.y) }));
  if (Array.isArray(data?.series))
    return (data.series as { label?: string; data?: Record<string, unknown>[] }[]).filter((s) => Array.isArray(s.data) && s.data.length)
      .map((s, i) => ({ label: s.label || `系列${i + 1}`, points: toPoints(s.data!) }));
  const rows = (Array.isArray(data?.data) ? data.data : []) as Record<string, unknown>[];
  // Long form: one row per area and year.
  const areas = [...new Set(rows.map((r) => text(r.areaName)).filter(Boolean))];
  if (areas.length > 1) return areas.map((label) => ({ label, points: toPoints(rows.filter((r) => r.areaName === label)) }));
  return rows.length ? [{ label: text(data.label) || '値', points: toPoints(rows) }] : [];
}

/**
 * Article municipal json → the area chart input. Rows join by area code and the set comes from the manifest's
 * areaScope: names in the data are for readers and are not matched against anything.
 */
export function areaChartFromArticleData(parsed: unknown, scope: AreaScope | undefined, opts: { metric?: ArticleMetric } = {}): AreaChartInput | { skip: string } {
  if (!scope) return { skip: 'source.json に areaScope が無い' };
  const data = (Array.isArray(parsed) ? { data: parsed } : parsed) as Record<string, unknown>;
  const items = (Array.isArray(data?.data) ? data.data : []) as { areaCode?: unknown; value?: unknown }[];
  if (!items.length || items.some((it) => !/^\d{5}$/.test(String(it.areaCode ?? '')))) return { skip: '地域コードの無い行がある' };
  const title = splitTitle((text(data.title) || text(data.label) || opts.metric?.title || '').replace(/ランキング$/, ''));
  if (!title.title) return { skip: '図の名前がデータに無い' };
  return {
    title: title.title, yearLabel: text(data.subtitle) || (/^\d{4}$/.test(text(data.year)) ? `${text(data.year)}年` : ''),
    unit: text(data.unit), source: text(data.source), note: title.condition || undefined,
    presentation: presentationOf(data, opts.metric),
    decimalPlaces: text(opts.metric?.unit) === text(data.unit) ? opts.metric?.display?.decimalPlaces : undefined,
    scope, values: items.map((it) => ({ areaCode: String(it.areaCode), value: numberOr(it.value) })),
  };
}

/** True when the x labels are not years: a cycle such as twelve months, which a line would read as a trend. */
export function hasCyclicAxis(parsed: unknown) {
  const series = articleSeries(parsed);
  if ('skip' in series) return false;
  return series.some((s) => s.points.some((p) => !/^\d{4}/.test(p.x)));
}

/** Article json with non-year categories → the grouped bars. */
export function groupedBarChartFromArticleData(parsed: unknown): GroupedBarChart | { skip: string } {
  const line = lineChartFromArticleData(parsed);
  if ('skip' in line) return line;
  const groups = [...new Set(line.series.flatMap((s) => s.points.map((p) => p.x)))];
  return {
    title: line.title, meta: line.meta, note: line.note, source: line.source, groups,
    series: line.series.map((s) => ({ label: s.label, values: groups.map((g) => s.points.find((p) => p.x === g)?.value ?? null) })),
  };
}

/** Article line json → the line type. Too many lines to tell apart stay a reason to fix the data. */
export function lineChartFromArticleData(parsed: unknown, opts: { maxSeries?: number } = {}): LineChart | { skip: string } {
  const data = (Array.isArray(parsed) ? {} : parsed) as Record<string, unknown>;
  const series = articleSeries(parsed);
  if ('skip' in series) return series;
  if (!series.length) return { skip: '系列が無い' };
  if (series.length > (opts.maxSeries ?? 8)) return { skip: `系列が多すぎる (${series.length})` };
  const named = splitTitle(text(data.title) || '推移');
  const xs = [...new Set(series.flatMap((s) => s.points.map((p) => p.x)))];
  const years = xs.map((x) => /^\d{4}/.exec(x)?.[0]).filter(Boolean).map(Number);
  const period = years.length === xs.length && years.length ? `${Math.min(...years)}–${Math.max(...years)}年` : '';
  const unit = text(data.unit);
  const values = series.flatMap((s) => s.points.flatMap((p) => (p.value === null ? [] : [p.value])));
  return {
    title: named.title,
    meta: [period, unit && `単位：${unit}`].filter(Boolean).join(' · ') || text(data.subtitle),
    note: named.condition || undefined,
    source: text(data.source),
    series, decimals: decimalsIn(values),
  };
}

const QUOTED_SOURCE = /[^・·\s]*「[^」]+」/;

/** Article stacked json (series with one value per bar, or one wide row per bar) → the stacked type. */
export function stackedChartFromArticleData(parsed: unknown): StackedChart | { skip: string } {
  const data = (Array.isArray(parsed) ? { data: parsed } : parsed) as Record<string, unknown>;
  let groups: string[], categories: StackedChart['categories'];
  if (Array.isArray(data.series)) {
    const series = (data.series as { label?: string; data?: Record<string, unknown>[] }[]).filter((s) => Array.isArray(s.data) && s.data.length);
    groups = [...new Set(series.flatMap((s) => s.data!.map(xOf)))];
    categories = series.map((s, i) => ({ label: s.label || `区分${i + 1}`, values: groups.map((g) => numberOr(s.data!.find((p) => xOf(p) === g)?.value)) }));
  } else {
    const rows = (Array.isArray(data.data) ? data.data : Array.isArray(data.rows) ? data.rows : []) as Record<string, unknown>[];
    const name = (r: Record<string, unknown>) => text(r.areaName) || text(r.label) || text(r.name);
    groups = rows.map(name);
    const keys = [...new Set(rows.flatMap((r) => Object.keys(r).filter((k) => typeof r[k] === 'number')))];
    categories = keys.map((label) => ({ label, values: rows.map((r) => numberOr(r[label])) }));
  }
  if (!groups.length || !categories.length) return { skip: '区分か棒が無い' };
  const named = splitTitle(text(data.title) || text(data.label) || '内訳');
  const unit = text(data.unit);
  const year = YEAR_ONLY.test(named.condition) ? named.condition : text(data.year) ? `${text(data.year)}年` : '';
  const values = categories.flatMap((c) => c.values.flatMap((v) => (v === null ? [] : [v])));
  return {
    title: named.title,
    meta: [year, unit && `単位：${unit}`].filter(Boolean).join(' · '),
    note: YEAR_ONLY.test(named.condition) ? undefined : named.condition || undefined,
    source: text(data.source) || (QUOTED_SOURCE.exec(text(data.subtitle))?.[0] ?? ''),
    groups, categories, normalized: data.normalized === true, unit, decimals: decimalsIn(values),
  };
}

type ScatterMetric = ArticleMetric & { source?: { displayName?: string } };
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

/** One scatter axis as source.json keeps it (config/schema/blog.chart-source.schema.json). */
export interface ChartAxisRecord {
  metricKey?: string;
  year: string;
  /** Stored value ÷ scale = the article's value; left out when 1. */
  scale?: number;
  /** values: every point matched the metric. manifest: a calculated axis, read from source.json and the label. */
  proof: 'values' | 'manifest';
}

/** The scale between the stored values and the article's (万人 from 人, 億円 from 百万円), as a scatter axis may be written. */
const AXIS_SCALES = [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e8, 0.1, 0.01, 0.001];

/** Which year and scale of a metric give the points exactly, or null. The match is the proof the axis is this metric. */
export function matchScatterAxis(values: number[], codes: string[], rows: ValuesRow[]) {
  for (const scale of AXIS_SCALES) {
    const year = matchScatterYear(values, codes, rows.map((r) => ({ ...r, value: r.value === null ? null : r.value / scale })));
    if (year) return { year, scale };
  }
  return null;
}

/** Metric keys a source manifest mentions, whichever of its many shapes it uses. */
export function metricKeysInSource(source: unknown, isMetric: (key: string) => boolean) {
  return [...new Set(JSON.stringify(source ?? {}).match(/[a-z0-9]+(?:-[a-z0-9]+)*/g) ?? [])].filter(isMetric);
}

/** The year a manifest or the axis label records for one axis, for axes no metric can prove (calculated ones). */
export function sourceAxisYear(source: Record<string, unknown>, axis: 'x' | 'y', label: string) {
  const named = /(\d{4})年度?/.exec(label)?.[0];
  if (named) return named;
  const shaped = (v: unknown) => (v as { year?: unknown } | undefined)?.year;
  const direct = source[`${axis}Year`] ?? shaped(source[axis]) ?? shaped(source[`${axis}Metric`]);
  if (/^\d{4}$/.test(String(direct))) return `${direct}年`;
  const year = String(source.year ?? '');
  const tagged = new RegExp(`${axis}:(\\d{4})`).exec(year)?.[1];
  if (tagged) return `${tagged}年`;
  const pair = /^(\d{4})\/(\d{4})$/.exec(year);
  if (pair) return `${axis === 'x' ? pair[1] : pair[2]}年`;
  if (/^\d{4}$/.test(year)) return `${year}年`;
  const list = (Array.isArray(source.inputs) ? source.inputs : Array.isArray(source.sources) ? source.sources : []) as { axis?: unknown; year?: unknown }[];
  const input = list.find((i) => i.axis === axis) ?? list[axis === 'x' ? 0 : 1];
  if (/^\d{4}$/.test(String(input?.year))) return `${input!.year}年`;
  const { fetchedAt: _f, generatedAt: _g, ...rest } = source;
  // e-Stat time codes read 2021000000.
  const years = new Set((JSON.stringify(rest).match(/(?<!\d)(?:19|20)\d{2}(?:000000)?(?!\d)/g) ?? []).map((y) => y.slice(0, 4)));
  if (years.size === 1) return `${[...years][0]}年`;
  // Non-statistical sources (place names) have no survey year, only when they were taken.
  const fetched = /^\d{4}/.exec(String(source.fetchedAt ?? ''))?.[0];
  return fetched && Array.isArray(source.displaySources) ? `${fetched}年取得` : null;
}

/** Survey names a manifest records directly, for charts whose axes are no metric. */
export function sourceNamesOf(source: Record<string, unknown>) {
  const items = (v: unknown) => (Array.isArray(v) ? v : []) as { label?: unknown; sourceName?: unknown }[];
  const named = [...items(source.displaySources).map((d) => d.label), source.sourceName, ...items(source.inputs).map((i) => i.sourceName)];
  const free = typeof source.source === 'string' && !source.source.startsWith('r2:') ? source.source.split(/\s+https?:/)[0] : '';
  return [...new Set([...named, free].filter((v): v is string => typeof v === 'string' && v.trim() !== ''))];
}

// Most metrics carry the default blue, which says nothing. A scatter takes its subject's colour instead.
const SCATTER_CATEGORY_SCHEME: Readonly<Record<string, string>> = {
  laborwage: 'interpolateOranges', commercial: 'interpolateOranges', construction: 'interpolateOranges',
  economy: 'interpolatePurples', administrativefinancial: 'interpolatePurples', miningindustry: 'interpolatePurples',
  socialsecurity: 'interpolateRdPu', safetyenvironment: 'interpolateReds',
  tourism: 'interpolateGreens', international: 'interpolateGreens', educationsports: 'interpolateGreens',
};

/**
 * Prefectures the text around a chart names, in reading order: the H2 section holding `data/<chartBase>.svg`.
 * Longest name first and consumed left to right, so 東京都 never also reads as 京都.
 */
export function prefecturesNamedNear(markdown: string, chartBase: string, names: string[]) {
  const sections = markdown.split(/^(?=## )/m);
  const section = sections.find((s) => s.includes(`data/${chartBase}.svg`));
  if (!section) return [];
  const byShort = new Map(names.map((name) => [prefectureShortName(name), name]));
  const pattern = new RegExp([...byShort.keys()].sort((a, b) => b.length - a.length).join('|'), 'g');
  // Links and cards point at other pages; their names are not what the text is saying about this chart.
  const prose = section.replace(/!?\[[^\]]*\]\([^)]*\)/g, '').replace(/<source-link[^>]*>.*?<\/source-link>/g, '');
  return [...new Set([...prose.matchAll(pattern)].map((m) => byShort.get(m[0])!))];
}

/** `asWritten`: the values are not the metric's own unit (scaled or calculated), so the axis keeps the article's unit and numbers. */
type ScatterAxisInput = { metric?: ScatterMetric; year: string | null; asWritten?: boolean };

/** Article scatter data + its source manifest → the shared scatter type's input, or why not. */
export function scatterChartFromArticleData(
  parsed: unknown,
  opts: {
    x: ScatterAxisInput; y: ScatterAxisInput;
    prefCodeOf: (name: string) => string; unitLabel: (unit: string) => string;
    /** Names to draw for the points, when the article's are short (富山 → 富山県). */
    prefNameOf?: (code: string) => string;
    /** Prefectures the source leaves out on purpose. */
    excludedCount?: number;
    /** Survey names and a colour source for axes that are no metric. */
    sourceNames?: string[];
    colorMetric?: ScatterMetric;
    /** Prefectures named in the chart's section; labelled after the data's own `labelPoints`. */
    bodyNames?: string[];
  }
): ScatterChart | { skip: string } {
  const data = (parsed ?? {}) as Record<string, unknown>;
  const raw = (Array.isArray(data.points) ? data.points : []) as { x?: unknown; y?: unknown; label?: unknown; code?: unknown }[];
  const points = raw.filter((p) => typeof p.x === 'number' && typeof p.y === 'number').map((p) => {
    const label = String(p.label ?? '');
    const code = `${String(p.code ?? opts.prefCodeOf(label)).slice(0, 2)}000`;
    return { code, name: opts.prefNameOf?.(code) ?? label, x: p.x as number, y: p.y as number };
  });
  const expected = 47 - (opts.excludedCount ?? 0);
  if (points.length !== expected || new Set(points.map((p) => p.code)).size !== expected || points.some((p) => !/^(0[1-9]|[1-3]\d|4[0-7])000$/.test(p.code)))
    return { skip: `${expected}都道府県がそろっていない (有効点 ${points.length} 件)` };
  if (!opts.x.year || !opts.y.year) return { skip: '観測値と一致する年が決まらない' };
  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  // The metric's title is the name; article labels may carry units, years or arrows that the axis already shows.
  const nameOf = (m: ScatterMetric | undefined, label: string) => (text(m?.title) || label).replace(/[（(][^）)]*[）)]|→/g, '').trim();
  const xRaw = text(data.xLabel), yRaw = text(data.yLabel);
  // One metric against itself (two years): only the article's labels tell the axes apart.
  const sameMetric = nameOf(opts.x.metric, xRaw) === nameOf(opts.y.metric, yRaw);
  const asLabelled = (label: string) => label.replace(/\[[^\]]*\]|→/g, '').trim();
  const xName = sameMetric ? asLabelled(xRaw) : nameOf(opts.x.metric, xRaw);
  const yName = sameMetric ? asLabelled(yRaw) : nameOf(opts.y.metric, yRaw);
  if (!xName || !yName) return { skip: '軸の指標名が無い' };
  // Only what changes the reading of the number: the denominator, the capital-city scope, a school grade or sex.
  const basis = (m: ScatterMetric | undefined, label: string) => {
    const subtitle = text(m?.subtitle);
    if (subtitle.includes('県庁所在市')) return '県庁所在市';
    // Inside the label's brackets only: 一人当たり in the metric's own name is not a separate basis.
    const per = /[^（(・、\s]*(?:当たり|あたり|に占める)/.exec(`${subtitle} ${label.replace(/^[^（(]*/, '')}`)?.[0];
    if (per) return per;
    return /(?:小学|中学|高校)\d年|男子|女子/.test(subtitle) && subtitle.length <= 10 ? subtitle : '';
  };
  // The unit an article writes first inside the axis label's brackets, when the data has no unit field.
  const labelUnit = (label: string) => {
    const unit = /[（(]([^）)・、,]+)/.exec(label)?.[1].trim() ?? '';
    return unit.length <= 8 && !/\d{4}|当たり|あたり|に占める/.test(unit) ? unit : '';
  };
  // Large quantities read in 万・億 on the axis too (one display unit per axis, from the unit canon).
  const axis = (name: string, unit: string, values: number[], scope: string, asWritten?: boolean) => {
    if (asWritten) {
      const detail = [unit && opts.unitLabel(unit), scope].filter(Boolean).join('・');
      return { label: detail && !name.includes(detail) ? `${name}（${detail}）` : name, format: undefined };
    }
    const scaled = chartValueLabels(unit, values);
    const detail = [scaled.unit && opts.unitLabel(scaled.unit), scope].filter(Boolean).join('・');
    return {
      label: detail ? `${name}（${detail}）` : name,
      format: scaled.display?.conversionFactor ? (v: number) => scaled.formatValue(v).replace(/\.0+$/, '') : undefined,
    };
  };
  const xAxis = axis(xName, text(data.xUnit).split('・')[0] || (opts.x.asWritten ? labelUnit(xRaw) : text(opts.x.metric?.unit)), points.map((p) => p.x), basis(opts.x.metric, xRaw), opts.x.asWritten);
  const yAxis = axis(yName, text(data.yUnit).split('・')[0] || (opts.y.asWritten ? labelUnit(yRaw) : text(opts.y.metric?.unit)), points.map((p) => p.y), basis(opts.y.metric, yRaw), opts.y.asWritten);
  const metricSources = [opts.x.metric?.source?.displayName, opts.y.metric?.source?.displayName].map(text).filter(Boolean);
  const sources = [...new Set(metricSources.length ? metricSources : opts.sourceNames ?? [])];
  if (!sources.length) return { skip: '出典が無い' };
  const colorMetric = opts.y.metric ?? opts.x.metric ?? opts.colorMetric;
  const presentation = presentationOf(data, colorMetric);
  const subject = presentation.colorScheme === DEFAULT_SEQUENTIAL_SCHEME ? SCATTER_CATEGORY_SCHEME[text(colorMetric?.category)] : undefined;
  return {
    title: sameMetric && text(data.title) ? text(data.title).replace(/\s*[×x]\s*/, 'と') : `${xName}と${yName}`,
    meta: opts.x.year === opts.y.year ? opts.x.year : `横軸 ${opts.x.year}・縦軸 ${opts.y.year}`,
    source: sources.join('・'),
    presentation: subject ? ({ ...presentation, colorScheme: subject } as MetricPresentation) : presentation,
    excludedCount: opts.excludedCount,
    xLabel: xAxis.label, yLabel: yAxis.label, formatX: xAxis.format, formatY: yAxis.format,
    points,
    labelNames: [...(Array.isArray(data.labelPoints) ? (data.labelPoints as unknown[]).map(String).map((n) => opts.prefNameOf?.(opts.prefCodeOf(n)) ?? n) : []), ...(opts.bodyNames ?? [])],
  };
}
