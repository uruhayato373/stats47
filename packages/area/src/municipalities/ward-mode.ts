import type { MunicipalityEntityPolicy } from '../types/municipality';

/**
 * 政令指定都市の見せ方 (2026-10-28 MUNI-DESIGNATED-CITY-WARDS-01)。
 * - `merged`: 政令指定都市を市全体で 1 つにする (基礎自治体の単位。ランキングの既定)
 * - `split`: 政令指定都市を行政区に分ける (内訳の単位)
 *
 * 東京の特別区はどちらでも区ごと (基礎自治体)。特別区部 13100 はどちらにも入らない (23 区の合計の行)。
 * 表示する地域・地図・順位はこのフラグ 1 つから決める。部品ごとに「東京都なら」「〜区なら」と判定しない。
 */
export type WardMode = 'merged' | 'split';

export interface WardModeAreas {
  /** このフラグで表示する地域のコード */
  codes: ReadonlySet<string>;
  /**
   * 地図で 1 つにまとめる形: 親 (政令指定都市) のコード → 子 (行政区) のコード。
   * merged のときだけ中身がある (split は分割版の形をそのまま使う)。
   */
  mergeGroups: ReadonlyMap<string, readonly string[]>;
  /** 政令指定都市 (行政区を持つ市) のコード */
  designatedCityCodes: ReadonlySet<string>;
}

/**
 * 公開方針 (buildMunicipalityEntityPolicy) の分類から、フラグごとの地域の集合を決める。
 * 分類の根拠は e-Stat の地域メタの @level / @parentCode (地域マスタ cities.json に写してある)。
 */
export function resolveWardModeAreas(
  policy: MunicipalityEntityPolicy,
  mode: WardMode
): WardModeAreas {
  const wardsByParent = new Map<string, string[]>();
  for (const entity of policy.entities) {
    if (entity.disposition !== 'excluded' || entity.kind !== 'administrative-ward') continue;
    const parent = entity.parentMunicipalityCode;
    if (!parent) throw new Error(`administrative ward has no parent: ${entity.code}`);
    wardsByParent.set(parent, [...(wardsByParent.get(parent) ?? []), entity.code]);
  }
  const designatedCityCodes = new Set(wardsByParent.keys());

  const codes = new Set<string>();
  for (const entity of policy.entities) {
    if (entity.disposition === 'publishable') {
      if (mode === 'split' && designatedCityCodes.has(entity.code)) continue;
      codes.add(entity.code);
    } else if (mode === 'split' && entity.kind === 'administrative-ward') {
      codes.add(entity.code);
    }
  }

  return {
    codes,
    mergeGroups: mode === 'merged' ? wardsByParent : new Map(),
    designatedCityCodes,
  };
}

/** 東京の特別区のコード (公開方針の分類 `special-ward`。e-Stat で親が特別区部 13100 の level 3) */
export function listSpecialWardCodes(policy: MunicipalityEntityPolicy): ReadonlySet<string> {
  return new Set(
    policy.entities.filter((entity) => entity.kind === 'special-ward').map((entity) => entity.code)
  );
}
