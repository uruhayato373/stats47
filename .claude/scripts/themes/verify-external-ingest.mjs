/**
 * 外部指標の取り込みスクリプトが手元に書いた値 (.local/r2/app/stats/<key>/values.json) を、R2 へ上げる前に検査する。
 * external-metric-ingest.yml が、取り込みの直後・R2 への反映の直前に呼ぶ。
 *
 * 使い方: node .claude/scripts/themes/verify-external-ingest.mjs --report <取り込みの報告 JSON> [--keys-out <ファイル>]
 *   報告の files[] (key と sha256) を唯一の対象の一覧として読み、1 件でも外れたら exit 1 で止まる。
 *   --keys-out には、R2 へ上げるキーをカンマ区切りで書く (push-exact-r2-assets.ts の --key に渡す)。
 *
 * 取り込みスクリプト自身も原典の形を検査しているが、ここは「上げるファイルそのもの」を読み直す。
 * 報告に載っていないファイル・報告と中身が違うファイル・47 県そろわない値を R2 へ出さないため。
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const PREFECTURE_COUNT = 47;
/** このスクリプトが上げてよい場所。観測値の都道府県の値だけ */
const KEY_PATTERN = /^app\/stats\/([a-z0-9]+(?:-[a-z0-9]+)*)\/values\.json$/;
const PREFECTURE_CODE = /^(0[1-9]|[1-3][0-9]|4[0-7])000$/;

const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');

/**
 * 報告と、手元のファイルの中身を突き合わせる。
 * read は R2 のキーを受けて、そのファイルの中身 (Buffer か文字列) を返す。
 * 戻り値は R2 へ上げるキーの一覧 (並びは報告の順)。
 */
export function verifyIngestReport(report, read) {
  assert.equal(report?.status, 'PASS', 'ingest report is not PASS');
  assert.equal(report.localStaged, true, 'ingest did not stage files (run with --write-local)');
  assert.ok(Array.isArray(report.files) && report.files.length > 0, 'ingest report has no files');
  assert.equal(report.files.length, report.metrics, 'report file count differs from metric count');

  const keys = report.files.map((file) => file.key);
  assert.equal(new Set(keys).size, keys.length, 'duplicate key in ingest report');

  for (const file of report.files) {
    const matched = KEY_PATTERN.exec(file.key);
    assert.ok(matched, `key is outside app/stats/<metric>/values.json: ${file.key}`);
    const metricKey = matched[1];
    const bytes = read(file.key);
    assert.equal(sha(bytes), file.sha256, `staged file differs from the ingest report: ${file.key}`);

    const payload = JSON.parse(String(bytes));
    assert.equal(payload.metricKey, metricKey, `metricKey mismatch: ${file.key}`);
    assert.equal(payload.entityKind, 'prefecture', `entityKind must be prefecture: ${file.key}`);
    assert.ok(Array.isArray(payload.rows) && payload.rows.length > 0, `no rows: ${file.key}`);
    assert.ok(payload.meta?.recipe?.configHash, `recipe is missing: ${file.key}`);

    const byYear = new Map();
    for (const row of payload.rows) {
      assert.match(String(row.areaCode), PREFECTURE_CODE, `invalid prefecture code: ${file.key} ${row.areaCode}`);
      assert.match(String(row.yearCode), /^\d{4}$/, `yearCode must be 4 digits: ${file.key} ${row.yearCode}`);
      assert.ok(typeof row.value === 'number' && Number.isFinite(row.value), `non-finite value: ${file.key} ${row.areaCode}`);
      assert.ok(typeof row.unit === 'string' && row.unit.length > 0, `unit is missing: ${file.key}`);
      const areas = byYear.get(row.yearCode) ?? new Set();
      assert.ok(!areas.has(row.areaCode), `duplicate prefecture in a year: ${file.key} ${row.yearCode} ${row.areaCode}`);
      areas.add(row.areaCode);
      byYear.set(row.yearCode, areas);
    }
    for (const [year, areas] of byYear) {
      assert.equal(areas.size, PREFECTURE_COUNT, `${PREFECTURE_COUNT} prefectures required: ${file.key} ${year} has ${areas.size}`);
    }
    assert.equal(payload.meta.rowCount, payload.rows.length, `meta.rowCount mismatch: ${file.key}`);
  }
  return keys;
}

function main() {
  const { values: options } = parseArgs({
    options: { report: { type: 'string' }, 'keys-out': { type: 'string' } },
  });
  assert.ok(options.report, '--report is required');
  const report = JSON.parse(readFileSync(resolve(root, options.report), 'utf8'));
  const keys = verifyIngestReport(report, (key) => readFileSync(resolve(root, '.local/r2', key)));
  if (options['keys-out']) writeFileSync(resolve(root, options['keys-out']), keys.join(','));
  console.log(JSON.stringify({ status: 'PASS', files: keys.length, keys }));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
