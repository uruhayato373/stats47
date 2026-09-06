import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { GEO_CROSS_ANALYSIS_SLUGS } from '../geo-cross-analysis';
import { parseGeoAnalysisManifest, parseGeoAnalysisPrefDetail } from '../load-geo-analysis-evidence';
import { parseGeoAnalysisSnapshot } from '../load-geo-analysis-snapshot';

// 任意のローカル生成物を実際の配信parserで検証する。CIではR2 mirrorなしならスキップ。
const root = resolve(process.cwd(), '../../.local/r2/app/geo');
const available = GEO_CROSS_ANALYSIS_SLUGS.every(slug => existsSync(resolve(root, slug, 'manifest.json')));
describe.skipIf(!available)('Geoローカル生成物の配信契約', () => {
  for (const slug of GEO_CROSS_ANALYSIS_SLUGS) {
    const read = (key: string) => JSON.parse(readFileSync(resolve(root, slug, `${key}.json`), 'utf8'));
    it(`${slug}: manifest・集計・47県の再計算値が有効`, () => {
      expect(parseGeoAnalysisManifest(read('manifest'), slug)).not.toBeNull();
      expect(parseGeoAnalysisSnapshot(read('item'), slug)).not.toBeNull();
      for (let i = 1; i <= 47; i++) {
        const pref = String(i).padStart(2, '0');
        expect(parseGeoAnalysisPrefDetail(read(`pref/${pref}`), slug, `${pref}000`), `${slug}/${pref}`).not.toBeNull();
      }
    });
  }
});
