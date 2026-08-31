#!/usr/bin/env node
/**
 * note-catalogで r2Body:false の公開済み記事を R2 に同期する。
 *
 * 使い方:
 *   node .claude/scripts/note/sync-note-r2.mjs              # dry-run
 *   DRY_RUN=false node .claude/scripts/note/sync-note-r2.mjs  # 本番
 *
 * CI (sync-note-r2.yml) から DRY_RUN=false で呼ばれる。
 * ローカルからの直接実行は dry-run のみ推奨 (R2 書き込みは CI 専用)。
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, cpSync, readdirSync, statSync } from 'fs'
import { resolve, join, relative } from 'path'
import { execSync } from 'child_process'

const ROOT = resolve(import.meta.dirname, '../../..')
const URLS_FILE = join(ROOT, '.claude/state/note-published-urls.json')
const DOCS31 = join(ROOT, 'docs/31_note記事原稿')
const LOCAL_R2 = join(ROOT, '.local/r2')

const DRY_RUN = process.env.DRY_RUN !== 'false'

if (DRY_RUN) console.log('[dry-run mode] R2 push / docs/31 削除はスキップ')

const data = JSON.parse(readFileSync(URLS_FILE, 'utf8'))
const articles = data.articles

/** docs/31 内で記事ディレクトリを探す (nested → top-level の順) */
function findSrcDir(vertical, slug) {
  // Case 1: docs/31/<vertical>/<slug>/ (koumuin-claude-code/00-xxx 等)
  const nested = join(DOCS31, vertical, slug)
  if (existsSync(nested)) return nested
  // Case 2: docs/31/<slug>/ (koumuin-gis-01-depopulation-medical 等)
  const topLevel = join(DOCS31, slug)
  if (existsSync(topLevel)) return topLevel
  return null
}

/** ディレクトリ内の全ファイルを再帰的に列挙 */
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

for (const [slug, info] of Object.entries(articles)) {
  if (slug.startsWith('_')) continue
  // r2_path はcatalogが公開前から予約する。実体の有無は r2_body だけで判定する。
  if (info.r2_body !== false) {
    // 既に r2_path が記録済み = 同期完了
    skipped.push(slug)
    continue
  }

  if (info.is_paid === true) {
    const message = `${slug}: paid article must use publish-paid-note-private-r2.ts; public R2 sync is forbidden`
    console.error(`  ❌ ${message}`)
    errors.push({ slug, error: message })
    continue
  }

  const vertical = info.vertical
  const srcDir = findSrcDir(vertical, slug)

  if (!srcDir) {
    // docs/31 に存在しない = 既に削除済み (手動削除など)
    skipped.push(slug)
    continue
  }

  const r2Prefix = `note/${vertical}/${slug}`
  const r2StagingDir = join(LOCAL_R2, 'note', vertical, slug)

  console.log(`\n▶ ${slug}`)
  console.log(`  src:    ${relative(ROOT, srcDir)}`)
  console.log(`  r2:     ${r2Prefix}`)

  try {
    if (!DRY_RUN) {
      // 1. .local/r2/note/<vertical>/<slug>/ にステージング
      mkdirSync(r2StagingDir, { recursive: true })
      cpSync(srcDir, r2StagingDir, { recursive: true })

      // 2. manifest.json を生成 (restore スクリプトがファイル一覧を取得するために使用)
      const files = listFiles(r2StagingDir)
      writeFileSync(
        join(r2StagingDir, 'manifest.json'),
        JSON.stringify({ slug, vertical, files, synced_at: new Date().toISOString() }, null, 2)
      )

      // 3. R2 push
      execSync(
        `npx tsx packages/r2-storage/src/scripts/diff-push-r2.ts --prefix "${r2Prefix}"`,
        { stdio: 'inherit', cwd: ROOT }
      )

      // 4. 派生indexへR2実体反映済みを記録（catalogは後続commitでr2Body:trueへ昇格）
      info.r2_path = r2Prefix
      info.r2_body = true
      info.status = 'r2_ready'
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

// 5. note-published-urls.json を保存
if (!DRY_RUN && synced.length > 0) {
  writeFileSync(URLS_FILE, JSON.stringify(data, null, 2) + '\n')
  console.log(`\n✅ note-published-urls.json 更新 (r2_path 追記)`)
}

// 6. 結果サマリと docs/31 削除対象を出力
console.log(`\n=== 結果 ===`)
console.log(`synced:  ${synced.length} 件`)
console.log(`skipped: ${skipped.length} 件 (r2_path 記録済み or docs/31 不在)`)
console.log(`errors:  ${errors.length} 件`)

if (synced.length > 0) {
  console.log(`\n=== docs/31 削除対象 ===`)
  for (const { slug, srcDir } of synced) {
    console.log(`  ${relative(ROOT, srcDir)}`)
  }
}

// CI から参照するために削除対象パスを JSON 出力
if (process.env.GITHUB_OUTPUT) {
  const toDelete = synced.map(s => relative(ROOT, s.srcDir))
  const fs2 = await import('fs')
  fs2.appendFileSync(process.env.GITHUB_OUTPUT, `synced_count=${synced.length}\n`)
  fs2.appendFileSync(process.env.GITHUB_OUTPUT, `delete_paths=${JSON.stringify(toDelete)}\n`)
}

if (errors.length > 0) process.exit(1)
