#!/usr/bin/env node
/**
 * login.mjs — ココナラ用の永続プロファイルに手動ログインを保存する (stats47)
 * ---------------------------------------------------------------------------
 * headed Chrome を coconala.com のログインページで開き、ユーザーが手動ログインするのを待つ。
 * ログイン成功 (マイページ描画) を検知したらプロファイルを保存して終了する。
 * 以降の coconala-publish / coconala-edit は再ログイン不要でこのプロファイルを共有する。
 *
 * ★アカウント: stats47 専用プロファイル .local/playwright-coconala-profile
 *   (doboku-note の dobokunote とは別。ここに入るのは stats47 のアカウント)。
 *
 * 使い方: node .claude/scripts/coconala/login.mjs   (最大 25 分待機)
 * ---------------------------------------------------------------------------
 */
import { launchContext, waitForLogin, PROFILE, sleep } from './lib/coconala-session.mjs';

const ctx = await launchContext({ headless: false });
try {
  const page = ctx.pages()[0] || (await ctx.newPage());
  await page.goto('https://coconala.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  console.log('[login] Chrome を開きました。この画面で stats47 のココナラアカウントにログインしてください。');
  console.log('[login] プロファイル:', PROFILE);

  const r = await waitForLogin(page, { waitMinutes: 25, tag: '[login]' });
  if (r.ok) {
    // ログイン後 Cookie を確実に書き出すため少し待ってから閉じる
    await sleep(2500);
    // 参考情報: マイページからプロフィール URL / 表示名を拾えれば表示 (account.json 記入の助け)
    let hint = {};
    try {
      hint = await page.evaluate(() => {
        const link = document.querySelector('a[href*="/users/"]');
        const href = link ? link.getAttribute('href') : '';
        return { profileHref: href };
      });
    } catch {}
    console.log('[login] ✓ ログインを検知。プロファイルに保存しました。');
    if (hint.profileHref) console.log('[login]   参考: プロフィールリンク候補 =', hint.profileHref);
    console.log('RESULT:', JSON.stringify({ ok: true, profile: PROFILE, ...hint }));
  } else {
    console.error('[login] ✗', r.reason);
    console.log('RESULT:', JSON.stringify({ ok: false, reason: r.reason }));
    process.exitCode = 2;
  }
} finally {
  await ctx.close();
}
