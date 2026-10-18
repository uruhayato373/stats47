#!/usr/bin/env node
/**
 * sync-r2-state.mjs — 画像まわりの派生データ (data/content-operations/live/) と private R2 の正本をやり取りする。
 * 2026-10-18 オーナー判断「画像は R2」: 在庫索引・Web 画像索引・SNS 画像の移行記録は git に置かず、
 * private R2 の state/content-operations/ を正本にする (有料記事の画像名・SHA を含むため公開 R2 には置かない)。
 *
 *   npm run media:state:pull    # R2 → live/ (manifest の SHA を照合してから置き換える)
 *   npm run media:state:push    # live/ → R2 (全ファイル + manifest.json)。索引を作り直した後に実行する
 *
 * 台帳では対象の行に r2State を付けている (config/datasets.mjs)。読み手は live/ が無いとき、
 * 索引に依存する照合だけを省略する (check-workspace.mjs)。
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import dotenv from 'dotenv';
import { createR2Store } from '../note/lib/cover-storage.mjs';
import { datasetPath } from '../../../config/datasets.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(ROOT, '.env.local'), quiet: true });
const { R2_PRIVATE_BUCKET } = createRequire(import.meta.url)('../lib/site-config.cjs');
// live/ は台帳の r2State 行 (在庫索引) の置き場から引く
const LIVE = path.join(ROOT, path.dirname(datasetPath('content.image-inventory')));
const PREFIX = 'state/content-operations/';
const MANIFEST = `${PREFIX}manifest.json`;
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

function listLocal(dir, base = dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.name.startsWith('.')) return [];
    return entry.isDirectory() ? listLocal(full, base) : [path.relative(base, full).split(path.sep).join('/')];
  }).sort();
}

async function push(store) {
  const names = listLocal(LIVE);
  if (names.length === 0) throw Error(`live/ が空です: ${LIVE}`);
  const files = [];
  for (const name of names) {
    const bytes = fs.readFileSync(path.join(LIVE, name));
    await store.put(PREFIX + name, bytes);
    const back = await store.get(PREFIX + name);
    if (!back || sha256(back) !== sha256(bytes)) throw Error(`R2 の読み戻しが一致しません: ${name}`);
    files.push({ name, bytes: bytes.length, sha256: sha256(bytes) });
  }
  await store.put(MANIFEST, Buffer.from(`${JSON.stringify({ schemaVersion: 1, pushedAt: new Date().toISOString(), files }, null, 2)}\n`));
  console.log(JSON.stringify({ pushed: files.length, bytes: files.reduce((s, f) => s + f.bytes, 0), bucket: store.bucket, prefix: PREFIX }));
}

async function pull(store) {
  const raw = await store.get(MANIFEST);
  if (!raw) throw Error(`R2 に manifest がありません (${store.bucket}/${MANIFEST})。先に media:state:push を実行する`);
  const manifest = JSON.parse(raw.toString('utf8'));
  const temp = `${LIVE}.pull-${process.pid}`;
  fs.rmSync(temp, { recursive: true, force: true });
  for (const file of manifest.files) {
    if (!file.name || file.name.includes('..') || file.name.startsWith('/')) throw Error(`不正なファイル名: ${file.name}`);
    const bytes = await store.get(PREFIX + file.name);
    if (!bytes || sha256(bytes) !== file.sha256) throw Error(`SHA が一致しません: ${file.name}`);
    fs.mkdirSync(path.dirname(path.join(temp, file.name)), { recursive: true });
    fs.writeFileSync(path.join(temp, file.name), bytes);
  }
  fs.rmSync(LIVE, { recursive: true, force: true });
  fs.renameSync(temp, LIVE);
  console.log(JSON.stringify({ pulled: manifest.files.length, pushedAt: manifest.pushedAt, dir: path.relative(ROOT, LIVE) }));
}

const command = process.argv[2];
if (!['push', 'pull'].includes(command)) { console.error('Usage: sync-r2-state.mjs push|pull'); process.exit(2); }
const store = createR2Store({ bucket: R2_PRIVATE_BUCKET });
await (command === 'push' ? push(store) : pull(store));
