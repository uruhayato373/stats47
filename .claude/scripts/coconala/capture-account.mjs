#!/usr/bin/env node
/**
 * capture-account.mjs — ログイン済みプロファイルから出品者名/プロフィールURLを取得し
 * coconala-account.json に記入する (stats47)。account assert (誤アカウント防止) の厳格化用。
 * 使い方: node .claude/scripts/coconala/capture-account.mjs [--write]
 *   --write なし: 取得候補を表示するだけ (dry-run)
 *   --write あり: sellerName / profileUrl を coconala-account.json に書き込む
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { launchContext, waitForLogin, assertAccount, sleep, ACCOUNT_PATH } from './lib/coconala-session.mjs';

const WRITE = process.argv.includes('--write');
const ctx = await launchContext({ headless: false });
try {
  const page = ctx.pages()[0] || (await ctx.newPage());
  const lg = await waitForLogin(page, { tag: '[capture]', waitMinutes: 2 });
  if (!lg.ok) { console.error('ABORT: 未ログイン', lg.reason); await ctx.close(); process.exit(2); }

  // 1. mypage 系から users/NNNN のプロフィールリンクを収集
  let profileHref = '';
  for (const url of ['https://coconala.com/mypage/dashboard', 'https://coconala.com/mypage']) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await sleep(2500);
    const hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll('a[href*="/users/"]')).map((a) => a.getAttribute('href')),
    );
    const hit = (hrefs || []).map((h) => (h || '').match(/\/users\/(\d+)/)).find(Boolean);
    if (hit) { profileHref = `https://coconala.com/users/${hit[1]}`; break; }
  }

  // 2. 公開プロフィールから表示名 (= sellerName) を取得
  let sellerName = '';
  if (profileHref) {
    await page.goto(profileHref, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
    await sleep(2500);
    sellerName = await page.evaluate(() => {
      const og = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
      const h1 = document.querySelector('h1')?.textContent?.trim() || '';
      const t = (document.title || '').replace(/[|｜].*$/, '').trim();
      // og:title / h1 / title の順で最も短い妥当な表示名を選ぶ
      const cand = [h1, og.replace(/[|｜].*$/, '').trim(), t].filter((s) => s && s.length <= 40);
      return cand[0] || '';
    });
  }

  console.log('候補: profileUrl =', profileHref || '(未取得)', '/ sellerName =', sellerName || '(未取得)');

  if (WRITE && sellerName) {
    const acc = JSON.parse(readFileSync(ACCOUNT_PATH, 'utf8'));
    acc.sellerName = sellerName;
    if (profileHref) acc.profileUrl = profileHref;
    writeFileSync(ACCOUNT_PATH, JSON.stringify(acc, null, 2) + '\n');
    console.log('[write] coconala-account.json に記入しました。');

    // 3. 書いた sellerName で厳格 assert が通るか検証
    const a = await assertAccount(page, { tag: '[verify]' });
    console.log('[verify] assertAccount =', JSON.stringify(a));
  } else if (WRITE) {
    console.error('[write] sellerName を取得できず記入をスキップ (手入力してください)');
    process.exitCode = 3;
  }
  console.log('RESULT:', JSON.stringify({ profileUrl: profileHref, sellerName }));
} finally {
  await ctx.close();
}
