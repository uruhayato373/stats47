#!/usr/bin/env node
/**
 * 公開済みの無料 note 記事の本文から、誤った文 (または区間) だけを置き換える。題名も直せる。
 *
 * 本文の照合 (data/note/body-figures.json) で見つかった値の誤りを直すための道具。公開版の本文 HTML の中で
 * 各 `from` がちょうど 1 回だけ現れることを確かめてから `to` に置き換え、公開 PUT に差し込む (publishEditedBody)。
 * 画像・カード・タグ・価格は変えない (題名は --title を付けたときだけ変える)。有料記事は止める。
 * 正典: .claude/rules/note-image-assets.md「本文の図の台帳」
 *
 *   node .claude/scripts/note/update-note-body-text.mjs --key <記事キー> --from "<誤った文>" --to "<正しい文>"   # dry-run
 *   node .claude/scripts/note/update-note-body-text.mjs --key <記事キー> --replacements <file.json> [--title <題名>] --commit
 *
 * --replacements は [{ "from": "<HTML>", "to": "<HTML>" }, ...] (長い区間の差し替え用)。dry-run はログインせず差分を表示するだけ。
 */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { findLedgerArticle, readArticleLedger } from './lib/article-ledger.mjs';
import { fetchNoteDetail } from './lib/cover-storage.mjs';
import { assertAccount, launchContext } from './lib/note-session.mjs';
import { fetchOwnerNote, noteKeyFromUrl, publishEditedBody } from './patch-note-paid-landing.mjs';

/** `from` が本文にちょうど 1 回あることを確かめて置き換える (純粋関数) */
export function replaceOnce(body, from, to) {
  if (!from || from === to) throw new Error('from と to は空でなく、互いに違うものにする');
  const count = body.split(from).length - 1;
  if (count !== 1) throw new Error(`置き換える文が本文に ${count} 回ある (1 回のときだけ置き換える)`);
  return body.replace(from, () => to);
}

function arg(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : null;
}

function readReplacements(argv) {
  const file = arg(argv, '--replacements');
  if (file) {
    const list = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!Array.isArray(list) || !list.length || list.some((r) => typeof r?.from !== 'string' || typeof r?.to !== 'string')) {
      throw new Error('--replacements は [{from,to}] の配列にする');
    }
    return list;
  }
  const from = arg(argv, '--from');
  const to = arg(argv, '--to');
  return from == null || to == null ? [] : [{ from, to }];
}

const brief = (text) => (text.length > 160 ? `${text.slice(0, 80)} … ${text.slice(-60)} (${text.length} 字)` : text);

async function main(argv) {
  const key = arg(argv, '--key');
  const title = arg(argv, '--title');
  const replacements = readReplacements(argv);
  if (!key || (!replacements.length && !title)) throw new Error('--key <記事キー> と、--from/--to か --replacements か --title が要る');
  const commit = argv.includes('--commit');
  const article = findLedgerArticle(readArticleLedger(), key);
  if (article.isPaid) throw new Error(`${key}: 有料記事は対象にしない`);
  const noteKey = noteKeyFromUrl(article.noteUrl);
  const before = await fetchNoteDetail(noteKey);
  const body = String(before.body ?? '');
  if (before.user?.urlname !== 'stats47' || before.status !== 'published') throw new Error(`${key}: 帰属か公開状態が不正`);
  const next = replacements.reduce((text, { from, to }) => replaceOnce(text, from, to), body);
  const name = title && title !== before.name ? title : null;
  console.log(`${key}: ${article.noteUrl}`);
  console.log(`画像以外の本文 ${body.length} → ${next.length} 字 / タグ ${(before.hashtag_notes ?? []).length} 件・価格 ${before.price} は変えない`);
  if (name) console.log(`  題名: ${before.name}\n     → ${name}`);
  for (const { from, to } of replacements) console.log(`  前: ${brief(from)}\n  後: ${brief(to)}`);
  if (!commit) {
    console.log('dry-run: note は変えていない');
    return;
  }
  const ctx = await launchContext({ headless: true });
  try {
    console.log(`account gate: ${await assertAccount(ctx)}`);
    const published = await fetchOwnerNote(ctx, noteKey);
    if (published.has_draft) throw new Error(`${key}: 未公開の下書きがあるので止める`);
    if (String(published.body ?? '') !== body) throw new Error(`${key}: 所有者 API と公開 API の本文が違う`);
    await publishEditedBody(ctx, noteKey, published, { freeBody: next, payBody: null, separator: published.separator ?? null, name });
    let after;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await new Promise((done) => setTimeout(done, 1500));
      after = await fetchNoteDetail(noteKey);
      if (String(after.body ?? '') === next) break;
    }
    const checks = {
      bodyMatches: String(after.body ?? '') === next,
      title: after.name === (name ?? before.name),
      hashtags: (after.hashtag_notes ?? []).length === (before.hashtag_notes ?? []).length,
      published: after.status === 'published',
    };
    const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([check]) => check);
    if (failed.length) throw new Error(`${key}: 公開版の検証に失敗 ${failed.join(',')}`);
    console.log(`${key}: UPDATED ${JSON.stringify(checks)}`);
  } finally {
    await ctx.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(`ERROR: ${error.message}`);
    process.exit(1);
  });
}
