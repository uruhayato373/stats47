#!/usr/bin/env npx tsx
/** private R2 から有料note原稿と商品ZIPをハッシュ検証付きで復元する。 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

interface Article {
  vertical: string;
  is_paid: boolean;
  r2_path: string;
  r2_body: boolean;
  r2_access?: string;
}

interface Manifest {
  slug: string;
  vertical: string;
  access: 'private';
  files: Array<{ name: string; bytes: number; sha256: string }>;
}

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
dotenv.config({ path: path.join(repoRoot, '.env.local'), quiet: true });
const slug = process.argv[2];
if (!slug || slug.startsWith('--')) throw new Error('usage: restore-paid-note-private-r2.ts <slug>');
const endpoint = process.env.R2_S3_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
if (!endpoint || !accessKeyId || !secretAccessKey) throw new Error('R2 S3 credentials are required');
const bucket = process.env.R2_PRIVATE_BUCKET_NAME ?? 'stats47-private';
const client = new S3Client({ region: 'auto', endpoint, credentials: { accessKeyId, secretAccessKey } });
const state = JSON.parse(fs.readFileSync(path.join(repoRoot, '.claude/state/note-published-urls.json'), 'utf8')) as {
  articles: Record<string, Article>;
};
const article = state.articles[slug];

async function getObject(key: string): Promise<Buffer> {
  const out = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  if (!out.Body) throw new Error(`empty object: ${key}`);
  return Buffer.from(await out.Body.transformToByteArray());
}

function sha256(body: Buffer): string {
  return createHash('sha256').update(body).digest('hex');
}

async function main(): Promise<void> {
  if (!article?.is_paid || !article.r2_body || article.r2_access !== 'private') {
    throw new Error(`${slug}: private paid R2 article not found in catalog-derived state`);
  }
  const manifestBody = await getObject(`${article.r2_path}/manifest.json`);
  const manifest = JSON.parse(manifestBody.toString('utf8')) as Manifest;
  if (manifest.slug !== slug || manifest.vertical !== article.vertical || manifest.access !== 'private') {
    throw new Error(`${slug}: manifest identity mismatch`);
  }
  const articleDir = path.join(repoRoot, 'docs/31_note記事原稿', article.vertical, slug);
  if (fs.existsSync(articleDir)) throw new Error(`${slug}: restore destination already exists: ${articleDir}`);
  const staged = path.join('/tmp', `stats47-paid-note-restore-${process.pid}`, slug);
  for (const file of manifest.files) {
    if (path.isAbsolute(file.name) || file.name.split('/').includes('..')) throw new Error(`unsafe manifest path: ${file.name}`);
    const body = await getObject(`${article.r2_path}/${file.name}`);
    if (body.byteLength !== file.bytes || sha256(body) !== file.sha256) throw new Error(`hash mismatch: ${file.name}`);
    const target = path.join(staged, file.name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, body);
  }
  fs.mkdirSync(path.dirname(articleDir), { recursive: true });
  fs.renameSync(staged, articleDir);
  console.log(`restored ${manifest.files.length} verified files: ${articleDir}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
