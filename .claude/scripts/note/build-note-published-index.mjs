#!/usr/bin/env node
/**
 * R2 の draft.md frontmatter を走査して note-published-urls.json を再構築する。
 *
 * note-published-urls.json は「派生インデックス」= このスクリプトで再生成できる派生物。
 * 真実源は R2 draft.md の frontmatter (note_url / published: true)。
 *
 * Usage:
 *   node .claude/scripts/note/build-note-published-index.mjs              # 全件再構築
 *   node .claude/scripts/note/build-note-published-index.mjs --dry-run    # 差分だけ表示
 *
 * 参照先:
 *   R2 note-draft-index.json  → 全スラッグ一覧
 *   R2 <vertical>/<slug>/draft.md → frontmatter を読んで note_url を収集
 *   .claude/state/note-published-urls.json → 上書き出力
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../..')

const DRY_RUN = process.argv.includes('--dry-run')
if (DRY_RUN) console.log('[dry-run] ファイル書き込みはスキップ')

const R2_PUBLIC = 'https://storage.stats47.jp'
const OUT_FILE = join(ROOT, '.claude/state/note-published-urls.json')

// ============================================================
// frontmatter パーサー
// ============================================================

function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/s)
  if (!m) return {}
  const fm = {}
  for (const line of m[1].split('\n')) {
    const lm = line.match(/^([^:]+):\s*(.*)$/)
    if (lm) {
      let val = lm[2].trim()
      // YAML boolean
      if (val === 'true') val = true
      else if (val === 'false') val = false
      // 数値
      else if (/^\d+$/.test(val)) val = Number(val)
      // クォート除去
      else val = val.replace(/^["']|["']$/g, '')
      fm[lm[1].trim()] = val
    }
  }
  return fm
}

// ============================================================
// 走査対象スラッグを収集（公開済み + 未公開ドラフト）
// ============================================================

function collectAllSlugs() {
  const slugMap = {}

  // 1. note-draft-index.json から未公開ドラフト（37件）
  const localIndexPath = join(ROOT, '.claude/state/note-draft-index.json')
  const localData = JSON.parse(readFileSync(localIndexPath, 'utf8'))
  for (const [slug, info] of Object.entries(localData.drafts || {})) {
    if (info && info.vertical) slugMap[slug] = { vertical: info.vertical, r2_path: info.r2_path }
  }

  // 2. note-published-urls.json から公開済み（SSOT の先駆け→今後はfrontmatter参照に移行）
  try {
    const pubData = JSON.parse(readFileSync(OUT_FILE, 'utf8'))
    for (const [slug, info] of Object.entries(pubData.articles || {})) {
      if (typeof info !== 'object' || !info.vertical) continue
      if (!slugMap[slug]) {
        slugMap[slug] = { vertical: info.vertical, r2_path: info.r2_path }
      }
    }
  } catch (e) {
    // 初回生成時は skip
  }

  return slugMap
}

// ============================================================
// メイン
// ============================================================

console.log('=== note-published-urls.json 再構築 ===')

const allSlugs = collectAllSlugs()
const slugs = Object.entries(allSlugs)
console.log(`走査対象: ${slugs.length}件（公開済み + 未公開ドラフト）`)

// note-published-urls.json の既存データを保持（コメント行等のメタ保持）
let existing = {}
try {
  existing = JSON.parse(readFileSync(OUT_FILE, 'utf8'))
} catch (e) {
  // 初回生成
}

const articles = {}
let publishedCount = 0
let notPublishedCount = 0

for (const [slug, info] of slugs) {
  if (!info || !info.vertical) continue
  const { vertical, r2_path } = info
  const r2Key = r2_path || `note/${vertical}/${slug}`
  const url = `${R2_PUBLIC}/${r2Key}/draft.md`

  let fm = {}
  try {
    const res = await fetch(url)
    if (!res.ok) {
      notPublishedCount++
      continue
    }
    const content = await res.text()
    fm = parseFrontmatter(content)
  } catch (e) {
    notPublishedCount++
    continue
  }

  // note_url があれば公開済みとみなす（published: true は任意フィールド）
  if (!fm.note_url) {
    notPublishedCount++
    continue
  }

  const entry = {
    vertical,
    title: fm.title || slug,
    url: fm.note_url,
    is_paid: fm.is_paid || false,
    published_at: fm.published_at || '',
    r2_path: r2Key,
    status: 'r2_ready',
  }
  if (fm.price_jpy) entry.price_jpy = fm.price_jpy
  if (fm.updated_at) entry.updated_at = fm.updated_at

  articles[slug] = entry
  publishedCount++
  process.stdout.write('.')
}

console.log(`\n\n公開済み: ${publishedCount}件 / 未公開: ${notPublishedCount}件`)

if (DRY_RUN) {
  const existing_slugs = Object.keys((existing.articles || {})).filter(k => !k.startsWith('_'))
  const new_slugs = Object.keys(articles)
  const added = new_slugs.filter(s => !existing_slugs.includes(s))
  const removed = existing_slugs.filter(s => !new_slugs.includes(s))
  console.log(`\n差分: +${added.length}件 / -${removed.length}件`)
  if (added.length > 0) console.log('追加:', added.slice(0, 10).join(', '))
  if (removed.length > 0) console.log('削除:', removed.slice(0, 10).join(', '))
  console.log('\n本番実行: node .claude/scripts/note/build-note-published-index.mjs')
  process.exit(0)
}

// コメント行は保持
const comments = Object.fromEntries(
  Object.entries(existing.articles || {}).filter(([k]) => k.startsWith('_'))
)

const output = {
  _meta: {
    generated_by: 'build-note-published-index.mjs',
    generated_at: new Date().toISOString().slice(0, 10),
    source: 'R2 draft.md frontmatter (note_url + published: true)',
    note: 'このファイルは派生インデックス。真実源は R2 draft.md の frontmatter。',
  },
  articles: { ...comments, ...articles },
}

writeFileSync(OUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf8')
console.log(`\n✓ 書き出し完了: .claude/state/note-published-urls.json (${publishedCount}件)`)
