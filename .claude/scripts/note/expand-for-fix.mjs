#!/usr/bin/env node
/**
 * 修正対象の公開note記事をR2から docs/31 に展開する。
 * すでに展開済みの場合はスキップ（draft.md が存在する場合）。
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve, join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../..')
const R2 = 'https://storage.stats47.jp'
const DOCS31 = join(ROOT, 'docs/31_note記事原稿')

const targets = JSON.parse(readFileSync('/tmp/note-style-problems.json', 'utf8'))

let ok = 0, skip = 0, err = 0

for (const item of targets) {
  const { slug, vertical, r2_path } = item
  const r2Key = r2_path || `note/${vertical}/${slug}`
  const slugDir = join(DOCS31, vertical, slug)
  const draftPath = join(slugDir, 'draft.md')

  if (existsSync(draftPath)) {
    process.stdout.write('s')
    skip++
    continue
  }

  // draft.md をR2から取得
  const url = `${R2}/${r2Key}/draft.md`
  try {
    const res = await fetch(url)
    if (!res.ok) { process.stdout.write('e'); err++; continue }
    const text = await res.text()
    mkdirSync(slugDir, { recursive: true })
    writeFileSync(draftPath, text, 'utf8')
    process.stdout.write('.')
    ok++
  } catch(e) {
    process.stdout.write('E'); err++
  }
}

console.log(`\n展開: ${ok}件 / スキップ(既存): ${skip}件 / エラー: ${err}件`)
