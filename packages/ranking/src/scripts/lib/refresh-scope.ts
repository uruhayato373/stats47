/**
 * data-refresh の派生更新範囲 `snapshot_scope=auto` を、指定された指標から決める (純関数)。
 *
 * 範囲を人が選ぶと、狭い範囲で足りるのに全範囲 (90 分前後) を回す。2026-10-28 に市区町村だけの財政指標 8 件で、
 * 必要な作り直しは数分なのに 75 分かかった。auto は「狭くしても作り直し漏れが起きない」と確かめた範囲だけを選び、
 * それ以外は全範囲に倒す。
 *
 * - municipality を選ぶのは、全 key が「有効・市区町村の値だけを持つ (都道府県の値を持たない)・市区町村ランキングとして
 *   公開中・e-Stat から取る」とき。市区町村の観測値 (cities.json) を読む派生は市区町村ランキングとデータブックだけで、
 *   計算型の指標は市区町村の値を使わない (2026-10-28 に registry で確認) ので、この 2 つを作り直せば漏れない。
 * - ranking (都道府県) は選ばない。地域プロフィール・相関・master などを作り直さないので、選ぶかは人が決める。
 */
export type AutoRefreshScope = 'all' | 'municipality';

export interface RefreshScopeMetric {
  isActive: boolean;
  entities: readonly string[];
  sourceKind: string;
}

export interface RefreshScopeLookup {
  metric(key: string): RefreshScopeMetric | undefined;
  isPublishedMunicipality(key: string): boolean;
}

export const MAX_SCOPED_REFRESH_KEYS = 50;

export function resolveAutoRefreshScope(
  keys: readonly string[],
  lookup: RefreshScopeLookup
): { scope: AutoRefreshScope; reason: string } {
  if (keys.length === 0) return { scope: 'all', reason: '指標の指定が無い (全指標)' };
  if (keys.length > MAX_SCOPED_REFRESH_KEYS) {
    return { scope: 'all', reason: `指標が ${MAX_SCOPED_REFRESH_KEYS} 件を超える (${keys.length} 件)` };
  }
  if (new Set(keys).size !== keys.length) return { scope: 'all', reason: '指標の指定が重複している' };
  for (const key of keys) {
    const metric = lookup.metric(key);
    if (!metric?.isActive) return { scope: 'all', reason: `${key} は有効な指標ではない` };
    if (!metric.entities.includes('city') || metric.entities.includes('prefecture')) {
      return { scope: 'all', reason: `${key} は市区町村だけの指標ではない` };
    }
    if (!lookup.isPublishedMunicipality(key)) {
      return { scope: 'all', reason: `${key} は市区町村ランキングとして公開していない` };
    }
    if (metric.sourceKind !== 'estat') return { scope: 'all', reason: `${key} は e-Stat から取る指標ではない` };
  }
  return { scope: 'municipality', reason: `${keys.length} 件すべてが公開中の市区町村だけの指標` };
}
