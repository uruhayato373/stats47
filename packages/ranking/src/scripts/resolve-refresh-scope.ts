/**
 * data-refresh の `snapshot_scope=auto` を解決して GITHUB_OUTPUT に書く CLI。
 * 判定の中身は `./lib/refresh-scope.ts` (純関数・テスト付き)。
 *
 *   REFRESH_METRIC=a,b npx tsx packages/ranking/src/scripts/resolve-refresh-scope.ts
 */
import { appendFileSync } from 'node:fs';

import { getMetricConfig } from '@stats47/data-configs';
import { KNOWN_MUNICIPALITY_RANKING_KEYS } from '@stats47/data-configs/geo-scope';

import { resolveAutoRefreshScope } from './lib/refresh-scope';

const keys = (process.env.REFRESH_METRIC ?? '').split(',').filter(Boolean);
const { scope, reason } = resolveAutoRefreshScope(keys, {
  metric: (key) => {
    const config = getMetricConfig(key);
    return config
      ? { isActive: config.isActive === true, entities: config.entities, sourceKind: config.source.kind }
      : undefined;
  },
  isPublishedMunicipality: (key) => KNOWN_MUNICIPALITY_RANKING_KEYS.has(key),
});

console.log(`snapshot_scope=auto → ${scope} (${reason})`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `snapshot_scope=${scope}\n`);
