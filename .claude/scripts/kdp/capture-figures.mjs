#!/usr/bin/env node
/**
 * capture-figures.mjs — 既刊 Kindle の図を、6 インチ相当の幅で 1 枚ずつ撮る (KINDLE-QUALITY-LOOP-01 の 2 段目の入力)。
 *
 *   npm run admin                                  # 先に管理画面を起動しておく (本文画面 /content/kindle/<id> を撮る)
 *   node .claude/scripts/kdp/capture-figures.mjs K-S1-07 K-S1-02 [--width 600] [--base http://127.0.0.1:4747]
 *
 * 出力: .local/kindle-quality/<id>/<章>-<n>.png と manifest.json (図ごとの sha256・章・alt・前後の段落の文)。
 * 評価済みの図は data/products/kindle-figure-reviews.json に sha256 で記録してあるので、manifest の `reviewed` が true の図は
 * エージェントに渡さない (同じ図を二度評価しない)。前後の段落は画像にせず文字で渡す (画像のトークンを図だけに絞る)。
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { chromium } from 'playwright';

import { datasetPath } from '../../../config/datasets.mjs';

const ROOT = resolve(import.meta.dirname ?? new URL('.', import.meta.url).pathname, '../../..');
const REVIEWS = join(ROOT, datasetPath('kindle.figure-reviews'));
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const width = Number(option('--width', '600'));
const base = option('--base', 'http://127.0.0.1:4747');
const ids = args.filter((arg, index) => /^K-S[1-4]-\d{2}$/.test(arg) && !['--width', '--base'].includes(args[index - 1]));
if (!ids.length) throw new Error('usage: capture-figures.mjs <K-S1-NN>... [--width 600]');

const reviewed = new Set(
  existsSync(REVIEWS) ? (JSON.parse(readFileSync(REVIEWS, 'utf8')).reviews ?? []).map((review) => review.sha256) : [],
);

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 2 });
  for (const id of ids) {
    const response = await page.goto(`${base}/content/kindle/${id}`, { waitUntil: 'networkidle' });
    if (!response?.ok()) throw new Error(`admin page ${id}: HTTP ${response?.status()} (npm run admin を起動しているか)`);
    const outDir = join(ROOT, '.local/kindle-quality', id);
    mkdirSync(outDir, { recursive: true });
    const figures = await page.locator('article figure').all();
    const manifest = [];
    for (let index = 0; index < figures.length; index++) {
      const figure = figures[index];
      const info = await figure.evaluate((element) => {
        const section = element.closest('section');
        const text = (node) => (node?.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 400);
        const previous = element.previousElementSibling;
        const next = element.nextElementSibling;
        return {
          chapterId: section?.id ?? '',
          chapterTitle: text(section?.querySelector('h2')),
          alt: element.querySelector('img')?.getAttribute('alt') ?? '',
          src: (element.querySelector('img')?.getAttribute('src') ?? '').split('/').pop(),
          before: previous?.tagName === 'P' ? text(previous) : '',
          after: next?.tagName === 'P' ? text(next) : '',
        };
      });
      await figure.scrollIntoViewIfNeeded();
      const png = await figure.screenshot();
      const sha256 = createHash('sha256').update(png).digest('hex');
      const file = join(outDir, `${info.chapterId}-${String(index + 1).padStart(2, '0')}.png`);
      writeFileSync(file, png);
      manifest.push({ bookId: id, ...info, file: file.slice(ROOT.length + 1), sha256, reviewed: reviewed.has(sha256) });
    }
    writeFileSync(join(outDir, 'manifest.json'), `${JSON.stringify({ bookId: id, width, figures: manifest }, null, 2)}\n`);
    console.log(`${id}: ${manifest.length} figures (${manifest.filter((figure) => !figure.reviewed).length} to review) → ${outDir}`);
  }
} finally {
  await browser.close();
}
