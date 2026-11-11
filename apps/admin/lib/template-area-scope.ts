import prefectures from '../../../data/areas/master/prefectures.json';
import { buildMunicipalityEntityPolicy, resolveWardModeAreas, type WardMode } from '../../../packages/area/src/municipalities';
import type { MetricPresentation } from '../../../packages/types/src/metric-presentation';
import { chartValueLabels, type RankingChart } from './template-ranking-data';

/**
 * Which areas a chart compares. Grain and range are separate axes, and every value, rank and shape follows
 * from them: 政令指定都市 are one area or their wards (WardMode), compared across the nation or one prefecture.
 */
export type AreaScope =
  | { level: 'prefecture' }
  | { level: 'municipality'; wardMode: WardMode; within: { kind: 'nation' } }
  | { level: 'municipality'; wardMode: WardMode; within: { kind: 'prefecture'; prefCode: string } };

/** One observation as R2 stores it. Names and ranks are not inputs: names come from the area master, ranks from the set. */
export interface AreaValue { areaCode: string; value: number | null }

export interface AreaChartInput {
  title: string;
  yearLabel: string;
  unit: string;
  source: string;
  note?: string;
  presentation: MetricPresentation;
  decimalPlaces?: number;
  scope: AreaScope;
  values: AreaValue[];
}

export interface AreaChart extends RankingChart {
  scope: AreaScope;
  /** Areas of the set with no value. They stay blank on a map and out of the ranks. */
  missing: string[];
}

const PREFECTURE_COUNT = 47;
const policy = (() => {
  let built: ReturnType<typeof buildMunicipalityEntityPolicy> | undefined;
  return () => (built ??= buildMunicipalityEntityPolicy());
})();
const allCodes = (() => {
  let built: Set<string> | undefined;
  return () => (built ??= new Set([...policy().entities.map((entity) => entity.code), ...prefectures.map((p) => p.prefCode)]));
})();

/** Master name 「神奈川県 横浜市 鶴見区」: the prefecture is the frame's. */
const municipalityLabel = (name: string) => name.split(' ').slice(1).join('');

/** The areas a scope compares, code → the name shown. The set is the only place a scope is interpreted. */
export function areasOf(scope: AreaScope): Map<string, string> {
  if (scope.level === 'prefecture') return new Map(prefectures.map((p) => [p.prefCode, p.prefName]));
  const { codes } = resolveWardModeAreas(policy(), scope.wardMode);
  const { within } = scope;
  if (within.kind === 'prefecture' && !prefectures.some((p) => p.prefCode === `${within.prefCode}000`))
    throw Error(`都道府県コードが実在しない: ${within.prefCode}`);
  const areas = new Map<string, string>();
  for (const entity of policy().entities) {
    if (!codes.has(entity.code)) continue;
    if (within.kind === 'prefecture' && !entity.code.startsWith(within.prefCode)) continue;
    areas.set(entity.code, municipalityLabel(entity.name));
  }
  return areas;
}

/** Marks an image with its scope, so a check can refuse a municipal image that does not say which set it counted. */
export function scopeAttributes(scope: AreaScope) {
  if (scope.level === 'prefecture') return 'data-scope="prefecture"';
  const { within } = scope;
  const range = within.kind === 'nation' ? 'nation' : `prefecture:${within.prefCode}`;
  return `data-scope="municipality" data-ward-mode="${scope.wardMode}" data-within="${range}"`;
}

/**
 * The chart a scope gives: the file holds every area, the scope picks the set, and ranks are counted inside
 * that set. A ward's rank never mixes with the cities', and a metric without ward values cannot be split.
 */
export function resolveAreaChart(input: AreaChartInput): AreaChart {
  const areas = areasOf(input.scope);
  const unknown = input.values.filter((row) => !allCodes().has(row.areaCode)).map((row) => row.areaCode);
  if (unknown.length) throw Error(`地域マスタに無いコード: ${[...new Set(unknown)].slice(0, 5).join(' ')}`);
  const seen = new Set<string>();
  const observed = input.values.filter((row): row is { areaCode: string; value: number } => {
    if (!areas.has(row.areaCode) || row.value === null || !Number.isFinite(row.value)) return false;
    if (seen.has(row.areaCode)) throw Error(`同じ地域の値が 2 つある: ${row.areaCode}`);
    seen.add(row.areaCode);
    return true;
  });
  if (!observed.length) throw Error('この範囲に値がありません。');
  if (input.scope.level === 'prefecture' && observed.length !== PREFECTURE_COUNT)
    throw Error(`47都道府県の値がそろっていません (${observed.length})。`);
  if (input.scope.level === 'municipality' && input.scope.wardMode === 'split') {
    const wards = observed.filter((row) => resolveWardModeAreas(policy(), 'split').codes.has(row.areaCode) && !resolveWardModeAreas(policy(), 'merged').codes.has(row.areaCode));
    if (!wards.length || wards.every((row) => row.value === 0)) throw Error('行政区の値が集計されていない指標は分割できません。');
  }
  const sorted = [...observed].sort((a, b) => b.value - a.value);
  const rows = sorted.map((row) => ({
    rank: sorted.findIndex((other) => other.value === row.value) + 1,
    area_code: row.areaCode, area_name: areas.get(row.areaCode)!, value: row.value,
  }));
  return {
    title: input.title, yearLabel: input.yearLabel, source: input.source, presentation: input.presentation, rows,
    note: input.note,
    scope: input.scope,
    missing: [...areas.keys()].filter((code) => !seen.has(code)),
    ...chartValueLabels(input.unit, rows.map((row) => row.value), input.decimalPlaces),
  };
}
