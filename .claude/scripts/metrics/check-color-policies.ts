/**
 * 配色の台帳 (data/ranking/color-policies/policies.json) の整合を通信なしで検査する。
 * 形は JSON Schema (check-datasets)、ここは主キーの一意性・指標の実在・集計を見る。作り直しは build-color-policies.ts。
 *
 *   npx tsx .claude/scripts/metrics/check-color-policies.ts
 */
import fs from 'node:fs';
import path from 'node:path';

import { datasetPath } from '../../../config/datasets.mjs';
import { getMetricConfig } from '../../../packages/data-configs/src/registry';
import type { ColorPolicyRow } from '../../../packages/types/src/color-policy';

export type Ledger = { schemaVersion: 1; summary: Record<string, number>; policies: ColorPolicyRow[] };

export const summaryOf = (policies: ColorPolicyRow[]) => {
  const count = (test: (row: ColorPolicyRow) => boolean) => policies.filter(test).length;
  return {
    rows: policies.length,
    continuous: count((row) => row.classification.method === 'continuous'),
    stepped: count((row) => row.classification.method !== 'continuous'),
    diverging: count((row) => row.colorSchemeType === 'diverging'),
  };
};

export function colorPolicyErrors(ledger: Ledger, metricOf: (key: string) => unknown) {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const row of ledger.policies) {
    const key = `${row.metricKey}|${row.grain}`;
    if (seen.has(key)) errors.push(`重複: ${key}`);
    seen.add(key);
    if (!metricOf(row.metricKey)) errors.push(`指標定義に無い: ${row.metricKey}`);
    if (row.classification.method === 'threshold' && row.colorSchemeType !== 'diverging') errors.push(`区切りは発散の配色だけ: ${key}`);
    if (row.colorScheme !== undefined && row.colorSchemeType !== 'diverging') errors.push(`配色の差し替えは発散の配色だけ: ${key}`);
  }
  const counted = summaryOf(ledger.policies);
  for (const [name, value] of Object.entries(counted)) if (ledger.summary[name] !== value) errors.push(`集計が合わない: ${name}`);
  return errors;
}

if (process.argv[1]?.endsWith('check-color-policies.ts')) {
  const file = path.resolve(__dirname, '../../..', datasetPath('metrics.color-policies'));
  const errors = colorPolicyErrors(JSON.parse(fs.readFileSync(file, 'utf8')), getMetricConfig);
  for (const error of errors) console.error(`✗ ${error}`);
  if (errors.length) process.exit(1);
  console.log('✓ 配色の台帳は整合している');
}
