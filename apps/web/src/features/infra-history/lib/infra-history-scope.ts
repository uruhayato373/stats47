import { PREFECTURE_LIST_2DIGIT } from '@stats47/area';
import {
  INFRA_REGIONS,
  INFRA_SCOPE_REGIONS,
  findInfraScopeRegionOfPref,
  type InfraNetworkKey,
} from '@stats47/gis/infra-history';

/**
 * `/geo/history/<network>[/<scope>]` の表示範囲。
 * scope は地方 (`tohoku`・`kanto` 等。北海道・沖縄は 1 道県なので地方のページを持たない) か 2 桁の県コード。
 * 省略すると全国。地方の区分は `INFRA_SCOPE_REGIONS` (共通 7 区分から北海道・沖縄を切り出した 9 区分)。
 */
export interface ResolvedInfraScope {
  readonly kind: 'national' | 'region' | 'prefecture';
  /** URL の scope 部分。全国は null */
  readonly slug: string | null;
  readonly name: string;
  /** 範囲に入る 2 桁県コード */
  readonly prefCodes: readonly string[];
  /** 地図の線データを返す同一オリジンの API のパス (R2 は CORS を返さないので直接読まない) */
  readonly topologyPath: string;
  /** 県の範囲なら属する区分 (9 区分の code) */
  readonly regionCode: string | null;
}

/** 都道府県境 (同一オリジン。/api/mf-topo が R2 から取り次ぐ) */
export const PREFECTURE_BOUNDARY_PATH = '/api/mf-topo/prefecture';

/** 市区町村境界 (政令指定都市は市全体。/api/mf-topo が WardMode merged で返す) */
export function municipalityBoundaryPath(prefCode: string): string {
  return `/api/mf-topo/${prefCode}`;
}

const PREF_NAME = new Map(PREFECTURE_LIST_2DIGIT.map((pref) => [pref.code, pref.name]));
const ALL_PREF_CODES = PREFECTURE_LIST_2DIGIT.map((pref) => pref.code);

export function infraHistoryPath(network: InfraNetworkKey, scopeSlug: string | null = null): string {
  return scopeSlug ? `/geo/history/${network}/${scopeSlug}` : `/geo/history/${network}`;
}

function topologyApiPath(network: InfraNetworkKey, file: string): string {
  return `/api/geo/history/${network}/${file}`;
}

export function resolveInfraScope(
  network: InfraNetworkKey,
  scopeSlug: string | null,
): ResolvedInfraScope | null {
  if (scopeSlug === null) {
    return {
      kind: 'national',
      slug: null,
      name: '全国',
      prefCodes: ALL_PREF_CODES,
      topologyPath: topologyApiPath(network, 'national.topojson'),
      regionCode: null,
    };
  }
  const region = INFRA_REGIONS.find((item) => item.code === scopeSlug);
  if (region) {
    return {
      kind: 'region',
      slug: region.code,
      name: region.name,
      prefCodes: region.prefCodes,
      topologyPath: topologyApiPath(network, `region/${region.code}.topojson`),
      regionCode: region.code,
    };
  }
  const name = PREF_NAME.get(scopeSlug);
  if (name) {
    return {
      kind: 'prefecture',
      slug: scopeSlug,
      name,
      prefCodes: [scopeSlug],
      topologyPath: topologyApiPath(network, `pref/${scopeSlug}.topojson`),
      regionCode: findInfraScopeRegionOfPref(scopeSlug)?.code ?? null,
    };
  }
  return null;
}

export interface InfraScopeNavItem {
  readonly key: string;
  readonly label: string;
  readonly href: string;
  readonly current: boolean;
}

/**
 * 範囲の切替 (全国 + 9 区分)。北海道・沖縄は 1 道県だけなので、地方のページではなく県のページへつなぐ
 * (同じ中身のページを 2 つ作らない)。
 */
export function infraScopeNavItems(network: InfraNetworkKey, scope: ResolvedInfraScope): InfraScopeNavItem[] {
  return [
    { key: 'national', label: '全国', href: infraHistoryPath(network), current: scope.kind === 'national' },
    ...INFRA_SCOPE_REGIONS.map((region) => {
      const isSinglePref = region.prefCodes.length === 1;
      const slug = isSinglePref ? region.prefCodes[0] : region.code;
      return {
        key: region.code,
        label: region.name,
        href: infraHistoryPath(network, slug),
        current: isSinglePref ? scope.slug === slug : scope.kind === 'region' && scope.slug === region.code,
      };
    }),
  ];
}

export function prefName(prefCode: string): string {
  return PREF_NAME.get(prefCode) ?? prefCode;
}
