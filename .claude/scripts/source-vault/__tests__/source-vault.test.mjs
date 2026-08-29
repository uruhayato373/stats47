import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../../..');
const CONFIG = path.join(PROJECT_ROOT, '.claude/config/source-vault.json');
const SCRIPT = path.join(
  PROJECT_ROOT,
  '.claude/scripts/source-vault/source-vault.mjs'
);

async function fixture() {
  const root = path.join(
    tmpdir(),
    `stats47-source-vault-test-${process.pid}-${Date.now()}`
  );
  const source = path.join(root, '日本国勢図絵');
  await mkdir(path.join(source, 'md'), { recursive: true });
  await mkdir(path.join(source, 'pages', '01'), { recursive: true });
  await writeFile(path.join(source, 'md', 'p026.md'), 'sample\n');
  await writeFile(
    path.join(source, 'pages', '01', 'p026.jpg'),
    'image-bytes\n'
  );
  await writeFile(path.join(source, 'page-dims.json'), '{}\n');
  return {
    root,
    source,
    bundle: path.join(root, 'stats47-japan-zue-2025-26-r1.tar.gz'),
    manifest: path.join(root, 'stats47-japan-zue-2025-26-r1.manifest.json'),
    parts: path.join(root, 'parts'),
  };
}

async function run(args) {
  return execFileAsync(process.execPath, [SCRIPT, ...args], {
    cwd: PROJECT_ROOT,
  });
}

test('source vault profiles follow the canonical private Drive hierarchy', async () => {
  const config = JSON.parse(await readFile(CONFIG, 'utf8'));
  assert.equal(config.schemaVersion, 2);
  assert.equal(config.driveRootFolder, 'stats47');
  assert.equal(config.driveCollectionFolder, '参考文献');
  for (const profile of Object.values(config.profiles)) {
    assert.equal(typeof profile.driveSourceFolderName, 'string');
    assert.equal(typeof profile.driveEditionFolderName, 'string');
  }
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(config.profiles).map(([key, profile]) => [
        key,
        [
          config.driveCollectionFolder,
          profile.driveSourceFolderName,
          profile.driveEditionFolderName,
        ].join('/'),
      ])
    ),
    {
      'japan-zue': '参考文献/日本国勢図会/2025・2026年版',
      'prefecture-deviation': '参考文献/47都道府県の偏差値/2018年版',
      'prefecture-databook-2021': '参考文献/2021都道府県DataBook/2021年版',
      'claude-skills-guide-2026': '参考文献/Claudeスキル構築ガイド/2026年版',
    }
  );
  assert.deepEqual(config.profiles['prefecture-deviation'].bibliography, {
    title: '47都道府県の偏差値',
    author: '久保哲朗',
    publisher: '小学館',
    published: '2018-02',
    isbn: '978-4-09-825317-3',
    verifiedAt:
      'https://ndlsearch.ndl.go.jp/books/R100000002-I028765909',
  });
});

test('check-local confirms private source material is absent from the repository', async () => {
  const checked = await run(['check-local']);
  assert.match(checked.stdout, /"clean": true/);
  assert.match(checked.stdout, /"books\/"/);
  assert.match(checked.stdout, /"docs\/books\/"/);
  assert.match(checked.stdout, /"\.claude\/pdfs\/"/);
});

test('create and verify produce a complete immutable manifest', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));

  await run([
    'create',
    '--source',
    paths.source,
    '--bundle',
    paths.bundle,
    '--manifest',
    paths.manifest,
    '--parts-dir',
    paths.parts,
    '--part-size-mib',
    '1',
  ]);
  const manifest = JSON.parse(await readFile(paths.manifest, 'utf8'));
  assert.equal(manifest.fileCount, 3);
  assert.equal(manifest.componentCounts.markdown, 1);
  assert.equal(manifest.componentCounts.pageImages, 1);
  assert.equal(manifest.componentCounts.auxiliary, 1);
  assert.equal(manifest.files.length, 3);
  assert.equal(manifest.bundle.parts.length, 1);
  assert.equal(
    manifest.storage.folderPath,
    '参考文献/日本国勢図会/2025・2026年版'
  );

  const verified = await run([
    'verify',
    '--manifest',
    paths.manifest,
    '--bundle',
    paths.bundle,
    '--source',
    paths.source,
    '--parts-dir',
    paths.parts,
  ]);
  assert.match(verified.stdout, /"fileCount": 3/);
});

test('verify rejects changed and unexpected source files', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await run([
    'create',
    '--source',
    paths.source,
    '--bundle',
    paths.bundle,
    '--manifest',
    paths.manifest,
    '--parts-dir',
    paths.parts,
    '--part-size-mib',
    '1',
  ]);
  await writeFile(path.join(paths.source, 'md', 'p026.md'), 'changed\n');
  await writeFile(path.join(paths.source, 'extra.txt'), 'extra\n');

  await assert.rejects(
    run(['verify', '--manifest', paths.manifest, '--source', paths.source]),
    /Source verification failed/
  );
});

test('restore verifies the bundle and refuses overwrite', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await run([
    'create',
    '--source',
    paths.source,
    '--bundle',
    paths.bundle,
    '--manifest',
    paths.manifest,
    '--parts-dir',
    paths.parts,
    '--part-size-mib',
    '1',
  ]);
  const target = path.join(paths.root, 'restored', '日本国勢図絵');
  await run([
    'restore',
    '--manifest',
    paths.manifest,
    '--bundle',
    paths.bundle,
    '--target',
    target,
  ]);
  assert.equal(
    await readFile(path.join(target, 'md', 'p026.md'), 'utf8'),
    'sample\n'
  );
  await assert.rejects(
    run([
      'restore',
      '--manifest',
      paths.manifest,
      '--bundle',
      paths.bundle,
      '--target',
      target,
    ]),
    /refusing to overwrite/
  );
});

test('restore refuses a target inside the public repository', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await run([
    'create',
    '--source',
    paths.source,
    '--bundle',
    paths.bundle,
    '--manifest',
    paths.manifest,
    '--parts-dir',
    paths.parts,
  ]);
  await assert.rejects(
    run([
      'restore',
      '--manifest',
      paths.manifest,
      '--bundle',
      paths.bundle,
      '--target',
      path.join(PROJECT_ROOT, 'books', 'restore-must-not-land-here'),
    ]),
    /Restore target must be outside the public Git repository/
  );
});

test('restore assembles verified parts', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await run([
    'create',
    '--source',
    paths.source,
    '--bundle',
    paths.bundle,
    '--manifest',
    paths.manifest,
    '--parts-dir',
    paths.parts,
    '--part-size-mib',
    '1',
  ]);
  await rm(paths.bundle);
  const target = path.join(paths.root, 'parts-restored', '日本国勢図絵');
  await run([
    'restore',
    '--manifest',
    paths.manifest,
    '--parts-dir',
    paths.parts,
    '--target',
    target,
  ]);
  assert.equal(
    await readFile(path.join(target, 'md', 'p026.md'), 'utf8'),
    'sample\n'
  );
});

test('profile creates and restores a second private source', async (t) => {
  const root = path.join(
    tmpdir(),
    `stats47-source-vault-profile-test-${process.pid}-${Date.now()}`
  );
  t.after(() => rm(root, { recursive: true, force: true }));
  const source = path.join(root, '47都道府県の偏差値');
  const bundle = path.join(
    root,
    'stats47-prefecture-deviation-2018-r1.tar.gz'
  );
  const manifestPath = path.join(
    root,
    'stats47-prefecture-deviation-2018-r1.manifest.json'
  );
  const parts = path.join(root, 'parts');
  await mkdir(source, { recursive: true });
  await writeFile(path.join(source, 'scan.pdf'), 'private-source\n');

  await run([
    'create',
    '--profile',
    'prefecture-deviation',
    '--source',
    source,
    '--bundle',
    bundle,
    '--manifest',
    manifestPath,
    '--parts-dir',
    parts,
  ]);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  assert.equal(manifest.profile, 'prefecture-deviation');
  assert.equal(manifest.sourceKey, 'prefecture-deviation');
  assert.equal(manifest.edition, '2018');
  assert.equal(manifest.sourceRootName, '47都道府県の偏差値');
  assert.equal(manifest.componentCounts.pdfs, 1);

  await rm(bundle);
  const target = path.join(root, 'restored', '47都道府県の偏差値');
  await run([
    'restore',
    '--manifest',
    manifestPath,
    '--parts-dir',
    parts,
    '--target',
    target,
  ]);
  assert.equal(
    await readFile(path.join(target, 'scan.pdf'), 'utf8'),
    'private-source\n'
  );
});

test('verify rejects manifest paths that can escape the download directory', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await run([
    'create',
    '--source',
    paths.source,
    '--bundle',
    paths.bundle,
    '--manifest',
    paths.manifest,
    '--parts-dir',
    paths.parts,
  ]);
  const manifest = JSON.parse(await readFile(paths.manifest, 'utf8'));
  manifest.bundle.parts[0].fileName = '../outside.part';
  await writeFile(paths.manifest, `${JSON.stringify(manifest)}\n`);
  await assert.rejects(
    run(['verify', '--manifest', paths.manifest, '--parts-dir', paths.parts]),
    /Unsafe manifest part fileName/
  );
});
