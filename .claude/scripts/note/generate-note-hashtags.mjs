#!/usr/bin/env node
/**
 * note ドラフトのハッシュタグ99個を、draft.md のタイトルと本文から Claude に提案させ、
 * 決定的な検査 (lib/note-hashtags.mjs) を通ったものだけを hashtags.txt に保存する。
 * 穴埋め用の汎用タグ (#毎日note 等) は使わない。headless `claude` CLI のログインが必要。
 *
 * Usage:
 *   node .claude/scripts/note/generate-note-hashtags.mjs [--slug <slug>] [--all]
 *
 * --slug: 特定ドラフトのみ生成
 * --all: note-draft-index.json の全ドラフトを対象
 *
 * 生成先: docs/31_note記事原稿/<vertical>/<slug>/hashtags.txt
 * (存在しない場合は restore-from-r2.sh で復元してから実行)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { proposeHashtags } from './lib/note-hashtags-propose.mjs';
import { datasetPath } from "../../../config/datasets.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '../../..');

function resolveSlugDir(draftRoot, vertical, slug) {
  // stats47-note は vertical ディレクトリなし (restore-from-r2.sh の挙動に合わせる)
  if (vertical === 'stats47-note') {
    const flat = path.join(draftRoot, slug);
    if (fs.existsSync(flat)) return flat;
  }
  return path.join(draftRoot, vertical, slug);
}

async function processSlug(slug, info, draftRoot) {
  const { vertical, r2_path } = info;
  const slugDir = resolveSlugDir(draftRoot, vertical, slug);

  if (!fs.existsSync(slugDir)) {
    console.log(`  SKIP (docs/31 に未展開): ${slug}`);
    console.log(`    → bash .claude/scripts/note/restore-from-r2.sh ${slug}`);
    return { status: 'skip', slug };
  }

  // draft.md からタイトルと本文を取得
  const draftPath = path.join(slugDir, 'draft.md');
  if (!fs.existsSync(draftPath)) {
    console.log(`  SKIP (draft.md なし): ${slug}`);
    return { status: 'skip', slug };
  }
  const content = fs.readFileSync(draftPath, 'utf8');
  const title = content.match(/^title:\s*["']?(.+?)["']?\s*$/m)?.[1].trim() ?? slug;
  const text = content.replace(/^---[\s\S]*?\n---\n/, '').replace(/!\[[^\]]*]\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim();
  const { tags: hashtags } = await proposeHashtags({ title, vertical, text, cwd: PROJECT_ROOT });

  const outPath = path.join(slugDir, 'hashtags.txt');
  fs.writeFileSync(outPath, hashtags.join('\n') + '\n', 'utf8');

  console.log(`  OK (${hashtags.length}個): ${slug}`);
  return { status: 'ok', slug, count: hashtags.length };
}

// ============================================================
// エントリポイント
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const targetSlug = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
  const allMode = args.includes('--all');
  const draftRoot = path.join(PROJECT_ROOT, 'docs/31_note記事原稿');

  const indexPath = path.join(PROJECT_ROOT, datasetPath("note.draft-index"));
  const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  const drafts = indexData.drafts || {};

  if (!allMode && !targetSlug) {
    console.log('Usage: node generate-note-hashtags.mjs [--slug <slug>] [--all]');
    return;
  }

  const targets = targetSlug
    ? { [targetSlug]: drafts[targetSlug] }
    : drafts;

  console.log(`=== ハッシュタグ生成 (対象: ${Object.keys(targets).length}件) ===`);
  const results = [];
  for (const [slug, info] of Object.entries(targets)) {
    if (!info) {
      console.log(`  NOT FOUND: ${slug}`);
      continue;
    }
    try {
      results.push(await processSlug(slug, info, draftRoot));
    } catch (error) {
      console.log(`  FAIL: ${slug}: ${error.message}`);
      results.push({ status: 'fail', slug });
    }
  }

  const ok = results.filter(r => r.status === 'ok').length;
  const skip = results.filter(r => r.status === 'skip').length;
  const fail = results.filter(r => r.status === 'fail').length;
  console.log(`\n完了: OK=${ok}件, SKIP(未展開)=${skip}件, FAIL=${fail}件`);
  if (fail > 0) process.exitCode = 1;
  if (skip > 0) {
    console.log('  未展開のドラフトは restore-from-r2.sh で展開後に再実行してください');
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
