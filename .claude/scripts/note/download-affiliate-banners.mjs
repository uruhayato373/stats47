#!/usr/bin/env node
/**
 * A8.net バナー画像を DL → PNG に変換して images/ ディレクトリに保存する。
 * 使い方: node .claude/scripts/note/download-affiliate-banners.mjs [--force]
 */
import { execSync } from 'child_process'
import { mkdirSync, existsSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const OUT = resolve(ROOT, '.claude/assets/affiliate-banners')
const FORCE = process.argv.includes('--force')

mkdirSync(OUT, { recursive: true })

const BANNERS = [
  {
    id: 'ai_agent_camp',
    title: 'AI Agent Camp（Claude Code研修）',
    imageUrl: 'https://www23.a8.net/svt/bgt?aid=260516554632&wid=001&eno=01&mid=s00000027444001003000&mc=1',
    trackingUrl: 'https://px.a8.net/svt/ejp?a8mat=4B3RUY+AG9Z3M+5VRC+5YZ75',
    width: 300,
    height: 250,
  },
  {
    id: 'career_banner',
    title: '転職サイト バナー',
    imageUrl: 'https://www25.a8.net/svt/bgt?aid=260309956603&wid=001&eno=01&mid=s00000027288001003000&mc=1',
    trackingUrl: 'https://px.a8.net/svt/ejp?a8mat=4AZCG4+9Z0EK2+5UK0+5YZ75',
    width: 300,
    height: 250,
  },
]

for (const b of BANNERS) {
  const gifPath = `${OUT}/${b.id}.gif`
  const pngPath = `${OUT}/${b.id}.png`

  if (!FORCE && existsSync(pngPath)) {
    console.log(`[SKIP] ${b.id}.png already exists`)
    continue
  }

  process.stdout.write(`[DL] ${b.id}... `)
  const res = await fetch(b.imageUrl)
  if (!res.ok) { console.log(`FAIL HTTP ${res.status}`); continue }
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(gifPath, buf)

  // GIF → PNG 変換（最初フレームのみ）
  try {
    execSync(`convert '${gifPath}[0]' '${pngPath}'`, { stdio: 'pipe' })
    console.log(`OK (${buf.length} bytes → PNG)`)
  } catch (e) {
    console.log(`convert error: ${e.message}`)
  }
}

console.log(`\nバナー保存先: ${OUT}`)
