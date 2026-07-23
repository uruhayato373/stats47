#!/usr/bin/env node
/**
 * capture-account.mjs — ログイン中の KDP アカウント名/メールを拾って kdp-account.json に記入する。
 *   node .claude/scripts/kdp/capture-account.mjs            # 表示のみ
 *   node .claude/scripts/kdp/capture-account.mjs --write    # kdp-account.json に書き込み
 * account assert を厳格化するため、初回ログイン後に一度実行する。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { launchContext, waitForLogin, ACCOUNT_PATH, sleep } from "./lib/kdp-session.mjs";

const WRITE = process.argv.includes("--write");
const ctx = await launchContext({ headless: false });
try {
  const page = ctx.pages()[0] || (await ctx.newPage());
  const lg = await waitForLogin(page, { tag: "[capture]" });
  if (!lg.ok) {
    console.error("ABORT:", lg.reason);
    process.exit(2);
  }
  // アカウントメニュー等からメール/名前らしき文字列を収集 (KDP の DOM は変わりやすいので広めに拾う)。
  const info = await page.evaluate(() => {
    const text = document.body?.innerText || "";
    const email = (text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [])[0] || "";
    // 右上のアカウント名 (「〜さん」/「Hello, X」等) を推定
    const nameEl = document.querySelector('[id*="account"], [class*="account"], [aria-label*="account" i]');
    const name = (nameEl?.textContent || "").trim().slice(0, 60);
    return { email, name };
  });
  console.log("[capture] 推定:", JSON.stringify(info));
  console.log("   ※ KDP の DOM は変わるため、正しいメール/名前を目視確認してから記入してください。");
  if (WRITE) {
    let acct = {};
    try {
      acct = JSON.parse(readFileSync(ACCOUNT_PATH, "utf8"));
    } catch {}
    if (info.email) acct.accountEmail = info.email;
    if (info.name && !acct.accountName) acct.accountName = info.name;
    writeFileSync(ACCOUNT_PATH, JSON.stringify(acct, null, 2) + "\n");
    console.log(`[capture] ✅ kdp-account.json に記入しました (accountEmail 等)。誤りがあれば手で修正してください。`);
  } else {
    console.log("[capture] --write で kdp-account.json に記入します。");
  }
  await sleep(1000);
} finally {
  await ctx.close();
}
