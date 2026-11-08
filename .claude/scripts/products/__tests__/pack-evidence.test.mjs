import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import JSZip from 'jszip';
import { inspectPack, selectPreview, sha256 } from '../lib/pack-evidence.mjs';

test('delivery contract rejects altered claims and artifacts; preview comes from the CSV', async () => {
  const root = mkdtempSync(join(tmpdir(), 'pack-evidence-'));
  try {
    const zip = new JSZip();
    for (let i = 1; i <= 9; i++) zip.file(`ppt/slides/slide${i}.xml`, '<p:sld/>');
    const files = { 'product.pptx': await zip.generateAsync({ type: 'nodebuffer' }),
      'data.csv': Buffer.from('コード,県,図書館数（人口100万人当たり）（館・2021）,注記\n' + Array.from({ length: 47 }, (_, i) => `${String(i + 1).padStart(2, '0')}000,県${i},${i},`).join('\n')),
      'SOURCES.csv': Buffer.from('調査名,表名\n社会・人口統計体系,図書館数（人口100万人当たり）\n') };
    for (const [name, bytes] of Object.entries(files)) writeFileSync(join(root, name), bytes);
    const manifest = Buffer.from(JSON.stringify({ files: Object.entries(files).map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: sha256(bytes) })) }));
    writeFileSync(join(root, 'manifest.json'), manifest);
    const listing = { _delivery: { artifactDirectory: '.', manifestSha256: sha256(manifest), indicatorCount: 1, pptxIndicatorCount: 1, hasXlsx: false } };
    const evidence = await inspectPack(root, listing);
    assert.equal(selectPreview(evidence, evidence.rows[0][2]).values[0][1], '0');
    assert.throws(() => selectPreview(evidence, 'invented metric'), /missing/);
    await assert.rejects(inspectPack(root, { _delivery: { ...listing._delivery, indicatorCount: 2 } }), /count mismatch/);
    await assert.rejects(inspectPack(root, { _delivery: { ...listing._delivery, hasXlsx: true } }), /Excel delivery mismatch/);
    writeFileSync(join(root, 'data.csv'), 'altered');
    await assert.rejects(inspectPack(root, listing), /artifact mismatch/);
  } finally { rmSync(root, { recursive: true, force: true }); }
});
