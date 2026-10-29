import 'server-only';

import {
  INFRA_NETWORKS,
  infraHistoryKeys,
  infraNetworkPageUrl,
  isInfraNetworkPublishable,
  parseInfraHistorySummary,
  type InfraNetworkDefinition,
} from '@stats47/gis/infra-history';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';
import { readStatsValues } from '@stats47/stats-r2/readers';

import type { GeoMapScope } from './geo-map-selection';
import type { GeoSubject } from '@stats47/gis/subjects';

/** 地図に描く主題 1 つ分 (クライアントへ渡す。シリアライズできる値だけ) */
export type GeoMapLayer =
  | {
      readonly kind: 'features';
      readonly id: string;
      readonly label: string;
      readonly geometry: 'line' | 'point';
      /** 同一オリジンの API (R2 は CORS を返さない) */
      readonly url: string;
      readonly classes: readonly { code: string; label: string; color: string }[];
      readonly firstYear: number;
      readonly lastYear: number;
    }
  | {
      readonly kind: 'municipal';
      readonly id: string;
      readonly label: string;
      readonly measure: { readonly label: string; readonly unit: string };
      /** 色の基準。全国の全年で固定する (範囲や年を変えても同じ色は同じ値) */
      readonly domain:
        | { readonly kind: 'sequential'; readonly scale: 'linear' | 'log'; readonly min: number; readonly max: number }
        | { readonly kind: 'diverging'; readonly maxAbs: number };
      readonly match: 'exact' | 'latest-before';
      /** 値のある年 (昇順)。values の各配列と同じ並び */
      readonly years: readonly number[];
      readonly values: Readonly<Record<string, readonly (number | null)[]>>;
      readonly names: Readonly<Record<string, string>>;
    };

export interface GeoMapUnavailable {
  readonly id: string;
  readonly label: string;
  readonly reason: 'not-built' | 'not-published' | 'load-failed';
}

export interface GeoMapSourceNote {
  readonly label: string;
  readonly href: string | null;
}

/** 区間・点の主題に対応する交通網 (同じ原典 ZIP の同じ地物の種類)。接合部は同じ網の joints ファイル */
function networkOfSubject(subject: GeoSubject): { network: InfraNetworkDefinition; file: 'scope' | 'joints' } | null {
  if (subject.source.kind !== 'ksj') return null;
  const { dataId, featureType } = subject.source;
  for (const network of INFRA_NETWORKS) {
    if (network.source.dataId !== dataId) continue;
    if (network.source.entry.endsWith(`_${featureType}.geojson`)) return { network, file: 'scope' };
    if (featureType === 'Joint') return { network, file: 'joints' };
  }
  return null;
}

function scopeFile(scope: GeoMapScope): string {
  if (scope.kind === 'national') return 'national.topojson';
  if (scope.kind === 'region') return `region/${scope.slug}.topojson`;
  return `pref/${scope.slug}.topojson`;
}

async function loadFeatureLayer(
  subject: GeoSubject,
  scope: GeoMapScope,
): Promise<{ layer: GeoMapLayer; source: GeoMapSourceNote } | GeoMapUnavailable> {
  const resolved = networkOfSubject(subject);
  if (!resolved || (subject.geometry !== 'line' && subject.geometry !== 'point')) {
    return { id: subject.id, label: subject.label, reason: 'not-built' };
  }
  const { network, file } = resolved;
  if (!isInfraNetworkPublishable(network)) return { id: subject.id, label: subject.label, reason: 'not-published' };
  const summary = await fetchFromR2AsJson<unknown>(infraHistoryKeys.summary(network.key))
    .then((raw) => parseInfraHistorySummary(raw, network.key))
    .catch(() => null);
  if (!summary) return { id: subject.id, label: subject.label, reason: 'load-failed' };
  const classes = subject.style.kind === 'category' ? subject.style.classes.map(({ code, label, color }) => ({ code, label, color })) : [];
  return {
    layer: {
      kind: 'features',
      id: subject.id,
      label: subject.label,
      geometry: subject.geometry,
      url: `/api/geo/history/${network.key}/${file === 'joints' ? 'joints.topojson' : scopeFile(scope)}`,
      classes,
      firstYear: summary.years[0],
      lastYear: summary.years[summary.years.length - 1],
    },
    source: { label: `${network.source.provider}「${network.source.name}」`, href: infraNetworkPageUrl(network) },
  };
}

/** 政令指定都市の行政区の行か (名前が「県 市 区」の 3 語)。境界は市全体なので描かれず、色の基準にも入れない */
const isWardRow = (areaName: string) => areaName.trim().split(/\s+/).length >= 3;

/** 正負の色分けで、色の濃さが頭打ちになる絶対値 (全国の全年の絶対値のこの分位点。外れ値で全体が薄くならないように) */
const DIVERGING_DOMAIN_QUANTILE = 0.95;

function quantile(sorted: readonly number[], q: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * q)));
  return sorted[index];
}

async function loadMunicipalLayer(
  subject: GeoSubject,
  scope: GeoMapScope,
): Promise<{ layer: GeoMapLayer; source: GeoMapSourceNote } | GeoMapUnavailable> {
  if (subject.source.kind !== 'estat-metric' || subject.source.entity !== 'city' || !subject.measure) {
    return { id: subject.id, label: subject.label, reason: 'not-built' };
  }
  if (subject.style.kind !== 'sequential' && subject.style.kind !== 'diverging') {
    return { id: subject.id, label: subject.label, reason: 'not-built' };
  }
  const payload = await readStatsValues(subject.source.metricKey, 'city').catch(() => null);
  if (!payload) return { id: subject.id, label: subject.label, reason: 'load-failed' };

  // 全国の全年の系列 (市区町村 × 年)。色の基準を全国で決めるので、範囲で絞る前に作る
  const yearOf = (code: string) => Number(code.slice(0, 4));
  const raw = new Map<string, { name: string; pref: string; byYear: Map<number, number> }>();
  for (const row of payload.rows) {
    if (typeof row.value !== 'number' || !Number.isFinite(row.value) || row.prefectureCode === undefined || isWardRow(row.areaName)) continue;
    const entry = raw.get(row.areaCode) ?? { name: row.areaName, pref: row.prefectureCode, byYear: new Map<number, number>() };
    entry.byYear.set(yearOf(row.yearCode), row.value);
    raw.set(row.areaCode, entry);
  }
  // 導いた値 (基準年からの増減率)。基準年の値が無い・0 以下の市区町村は描かない
  const derive = subject.derive;
  const series = new Map<string, { name: string; pref: string; byYear: Map<number, number> }>();
  for (const [code, entry] of raw) {
    if (!derive) {
      series.set(code, entry);
      continue;
    }
    const base = entry.byYear.get(derive.baseYear);
    if (base === undefined || base <= 0) continue;
    const byYear = new Map<number, number>();
    for (const [year, value] of entry.byYear) if (year >= derive.baseYear) byYear.set(year, (value / base - 1) * 100);
    series.set(code, { ...entry, byYear });
  }
  const allValues = [...series.values()].flatMap((entry) => [...entry.byYear.values()]);
  if (allValues.length === 0) return { id: subject.id, label: subject.label, reason: 'load-failed' };
  const domain =
    subject.style.kind === 'diverging'
      ? {
          kind: 'diverging' as const,
          maxAbs: quantile(allValues.map((v) => Math.abs(v)).sort((a, b) => a - b), DIVERGING_DOMAIN_QUANTILE),
        }
      : {
          kind: 'sequential' as const,
          scale: subject.style.scale,
          min: Math.min(...allValues.filter((v) => subject.style.kind !== 'sequential' || subject.style.scale !== 'log' || v > 0)),
          max: Math.max(...allValues),
        };

  const prefCodes = new Set(scope.prefCodes);
  const scoped = [...series].filter(([, entry]) => prefCodes.has(entry.pref));
  const years = [...new Set(scoped.flatMap(([, entry]) => [...entry.byYear.keys()]))].sort((a, b) => a - b);
  const values: Record<string, (number | null)[]> = {};
  const names: Record<string, string> = {};
  for (const [code, entry] of scoped) {
    values[code] = years.map((year) => entry.byYear.get(year) ?? null);
    names[code] = entry.name;
  }
  const statsDataId = (payload.meta as { recipe?: { estatParams?: { statsDataId?: string } } }).recipe?.estatParams?.statsDataId;
  return {
    layer: {
      kind: 'municipal',
      id: subject.id,
      label: subject.label,
      measure: subject.measure,
      domain,
      match: subject.time.match === 'exact' ? 'exact' : 'latest-before',
      years,
      values,
      names,
    },
    source: {
      label: `政府統計の総合窓口 e-Stat${statsDataId ? ` (統計表 ${statsDataId})` : ''}`,
      href: 'https://www.e-stat.go.jp/',
    },
  };
}

/** 選んだ主題のデータを読む。描けない主題は理由付きで返す (画面で伝える) */
export async function loadGeoMapLayers(
  subjects: readonly GeoSubject[],
  scope: GeoMapScope,
): Promise<{ layers: GeoMapLayer[]; unavailable: GeoMapUnavailable[]; sources: GeoMapSourceNote[] }> {
  const results = await Promise.all(
    subjects.map((subject) => (subject.geometry === 'area' ? loadMunicipalLayer(subject, scope) : loadFeatureLayer(subject, scope))),
  );
  const layers: GeoMapLayer[] = [];
  const unavailable: GeoMapUnavailable[] = [];
  const sources = new Map<string, GeoMapSourceNote>();
  for (const result of results) {
    if ('reason' in result) unavailable.push(result);
    else {
      layers.push(result.layer);
      sources.set(result.source.label, result.source);
    }
  }
  return { layers, unavailable, sources: [...sources.values()] };
}
