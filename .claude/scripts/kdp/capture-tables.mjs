#!/usr/bin/env node
/**
 * capture-tables.mjs — Kindle 本の全県表を、本の CSS (style.css) のまま Kindle に近い画面幅で撮る (KINDLE-QUALITY-LOOP-01)。
 *
 *   node .claude/scripts/kdp/capture-tables.mjs K-S1-02 K-S1-07 --version v5-20261103-tables
 *
 * Kindle Previewer の代わりではない (Kindle の組版・ページ分割は再現しない)。小さい画面で列が折り返さないか・
 * 数字が読めるか・表の始まりが見出しと同じ画面に入るかを、エージェントが画像で見るための近似。
 * XHTML は XML として読まれ tagName が小文字になるので、見出しの判定は大文字小文字を区別しない。
 * 幅は 2 つ: 390px (スマホの Kindle アプリ相当) と 600px (6 インチ端末相当)。
 * 出力: .local/kindle-quality/<id>/<version>/tables/<章>-<n>-<幅>.png (表の始まりの 1 画面) と
 *       <章>-<n>-full-390.png (表の全体)、manifest.json。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { chromium } from 'playwright';

const ROOT = resolve(import.meta.dirname ?? new URL('.', import.meta.url).pathname, '../../..');
const args = process.argv.slice(2);
const versionIndex = args.indexOf('--version');
const version = versionIndex >= 0 ? args[versionIndex + 1] : null;
const ids = args.filter((arg) => /^K-S[1-4]-\d{2}$/.test(arg));
if (!ids.length || !version || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(version)) {
  throw new Error('usage: capture-tables.mjs <K-S1-NN>... --version <version>');
}
const SCREENS = [
  { name: '390', width: 390, height: 700 },
  { name: '600', width: 600, height: 800 },
];
const FULL_TABLE_ROWS = 48;

const browser = await chromium.launch();
try {
  for (const id of ids) {
    const epub = join(ROOT, '.local/kindle-books', id, version, 'book.epub');
    if (!existsSync(epub)) throw new Error(`${id}: ${epub} が無い`);
    const outDir = join(ROOT, '.local/kindle-quality', id, version);
    const epubDir = join(outDir, 'epub');
    const tableDir = join(outDir, 'tables');
    mkdirSync(epubDir, { recursive: true });
    mkdirSync(tableDir, { recursive: true });
    execFileSync('unzip', ['-o', '-q', epub, '-d', epubDir]);
    const chapters = readdirSync(join(epubDir, 'OEBPS')).filter((name) => /^chap.*\.xhtml$/.test(name)).sort();
    const manifest = [];
    for (const screen of SCREENS) {
      const page = await browser.newPage({ viewport: { width: screen.width, height: screen.height }, deviceScaleFactor: 2 });
      for (const chapter of chapters) {
        const xhtml = readFileSync(join(epubDir, 'OEBPS', chapter), 'utf8');
        if (!/<table\b/.test(xhtml)) continue;
        await page.goto(pathToFileURL(join(epubDir, 'OEBPS', chapter)).href);
        const tables = await page.locator('table').all();
        for (let index = 0; index < tables.length; index++) {
          const table = tables[index];
          const rows = await table.locator('tr').count();
          if (rows < FULL_TABLE_ROWS) continue;
          const info = await table.evaluate((element) => {
            let heading = element.previousElementSibling;
            while (heading && !/^h[1-4]$/i.test(heading.tagName)) heading = heading.previousElementSibling;
            const box = element.getBoundingClientRect();
            const cells = [...element.querySelectorAll('td')];
            return {
              heading: heading?.textContent?.trim() ?? '',
              tableWidth: Math.round(box.width),
              viewportWidth: window.innerWidth,
              // 1 行が 2 行以上に折り返していないか (行の高さのばらつき)
              rowHeights: [...element.querySelectorAll('tr')].slice(1, 6).map((tr) => Math.round(tr.getBoundingClientRect().height)),
              wrappedCells: cells.filter((td) => td.getBoundingClientRect().height > 40).length,
            };
          });
          // 表の見出しから始まる 1 画面 (Kindle の 1 ページに近い)
          await page.evaluate((i) => {
            const element = document.querySelectorAll('table')[i];
            let heading = element.previousElementSibling;
            while (heading && !/^h[1-4]$/i.test(heading.tagName)) heading = heading.previousElementSibling;
            (heading ?? element).scrollIntoView({ block: 'start' });
          }, index);
          const base = `${chapter.replace('.xhtml', '')}-${String(index + 1).padStart(2, '0')}`;
          const screenFile = join(tableDir, `${base}-${screen.name}.png`);
          await page.screenshot({ path: screenFile });
          let fullFile = null;
          if (screen.name === '390') {
            fullFile = join(tableDir, `${base}-full-390.png`);
            await table.screenshot({ path: fullFile });
          }
          manifest.push({
            bookId: id, version, chapter, table: index + 1, screen: screen.name, rows, ...info,
            screenFile: screenFile.slice(ROOT.length + 1), fullFile: fullFile ? fullFile.slice(ROOT.length + 1) : null,
          });
        }
      }
      await page.close();
    }
    writeFileSync(join(tableDir, 'manifest.json'), `${JSON.stringify({ bookId: id, version, tables: manifest }, null, 2)}\n`);
    console.log(`${id} ${version}: ${manifest.length} screenshots → ${tableDir}`);
  }
} finally {
  await browser.close();
}
