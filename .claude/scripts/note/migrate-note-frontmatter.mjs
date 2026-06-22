#!/usr/bin/env node
/**
 * note-published-urls.json → R2 draft.md frontmatter マイグレーション
 *
 * 公開済み記事の R2 draft.md frontmatter に以下を追加する:
 *   note_url: https://note.com/stats47/n/nXXXXX
 *   published: true
 *   published_at: YYYY-MM-DD
 *   (is_paid: true/false, price_jpy: N は既存の場合は更新しない)
 *
 * Usage:
 *   node .claude/scripts/note/migrate-note-frontmatter.mjs              # dry-run
 *   DRY_RUN=false node .claude/scripts/note/migrate-note-frontmatter.mjs  # 本番
 *   DRY_RUN=false node .claude/scripts/note/migrate-note-frontmatter.mjs --slug <slug>  # 1件
 *
 * 前提: .env.local に R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_S3_ENDPOINT が設定済み
 */

import { readFileSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../..')
const require = createRequire(import.meta.url)

// .env.local を手動ロード
const envPath = join(ROOT, '.env.local')
try {
  const envContent = readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const m = line.trim().match(/^([A-Z0-9_]+)\s*=\s*(.+)$/)
    if (m) process.env[m[1]] = m[2].trim()
  }
} catch (e) {
  // .env.local がなくても CI では環境変数が設定済み
}

const DRY_RUN = process.env.DRY_RUN !== 'false'
if (DRY_RUN) console.log('[dry-run] R2 書き込みはスキップ')

// R2 S3 API
const { S3Client, PutObjectCommand, GetObjectCommand } = await import('@aws-sdk/client-s3').then(
  m => m
)
const { Readable } = await import('stream')

const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_S3_ENDPOINT = process.env.R2_S3_ENDPOINT
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'stats47'

if (!DRY_RUN && (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_S3_ENDPOINT)) {
  console.error('ERROR: R2 credentials 未設定 (.env.local を確認)')
  process.exit(1)
}

const s3 = DRY_RUN ? null : new S3Client({
  region: 'auto',
  endpoint: R2_S3_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
})

// note-published-urls.json 読み込み
const publishedPath = join(ROOT, '.claude/state/note-published-urls.json')
const publishedData = JSON.parse(readFileSync(publishedPath, 'utf8'))
const articles = publishedData.articles || {}

// CLI 引数
const args = process.argv.slice(2)
const targetSlug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null

// ============================================================
// frontmatter パーサー / ライター
// ============================================================

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/s)
  if (!m) return { fm: {}, body: content, raw: '' }
  const raw = m[1]
  const body = m[2]
  const fm = {}
  for (const line of raw.split('\n')) {
    const lm = line.match(/^([^:]+):\s*(.*)$/)
    if (lm) fm[lm[1].trim()] = lm[2].trim()
  }
  return { fm, body, raw }
}

function serializeFrontmatter(fm) {
  const lines = []
  for (const [k, v] of Object.entries(fm)) {
    lines.push(`${k}: ${v}`)
  }
  return lines.join('\n')
}

/**
 * R2 から文字列を GET する
 */
async function r2Get(key) {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key })
  const res = await s3.send(cmd)
  const chunks = []
  for await (const chunk of res.Body) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

/**
 * R2 に文字列を PUT する
 */
async function r2Put(key, content) {
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: Buffer.from(content, 'utf8'),
    ContentType: 'text/markdown; charset=utf-8',
  })
  await s3.send(cmd)
}

// ============================================================
// 1件処理
// ============================================================

async function processSingle(slug, info) {
  if (typeof info !== 'object' || !info.vertical) {
    console.log(`  SKIP (コメント行): ${slug}`)
    return 'skip'
  }

  const { vertical, url, published_at, is_paid, price_jpy, r2_path } = info
  if (!url) {
    console.log(`  SKIP (URL なし): ${slug}`)
    return 'skip'
  }

  const r2Key = r2_path ? `${r2_path}/draft.md` : `note/${vertical}/${slug}/draft.md`

  // R2 から draft.md を取得（dry-run は公開URLで取得）
  let content
  if (DRY_RUN) {
    const publicUrl = `https://storage.stats47.jp/${r2Key}`
    const res = await fetch(publicUrl)
    if (!res.ok) {
      console.log(`  SKIP (R2 fetch 失敗 ${res.status}): ${slug}`)
      return 'skip'
    }
    content = await res.text()
  } else {
    try {
      content = await r2Get(r2Key)
    } catch (e) {
      console.log(`  SKIP (R2 GET 失敗): ${slug} — ${e.message}`)
      return 'skip'
    }
  }

  const { fm, body, raw } = parseFrontmatter(content)

  // すでに note_url が設定済みならスキップ（冪等）
  if (fm.note_url) {
    console.log(`  ALREADY: ${slug} (${fm.note_url})`)
    return 'already'
  }

  // frontmatter に追記するフィールド
  const updates = {
    note_url: url,
    published: 'true',
    published_at: published_at || '',
  }
  // is_paid / price_jpy は既存になければ追加
  if (!fm.is_paid) updates.is_paid = String(is_paid || false)
  if (!fm.price_jpy && price_jpy != null) updates.price_jpy = String(price_jpy)

  const newFm = { ...fm, ...updates }
  const newContent = `---\n${serializeFrontmatter(newFm)}\n---\n${body}`

  if (DRY_RUN) {
    const added = Object.keys(updates).join(', ')
    console.log(`  [dry-run] WOULD UPDATE: ${slug} — add {${added}}`)
    return 'would-update'
  }

  await r2Put(r2Key, newContent)
  console.log(`  UPDATED: ${slug} → ${url}`)
  return 'updated'
}

// ============================================================
// メイン
// ============================================================

const targets = targetSlug
  ? { [targetSlug]: articles[targetSlug] }
  : articles

const slugs = Object.entries(targets).filter(([, v]) => typeof v === 'object' && v.vertical)
console.log(`\n=== note frontmatter マイグレーション (${slugs.length}件) ===`)

const results = { updated: 0, already: 0, skip: 0, 'would-update': 0 }
for (const [slug, info] of slugs) {
  const status = await processSingle(slug, info)
  results[status] = (results[status] || 0) + 1
}

console.log('\n=== 完了 ===')
for (const [k, v] of Object.entries(results)) {
  if (v > 0) console.log(`  ${k}: ${v}件`)
}
if (DRY_RUN) {
  console.log('\n本番実行: DRY_RUN=false node .claude/scripts/note/migrate-note-frontmatter.mjs')
}
