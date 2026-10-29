import { PREFECTURE_LIST_2DIGIT } from '@stats47/area';
import { INFRA_SCOPE_REGIONS } from '@stats47/gis/infra-history';
import {
  normalizeGeoMapSubjects,
  type GeoSubject,
  type GeoSubjectDropReason,
  type GeoSubjectScopeKind,
} from '@stats47/gis/subjects';

const PREF_NAME = new Map(PREFECTURE_LIST_2DIGIT.map((pref) => [pref.code, pref.name]));
export const prefName = (code: string) => PREF_NAME.get(code) ?? code;

/**
 * 重ね合わせ画面の URL。`/geo/map?base=<背景の主題>&subjects=<重ねる主題,…>&scope=<範囲>`。
 * 主題の id は主題の台帳 (data/geo/subjects/subjects.json)。塗り分けは同時に 1 つまでなので、背景は値を 1 つしか持てない base= で受ける
 */
export const GEO_MAP_PATH = '/geo/map';

/** base= を「背景なし」にするときの値 */
export const NO_BASE = 'none';

/** 何も指定が無いときの背景・重ねるもの・範囲 (市区町村の塗り分けは全国では描かないので地方を既定にする) */
export const DEFAULT_GEO_MAP_BASE = 'municipal-population-change';
export const DEFAULT_GEO_MAP_OVERLAYS = ['expressway-sections', 'expressway-joints'] as const;
export const DEFAULT_GEO_MAP_SCOPE = 'kanto';

export interface GeoMapScope {
  readonly kind: GeoSubjectScopeKind;
  /** URL の scope= の値 (national・地方コード・2 桁県コード) */
  readonly slug: string;
  readonly name: string;
  readonly prefCodes: readonly string[];
}

const ALL_PREF_CODES = PREFECTURE_LIST_2DIGIT.map((pref) => pref.code);

/** scope= を範囲に直す。1 道県の地方 (北海道・沖縄) は県として扱う。解釈できない値は null */
export function resolveGeoMapScope(slug: string | null | undefined): GeoMapScope | null {
  const value = slug ?? DEFAULT_GEO_MAP_SCOPE;
  if (value === 'national') return { kind: 'national', slug: 'national', name: '全国', prefCodes: ALL_PREF_CODES };
  if (/^\d{2}$/.test(value) && ALL_PREF_CODES.includes(value)) {
    return { kind: 'prefecture', slug: value, name: prefName(value), prefCodes: [value] };
  }
  const region = INFRA_SCOPE_REGIONS.find((item) => item.code === value);
  if (!region) return null;
  if (region.prefCodes.length === 1) {
    const [code] = region.prefCodes;
    return { kind: 'prefecture', slug: code, name: prefName(code), prefCodes: [code] };
  }
  return { kind: 'region', slug: region.code, name: region.name, prefCodes: region.prefCodes };
}

const first = (value: string | readonly string[] | undefined) => (Array.isArray(value) ? value[0] : (value as string | undefined));

/** subjects= の値 (カンマ区切り・複数指定のどちらも) を ID の並びにする */
function parseIds(value: string | readonly string[]): string[] {
  const raw = Array.isArray(value) ? value.join(',') : String(value);
  return raw
    .split(',')
    .map((id) => id.trim())
    .filter((id) => id !== '');
}

export interface GeoMapSelection {
  readonly scope: GeoMapScope;
  readonly base: GeoSubject | null;
  readonly overlays: readonly GeoSubject[];
  readonly dropped: readonly { id: string; reason: GeoSubjectDropReason }[];
  /** URL に条件が付いているか (付いていれば noindex。canonical は素の /geo/map) */
  readonly hasQuery: boolean;
}

export function resolveGeoMapSelection(params: {
  base?: string | readonly string[];
  subjects?: string | readonly string[];
  scope?: string | readonly string[];
}): GeoMapSelection {
  const scope = resolveGeoMapScope(first(params.scope)) ?? (resolveGeoMapScope(DEFAULT_GEO_MAP_SCOPE) as GeoMapScope);
  const baseParam = first(params.base);
  const baseId = baseParam === undefined ? DEFAULT_GEO_MAP_BASE : baseParam === NO_BASE ? null : baseParam;
  const overlayIds = params.subjects === undefined ? [...DEFAULT_GEO_MAP_OVERLAYS] : parseIds(params.subjects);
  const { base, overlays, dropped } = normalizeGeoMapSubjects(baseId, overlayIds, scope.kind);
  return {
    scope,
    base,
    overlays,
    dropped,
    hasQuery: params.base !== undefined || params.subjects !== undefined || params.scope !== undefined,
  };
}

/** 背景・重ねるもの・範囲から URL を作る (背景なしは base=none) */
export function geoMapHref(baseId: string | null, overlayIds: readonly string[], scopeSlug: string): string {
  const query = new URLSearchParams();
  query.set('base', baseId ?? NO_BASE);
  query.set('subjects', overlayIds.join(','));
  query.set('scope', scopeSlug);
  return `${GEO_MAP_PATH}?${query.toString().replace(/%2C/g, ',')}`;
}

/** 外した主題の理由を読者向けの文にする (手で URL を書いたときだけ出る) */
export const DROP_REASON_TEXT: Record<GeoSubjectDropReason, string> = {
  unknown: '台帳に無い主題',
  duplicate: '重複した指定',
  scope: 'この範囲では描かない主題 (市区町村の塗り分けは地方・県で表示)',
  kind: '背景 (塗り分け) と重ねるもの (線・点) の取り違え',
};
