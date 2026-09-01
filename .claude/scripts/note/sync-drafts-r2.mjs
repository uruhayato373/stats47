#!/usr/bin/env node
/**
 * 未公開の note ドラフトを R2 に同期し、docs/31 から削除する。
 *
 * 使い方:
 *   node .claude/scripts/note/sync-drafts-r2.mjs              # dry-run
 *   DRY_RUN=false node .claude/scripts/note/sync-drafts-r2.mjs  # 本番
 *
 * CI (sync-note-r2.yml) から DRY_RUN=false で呼ばれる。
 * ローカルからの直接実行は dry-run のみ推奨 (R2 書き込みは CI 専用)。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, readdirSync } from 'fs'
import { resolve, join, relative } from 'path'
import { execSync } from 'child_process'

const ROOT = resolve(import.meta.dirname, '../../..')
const DRAFT_INDEX_FILE = join(ROOT, '.claude/state/note-draft-index.json')
const DOCS31 = join(ROOT, 'docs/31_note記事原稿')
const LOCAL_R2 = join(ROOT, '.local/r2')

const DRY_RUN = process.env.DRY_RUN !== 'false'

if (DRY_RUN) console.log('[dry-run mode] R2 push / docs/31 削除はスキップ')

const data = JSON.parse(readFileSync(DRAFT_INDEX_FILE, 'utf8'))
const drafts = data.drafts

function findSrcDir(vertical, slug) {
  if (vertical === 'stats47-note') {
    const topLevel = join(DOCS31, slug)
    return existsSync(topLevel) ? topLevel : null
  }
  const nested = join(DOCS31, vertical, slug)
  return existsSync(nested) ? nested : null
}

function listFiles(dir, base = dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...listFiles(full, base))
    } else {
      results.push(relative(base, full))
    }
  }
  return results
}

const synced = []
const skipped = []
const errors = []

for (const [slug, info] of Object.entries(drafts)) {
  if (info.r2_path) {
    skipped.push(slug)
    continue
  }

  const { vertical } = info
  const srcDir = findSrcDir(vertical, slug)

  if (!srcDir) {
    skipped.push(slug)
    continue
  }

  const draftPath = join(srcDir, 'draft.md')
  if (existsSync(draftPath) && /^is_paid:\s*true\s*$/m.test(readFileSync(draftPath, 'utf8'))) {
    const message = `${slug}: paid draft must not be uploaded to public R2`
    console.error(`  ❌ ${message}`)
    errors.push({ slug, error: message })
    continue
  }

  const r2Prefix = `note/${vertical}/${slug}`
  const r2StagingDir = join(LOCAL_R2, 'note', vertical, slug)

  console.log(`\n▶ ${slug}`)
  console.log(`  src:    ${relative(ROOT, srcDir)}`)
  console.log(`  r2:     ${r2Prefix}`)

  try {
    if (!DRY_RUN) {
      mkdirSync(r2StagingDir, { recursive: true })
      cpSync(srcDir, r2StagingDir, { recursive: true })

      const files = listFiles(r2StagingDir)
      writeFileSync(
        join(r2StagingDir, 'manifest.json'),
        JSON.stringify({ slug, vertical, status: 'draft', files, synced_at: new Date().toISOString() }, null, 2)
      )

      execSync(
        `npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix "${r2Prefix}"`,
        { stdio: 'inherit', cwd: ROOT }
      )

      info.r2_path = r2Prefix
    } else {
      const files = listFiles(srcDir)
      console.log(`  files:  ${files.length} 件 (${files.slice(0, 3).join(', ')}${files.length > 3 ? '...' : ''})`)
      console.log(`  [dry-run] push スキップ`)
    }

    synced.push({ slug, vertical, r2Prefix, srcDir })
  } catch (err) {
    console.error(`  ❌ エラー: ${err.message}`)
    errors.push({ slug, error: err.message })
  }
}

if (!DRY_RUN && synced.length > 0) {
  data.updated = new Date().toISOString().slice(0, 10)
  writeFileSync(DRAFT_INDEX_FILE, JSON.stringify(data, null, 2) + '\n')
  console.log(`\n✅ note-draft-index.json 更新 (r2_path 追記)`)
}

console.log(`\n=== ドラフト同期結果 ===`)
console.log(`synced:  ${synced.length} 件`)
console.log(`skipped: ${skipped.length} 件 (r2_path 記録済み or docs/31 不在)`)
console.log(`errors:  ${errors.length} 件`)

if (synced.length > 0) {
  console.log(`\n=== docs/31 削除対象 ===`)
  for (const { slug, srcDir } of synced) {
    console.log(`  ${relative(ROOT, srcDir)}`)
  }
}

if (process.env.GITHUB_OUTPUT) {
  const fs2 = await import('fs')
  fs2.appendFileSync(process.env.GITHUB_OUTPUT, `draft_synced_count=${synced.length}\n`)
  fs2.appendFileSync(process.env.GITHUB_OUTPUT, `draft_delete_paths=${JSON.stringify(synced.map(s => relative(ROOT, s.srcDir)))}\n`)
}

if (errors.length > 0) process.exit(1)
