import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

import {
  parseContentCrop,
  parsePageSelector,
  stageStatus,
  validateCropSpec,
  validateMdPage,
  validateOcrLayout,
  validatePageImageContract,
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
  assert.equal(readiness.profiles.length, 5);
  assert.deepEqual(
    readiness.profiles.map((profile) => profile.profile).sort(),
    [
      'claude-skills-guide-2026',
      'japan-zue',
      'kakei-marketing-2015',
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

test('page image contract validates dpi, format, quality, and content crop geometry', () => {
  assert.equal(validatePageImageContract(undefined), null);
  assert.deepEqual(
    validatePageImageContract({ dpi: 220, format: 'jpg', quality: 85, contentCrop: '1970x2550+236+268' }),
    {
      dpi: 220,
      format: 'jpg',
      quality: 85,
      contentCrop: { geometry: '1970x2550+236+268', width: 1970, height: 2550, x: 236, y: 268 },
    }
  );
  assert.deepEqual(validatePageImageContract({}), { dpi: 180, format: 'png', quality: 85, contentCrop: null });
  assert.throws(() => validatePageImageContract({ format: 'webp' }), /format must be png or jpg/);
  assert.throws(() => validatePageImageContract({ dpi: 30 }), /dpi must be an integer/);
  assert.throws(() => parseContentCrop('1970x2550'), /WxH\+X\+Y/);
  assert.throws(() => parseContentCrop('0x10+1+1'), /positive/);
});

test('markdown transcription pages require page/kind frontmatter and existing figure ids', () => {
  const known = new Set(['p0012-fig-1']);
  assert.deepEqual(
    validateMdPage({
      fileName: 'p0012.md',
      frontmatter: { page: 12, kind: 'figure', figures: ['p0012-fig-1'] },
      body: '図の要点',
      knownFigureIds: known,
    }),
    []
  );
  assert.match(
    validateMdPage({ fileName: 'p0012.md', frontmatter: { page: 13, kind: 'text' }, body: 'x', knownFigureIds: known }).join('\n'),
    /frontmatter.page must be 12/
  );
  assert.match(
    validateMdPage({ fileName: 'p0012.md', frontmatter: { page: 12, kind: 'poem' }, body: 'x', knownFigureIds: known }).join('\n'),
    /kind must be one of/
  );
  assert.match(
    validateMdPage({ fileName: 'p0012.md', frontmatter: { page: 12, kind: 'figure', figures: '[p0099-fig-1]' }, body: 'x', knownFigureIds: known }).join('\n'),
    /unknown figure id p0099-fig-1/
  );
  assert.match(
    validateMdPage({ fileName: 'p0012.md', frontmatter: { page: 12, kind: 'table' }, body: 'x', knownFigureIds: known }).join('\n'),
    /requires figures/
  );
  assert.match(
    validateMdPage({ fileName: 'p0012.md', frontmatter: { page: 12, kind: 'text' }, body: '  \n', knownFigureIds: known }).join('\n'),
    /body is empty/
  );
  assert.deepEqual(
    validateMdPage({ fileName: 'p0012.md', frontmatter: { page: 12, kind: 'blank' }, body: '', knownFigureIds: known }),
    []
  );
  assert.match(validateMdPage({ fileName: 'page12.md', frontmatter: {}, body: '', knownFigureIds: known }).join('\n'), /pNNNN\.md/);
});

test('stage status derives S0-S4 reach from manifest counts and inventory summary', () => {
  const manifest = {
    revision: 2,
    componentCounts: { markdown: 0, figures: 0, pageImages: 307, ocrRaw: 0, transcripts: 307, pdfs: 1, auxiliary: 1 },
  };
  const status = stageStatus(manifest, { input: { pages: 307 }, resolutionCoverage: 1 });
  assert.deepEqual(status.stages, {
    s0Preserved: true,
    s1PageImages: true,
    s2Transcripts: true,
    s2Markdown: false,
    s3Figures: false,
    s4Inventory: true,
  });
  const partial = stageStatus(manifest, { input: { pages: 400 }, resolutionCoverage: 0.5 });
  assert.equal(partial.stages.s1PageImages, false);
  assert.equal(partial.stages.s4Inventory, false);
  assert.equal(stageStatus({ revision: 1, componentCounts: {} }, null).stages.s0Preserved, false);
});
