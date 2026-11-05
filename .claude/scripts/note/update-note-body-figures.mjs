#!/usr/bin/env node
/**
 * 公開済みの無料ランキング記事の本文 3 枚だけを、共通の型の画像へ差し替える。
 *
 * エディタで画像を入れ直すと位置がずれ (ins_img の既知の不具合)、本文全体の更新はカードやタグを巻き込むので、
 * 公開版の本文 HTML の <img> だけを置き換えて公開 PUT に差し込む。文章・カード・タグ・カバーは変えない。
 * 有料記事は対象にしない (止める)。正典: .claude/rules/note-image-assets.md
 *
 *   node .claude/scripts/note/update-note-body-figures.mjs --key a-maximum-temperature            # dry-run
 *   node .claude/scripts/note/update-note-body-figures.mjs --key a-maximum-temperature --commit   # 更新 + 公開版の検証
 *
 * dry-run はログインせず、画像を .local/note-figure-update/<key>/ に作って変更箇所を表示する。
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { R2_PUBLIC_BASE_URL } from '../lib/site-config.cjs';
import { findLedgerArticle, readArticleLedger } from './lib/article-ledger.mjs';
import { fetchNoteDetail } from './lib/cover-storage.mjs';
import { NOTE_RANKING_IMAGES } from './lib/note-render-spec.mjs';
import { assertAccount, launchContext } from './lib/note-session.mjs';
import { fetchOwnerNote, noteKeyFromUrl, pngSize, publishEditedBody, uploadImage } from './patch-note-paid-landing.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
/** note の本文の画像の表示幅 */
const BODY_WIDTH = 620;

const IMAGE_FIGURE = /<figure\b[^>]*>\s*<img\b[^>]*>[\s\S]*?<\/figure>/g;

/** 本文の画像 figure の src を、順番どおりに新しい画像へ置き換える。数が合わなければ止める (純粋関数) */
export function swapFigureImages(body, images) {
  const figures = body.match(IMAGE_FIGURE) ?? [];
  if (figures.length !== images.length) throw new Error(`本文の画像が ${figures.length} 枚で、差し替える画像は ${images.length} 枚`);
  let index = 0;
  return body.replace(IMAGE_FIGURE, (figure) => {
    const { url, width, height } = images[index++];
    return figure.replace(/<img\b[^>]*>/, (img) => img
      .replace(/src="[^"]*"/, `src="${url}"`)
      .replace(/width="\d+"/, `width="${BODY_WIDTH}"`)
      .replace(/height="\d+"/, `height="${Math.round(BODY_WIDTH * height / width)}"`));
  });
}

/** 画像の参照を除いて本文が同じか。文章やカードが変わっていないことの検査 */
export function sameExceptImages(before, after) {
  const blank = (html) => html.replace(/<img\b[^>]*>/g, '<img>');
  return blank(before) === blank(after);
}

async function buildImages(article, dir) {
  const res = await fetch(`${R2}/${article.r2Path}/chart-data.json`);
  if (!res.ok) throw new Error(`${article.key}: chart-data.json が無い (HTTP ${res.status})`);
  fs.mkdirSync(dir, { recursive: true });
  const input = path.join(dir, 'chart-data.json');
  fs.writeFileSync(input, await res.text());
  execFileSync(process.execPath, [path.join(ROOT, 'node_modules/tsx/dist/cli.mjs'), path.join(ROOT, '.claude/scripts/note/build-ranking-type-images.ts'), '--chart-data', input, '--out', dir], { cwd: ROOT, stdio: 'inherit' });
  return NOTE_RANKING_IMAGES.map((image) => path.join(dir, path.basename(image.file)));
}

async function main(argv) {
  const key = argv.includes('--key') ? argv[argv.indexOf('--key') + 1] : null;
  if (!key) throw new Error('--key <記事キー> が要る');
  const commit = argv.includes('--commit');
  const article = findLedgerArticle(readArticleLedger(), key);
  if (article.isPaid) throw new Error(`${key}: 有料記事は対象にしない`);
  const noteKey = noteKeyFromUrl(article.noteUrl);
  const files = await buildImages(article, path.join(ROOT, '.local/note-figure-update', key));
  const placeholders = files.map((file) => ({ url: `new:${path.basename(file)}`, ...pngSize(fs.readFileSync(file)) }));
  const before = await fetchNoteDetail(noteKey);
  const body = String(before.body ?? '');
  if (before.user?.urlname !== 'stats47' || before.status !== 'published') throw new Error(`${key}: 帰属か公開状態が不正`);
  const preview = swapFigureImages(body, placeholders);
  if (!sameExceptImages(body, preview)) throw new Error(`${key}: 画像以外が変わる`);
  console.log(`${key}: ${article.noteUrl}`);
  console.log(`本文 ${body.length} 字 / 画像 ${placeholders.length} 枚を差し替える / カバー・タグ ${(before.hashtag_notes ?? []).length} 件・価格 ${before.price} は変えない`);
  for (const [i, oldSrc] of [...body.matchAll(/<img\b[^>]*src="([^"]+)"/g)].map((m) => m[1]).entries()) console.log(`  ${i + 1}. ${oldSrc}\n     → ${path.basename(files[i])} ${placeholders[i].width}×${placeholders[i].height}`);
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
    const uploaded = [];
    for (const file of files) {
      const { uploadedUrl, width, height } = await uploadImage(ctx, file);
      uploaded.push({ url: uploadedUrl, width, height });
    }
    const next = swapFigureImages(body, uploaded);
    await publishEditedBody(ctx, noteKey, published, { freeBody: next, payBody: null, separator: published.separator ?? null });
    let after;
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await new Promise((done) => setTimeout(done, 1500));
      after = await fetchNoteDetail(noteKey);
      if (uploaded.every((image) => String(after.body ?? '').includes(image.url))) break;
    }
    const checks = {
      images: uploaded.every((image) => String(after.body ?? '').includes(image.url)),
      textUnchanged: sameExceptImages(body, String(after.body ?? '')),
      hashtags: (after.hashtag_notes ?? []).length === (before.hashtag_notes ?? []).length,
      published: after.status === 'published',
    };
    const failed = Object.entries(checks).filter(([, ok]) => !ok).map(([name]) => name);
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
