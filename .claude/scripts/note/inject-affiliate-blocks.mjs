#!/usr/bin/env node
/**
 * koumuin-claude-code / koumuin-estat-claude-code の全記事に
 * アフィリエイトブロック（導入文 + バナープレースホルダー）を挿入して R2 に書き戻す。
 *
 * 挿入位置:
 *   - 「## まとめ」がある記事: その直前
 *   - 「## まとめ」がない記事: 最後の「---」分割線の直前
 *
 * 挿入内容:
 *   - AI Agent Camp バナー（全Claude Code系記事）
 *
 * 使い方:
 *   node .claude/scripts/note/inject-affiliate-blocks.mjs [--dry-run] [--slug <slug>]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../..')
const R2 = 'https://storage.stats47.jp'
const DRY_RUN = process.argv.includes('--dry-run')
const ONLY_SLUG = process.argv.includes('--slug')
  ? process.argv[process.argv.indexOf('--slug') + 1]
  : null

const envPath = join(ROOT, '.env.local')
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.trim().match(/^([A-Z0-9_]+)\s*=\s*(.+)$/)
    if (m) process.env[m[1]] = m[2].trim()
  }
} catch {}

const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'stats47'
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

// ── アフィリエイトブロック定義 ──────────────────────────────────────────────
const AFFILIATE_BLOCK_AI_AGENT_CAMP = `
---

💡 **この記事を書いた私から、Claude Code 学習でひとつだけご紹介させてください（PR）**

この記事を読んでいる方は、Claude Code を業務に取り入れようとしているか、すでに使い始めているのだと思います。

独学でも十分に使えますが、「もっと体系的に学びたい」「詰まったときにすぐサポートを受けたい」という方には、Claude Code に特化した研修プログラムも選択肢のひとつです。

このリンクから申し込んでいただくと、私に紹介料が入ります。それでもお伝えするのは、Claude Code を業務で使いこなしたいすべての方に本当に役立つと思っているからです。

{{AFFILIATE_BANNER:ai_agent_camp}}

▶ Claude Code 特化研修「AI Agent Camp」の詳細はこちら（無料相談あり）

---
`

// ── 対象記事 ────────────────────────────────────────────────────────────────
const TARGETS = [
  // koumuin-claude-code（無料・有料混在）
  ...['00-claude-code-intro-for-public-servants','01-claude-code-setup-complete',
      '02-internal-network-workarounds','03-it-dept-security-doc',
      '04-meeting-minutes-30min-to-5min','05-assembly-answer-prompts',
      '06-ordinance-revision-review','07-official-doc-skills',
      '08-proposal-doc-checklist-20','09-assembly-question-points',
      '10-ai-without-personal-info','11-hooks-personal-info-masking',
      '12-audit-ready-settings','13-ollama-offline-local-llm',
      '14-excel-budget-aggregation','15-data-preprocessing-intro',
      '16-subsidy-doc-consistency','17-year-on-year-analysis',
      '18-pr-magazine-rewrite','19-faq-auto-generation',
      '20-complaint-reply-patterns','21-disaster-sns-multilang',
      '31-claude-code-how-to-ask','32-claude-skills-getting-started',
  ].map(slug => ({ vertical: 'koumuin-claude-code', slug })),
  // koumuin-estat-claude-code
  ...['00-estat-claude-code-intro','01-estat-api-key-setup',
      '02-search-estat-statsdataid','03-fetch-prefecture-ranking',
      '04-excel-download-and-parse','05-pandas-duckdb-derived-metrics',
      '06-prefecture-code-and-merge','07-year-on-year-diff',
      '08-benchmark-table-5min','09-assembly-chart-generation',
      '10-claude-skills-routinize','11-mcp-sqlite-search',
  ].map(slug => ({ vertical: 'koumuin-estat-claude-code', slug })),
]

const targets = ONLY_SLUG
  ? TARGETS.filter(t => t.slug === ONLY_SLUG)
  : TARGETS

if (DRY_RUN) console.log('[dry-run mode]')

let ok = 0, skip = 0, err = 0

/**
 * アフィリエイトブロックを挿入する位置を決めて挿入済みのテキストを返す。
 * すでに {{AFFILIATE_BANNER:ai_agent_camp}} が含まれていればスキップ。
 */
function insertAffiliateBlock(text, block) {
  if (text.includes('{{AFFILIATE_BANNER:ai_agent_camp}}')) return null  // 挿入済み

  // 挿入位置 1: 「## まとめ」の直前
  const summaryMatch = text.match(/\n(## まとめ)/)
  if (summaryMatch) {
    const idx = text.indexOf('\n' + summaryMatch[1])
    return text.slice(0, idx) + '\n' + block.trimEnd() + '\n\n' + text.slice(idx + 1)
  }

  // 挿入位置 2: 有料境界行の直前（ブロック全体を探す）
  const paidMatch = text.match(/\n(ここから先は有料)/)
  if (paidMatch) {
    // 有料境界の直前の「---」行の前に挿入
    const paidIdx = text.indexOf('\nここから先は有料')
    // その手前の「---」を探す
    const before = text.slice(0, paidIdx)
    const lastHrIdx = before.lastIndexOf('\n---\n')
    if (lastHrIdx > 0) {
      return before.slice(0, lastHrIdx) + '\n' + block.trimEnd() + '\n' + text.slice(lastHrIdx)
    }
    // 「---」がなければ有料境界直前に挿入
    return before + '\n' + block.trimEnd() + '\n' + text.slice(paidIdx)
  }

  // 挿入位置 3: 末尾のフッター「---」の直前
  const footerIdx = text.lastIndexOf('\n---\n')
  if (footerIdx > 0) {
    return text.slice(0, footerIdx) + '\n' + block.trimEnd() + '\n' + text.slice(footerIdx)
  }

  // 挿入位置 4: 末尾
  return text.trimEnd() + '\n\n' + block.trimEnd() + '\n'
}

for (const { vertical, slug } of targets) {
  const r2Key = `note/${vertical}/${slug}/draft.md`
  const url = `${R2}/${r2Key}`

  process.stdout.write(`${slug}: `)

  // R2 から取得
  let text
  try {
    const res = await fetch(url)
    if (!res.ok) { console.log(`fetch ${res.status}`); err++; continue }
    text = await res.text()
  } catch (e) { console.log(`fetch error: ${e.message}`); err++; continue }

  // 挿入
  const updated = insertAffiliateBlock(text, AFFILIATE_BLOCK_AI_AGENT_CAMP)
  if (updated === null) { console.log('already inserted, skip'); skip++; continue }

  if (DRY_RUN) {
    // 挿入後の前後5行を表示
    const insertedIdx = updated.indexOf('{{AFFILIATE_BANNER')
    const lines = updated.split('\n')
    const lineNum = updated.slice(0, insertedIdx).split('\n').length
    console.log(`would insert at line ~${lineNum}`)
    console.log('  ...' + lines.slice(Math.max(0, lineNum - 3), lineNum + 5).join('\n  ').slice(0, 300))
    ok++; continue
  }

  // R2 に書き戻す
  try {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: r2Key,
      Body: Buffer.from(updated, 'utf8'),
      ContentType: 'text/markdown; charset=utf-8',
    }))
    console.log('OK')
    ok++
  } catch (e) { console.log(`R2 PUT error: ${e.message}`); err++ }
}

console.log(`\n完了: ${ok}件 / スキップ: ${skip}件 / エラー: ${err}件`)
