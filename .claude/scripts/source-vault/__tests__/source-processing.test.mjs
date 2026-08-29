import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

import {
  parsePageSelector,
  validateCropSpec,
  validateOcrLayout,
} from '../source-processing.mjs';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../../..');
const SCRIPT = path.join(
  PROJECT_ROOT,
  '.claude/scripts/source-vault/source-processing.mjs'
);

test('all source profiles have a restorable processing contract', async () => {
  const { stdout } = await execFileAsync(
    process.execPath,
    [SCRIPT, 'readiness', '--contract-only'],
    { cwd: PROJECT_ROOT }
  );
  const readiness = JSON.parse(stdout);
  assert.equal(readiness.ready, true);
  assert.equal(readiness.contractOnly, true);
  assert.equal(readiness.profiles.length, 4);
  assert.deepEqual(
    readiness.profiles.map((profile) => profile.profile).sort(),
    [
      'claude-skills-guide-2026',
      'japan-zue',
      'prefecture-databook-2021',
      'prefecture-deviation',
    ]
  );
  for (const profile of readiness.profiles) {
    assert.ok(profile.pdfCount > 0);
    assert.equal(profile.publicOriginalReuse, 'forbidden');
  }
});

test('page selector is explicit, bounded, deduplicated, and sorted', () => {
  assert.deepEqual(parsePageSelector('5,2-3,3', 8), [2, 3, 5]);
  assert.throws(
    () => parsePageSelector('all', 3),
    /requires --allow-all-pages/
  );
  assert.deepEqual(parsePageSelector('all', 3, true), [1, 2, 3]);
  assert.throws(() => parsePageSelector('0,2', 3), /outside 1-3/);
  assert.throws(() => parsePageSelector('2-4', 3), /outside 1-3/);
  assert.throws(() => parsePageSelector('1;2', 3), /Invalid page selector/);
});

test('OCR layout accepts only deterministic rotations and Tesseract modes', () => {
  assert.deepEqual(validateOcrLayout('90', '4'), {
    rotationDegrees: 90,
    pageSegmentationMode: 4,
  });
  assert.throws(() => validateOcrLayout(45, 4), /rotation must be one of/);
  assert.throws(() => validateOcrLayout(0, 14), /psm must be an integer/);
});

test('crop spec requires an internal-only rights and primary-source gate', () => {
  const workspace = {
    profile: 'prefecture-databook-2021',
    sourceKey: 'prefecture-databook',
    edition: '2021',
    revision: 1,
    sourceBundleSha256: 'abc',
    documents: [{ id: 'pdf-123', path: 'sample.pdf', pages: 2 }],
  };
  const valid = {
    schemaVersion: 1,
    profile: workspace.profile,
    sourceKey: workspace.sourceKey,
    edition: workspace.edition,
    revision: workspace.revision,
    sourceBundleSha256: workspace.sourceBundleSha256,
    internalUseOnly: true,
    publicOriginalReuse: 'forbidden',
    crops: [
      {
        id: 'prefecture-symbol-box',
        document: 'sample.pdf',
        page: 1,
        box: { unit: 'pixel', x: 10, y: 20, width: 300, height: 200 },
        purpose: '県シンボルの事実照合',
        sourceRef: 'p.1 県のシンボル欄',
        intendedStats47Use: '一次資料で裏取りする候補の抽出',
        primarySourceRequired: true,
      },
    ],
  };
  assert.equal(validateCropSpec(valid, workspace), valid);
  assert.throws(
    () =>
      validateCropSpec({ ...valid, publicOriginalReuse: 'allowed' }, workspace),
    /publicOriginalReuse must be forbidden/
  );
  assert.throws(
    () =>
      validateCropSpec(
        {
          ...valid,
          crops: [{ ...valid.crops[0], primarySourceRequired: false }],
        },
        workspace
      ),
    /primarySourceRequired must be true/
  );
});
