// テーマの出典の提案は、台帳 themes.sources (data/themes/sources/<名前>.json) へそのまま置ける JSON で書き・読む。
// 提案が TS のままだと、取り込むたびに手で JSON へ写すことになる (THEME-SOURCE-PROPOSAL-WRITES-TS-01)。
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { datasetDir } from '../../../../config/datasets.mjs';
import { assertDatasetShape } from '../../lib/dataset-shape.mjs';
import { readSourceDefinition } from '../ingest-bridge-inspection-age.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../../..');
const ledgerFile = (name) => join(ROOT, datasetDir('themes.sources'), `${name}.json`);

function withTempDir(run) {
  const dir = mkdtempSync(join(tmpdir(), 'theme-source-proposal-'));
  const cleanup = () => rmSync(dir, { recursive: true, force: true });
  return Promise.resolve().then(() => run(dir)).finally(cleanup);
}

test('prepare-proposal.py は出典の提案を、台帳へそのまま置ける名前と形の JSON で書く', () =>
  withTempDir((dir) => {
    const ledgerText = readFileSync(ledgerFile('property-price-distribution'), 'utf8');
    const ledger = JSON.parse(ledgerText);
    const area = { areaCode: '13000', areaName: '東京都', transactions: { median: 1, count: 2 }, officialLandPrice: { median: 3, count: 4 } };
    writeFileSync(
      join(dir, 'property-prices.json'),
      JSON.stringify({ definition: ledger.definition, notes: ledger.notes, sourceFiles: [{ file: '13.csv', sha256: '0'.repeat(64) }], areas: [area] })
    );
    const run = spawnSync('python3', [resolve(HERE, '../property-prices/prepare-proposal.py')], {
      env: { ...process.env, STATS47_PROPERTY_SOURCE_DIR: dir },
      encoding: 'utf8',
    });
    assert.equal(run.status, 0, run.stderr);
    assert.equal(existsSync(join(dir, 'property-price-distribution-source.ts')), false, '提案を TS で書いていない');

    const text = readFileSync(join(dir, 'property-price-distribution.json'), 'utf8');
    const proposal = JSON.parse(text);
    assertDatasetShape('themes.sources', proposal);
    // 採用済みの入力 (定義と注意書き) からは、原典の束の SHA 以外が台帳と 1 バイトも違わないファイルになる
    assert.notEqual(proposal.sourceManifestSha256, ledger.sourceManifestSha256);
    assert.equal(text.replace(proposal.sourceManifestSha256, ledger.sourceManifestSha256), ledgerText);
  }));

test('ingest-bridge-inspection-age の --proposal-dir は台帳と同じ名前の JSON を読む', () =>
  withTempDir(async (dir) => {
    const proposal = { ...JSON.parse(readFileSync(ledgerFile('bridge-inspection-age'), 'utf8')), year: '2099' };
    writeFileSync(join(dir, 'bridge-inspection-age.json'), JSON.stringify(proposal, null, 2) + '\n');
    assert.deepEqual(await readSourceDefinition({ root: ROOT, proposal: dir }), proposal);
  }));

test('台帳の形に合わない提案は、取り込みの前に止まる', () =>
  withTempDir(async (dir) => {
    const ledger = JSON.parse(readFileSync(ledgerFile('bridge-inspection-age'), 'utf8'));
    writeFileSync(join(dir, 'bridge-inspection-age.json'), JSON.stringify({ ...ledger, publicBaseUrl: 'https://example.com' }));
    await assert.rejects(readSourceDefinition({ root: ROOT, proposal: dir }), /dataset_shape_mismatch: themes\.sources/);
  }));

test('提案を渡さなければ台帳の値を読む', async () => {
  const ledger = JSON.parse(readFileSync(ledgerFile('bridge-inspection-age'), 'utf8'));
  assert.deepEqual(await readSourceDefinition({ root: ROOT }), ledger);
});
