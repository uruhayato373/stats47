/**
 * 配色の台帳。指標 × 粒度ごとに、連続か 5 段階か・一方向か発散かを R2 の値から決めて持つ。
 * 指標定義は人が決める色相と基準値、この台帳は値が決める段階 (正規化。結合は metricPresentation)。
 *
 *   npx tsx .claude/scripts/metrics/build-color-policies.ts   # R2 から作り直す (週次の CI)
 *   検査は check-color-policies.ts (通信なし)
 *
 * 判定の規則の正本は packages/types/src/color-policy.ts。取得できなかった指標は前回の行を残す。
 */
import fs from 'node:fs';
import path from 'node:path';

import { datasetPath } from '../../../config/datasets.mjs';
import { buildMunicipalityEntityPolicy, resolveWardModeAreas } from '../../../packages/area/src/municipalities';
import { listAllMetrics } from '../../../packages/data-configs/src/registry';
import { COLOR_GRAINS, colorPolicyRow, type ColorGrain, type ColorPolicyRow } from '../../../packages/types/src/color-policy';
import { R2_PUBLIC_BASE_URL } from '../lib/site-config.cjs';
import { summaryOf, type Ledger } from './check-color-policies';

const ROOT = path.resolve(__dirname, '../../..');
const LEDGER = path.join(ROOT, datasetPath('metrics.color-policies'));
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const CONCURRENCY = 12;
const FETCH_TIMEOUT_MS = 20000;
const MIN_AREAS = 10;
const PROGRESS_EVERY = 250;
// More failures than this means R2 or the network is down, not that metrics are missing.
const MAX_FAILURE_SHARE = 0.02;
const PREFECTURE_CODE = /^(?!00000)\d{2}000$/;

type ValueRow = { areaCode: string; yearCode: string; value: number | null };

/** The latest year with enough areas, and its values. */
export function latestValues(rows: ValueRow[], inSet: (code: string) => boolean) {
  const byYear = new Map<string, number[]>();
  for (const row of rows) {
    if (typeof row.value !== 'number' || !Number.isFinite(row.value) || !inSet(row.areaCode)) continue;
    byYear.set(row.yearCode, [...(byYear.get(row.yearCode) ?? []), row.value]);
  }
  const year = [...byYear.keys()].filter((y) => byYear.get(y)!.length >= MIN_AREAS).sort().pop();
  return year ? { year, values: byYear.get(year)! } : null;
}

const sortRows = (policies: ColorPolicyRow[]) => [...policies].sort((a, b) => a.metricKey.localeCompare(b.metricKey) || COLOR_GRAINS.indexOf(a.grain) - COLOR_GRAINS.indexOf(b.grain));

async function fetchRows(key: string, file: string): Promise<ValueRow[] | 'missing' | 'failed'> {
  try {
    const res = await fetch(`${R2}/app/stats/${key}/${file}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
    if (res.status === 404) return 'missing';
    if (!res.ok) return 'failed';
    return ((await res.json()) as { rows?: ValueRow[] }).rows ?? 'missing';
  } catch {
    return 'failed';
  }
}

async function build() {
  const previous: ColorPolicyRow[] = fs.existsSync(LEDGER) ? JSON.parse(fs.readFileSync(LEDGER, 'utf8')).policies : [];
  const policy = buildMunicipalityEntityPolicy();
  const merged = resolveWardModeAreas(policy, 'merged').codes;
  const split = resolveWardModeAreas(policy, 'split').codes;
  const wards = new Set([...split].filter((code) => !merged.has(code)));
  const metrics = listAllMetrics().filter((metric) => metric.isActive !== false);
  const rows: ColorPolicyRow[] = [];
  let failures = 0, next = 0;
  const keep = (key: string, grain: ColorGrain) => rows.push(...previous.filter((row) => row.metricKey === key && row.grain === grain));
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < metrics.length) {
      const metric = metrics[next++];
      if (next % PROGRESS_EVERY === 0) console.log(`${next} / ${metrics.length} 指標`);
      const add = (grain: ColorGrain, found: ReturnType<typeof latestValues>) => {
        if (found) rows.push(colorPolicyRow(metric.key, grain, metric.visualization, found.year, found.values));
      };
      const prefecture = await fetchRows(metric.key, 'values.json');
      if (prefecture === 'failed') { failures++; keep(metric.key, 'prefecture'); } else if (prefecture !== 'missing') add('prefecture', latestValues(prefecture, (code) => PREFECTURE_CODE.test(code)));
      const cities = await fetchRows(metric.key, 'cities.json');
      if (cities === 'failed') { failures++; keep(metric.key, 'municipality-merged'); keep(metric.key, 'municipality-split'); continue; }
      if (cities === 'missing') continue;
      add('municipality-merged', latestValues(cities, (code) => merged.has(code)));
      // A metric without ward values cannot be split: all-zero wards are unaggregated, not zero.
      const hasWards = cities.some((row) => wards.has(row.areaCode) && typeof row.value === 'number' && row.value !== 0);
      if (hasWards) add('municipality-split', latestValues(cities, (code) => split.has(code)));
    }
  }));
  if (failures > metrics.length * 2 * MAX_FAILURE_SHARE) throw new Error(`R2 の取得失敗が多すぎる (${failures} 件)。台帳を更新しない`);
  const policies = sortRows(rows);
  const ledger: Ledger = { schemaVersion: 1, summary: summaryOf(policies), policies };
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  fs.writeFileSync(LEDGER, `${JSON.stringify(ledger, null, 2)}\n`);
  console.log(`配色の台帳: ${policies.length} 行・取得失敗 ${failures}`, ledger.summary);
}

if (process.argv[1]?.endsWith('build-color-policies.ts')) build().catch((error) => { console.error(error); process.exit(1); });
