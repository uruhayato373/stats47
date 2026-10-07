/**
 * テーマカタログの件数基準 (`.claude/config/theme-catalog-baseline.json`) を実測と比べ、`--write` で書き直す。
 *
 * テストは図の数・依存する指標の数・指標ハブの説明の数などを固定し、意図しない増減を止める。
 * 2026-10-06 までは 6 つのテストファイルに数が直書きされ、テーマを 1 つ直すたびに十数か所を手で合わせていた。
 * 基準は JSON 1 つに集め、テストはそこを読む。図を外す・足すなど意図した変更のときだけ `--write` で更新し、
 * PR の差分で増減を見せる (縮小専用の項目は生 estatParams と生色で、テスト側が「以下」で比べる)。
 *
 *   npx tsx packages/data-configs/scripts/update-theme-catalog-baseline.ts          # 差分を表示 (差があれば exit 1)
 *   npx tsx packages/data-configs/scripts/update-theme-catalog-baseline.ts --write  # 実測で書き直す
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { METRICS_REGISTRY } from '../src/registry';
import { collectCatalogBaseline } from '../src/theme-catalog/baseline-collector';
import { collectThemeDataDependencies } from '../src/theme-catalog/chart-dependencies';
import { THEME_CATALOGS } from '../src/theme-catalog/index';
import { collectThemeMetricContentCoverage } from '../src/theme-catalog/theme-metric-content';
import { validateIndicatorHubContentCompleteness } from './validate-theme-catalog';

const ROOT = path.resolve(__dirname, '../../..');
export const THEME_CATALOG_BASELINE_FILE = path.join(ROOT, '.claude/config/theme-catalog-baseline.json');
const MIGRATION_FIXTURE = path.join(
  __dirname,
  '../src/theme-catalog/__tests__/fixtures/series-ref-migration-contract.json'
);

export interface ThemeCatalogCounts {
  themes: number;
  charts: number;
  chartsByType: Record<string, number>;
  chartsWithRelatedRankingKeys: number;
  chartsWithRawEstatParams: number;
  rawEstatRequests: number;
  rawColorPlaces: number;
  distinctColors: number;
  totalMetricRefs: number;
  distinctMetricKeys: number;
  indicatorHubKeys: number;
  authoredNoteKeys: number;
  migrationContractRows: number;
}

export function measureThemeCatalogCounts(): ThemeCatalogCounts {
  const catalogs = Object.values(THEME_CATALOGS);
  const baseline = collectCatalogBaseline(catalogs);
  const deps = collectThemeDataDependencies(catalogs);
  const hub = validateIndicatorHubContentCompleteness(catalogs, [], []);
  const content = collectThemeMetricContentCoverage(catalogs, METRICS_REGISTRY);
  if (hub.totalKeys !== content.themeReferencedKeys.length || hub.authoredNoteKeys.length !== content.populatedNoteKeys.length) {
    throw new Error('指標ハブの説明の集計が validator と theme-metric-content で食い違う');
  }
  return {
    themes: baseline.themes,
    charts: baseline.charts,
    chartsByType: baseline.chartsByType,
    chartsWithRelatedRankingKeys: baseline.chartsWithRelatedRankingKeys,
    chartsWithRawEstatParams: baseline.chartsWithRawEstatParams,
    rawEstatRequests: baseline.rawEstatRequests,
    rawColorPlaces: baseline.rawColorPlaces,
    distinctColors: baseline.distinctColors.length,
    totalMetricRefs: deps.totalMetricRefs,
    distinctMetricKeys: deps.distinctMetricKeys.length,
    indicatorHubKeys: hub.totalKeys,
    authoredNoteKeys: hub.authoredNoteKeys.length,
    migrationContractRows: (JSON.parse(readFileSync(MIGRATION_FIXTURE, 'utf8')) as unknown[]).length,
  };
}

function main(): void {
  const write = process.argv.includes('--write');
  const file = JSON.parse(readFileSync(THEME_CATALOG_BASELINE_FILE, 'utf8')) as { counts: ThemeCatalogCounts };
  const live = measureThemeCatalogCounts();
  const diffs = (Object.keys(live) as (keyof ThemeCatalogCounts)[]).filter(
    (key) => JSON.stringify(live[key]) !== JSON.stringify(file.counts[key])
  );
  for (const key of diffs) {
    console.log(`  ${key}: ${JSON.stringify(file.counts[key])} → ${JSON.stringify(live[key])}`);
  }
  if (diffs.length === 0) {
    console.log('✓ theme-catalog-baseline は実測と一致');
    return;
  }
  if (!write) {
    console.log(`✗ ${diffs.length} 項目が実測と違う。意図した変更なら --write で書き直す`);
    process.exit(1);
  }
  writeFileSync(THEME_CATALOG_BASELINE_FILE, `${JSON.stringify({ ...file, counts: live }, null, 2)}\n`);
  console.log(`✎ ${diffs.length} 項目を書き直した: ${path.relative(ROOT, THEME_CATALOG_BASELINE_FILE)}`);
}

if (require.main === module) main();
