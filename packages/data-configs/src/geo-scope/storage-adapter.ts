import type { EntityKind } from '../types';
import type { StatisticsScope } from './types';

export type GeoScopeStorageEntityKind = Extract<
  EntityKind,
  'prefecture' | 'city'
>;

/**
 * URL/UI上の地理スコープを既存R2観測値のentity名へ変換する唯一の境界。
 * 日本・世界は専用snapshotを使うため、prefectureへ暗黙変換しない。
 */
export function toGeoScopeStorageEntityKind(
  scope: StatisticsScope
): GeoScopeStorageEntityKind {
  switch (scope.kind) {
    case 'prefecture-set':
    case 'prefecture':
      return 'prefecture';
    case 'municipality-set':
    case 'municipality':
      return 'city';
    case 'japan':
    case 'world':
      throw new Error(
        `${scope.kind} scope does not use prefecture/city storage`
      );
  }
}
