#!/usr/bin/env node
/**
 * ページのレスポンシブ / タップ領域 / キーボード到達性を実測する (read-only)。
 *
 * ★なぜ要るか: 「390/768/1024/1280/1440 の light/dark を確認する」類のタスクは、
 *   目視だと再現できず結論が残らない。ここで測れば数値が残り、次に誰が見ても同じ値が出る。
 *
 * ★dark は OS の prefers-color-scheme では切り替わらない。next-themes が
 *   `enableSystem={false}` / `defaultTheme="light"` なので (`providers/theme-provider.tsx`)、
 *   localStorage の `theme` を設定してから読み込む。**colorScheme を渡すだけでは
 *   light のままで、「dark が効いていない」と誤診する** (2026-08-21 に実際に踏んだ)。
 *
 * ★Claude の Browser ペインでは測れない。ペインが非表示だと `visibilityState: "hidden"`
 *   でレイアウトが走らず、`getBoundingClientRect()` が全部 0 を返す。Playwright を使う。
 *
 * 判定の基準:
 *   - WCAG 2.5.8 (AA)  = 24×24。文中リンク等は適用外なので、出力を見て人が判断する。
 *   - WCAG 2.5.5 (AAA) = 44×44。モバイルの推奨。
 *
 * Usage:
 *   node .claude/scripts/ui/measure-page-a11y.mjs <url> [--widths 390,768,1280]
 */
import { chromium } from '@playwright/test';

const argv = process.argv.slice(2);
const url = argv.find((a) => !a.startsWith('--')) ?? 'http://localhost:3000/';
const widthArg = argv[argv.indexOf('--widths') + 1];
const WIDTHS =
  argv.includes('--widths') && widthArg
    ? widthArg.split(',').map(Number)
    : [390, 768, 1024, 1280, 1440];
const THEMES = ['light', 'dark'];

const browser = await chromium.launch();
const rows = [];
const consoleIssues = [];
let detail = null;

for (const width of WIDTHS) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
      hasTouch: width < 768,
    });
    await ctx.addInitScript((t) => {
      try {
        localStorage.setItem('theme', t);
      } catch {}
    }, theme);
    const page = await ctx.newPage();
    page.on('console', (m) => {
      if (m.type() !== 'error' && m.type() !== 'warning') return;
      const text = m.text();
      if (/hydrat|did not match|Warning:|Error/i.test(text)) {
        consoleIssues.push({ width, theme, type: m.type(), text: text.slice(0, 200) });
      }
    });
    page.on('pageerror', (e) =>
      consoleIssues.push({ width, theme, type: 'pageerror', text: String(e).slice(0, 200) }),
    );

    await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 });
    await page.waitForTimeout(700); // hydration 後の再レイアウト

    const measured = await page.evaluate(() => {
      const doc = document.documentElement;
      const vis = (el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      };
      const describe = (el) => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 22),
          w: Math.round(r.width),
          h: Math.round(r.height),
          chrome: !!el.closest('nav,header,footer'),
        };
      };
      const interactive = [
        ...document.querySelectorAll(
          'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
        ),
      ]
        .filter(vis)
        .map(describe);
      return {
        htmlClass: doc.className,
        horizontalOverflowPx: doc.scrollWidth - doc.clientWidth,
        interactiveVisible: interactive.length,
        below24: interactive.filter((x) => x.h < 24 || x.w < 24),
        below44: interactive.filter((x) => x.h < 44 || x.w < 44),
        bodyBg: getComputedStyle(document.body).backgroundColor,
        bodyColor: getComputedStyle(document.body).color,
      };
    });

    // キーボード: Tab を 40 回押して main 内のリンクへ到達し、focus ring が出るか
    let reachedMain = false;
    let focusRingOk = true;
    for (let i = 0; i < 40 && !reachedMain; i += 1) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        return {
          inMain: !!el.closest('main'),
          outline: `${cs.outlineStyle} ${cs.outlineWidth}`,
          ring: cs.boxShadow !== 'none',
        };
      });
      if (info?.inMain) {
        reachedMain = true;
        focusRingOk = info.outline !== 'none 0px' || info.ring;
      }
    }

    if (detail === null) detail = { width, theme, ...measured };
    rows.push({ width, theme, ...measured, reachedMain, focusRingOk });
    await ctx.close();
  }
}
await browser.close();

const pad = (v, n) => String(v).padEnd(n);
console.log(`## ${url}\n`);
console.log(
  pad('vw', 6) + pad('theme', 6) + pad('html', 7) + pad('overflow', 9) +
  pad('操作可', 8) + pad('<24', 5) + pad('<44', 5) + pad('kbd', 5) + 'focusRing',
);
for (const r of rows) {
  console.log(
    pad(r.width, 6) + pad(r.theme, 6) + pad(r.htmlClass || '-', 7) +
    pad(r.horizontalOverflowPx, 9) + pad(r.interactiveVisible, 8) +
    pad(r.below24.length, 5) + pad(r.below44.length, 5) +
    pad(r.reachedMain ? 'ok' : 'NG', 5) + (r.focusRingOk ? 'ok' : 'NG'),
  );
}

console.log('\n[body 配色 (dark が切り替わっているかの確認)]');
for (const r of rows.filter((r) => r.width === WIDTHS[0])) {
  console.log(`  ${r.width} ${r.theme}: bg=${r.bodyBg} fg=${r.bodyColor}`);
}

console.log(`\n[${detail.width}px / ${detail.theme} で 24px 未満 (WCAG 2.5.8 AA)]`);
for (const x of detail.below24) {
  console.log(`  ${x.w}x${x.h} <${x.tag}> ${x.chrome ? '[chrome]' : '[本文]'} ${x.label}`);
}
console.log(`\n[同 44px 未満 (24px は満たす・2.5.5 AAA)]`);
for (const x of detail.below44.filter((a) => !(a.h < 24 || a.w < 24))) {
  console.log(`  ${x.w}x${x.h} <${x.tag}> ${x.chrome ? '[chrome]' : '[本文]'} ${x.label}`);
}

console.log(`\n[console / hydration] ${consoleIssues.length} 件`);
for (const c of consoleIssues.slice(0, 10)) {
  console.log(`  ${c.width}/${c.theme} ${c.type}: ${c.text}`);
}

const overflow = rows.filter((r) => r.horizontalOverflowPx > 0);
const kbdNg = rows.filter((r) => !r.reachedMain || !r.focusRingOk);
if (overflow.length || kbdNg.length || consoleIssues.length) {
  console.error(
    `\n❌ 横スクロール ${overflow.length} / キーボード ${kbdNg.length} / console ${consoleIssues.length}`,
  );
  process.exit(1);
}
console.log('\n✅ 横スクロールなし / キーボード到達 ok / console 異常なし');
