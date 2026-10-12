/**
 * note 記事本文の R2 保存 (正本)。git には置かない。
 *
 * - 作業コピー: docs/31_note記事原稿/<key>/ (stats47-note) または docs/31_note記事原稿/<vertical>/<key>/ (その他)。gitignore 済み
 * - 本文: 無料は公開 R2、有料は private R2 の <r2Path>/<file>
 * - 履歴: private R2 の note-archive/manifests/<key>/<sha256>.json (ファイル名→SHA の一覧) を保存ごとに不変保存し、
 *   上書き・削除される旧ファイルは note-archive/blobs/<sha256> へ退避する
 * - 台帳: data/note/articles.json の body.manifest に最新マニフェストの SHA を記録する
 *
 * 他の端末が先に保存していれば (R2 の実体が台帳の記録と違えば) 上書きせずに止まる。
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createR2Store } from './cover-storage.mjs';

const require = createRequire(import.meta.url);
const { R2_BUCKET, R2_PRIVATE_BUCKET } = require('../../lib/site-config.cjs');

export const WORKING_ROOT = 'docs/31_note記事原稿';
export const ARCHIVE_PREFIX = 'note-archive';
/** 有料記事の公開 R2 に置いてよい唯一のファイル (販売用のメタ。publish-paid の時代からの形) */
export const PAID_PUBLIC_META = 'public.json';

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const manifestKey = (key, sha) => `${ARCHIVE_PREFIX}/manifests/${key}/${sha}.json`;
export const blobKey = (sha) => `${ARCHIVE_PREFIX}/blobs/${sha}`;

export function workingDir(article, root) {
  const rel = article.vertical === 'stats47-note' ? article.key : `${article.vertical}/${article.key}`;
  return path.join(root, WORKING_ROOT, rel);
}

export function bodyBucket(article) {
  if (article.body.store === 'r2-public') return R2_BUCKET;
  if (article.body.store === 'r2-private') return R2_PRIVATE_BUCKET;
  throw Error(`${article.key}: 本文が note.com にしか無い (note-only) ため R2 の操作はできません`);
}

/** R2 stores for one article: its body bucket, the public bucket (paid leak check) and the private write-once archive. */
export function createArticleStores(article) {
  const body = createR2Store({ bucket: bodyBucket(article) });
  return {
    body,
    public: body.bucket === R2_BUCKET ? body : createR2Store({ bucket: R2_BUCKET }),
    archive: createR2Store({ bucket: R2_PRIVATE_BUCKET, writeOnce: true }),
  };
}

const SKIP = (name) => name.startsWith('.') || name === 'Thumbs.db';

/** Working-copy files as { name (posix, relative), bytes }. Dotfiles (.DS_Store, .gitkeep) are not article content. */
export function readLocalFiles(dir) {
  const files = [];
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (SKIP(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile()) files.push({ name: path.relative(dir, full).split(path.sep).join('/'), bytes: fs.readFileSync(full) });
    }
  };
  walk(dir);
  return files.sort((a, b) => (a.name < b.name ? -1 : 1));
}

export function buildManifest(key, files) {
  if (!files.some((f) => f.name === 'draft.md')) throw Error(`${key}: draft.md がありません`);
  const names = new Set();
  for (const f of files) {
    if (!/^[^/][^\\]*$/.test(f.name) || f.name.split('/').includes('..')) throw Error(`${key}: 不正なファイル名 ${f.name}`);
    if (names.has(f.name)) throw Error(`${key}: ファイル名が重複 ${f.name}`);
    names.add(f.name);
  }
  const manifest = {
    schemaVersion: 1,
    key,
    files: files.map((f) => ({ name: f.name, sha256: sha256(f.bytes), bytes: f.bytes.length }))
      .sort((a, b) => (a.name < b.name ? -1 : 1)),
  };
  const bytes = Buffer.from(`${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, bytes, sha256: sha256(bytes) };
}

export async function readManifest(article, archive) {
  const recorded = article.body.manifest;
  if (!recorded) return null;
  const bytes = await archive.get(manifestKey(article.key, recorded.sha256));
  if (!bytes || sha256(bytes) !== recorded.sha256) throw Error(`${article.key}: 台帳のマニフェストが R2 に無いか SHA が違います`);
  return JSON.parse(bytes.toString('utf8'));
}

async function putVerified(store, key, bytes) {
  await store.put(key, bytes);
  const check = await store.get(key);
  if (!check || sha256(check) !== sha256(bytes)) throw Error(`R2 の読み戻しが一致しません: ${key}`);
}

async function archiveBlob(archive, bytes) {
  const key = blobKey(sha256(bytes));
  const existing = await archive.get(key);
  if (existing && sha256(existing) !== sha256(bytes)) throw Error(`退避先の不変オブジェクトが一致しません: ${key}`);
  if (!existing) await putVerified(archive, key, bytes);
}

/**
 * Save files as the article's current body. Returns the ledger manifest record.
 * - Recorded files whose remote copy no longer matches the ledger are a conflict (another machine saved): stop.
 * - Replaced or removed remote files are archived to the private blob store before they change.
 */
export async function saveArticleFiles(article, files, stores, now = new Date()) {
  const { manifest, bytes: manifestBytes, sha256: manifestSha } = buildManifest(article.key, files);
  const previous = await readManifest(article, stores.archive);
  const recorded = new Map((previous?.files ?? []).map((f) => [f.name, f.sha256]));
  const remoteKey = (name) => `${article.r2Path}/${name}`;
  let uploaded = 0;
  for (const file of files) {
    const nextSha = sha256(file.bytes);
    const existing = await stores.body.get(remoteKey(file.name));
    if (existing && recorded.has(file.name) && sha256(existing) !== recorded.get(file.name))
      throw Error(`${article.key}/${file.name}: R2 の実体が台帳の記録と違います (別の端末が保存した可能性)。git pull してから checkout し直してください`);
    if (existing && sha256(existing) === nextSha) continue;
    if (existing) await archiveBlob(stores.archive, existing);
    await putVerified(stores.body, remoteKey(file.name), file.bytes);
    uploaded++;
  }
  const keep = new Set(files.map((f) => f.name));
  let removed = 0;
  for (const [name, sha] of recorded) {
    if (keep.has(name)) continue;
    const existing = await stores.body.get(remoteKey(name));
    if (!existing) continue;
    if (sha256(existing) !== sha) throw Error(`${article.key}/${name}: 削除しようとした R2 の実体が台帳の記録と違います`);
    await archiveBlob(stores.archive, existing);
    await stores.body.delete(remoteKey(name));
    removed++;
  }
  const manifestObject = manifestKey(article.key, manifestSha);
  const existingManifest = await stores.archive.get(manifestObject);
  if (!existingManifest) await putVerified(stores.archive, manifestObject, manifestBytes);
  else if (sha256(existingManifest) !== manifestSha) throw Error(`${article.key}: マニフェストの不変オブジェクトが一致しません`);
  return {
    record: { sha256: manifestSha, files: manifest.files.length, bytes: manifest.files.reduce((n, f) => n + f.bytes, 0), savedAt: now.toISOString() },
    uploaded,
    removed,
  };
}

/** Files currently stored for the article, checked against the recorded manifest. */
export async function loadArticleFiles(article, stores) {
  const manifest = await readManifest(article, stores.archive);
  if (!manifest) throw Error(`${article.key}: 本文がまだ R2 に保存されていません (body.manifest が null)`);
  const files = [];
  for (const entry of manifest.files) {
    const bytes = await stores.body.get(`${article.r2Path}/${entry.name}`);
    if (!bytes || sha256(bytes) !== entry.sha256) throw Error(`${article.key}/${entry.name}: R2 の実体がマニフェストと違います`);
    files.push({ name: entry.name, bytes });
  }
  return files;
}

/** Remote files under the article prefix, as { name, bytes } (used to adopt bodies saved before the ledger existed). */
export async function listRemoteFiles(article, store) {
  const objects = await store.list(`${article.r2Path}/`);
  const files = [];
  for (const o of objects) {
    const name = o.key.slice(article.r2Path.length + 1);
    if (!name || SKIP(path.posix.basename(name))) continue;
    if (store.bucket === R2_BUCKET && article.isPaid && name === PAID_PUBLIC_META) continue;
    const bytes = await store.get(o.key);
    if (bytes) files.push({ name, bytes });
  }
  return files.sort((a, b) => (a.name < b.name ? -1 : 1));
}

/**
 * Compare stored objects with the recorded manifest. Returns a list of problems (empty = ok).
 * deep downloads every file and compares SHA; otherwise names and sizes from the listing are compared.
 */
export async function verifyArticleStorage(article, stores, { deep = false } = {}) {
  const problems = [];
  if (article.body.store === 'note-only') return problems;
  let manifest;
  try {
    manifest = await readManifest(article, stores.archive);
  } catch (error) {
    return [error.message];
  }
  if (!manifest) return [`${article.key}: 本文が R2 に未保存 (body.manifest が null)`];
  const listed = new Map((await stores.body.list(`${article.r2Path}/`))
    .map((o) => [o.key.slice(article.r2Path.length + 1), o.size])
    .filter(([name]) => !name.split('/').some(SKIP)));
  for (const entry of manifest.files) {
    if (!listed.has(entry.name)) problems.push(`${article.key}/${entry.name}: R2 に無い`);
    else if (listed.get(entry.name) !== entry.bytes) problems.push(`${article.key}/${entry.name}: サイズがマニフェストと違う`);
    else if (deep) {
      const bytes = await stores.body.get(`${article.r2Path}/${entry.name}`);
      if (!bytes || sha256(bytes) !== entry.sha256) problems.push(`${article.key}/${entry.name}: SHA がマニフェストと違う`);
    }
  }
  const known = new Set(manifest.files.map((f) => f.name));
  for (const name of listed.keys())
    if (!known.has(name) && !(article.isPaid && stores.body.bucket === R2_BUCKET && name === PAID_PUBLIC_META))
      problems.push(`${article.key}/${name}: マニフェストに無いファイルが R2 にある`);
  if (article.isPaid) {
    const exposed = (await stores.public.list(`${article.r2Path}/`))
      .map((o) => o.key.slice(article.r2Path.length + 1)).filter((name) => name !== PAID_PUBLIC_META);
    if (exposed.length) problems.push(`${article.key}: 有料記事の本文が公開 R2 にある (${exposed.length} 件: ${exposed.slice(0, 3).join(', ')})`);
  }
  return problems;
}
