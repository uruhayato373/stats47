#!/usr/bin/env npx tsx
/**
 * 有料noteの完全原稿をprivate R2へ保存し、公開R2には販売メタだけを残す。
 *
 * Usage:
 *   npx tsx .claude/scripts/note/publish-paid-note-private-r2.ts <slug...>          # dry-run
 *   npx tsx .claude/scripts/note/publish-paid-note-private-r2.ts <slug...> --commit
 *   npx tsx .claude/scripts/note/publish-paid-note-private-r2.ts --migrate-existing --commit
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import {
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { assertR2WriteAllowed } from '../../../packages/r2-storage/src/scripts/_assert-ci-write';

interface PublishedArticle {
  vertical: string;
  title: string;
  url: string;
  is_paid: boolean;
  price_jpy?: number;
  r2_path: string;
  r2_body: boolean;
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(repoRoot, '.env.local'), quiet: true });
const args = process.argv.slice(2);
const commit = args.includes('--commit');
const migrateExisting = args.includes('--migrate-existing');
const requested = args.filter((value) => !value.startsWith('--'));
const publicBucket = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? 'stats47';
const privateBucket = process.env.R2_PRIVATE_BUCKET_NAME ?? 'stats47-private';
const endpoint = process.env.R2_S3_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
if (!endpoint || !accessKeyId || !secretAccessKey) {
  throw new Error('R2 S3 credentials are required (.env.local or environment)');
}
const client = new S3Client({
  region: 'auto',
  endpoint,
  credentials: { accessKeyId, secretAccessKey },
});
const state = JSON.parse(
  fs.readFileSync(path.join(repoRoot, '.claude/state/note-published-urls.json'), 'utf8'),
) as { articles: Record<string, PublishedArticle> };

function sha256(body: Uint8Array | string): string {
  return createHash('sha256').update(body).digest('hex');
}

function localSource(article: PublishedArticle, slug: string): string | null {
  const nested = path.join(repoRoot, 'docs/31_note記事原稿', article.vertical, slug);
  if (fs.existsSync(nested)) return nested;
  const top = path.join(repoRoot, 'docs/31_note記事原稿', slug);
  return fs.existsSync(top) ? top : null;
}

function localFiles(dir: string, base = dir): Array<{ name: string; body: Buffer }> {
  const files: Array<{ name: string; body: Buffer }> = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...localFiles(full, base));
    else files.push({ name: path.relative(base, full).split(path.sep).join('/'), body: fs.readFileSync(full) });
  }
  return files;
}

function localProductFiles(source: string): Array<{ name: string; body: Buffer }> {
  const draftPath = path.join(source, 'draft.md');
  if (!fs.existsSync(draftPath)) return [];
  const draft = fs.readFileSync(draftPath, 'utf8');
  const match = draft.match(/^product_archive:\s*["']?([^"'\n]+)["']?\s*$/m);
  if (!match) return [];
  const archivePath = path.resolve(repoRoot, match[1].trim());
  const allowedRoot = path.join(repoRoot, '.local/geo-products') + path.sep;
  if (!archivePath.startsWith(allowedRoot) || path.extname(archivePath).toLowerCase() !== '.zip') {
    throw new Error(`product_archive is outside .local/geo-products or is not ZIP: ${match[1]}`);
  }
  if (!fs.existsSync(archivePath)) throw new Error(`product archive not found: ${match[1]}`);
  const body = fs.readFileSync(archivePath);
  if (body.byteLength > 50 * 1024 * 1024) throw new Error(`product archive exceeds note 50MB limit: ${match[1]}`);
  return [{ name: `product/${path.basename(archivePath)}`, body }];
}

async function listObjects(bucket: string, prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let token: string | undefined;
  do {
    const out = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: `${prefix}/`, ContinuationToken: token }));
    keys.push(...(out.Contents ?? []).flatMap((value) => value.Key ? [value.Key] : []));
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function getObject(bucket: string, key: string): Promise<Buffer> {
  const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!out.Body) throw new Error(`empty object: ${bucket}/${key}`);
  return Buffer.from(await out.Body.transformToByteArray());
}

async function putObject(bucket: string, key: string, body: Buffer | string, contentType: string): Promise<void> {
  await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: contentType }));
}

async function deletePrefix(bucket: string, prefix: string): Promise<void> {
  const keys = await listObjects(bucket, prefix);
  for (let i = 0; i < keys.length; i += 1000) {
    await client.send(new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: { Quiet: true, Objects: keys.slice(i, i + 1000).map((Key) => ({ Key })) },
    }));
  }
}

function contentType(name: string): string {
  if (name.endsWith('.json')) return 'application/json; charset=utf-8';
  if (name.endsWith('.md') || name.endsWith('.txt')) return 'text/plain; charset=utf-8';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

async function privateFilesFor(slug: string, article: PublishedArticle): Promise<Array<{ name: string; body: Buffer }>> {
  const source = localSource(article, slug);
  if (source) return [...localFiles(source), ...localProductFiles(source)];
  if (!migrateExisting) throw new Error(`${slug}: local source not found`);
  let bucket = publicBucket;
  let keys = await listObjects(publicBucket, article.r2_path);
  if (!keys.includes(`${article.r2_path}/draft.md`)) {
    bucket = privateBucket;
    keys = await listObjects(privateBucket, article.r2_path);
  }
  if (!keys.includes(`${article.r2_path}/draft.md`)) throw new Error(`${slug}: complete R2 source not found`);
  return Promise.all(keys.map(async (key) => ({
    name: key.slice(article.r2_path.length + 1),
    body: await getObject(bucket, key),
  })));
}

async function publishOne(slug: string, article: PublishedArticle): Promise<Record<string, unknown>> {
  if (!article.is_paid || !article.url || !article.r2_path) throw new Error(`${slug}: published paid metadata missing`);
  const files = await privateFilesFor(slug, article);
  if (!files.some((file) => file.name === 'draft.md')) throw new Error(`${slug}: draft.md missing`);
  const manifest = {
    schemaVersion: 1,
    slug,
    vertical: article.vertical,
    access: 'private',
    noteUrl: article.url,
    files: files
      .filter((file) => file.name !== 'manifest.json')
      .map((file) => ({ name: file.name, bytes: file.body.byteLength, sha256: sha256(file.body) }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  };
  const manifestBody = `${JSON.stringify(manifest, null, 2)}\n`;
  const privatePayload = [
    ...files.filter((file) => file.name !== 'manifest.json'),
    { name: 'manifest.json', body: Buffer.from(manifestBody) },
  ];
  const publicMetadata = `${JSON.stringify({
    schemaVersion: 1,
    slug,
    vertical: article.vertical,
    title: article.title,
    noteUrl: article.url,
    isPaid: true,
    priceJpy: article.price_jpy ?? null,
    contentLocation: 'note-paywall',
    fullSourceStorage: 'private-r2',
  }, null, 2)}\n`;

  console.log(`${commit ? 'publish' : 'dry-run'} ${slug}: ${privatePayload.length} private objects / public metadata only`);
  if (!commit) return { slug, files: privatePayload.length, status: 'dry-run' };

  await deletePrefix(privateBucket, article.r2_path);
  for (const file of privatePayload) {
    await putObject(privateBucket, `${article.r2_path}/${file.name}`, file.body, contentType(file.name));
  }
  const privateKeys = await listObjects(privateBucket, article.r2_path);
  if (!privateKeys.includes(`${article.r2_path}/draft.md`) || privateKeys.length !== privatePayload.length) {
    throw new Error(`${slug}: private R2 verification failed`);
  }
  for (const file of privatePayload) {
    const stored = await getObject(privateBucket, `${article.r2_path}/${file.name}`);
    if (stored.byteLength !== file.body.byteLength || sha256(stored) !== sha256(file.body)) {
      throw new Error(`${slug}: private R2 hash verification failed: ${file.name}`);
    }
  }

  await deletePrefix(publicBucket, article.r2_path);
  await putObject(publicBucket, `${article.r2_path}/public.json`, publicMetadata, 'application/json; charset=utf-8');
  const publicKeys = await listObjects(publicBucket, article.r2_path);
  if (publicKeys.length !== 1 || publicKeys[0] !== `${article.r2_path}/public.json`) {
    throw new Error(`${slug}: public R2 sanitization failed`);
  }
  return {
    slug,
    status: 'published',
    privateObjects: privateKeys.length,
    publicObjects: publicKeys.length,
    manifestSha256: sha256(manifestBody),
  };
}

async function main(): Promise<void> {
  assertR2WriteAllowed({ op: 'publish paid note source to private R2', dryRun: !commit });
  const selected = migrateExisting
    ? Object.entries(state.articles).filter(([, article]) => article.is_paid === true && article.r2_body === true)
    : requested.map((slug) => [slug, state.articles[slug]] as const);
  if (selected.length === 0) throw new Error('paid note slug is required');
  for (const [slug, article] of selected) if (!article) throw new Error(`${slug}: not found in published index`);

  const results: Record<string, unknown>[] = [];
  for (const [slug, article] of selected) results.push(await publishOne(slug, article));
  const report = {
    generatedAt: new Date().toISOString(),
    mode: migrateExisting ? 'migrate-existing' : 'publish-local',
    committed: commit,
    publicBucket,
    privateBucket,
    results,
  };
  fs.writeFileSync('/tmp/paid-note-r2-publish-report.json', `${JSON.stringify(report, null, 2)}\n`);
  console.log(`done: ${results.length} article(s) → /tmp/paid-note-r2-publish-report.json`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
