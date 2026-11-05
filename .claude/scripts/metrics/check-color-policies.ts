/**
 * 配色の台帳 (data/ranking/color-policies/policies.json) の整合を通信なしで検査する。
 * 形は JSON Schema (check-datasets)、ここは主キーの一意性・指標の実在・全ての有効な指標の行か理由・集計・型と Schema のずれを見る。作り直しは build-color-policies.ts。
 *
 *   npx tsx .claude/scripts/metrics/check-color-policies.ts            # PR。追加直後の指標は警告
 *   npx tsx .claude/scripts/metrics/check-color-policies.ts --strict   # 作り直しの直後。全ての有効な指標の行か理由を要求
 */
import fs from 'node:fs';
import path from 'node:path';

import { datasetPath } from '../../../config/datasets.mjs';
import { getMetricConfig, listAllMetrics } from '../../../packages/data-configs/src/registry';
import { COLOR_GRAINS, COLOR_SKIP_REASONS, type ColorPolicyRow, type ColorPolicySkip } from '../../../packages/types/src/color-policy';

export type Ledger = { schemaVersion: 1; summary: Record<string, number>; skipped: ColorPolicySkip[]; policies: ColorPolicyRow[] };

export const summaryOf = (policies: ColorPolicyRow[], skipped: ColorPolicySkip[]) => {
  const count = (test: (row: ColorPolicyRow) => boolean) => policies.filter(test).length;
  return {
    rows: policies.length,
    continuous: count((row) => row.classification.method === 'continuous'),
    stepped: count((row) => row.classification.method !== 'continuous'),
    diverging: count((row) => row.colorSchemeType === 'diverging'),
    skipped: skipped.length,
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
  const withRow = new Set(ledger.policies.map((row) => row.metricKey));
  const skipped = new Set<string>();
  for (const { metricKey } of ledger.skipped) {
    if (withRow.has(metricKey) || skipped.has(metricKey)) errors.push(`行と理由の両方がある、または理由が重複: ${metricKey}`);
    skipped.add(metricKey);
  }
  const counted = summaryOf(ledger.policies, ledger.skipped);
  for (const [name, value] of Object.entries(counted)) if (ledger.summary[name] !== value) errors.push(`集計が合わない: ${name}`);
  return errors;
}

/**
 * Active metrics the ledger does not account for. A metric added since the weekly build is expected to be here
 * and uses the continuous ramp until then, so only --strict (right after a build) makes this a failure.
 */
export const unaccountedMetrics = (ledger: Ledger, activeKeys: readonly string[]) => {
  const known = new Set([...ledger.policies, ...ledger.skipped].map((row) => row.metricKey));
  return activeKeys.filter((key) => !known.has(key));
};

/** The ledger's schema repeats the type's values; JSON Schema cannot import them, so they are compared here. */
export function schemaDriftErrors(schema: { properties: Record<string, { items: { properties: Record<string, { enum: string[] }> } }> }) {
  const same = (a: readonly string[], b: readonly string[]) => JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  return [
    ...(same(schema.properties.policies.items.properties.grain.enum, COLOR_GRAINS) ? [] : ['Schema の粒度が COLOR_GRAINS と違う']),
    ...(same(schema.properties.skipped.items.properties.reason.enum, COLOR_SKIP_REASONS) ? [] : ['Schema の理由が COLOR_SKIP_REASONS と違う']),
  ];
}

if (process.argv[1]?.endsWith('check-color-policies.ts')) {
  const file = path.resolve(__dirname, '../../..', datasetPath('ranking.color-policies'));
  const schemaFile = path.resolve(__dirname, '../../..', datasetPath('ranking.color-policies-schema'));
  const active = listAllMetrics().filter((metric) => metric.isActive !== false).map((metric) => metric.key);
  const ledger: Ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
  const unaccounted = unaccountedMetrics(ledger, active).map((key) => `行も理由も無い有効な指標: ${key}`);
  const strict = process.argv.includes('--strict');
  const errors = [
    ...colorPolicyErrors(ledger, getMetricConfig),
    ...schemaDriftErrors(JSON.parse(fs.readFileSync(schemaFile, 'utf8'))),
    ...(strict ? unaccounted : []),
  ];
  if (!strict) for (const line of unaccounted) console.warn(`⚠ ${line} (次の週次で作られる)`);
  for (const error of errors) console.error(`✗ ${error}`);
  if (errors.length) process.exit(1);
  console.log('✓ 配色の台帳は整合している');
}
