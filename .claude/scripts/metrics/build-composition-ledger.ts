/**
 * 内訳の台帳。「足すと全体になる」指標の組は指標の定義からは判らないので、テーマのカタログの積み上げ
 * (composition-chart) に書かれた組を集める。正本はカタログで、ここは生成物 (手で直さない)。
 *
 *   npx tsx .claude/scripts/metrics/build-composition-ledger.ts          # data/themes/compositions/sets.json を作り直す
 *   npx tsx .claude/scripts/metrics/build-composition-ledger.ts --check  # カタログとのずれと、組の問題で止める
 */
import fs from 'node:fs';
import path from 'node:path';

import { datasetDir, datasetPath } from '../../../config/datasets.mjs';
import { getMetricConfig } from '../../../packages/data-configs/src/registry';

const ROOT = path.resolve(__dirname, '../../..');
const CATALOG_DIR = path.join(ROOT, datasetDir('themes.catalogs'));
const LEDGER = path.join(ROOT, datasetPath('themes.composition-sets'));
const COMPOSITION = 'composition-chart';
// A stacked bar's legend holds this many parts before the rest stop being readable.
const MAX_PARTS = 6;

export type CompositionIssue = 'unknown-metric' | 'mixed-units' | 'too-many-parts';
type ChartDefinition = { componentKey: string; componentType: string; title: string; componentProps?: { seriesRefs?: { metricKey: string; label: string }[] } };
type Metric = { unit?: string } | undefined;

/** Theme catalogs → one set per composition chart. A set's parts must share a unit to be added up at all. */
export function compositionSetsFromCatalogs(catalogs: { key: string; charts?: ChartDefinition[] }[], metricOf: (key: string) => Metric) {
  const sets = catalogs.flatMap((catalog) => (catalog.charts ?? []).filter((chart) => chart.componentType === COMPOSITION).map((chart) => {
    const parts = (chart.componentProps?.seriesRefs ?? []).map((ref) => ({ metricKey: ref.metricKey, label: ref.label, unit: metricOf(ref.metricKey)?.unit ?? null }));
    const units = new Set(parts.flatMap((part) => (part.unit ? [part.unit] : [])));
    const issues: CompositionIssue[] = [];
    if (parts.some((part) => !metricOf(part.metricKey))) issues.push('unknown-metric');
    if (units.size > 1) issues.push('mixed-units');
    if (parts.length > MAX_PARTS) issues.push('too-many-parts');
    return { id: `${catalog.key}/${chart.componentKey}`, theme: catalog.key, title: chart.title, parts, issues };
  }));
  return sets.sort((a, b) => a.id.localeCompare(b.id));
}

function build() {
  const catalogs = fs.readdirSync(CATALOG_DIR).filter((file) => file.endsWith('.json')).sort()
    .map((file) => JSON.parse(fs.readFileSync(path.join(CATALOG_DIR, file), 'utf8')));
  const sets = compositionSetsFromCatalogs(catalogs, getMetricConfig);
  return { schemaVersion: 1, summary: { sets: sets.length, parts: sets.reduce((sum, set) => sum + set.parts.length, 0), withIssues: sets.filter((set) => set.issues.length).length }, sets };
}

function main() {
  const ledger = `${JSON.stringify(build(), null, 2)}\n`;
  if (!process.argv.includes('--check')) {
    fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
    fs.writeFileSync(LEDGER, ledger);
    console.log(`内訳の組 ${JSON.parse(ledger).summary.sets} を書いた`);
    return;
  }
  if (!fs.existsSync(LEDGER) || fs.readFileSync(LEDGER, 'utf8').split('\r\n').join('\n') !== ledger) {
    console.error('✗ 内訳の台帳がカタログとずれている。npx tsx .claude/scripts/metrics/build-composition-ledger.ts で作り直す');
    process.exit(1);
  }
  console.log('✓ 内訳の台帳はカタログと一致');
}

if (process.argv[1]?.endsWith('build-composition-ledger.ts')) main();
