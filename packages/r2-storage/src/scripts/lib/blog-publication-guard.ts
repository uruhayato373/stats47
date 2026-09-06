import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';

import { GONE_BLOG_SLUGS } from '../../../../../apps/web/src/config/gone-blog-slugs';
import { METRICS_REGISTRY } from '../../../../data-configs/src/registry';
import type { ImageObjectStore } from '../../image-pipeline';

export const BLOG_INDEX_KEY = 'app/blog/all.json';
const root = resolve(__dirname, '../../../../..');
const contractFiles = [
  'apps/web/scripts/export-blog-snapshot.ts',
  'apps/web/src/config/gone-blog-slugs.ts',
  'apps/web/src/features/blog/services/article-survey-taxonomy.ts',
  'packages/ranking/src/survey/survey-taxonomy.ts',
  'packages/ranking/src/data/surveys.json',
  'packages/ranking/src/builders/build-ranking-item-from-metric.ts',
  'packages/data-configs/src/provenance/resolve-metric-provenance.ts',
  'packages/data-configs/src/ssds/source-name-to-survey.ts',
  'packages/data-configs/src/ssds/displayname-to-survey.ts',
  'packages/data-configs/src/ssds/estat-provenance.generated.json',
  'packages/data-configs/src/ssds/ssds-provenance.generated.json',
];

export function blogSnapshotHash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

/** Tooling-only fingerprint: stale checkout/staging must regenerate, not relabel old rows. */
export function blogPublicationContract(base: unknown) {
  const hash = createHash('sha256');
  for (const file of contractFiles) hash.update(file).update(readFileSync(resolve(root, file)));
  hash.update(JSON.stringify(METRICS_REGISTRY));
  return { contractSha256: hash.digest('hex'), baseSnapshotSha256: blogSnapshotHash(base) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseCandidate(body: Buffer) {
  const snapshot: unknown = JSON.parse(body.toString('utf8'));
  if (!isRecord(snapshot) || !isRecord(snapshot.publication) ||
      typeof snapshot.publication.baseSnapshotSha256 !== 'string' ||
      !/^[a-f0-9]{64}$/.test(snapshot.publication.baseSnapshotSha256) ||
      snapshot.publication.contractSha256 !== blogPublicationContract(null).contractSha256) {
    throw new Error('古いblog索引: 現行export-blog-snapshot.tsで再生成してください');
  }
  if (!Array.isArray(snapshot.articles) || snapshot.articles.some((row: unknown) =>
    !isRecord(row) || typeof row.slug !== 'string' || GONE_BLOG_SLUGS.has(row.slug))) {
    throw new Error('公開終了記事または不正な記事行を含むblog索引は公開できません');
  }
  return { snapshot, baseSnapshotSha256: snapshot.publication.baseSnapshotSha256 };
}

export function assertBlogPublicAssetsAllowed(keys: readonly string[], readBody: (key: string) => Buffer): void {
  for (const key of keys) {
    if (!key.startsWith('app/blog/')) continue;
    if (GONE_BLOG_SLUGS.has(key.split('/')[2])) throw new Error(`公開終了ブログの再送禁止: ${key}`);
    if (key !== BLOG_INDEX_KEY) continue;
    parseCandidate(readBody(key));
  }
}

/** Compare against the generation base, not merely the HEAD observed at upload time. */
export async function blogSnapshotWriteCondition(body: Buffer, store: ImageObjectStore) {
  const candidate = parseCandidate(body);
  const remote = await store.get(BLOG_INDEX_KEY);
  const current: unknown = remote ? JSON.parse((remote.contentEncoding === 'gzip' ? gunzipSync(remote.body) : remote.body).toString()) : null;
  if (blogSnapshotHash(candidate.snapshot) !== blogSnapshotHash(current) &&
      candidate.baseSnapshotSha256 !== blogSnapshotHash(current)) {
    throw new Error('blog索引の生成後に別writerが更新しました。最新R2を基に再生成してください');
  }
  if (!remote) return { ifNoneMatch: '*' as const };
  if (!remote.etag) throw new Error('blog索引のETag不明: 書込禁止');
  return { ifMatch: remote.etag };
}
