import { PREFECTURE_LIST_2DIGIT, REGIONS } from '@stats47/area';
import { infraHistoryKeys, type InfraNetworkKey } from '@stats47/gis/infra-history';

/**
 * `/geo/history/<network>[/<scope>]` の表示範囲。
 * scope は 7 地方の regionCode (`kanto` 等) か 2 桁の県コード。省略すると全国。
 */
export interface ResolvedInfraScope {
  readonly kind: 'national' | 'region' | 'prefecture';
  /** URL の scope 部分。全国は null */
  readonly slug: string | null;
  readonly name: string;
  /** 範囲に入る 2 桁県コード */
  readonly prefCodes: readonly string[];
  /** 地図の線データの R2 key */
  readonly topologyKey: string;
  /** 県の範囲なら属する地方 */
  readonly regionCode: string | null;
}

const PREF_NAME = new Map(PREFECTURE_LIST_2DIGIT.map((pref) => [pref.code, pref.name]));
const ALL_PREF_CODES = PREFECTURE_LIST_2DIGIT.map((pref) => pref.code);

export function infraHistoryPath(network: InfraNetworkKey, scopeSlug: string | null = null): string {
  return scopeSlug ? `/geo/history/${network}/${scopeSlug}` : `/geo/history/${network}`;
}

export function regionOfPref(prefCode: string): string | null {
  return REGIONS.find((region) => region.prefectures.some((code) => code.startsWith(prefCode)))?.regionCode ?? null;
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
      topologyKey: infraHistoryKeys.national(network),
      regionCode: null,
    };
  }
  const region = REGIONS.find((item) => item.regionCode === scopeSlug);
  if (region) {
    return {
      kind: 'region',
      slug: region.regionCode,
      name: region.regionName,
      prefCodes: region.prefectures.map((code) => code.slice(0, 2)),
      topologyKey: infraHistoryKeys.region(network, region.regionCode),
      regionCode: region.regionCode,
    };
  }
  const prefName = PREF_NAME.get(scopeSlug);
  if (prefName) {
    return {
      kind: 'prefecture',
      slug: scopeSlug,
      name: prefName,
      prefCodes: [scopeSlug],
      topologyKey: infraHistoryKeys.prefecture(network, scopeSlug),
      regionCode: regionOfPref(scopeSlug),
    };
  }
  return null;
}

/** generateStaticParams は使わない (R2 依存の動的 route。nextjs-ssg-preservation.md)。一覧リンク用 */
export function listInfraScopeSlugs(): string[] {
  return [...REGIONS.map((region) => region.regionCode), ...ALL_PREF_CODES];
}

export function prefName(prefCode: string): string {
  return PREF_NAME.get(prefCode) ?? prefCode;
}
