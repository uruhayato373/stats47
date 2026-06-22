#!/usr/bin/env node
/**
 * docs/31_note記事原稿 の修正済み draft.md を R2 に書き戻す。
 * 対象: /tmp/note-style-problems.json にリストされた公開済み記事。
 * 前提: .env.local に R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_S3_ENDPOINT が設定済み。
 */
import { readFileSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../..')

// .env.local ロード
const envPath = join(ROOT, '.env.local')
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.trim().match(/^([A-Z0-9_]+)\s*=\s*(.+)$/)
    if (m) process.env[m[1]] = m[2].trim()
  }
} catch {}

const DRY_RUN = process.argv.includes('--dry-run')
if (DRY_RUN) console.log('[dry-run] R2 書き込みはスキップ')

const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')

const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'stats47'
const s3 = DRY_RUN ? null : new S3Client({
  region: 'auto',
  endpoint: process.env.R2_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const targets = JSON.parse(readFileSync('/tmp/note-style-problems.json', 'utf8'))
const DOCS31 = join(ROOT, 'docs/31_note記事原稿')

let ok = 0, skip = 0, err = 0

for (const { slug, vertical, r2_path } of targets) {
  const localPath = join(DOCS31, vertical, slug, 'draft.md')
  if (!existsSync(localPath)) { process.stdout.write('m'); skip++; continue }

  const content = readFileSync(localPath, 'utf8')
  const r2Key = (r2_path || `note/${vertical}/${slug}`) + '/draft.md'

  if (DRY_RUN) {
    console.log(`  [dry-run] WOULD PUT: ${r2Key}`)
    ok++
    continue
  }

  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: Buffer.from(content, 'utf8'),
      ContentType: 'text/markdown; charset=utf-8',
    }))
    process.stdout.write('.')
    ok++
  } catch (e) {
    console.error(`\nERROR: ${slug} — ${e.message}`)
    err++
  }
}

console.log(`\n完了: ${ok}件 / スキップ: ${skip}件 / エラー: ${err}件`)
