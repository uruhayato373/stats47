#!/usr/bin/env node
/** Official block-level profile only. No prefecture metrics and no remote writes. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
const require = createRequire(import.meta.url);
const {
  DEPOPULATED_SETTLEMENTS_SOURCE: source,
} = require('../../../packages/data-configs/src/theme-catalog/depopulated-settlements-source.ts');
const {
  parseDepopulatedSettlementsSnapshot,
} = require('../../../apps/web/src/features/depopulated-settlements/lib/depopulated-settlements-snapshot.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sha256 = (body) => createHash('sha256').update(body).digest('hex');
export function validateReportBytes(bytes) {
  assert.equal(bytes.length, source.bytes, 'official PDF bytes');
  assert.equal(sha256(bytes), source.sha256, 'official PDF SHA');
  assert.equal(bytes.subarray(0, 5).toString(), '%PDF-', 'PDF signature');
}
const numericColumns = (text) => {
  const tokens = text.trim().split(/\s+/);
  assert.equal(tokens.length, 11, 'exactly eleven numeric columns');
  assert(
    tokens.every((token) => /^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(token)),
    'missing/non-numeric is not zero'
  );
  const numbers = tokens.map((token) => Number(token.replaceAll(',', '')));
  assert(
    numbers.every((number) => Number.isSafeInteger(number) && number >= 0),
    'finite nonnegative integer counts'
  );
  return numbers;
};
const toRow = (blockCode, blockName, numbers) => ({
  blockCode,
  blockName,
  categories: source.categories.map((category, i) => ({
    key: category.key,
    count: numbers[i],
  })),
  total: numbers[7],
  age65ShareUnder50: numbers[8],
  age65Share50plus: numbers[9],
  age65Share100: numbers[10],
});
export function extractSettlementTable(
  pageText,
  generatedAt = new Date().toISOString()
) {
  assert(
    pageText.includes('図表2-93') && pageText.includes('図表2-94'),
    'exact neighboring figures'
  );
  const table = pageText
    .split('図表2-93')[1]
    .split('図表2-94')[0]
    .split('前回調査')[0];
  const rows = [];
  for (const line of table.split('\n')) {
    const match = line.match(
      /^\s*(\d{1,2})\s+(北海道|東北圏|首都圏|北陸圏|中部圏|近畿圏|中国圏|四国圏|九州圏|沖縄県)\s+(.+)$/
    );
    if (match)
      rows.push(
        toRow(match[1].padStart(2, '0'), match[2], numericColumns(match[3]))
      );
  }
  const nationalMatches = [
    ...table.matchAll(/^\s*([\d,]+(?:\s+[\d,]+){10})\s*\n\s*合計\s*$/gm),
  ];
  assert.equal(
    nationalMatches.length,
    1,
    'extract the official national row, not previous survey'
  );
  const snapshot = {
    schemaVersion: 1,
    seriesKey: 'depopulated-settlements',
    period: source.period,
    unit: source.unit,
    geography: source.geography,
    universeId: source.universeId,
    generatedAt,
    source: {
      title: source.title,
      url: source.url,
      sha256: source.sha256,
      pdfPage: source.pdfPage,
      mappingPdfPage: source.mappingPdfPage,
    },
    rows,
    national: toRow('00', '全国', numericColumns(nationalMatches[0][1])),
  };
  const parsed = parseDepopulatedSettlementsSnapshot(snapshot);
  assert(
    parsed,
    'strict geography, categories, source, national pins and conservation'
  );
  return parsed;
}
export async function main(args = process.argv.slice(2)) {
  const { values } = parseArgs({
    args,
    options: {
      'source-dir': {
        type: 'string',
        default: '.local/verification/themes/depopulated-settlements-source',
      },
      'output-dir': {
        type: 'string',
        default:
          '.local/verification/themes/depopulated-settlements-source/reproduced',
      },
      download: { type: 'boolean', default: false },
      'write-local': { type: 'boolean', default: false },
    },
  });
  const sourceDir = resolve(values['source-dir']);
  const outputDir = resolve(values['output-dir']);
  const filename = resolve(sourceDir, 'settlements-report-2024.pdf');
  if (values.download) {
    const response = await fetch(source.url);
    assert(response.ok, `official PDF HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    validateReportBytes(bytes);
    await mkdir(sourceDir, { recursive: true });
    await writeFile(filename, bytes);
    await writeFile(
      `${filename}.source.json`,
      JSON.stringify(
        {
          url: source.url,
          finalUrl: response.url,
          sha256: source.sha256,
          bytes: bytes.length,
          fetchedAt: new Date().toISOString(),
        },
        null,
        2
      ) + '\n'
    );
  }
  const raw = await readFile(filename);
  validateReportBytes(raw);
  const page = execFileSync(
    'pdftotext',
    [
      '-f',
      String(source.pdfPage),
      '-l',
      String(source.pdfPage),
      '-layout',
      filename,
      '-',
    ],
    { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 }
  );
  const snapshot = extractSettlementTable(page);
  const body = JSON.stringify(snapshot, null, 2) + '\n';
  let receipt = null;
  try {
    receipt = JSON.parse(await readFile(`${filename}.source.json`, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    // Supplied PDF is still verified by SHA; absent acquisition time remains unknown.
  }
  if (receipt) {
    assert.equal(receipt.url, source.url, 'receipt URL');
    assert.equal(receipt.sha256, source.sha256, 'receipt SHA');
  }
  await mkdir(outputDir, { recursive: true });
  await writeFile(resolve(outputDir, 'depopulated-settlements.json'), body);
  const proof = {
    status: 'PASS',
    source: {
      url: source.url,
      sha256: source.sha256,
      bytes: raw.length,
      fetchedAt: receipt?.fetchedAt ?? null,
      verifiedAt: new Date().toISOString(),
      localPath: filename,
    },
    table: source.table,
    pdfPage: source.pdfPage,
    printedPage: source.printedPage,
    geographyDefinition: {
      table: source.mappingTable,
      pdfPage: source.mappingPdfPage,
      sha256: source.sha256,
      method:
        'Authored mapping transcribed from rightmost column; 47 rows visually verified against pinned PDF.',
    },
    checks: {
      blockCount: 10,
      prefectureObservationsCreated: 0,
      exclusiveRows: 11,
      subtotalChecks: 22,
      subsetChecks: 11,
      nationalColumnSums: 11,
      nationalPins: 11,
    },
    national: source.nationalPins,
    payloadSha256: sha256(body),
    r2Key: source.r2Key,
    limitations: source.notes,
  };
  await writeFile(
    resolve(outputDir, 'verification.json'),
    JSON.stringify(proof, null, 2) + '\n'
  );
  if (values['write-local']) {
    const target = resolve(root, '.local/r2', source.r2Key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, body);
  }
  return proof;
}
if (
  process.argv[1] &&
  realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
) {
  main().then((proof) =>
    process.stdout.write(
      JSON.stringify({
        status: proof.status,
        blocks: proof.checks.blockCount,
        prefectureObservationsCreated: 0,
        payloadSha256: proof.payloadSha256,
      }) + '\n'
    )
  );
}
