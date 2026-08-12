#!/usr/bin/env node
/**
 * capture-account.mjs — ログイン中の KDP アカウント名/メールを拾って記録する。
 *   node .claude/scripts/kdp/capture-account.mjs            # 表示のみ
 *   node .claude/scripts/kdp/capture-account.mjs --write    # .local/kdp-account.local.json に書き込み
 *
 * ★書き込み先は git 管理外。このリポジトリは public なので、公開側の
 *   .claude/config/kdp-account.json には個人情報を書かない (2026-08-12)。
 * ★KDP はメールを本棚に出さず、アカウントページは 2FA を再要求するため、実測では
 *   自動取得できなかった。その場合は knownAsin (この口座で公開済みの本の ASIN) で照合する。
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { launchContext, waitForLogin, ACCOUNT_LOCAL_PATH, sleep } from "./lib/kdp-session.mjs";

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
    // ★書き込み先は git 管理外 (.local/)。**公開リポジトリにメールアドレスを書かない** (2026-08-12)。
    //   stats47 は public なので、`.claude/config/kdp-account.json` に入れると GitHub に載る。
    //   readAccount() が .local を上書きとして重ねるので、assert には問題なく効く。
    let acct = {};
    try {
      acct = JSON.parse(readFileSync(ACCOUNT_LOCAL_PATH, "utf8"));
    } catch {}
    if (info.email) acct.accountEmail = info.email;
    if (info.name && !acct.accountName) acct.accountName = info.name;
    if (!info.email && !info.name) {
      console.log("[capture] ⚠ メール/名前を検出できなかったため書き込みません。");
      console.log("   KDP はメールを本棚に出さず、アカウントページは 2FA を再要求するため自動取得できません。");
      console.log(`   代わりに ${ACCOUNT_LOCAL_PATH} に knownAsin (この口座で公開済みの本の ASIN) を記入すると照合できます。`);
    } else {
      mkdirSync(dirname(ACCOUNT_LOCAL_PATH), { recursive: true });
      writeFileSync(ACCOUNT_LOCAL_PATH, JSON.stringify(acct, null, 2) + "\n");
      console.log(`[capture] ✅ ${ACCOUNT_LOCAL_PATH} に記入しました (git 管理外)。誤りがあれば手で修正してください。`);
    }
  } else {
    console.log(`[capture] --write で ${ACCOUNT_LOCAL_PATH} (git 管理外) に記入します。`);
  }
  await sleep(1000);
} finally {
  await ctx.close();
}
