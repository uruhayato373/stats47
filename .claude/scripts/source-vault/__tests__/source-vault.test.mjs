import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdir, readFile, rm, writeFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';

import {
  VAULT_ROOT_ENV,
  contentSha256,
  resolveVaultRoot,
} from '../source-vault.mjs';

const execFileAsync = promisify(execFile);
const PROJECT_ROOT = path.resolve(import.meta.dirname, '../../../..');
const CONFIG = path.join(PROJECT_ROOT, '.claude/config/source-vault.json');
const SCRIPT = path.join(
  PROJECT_ROOT,
  '.claude/scripts/source-vault/source-vault.mjs'
);

/**
 * source root (work) と偽の Drive マウント (vaultRoot/参考文献/日本国勢図会/2025・2026年版) を
 * 一時領域に作る。CLI は env でマウントを差し替えられるので実 Drive に触らない。
 */
async function fixture() {
  const root = path.join(
    tmpdir(),
    `stats47-source-vault-test-${process.pid}-${Date.now()}`
  );
  const source = path.join(root, 'work', '日本国勢図絵');
  await mkdir(path.join(source, 'md'), { recursive: true });
  await mkdir(path.join(source, 'pages', '01'), { recursive: true });
  await writeFile(path.join(source, 'md', 'p026.md'), 'sample\n');
  await writeFile(
    path.join(source, 'pages', '01', 'p026.jpg'),
    'image-bytes\n'
  );
  await writeFile(path.join(source, 'page-dims.json'), '{}\n');
  await writeFile(path.join(source, '.DS_Store'), 'finder-noise\n');
  const vaultRoot = path.join(root, 'stats47');
  const vaultDir = path.join(vaultRoot, '参考文献', '日本国勢図会', '2025・2026年版');
  await mkdir(vaultDir, { recursive: true });
  return {
    root,
    source,
    vaultRoot,
    vaultDir,
    manifest: path.join(root, 'stats47-japan-zue-2025-26.manifest.json'),
    restoreTarget: path.join(root, 'restore', '日本国勢図絵'),
  };
}

async function run(args, env = {}) {
  return execFileAsync(process.execPath, [SCRIPT, ...args], {
    cwd: PROJECT_ROOT,
    env: { ...process.env, ...env },
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
      'kakei-marketing-2015': '参考文献/マーケティングに使える家計調査/2015年版',
      'capital-city-guide': '参考文献/47都道府県県庁所在地ガイド/版不明',
      'money-health-ranking': '参考文献/おカネと健康 都道府県ランキング/版不明',
      'yabai-kenmin-ranking': '参考文献/全国47都道府県やばい県民ランキング/版不明',
      'amusement-shop-density': '参考文献/全国都道府県遊技営業店密度ランキング/版不明',
      'gis-business-guide': '参考文献/最新GISのビジネス活用がよ〜くわかる本/版不明',
      'prefecture-ranking-consumption':
        '参考文献/統計から読み解く47都道府県ランキング 消費・子供・スポーツ編/版不明',
      'average-income-ranking': '参考文献/都道府県別平均年収ランキング/版不明',
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

test('vault root resolution prefers the env override and reports tried candidates', () => {
  const env = { [VAULT_ROOT_ENV]: '/mnt/drive/stats47/' };
  const exists = (target) => target === path.join('/mnt/drive/stats47', '参考文献');
  assert.deepEqual(resolveVaultRoot({ env, exists }), {
    root: '/mnt/drive/stats47',
    source: `env:${VAULT_ROOT_ENV}`,
  });
  assert.throws(
    () => resolveVaultRoot({ env, exists: () => false }),
    /does not contain 参考文献/
  );
  // 日本語ロケールの macOS マウント (`マイドライブ`) を候補から見つける
  const home = '/Users/tester';
  const mount = path.join(home, 'Library/CloudStorage/GoogleDrive-a@example.com/マイドライブ/stats47');
  const found = resolveVaultRoot({
    env: {},
    platform: 'darwin',
    homeDir: home,
    listDir: () => ['GoogleDrive-a@example.com'],
    exists: (target) => target === path.join(mount, '参考文献'),
  });
  assert.deepEqual(found, { root: mount, source: 'candidate' });
  assert.throws(
    () =>
      resolveVaultRoot({
        env: {},
        platform: 'darwin',
        homeDir: home,
        listDir: () => [],
        exists: () => false,
      }),
    new RegExp(`Set ${VAULT_ROOT_ENV}`)
  );
});

test('content hash is order-independent and changes with any file', () => {
  const files = [
    { path: 'b.pdf', sha256: '22' },
    { path: 'a.pdf', sha256: '11' },
  ];
  assert.equal(contentSha256(files), contentSha256([...files].reverse()));
  assert.notEqual(
    contentSha256(files),
    contentSha256([files[0], { path: 'a.pdf', sha256: '99' }])
  );
});

test('create → upload → verify --vault → restore round-trips through the mounted vault', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  const env = { [VAULT_ROOT_ENV]: paths.vaultRoot };

  await run(['create', '--source', paths.source, '--manifest', paths.manifest]);
  const manifest = JSON.parse(await readFile(paths.manifest, 'utf8'));
  assert.equal(manifest.schemaVersion, 2);
  assert.equal(manifest.storage.layout, 'expanded');
  assert.equal(manifest.storage.folderPath, '参考文献/日本国勢図会/2025・2026年版');
  assert.equal(manifest.fileCount, 3, '.DS_Store は manifest に入らない');
  assert.equal(manifest.componentCounts.markdown, 1);
  assert.equal(manifest.componentCounts.pageImages, 1);
  assert.equal(manifest.componentCounts.auxiliary, 1);
  assert.equal(manifest.contentSha256, contentSha256(manifest.files));

  const uploaded = await run(
    ['upload', '--source', paths.source, '--manifest', paths.manifest],
    env
  );
  const uploadResult = JSON.parse(uploaded.stdout);
  assert.equal(uploadResult.copied, 3);
  assert.equal(uploadResult.unchanged, 0);
  assert.equal(uploadResult.readback.fileCount, 3);
  assert.ok(
    (await readdir(paths.vaultDir)).includes('stats47-japan-zue-2025-26.manifest.json'),
    'manifest のコピーを vault directory にも置く'
  );

  const again = JSON.parse(
    (await run(['upload', '--source', paths.source, '--manifest', paths.manifest], env)).stdout
  );
  assert.equal(again.unchanged, 3, '再 upload は sha256 一致を触らない');

  const verified = await run(['verify', '--manifest', paths.manifest, '--vault'], env);
  assert.match(verified.stdout, /"fileCount": 3/);

  const restored = await run(
    ['restore', '--manifest', paths.manifest, '--target', paths.restoreTarget],
    env
  );
  assert.match(restored.stdout, /"fileCount": 3/);
  assert.equal(
    await readFile(path.join(paths.restoreTarget, 'md', 'p026.md'), 'utf8'),
    'sample\n'
  );
  await assert.rejects(
    run(['restore', '--manifest', paths.manifest, '--target', paths.restoreTarget], env),
    /already exists/
  );
});

test('verify rejects changed, missing, and unexpected files in source and vault', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  const env = { [VAULT_ROOT_ENV]: paths.vaultRoot };
  await run(['create', '--source', paths.source, '--manifest', paths.manifest]);
  await run(['upload', '--source', paths.source, '--manifest', paths.manifest], env);

  await writeFile(path.join(paths.vaultDir, 'md', 'p026.md'), 'tampered\n');
  await assert.rejects(
    run(['verify', '--manifest', paths.manifest, '--vault'], env),
    /content mismatch: md\/p026\.md/
  );
  await assert.rejects(
    run(['upload', '--source', paths.source, '--manifest', paths.manifest], env),
    /differs from manifest; use --force/
  );
  const forced = JSON.parse(
    (await run(['upload', '--source', paths.source, '--manifest', paths.manifest, '--force'], env)).stdout
  );
  assert.equal(forced.replaced, 1);

  await writeFile(path.join(paths.vaultDir, 'stray.txt'), 'x\n');
  await assert.rejects(
    run(['verify', '--manifest', paths.manifest, '--vault'], env),
    /unexpected file: stray\.txt/
  );
  await rm(path.join(paths.vaultDir, 'stray.txt'));
  await rm(path.join(paths.vaultDir, 'page-dims.json'));
  await assert.rejects(
    run(['verify', '--manifest', paths.manifest, '--vault'], env),
    /missing file: page-dims\.json/
  );

  await writeFile(path.join(paths.source, 'md', 'p026.md'), 'changed\n');
  await assert.rejects(
    run(['verify', '--manifest', paths.manifest, '--source', paths.source]),
    /content mismatch: md\/p026\.md/
  );
});

test('manifest whose contentSha256 does not match files[] is rejected', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await run(['create', '--source', paths.source, '--manifest', paths.manifest]);
  const manifest = JSON.parse(await readFile(paths.manifest, 'utf8'));
  manifest.files[0].sha256 = 'f'.repeat(64);
  await writeFile(paths.manifest, JSON.stringify(manifest));
  await assert.rejects(
    run(['verify', '--manifest', paths.manifest, '--source', paths.source]),
    /contentSha256 does not match/
  );
});

test('create refuses a source root inside the repository or with the wrong name', async (t) => {
  const paths = await fixture();
  t.after(() => rm(paths.root, { recursive: true, force: true }));
  await assert.rejects(
    run(['create', '--source', path.join(PROJECT_ROOT, 'docs'), '--manifest', paths.manifest]),
    /outside the public Git repository/
  );
  await assert.rejects(
    run(['create', '--source', paths.root, '--manifest', paths.manifest]),
    /Source root must be named 日本国勢図絵/
  );
});
