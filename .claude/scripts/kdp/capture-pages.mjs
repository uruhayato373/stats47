#!/usr/bin/env node
/**
 * capture-pages.mjs — Kindle 本の章を、端末のようにページに分けて表示し、全県表の前後のページを撮る (KINDLE-QUALITY-LOOP-01)。
 *
 *   node .claude/scripts/kdp/capture-pages.mjs K-S1-02 K-S1-07 --version v5-20261103-tables
 *
 * 本の XHTML と CSS をそのまま Chromium で開き、CSS の段組み (column-fill: auto) で 1 段 = 1 ページにして撮る。
 * EPUB の改ページ指定 (page-break-after:avoid など) は段の区切りにも効くので、見出しがページ末に取り残されるか、
 * 表がどこで切れるかを確かめられる。Amazon の Kindle 変換そのものではない (Kindle Previewer も Kindle for Web も
 * この環境では使えないための近似。Kindle for Web は Amazon へのログインが要る)。
 * 画面は 2 つ: 6 インチ端末相当 600×800 と、スマホの Kindle アプリ相当 390×700。
 * 出力: .local/kindle-quality/<id>/<version>/pages/<章>-<表>-<画面>-p<ページ>.png (見出しから注記までの全ページ) と manifest.json
 *       (見出し・最初の行・最後の行・注記が何ページ目か。見出しと最初の行が別ページなら orphanHeading: true)。
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
  throw new Error('usage: capture-pages.mjs <K-S1-NN>... --version <version>');
}
const SCREENS = [
  { name: 'eink600', width: 600, height: 800 },
  { name: 'phone390', width: 390, height: 700 },
];
const MARGIN = 24;
/** 1 段 = 1 ページ。段の幅 + 段の間 = 画面の幅になるので、n ページ目は横に n 画面ずらせば出る。 */
const PAGED_CSS = `
html{height:100%;overflow:hidden;}
body{margin:0 !important;padding:${MARGIN}px ${MARGIN}px;box-sizing:border-box;height:100vh;
  column-width:calc(100vw - ${MARGIN * 2}px);column-gap:${MARGIN * 2}px;column-fill:auto;}
`;

const browser = await chromium.launch();
try {
  for (const id of ids) {
    const epub = join(ROOT, '.local/kindle-books', id, version, 'book.epub');
    if (!existsSync(epub)) throw new Error(`${id}: ${epub} が無い`);
    const outDir = join(ROOT, '.local/kindle-quality', id, version);
    const epubDir = join(outDir, 'epub');
    const pageDir = join(outDir, 'pages');
    mkdirSync(pageDir, { recursive: true });
    execFileSync('unzip', ['-o', '-q', epub, '-d', epubDir]);
    const chapters = readdirSync(join(epubDir, 'OEBPS')).filter((name) => /^chap.*\.xhtml$/.test(name)).sort();
    const manifest = [];
    for (const screen of SCREENS) {
      const page = await browser.newPage({ viewport: { width: screen.width, height: screen.height }, deviceScaleFactor: 2 });
      for (const chapter of chapters) {
        if (!/全47都道府県の値/.test(readFileSync(join(epubDir, 'OEBPS', chapter), 'utf8'))) continue;
        await page.goto(pathToFileURL(join(epubDir, 'OEBPS', chapter)).href);
        await page.addStyleTag({ content: PAGED_CSS });
        await page.evaluate(() => document.fonts.ready);
        // 全県表は「全47都道府県の値」の見出しの下に 16 行ずつの表が続く (full-tables.ts)。見出しから次の見出しの手前までを 1 つとみなす
        const tables = await page.evaluate(() => {
          const pageOf = (element) => Math.floor((element.getBoundingClientRect().left + 1) / window.innerWidth);
          const headings = [...document.querySelectorAll('h2,h3,h4')].filter((h) => /^全47都道府県の値/.test(h.textContent.trim()));
          return headings.map((heading, index) => {
            const body = [];
            let note = null;
            let continuationOrphans = 0;
            let lastLabel = null;
            for (let el = heading.nextElementSibling; el && !/^h[1-4]$/i.test(el.tagName); el = el.nextElementSibling) {
              const tag = el.tagName.toLowerCase();
              if (tag === 'h5') lastLabel = el;
              else if (tag === 'table') {
                const rows = [...el.querySelectorAll('tbody tr')];
                // つづきの小見出しと、その表の最初の行が別ページなら取り残し
                if (lastLabel && rows[0] && pageOf(lastLabel) !== pageOf(rows[0])) continuationOrphans += 1;
                lastLabel = null;
                body.push(...rows);
              } else if (tag === 'p') note = el;
            }
            return {
              index,
              rows: body.length,
              heading: heading.textContent.trim(),
              headingPage: pageOf(heading),
              firstRowPage: body[0] ? pageOf(body[0]) : null,
              lastRowPage: body.length ? pageOf(body[body.length - 1]) : null,
              notePage: note ? pageOf(note) : null,
              continuationOrphans,
              rowsPerPage: body.reduce((acc, tr) => {
                const p = pageOf(tr);
                acc[p] = (acc[p] ?? 0) + 1;
                return acc;
              }, {}),
            };
          });
        });
        for (const table of tables) {
          // 見出しから注記までの全ページを撮る (間のページを飛ばさない)
          const last = Math.max(table.lastRowPage ?? 0, table.notePage ?? 0);
          const pages = [];
          for (let p = table.headingPage; p <= last; p++) pages.push(p);
          const files = [];
          for (const p of pages) {
            await page.evaluate((offset) => { document.body.style.transform = `translateX(${-offset}px)`; }, p * screen.width);
            const file = join(pageDir, `${chapter.replace('.xhtml', '')}-${String(table.index + 1).padStart(2, '0')}-${screen.name}-p${p}.png`);
            await page.screenshot({ path: file });
            files.push(file.slice(ROOT.length + 1));
          }
          await page.evaluate(() => { document.body.style.transform = ''; });
          manifest.push({
            bookId: id, version, chapter, screen: screen.name, ...table,
            pagesSpanned: table.lastRowPage - (table.headingPage ?? table.firstRowPage) + 1,
            orphanHeading: table.headingPage !== null && table.headingPage !== table.firstRowPage,
            files,
          });
        }
      }
      await page.close();
    }
    writeFileSync(join(pageDir, 'manifest.json'), `${JSON.stringify({ bookId: id, version, tables: manifest }, null, 2)}\n`);
    const orphans = manifest.filter((table) => table.orphanHeading).length;
    const continuation = manifest.reduce((sum, table) => sum + table.continuationOrphans, 0);
    console.log(`${id} ${version}: ${manifest.length} tables × screens, orphan headings ${orphans}, orphan continuation labels ${continuation} → ${pageDir}`);
  }
} finally {
  await browser.close();
}
