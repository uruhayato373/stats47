#!/usr/bin/env node
/**
 * login.mjs — 初回だけ headed Chrome で KDP に手動ログインし、永続プロファイルに保存する。
 * エージェントは認証を代行しない。人間が Amazon/KDP に (2FA 含め) 手動ログインする。
 *
 *   node .claude/scripts/kdp/login.mjs
 *
 * ログインが完了したら、このターミナルで Enter を押すとプロファイルが保存されて終了する。
 * ログイン後は capture-account.mjs で accountEmail/accountName を kdp-account.json に記入すること。
 */
import { launchContext, waitForLogin, sleep } from "./lib/kdp-session.mjs";

const ctx = await launchContext({ headless: false });
try {
  const page = ctx.pages()[0] || (await ctx.newPage());
  console.log("[login] KDP bookshelf を開きます。stats47 の Amazon/KDP アカウントにログインしてください (2FA 含む)。");
  const r = await waitForLogin(page, { tag: "[login]", waitMinutes: 10 });
  if (r.ok) {
    console.log("[login] ✅ ログインを確認しました。プロファイルに保存されました。");
    console.log("[login] 次: node .claude/scripts/kdp/capture-account.mjs --write で accountEmail/accountName を記入。");
  } else {
    console.log(`[login] ⚠ ${r.reason}. もう一度実行してください。`);
  }
  await sleep(1500);
} finally {
  await ctx.close();
}
