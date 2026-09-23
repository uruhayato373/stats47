#!/usr/bin/env node
"use strict";

/**
 * Threads の公開済み確認。ログインせずに自アカウントの公開プロフィールを開き、見えた投稿の
 * permalink と本文 (描画後の画面の投稿ごとの文字) を集めて、台帳 posts.json の Threads 行と
 * 本文 1 行目で突き合わせる。一致した行だけ status=posted + post_url (permalink) にする。
 * 判定は lib/sns-posted-core.cjs (テスト付き)。
 *
 * CI (.github/workflows/sns-verify-threads-posted.yml) が毎晩動かし、台帳を develop へ戻す。
 * ローカルでも同じコマンドで動く (ログイン不要)。
 *
 * usage:
 *   node .claude/scripts/sns/verify-threads-posted.cjs --dry-run
 *   node .claude/scripts/sns/verify-threads-posted.cjs --apply
 *   node .claude/scripts/sns/verify-threads-posted.cjs --dry-run --account zuck   (取得経路の動作確認用)
 *
 * 終了コード: 0 = 確認できた (一致 0 件を含む) / 1 = プロフィールが開けない、または予約時刻から
 * 24 時間以上たった行があるのに公開投稿が 1 件も見えない (ログイン壁・仕様変更を疑う)
 */

const path = require("node:path");
const { chromium } = require("playwright");
const store = require(path.join(__dirname, "../lib/sns-posts-store.cjs"));
const core = require(path.join(__dirname, "../lib/sns-posted-core.cjs"));

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36";

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : null;
}

/**
 * プロフィールに見えている投稿の permalink・公開時刻・本文を集める。
 * 本文は描画後の画面から読む: 投稿リンク (/@acct/post/CODE) から親をたどり、別の投稿の
 * リンクを含まない一番外側の要素をその投稿のまとまりとみなして innerText を取る。
 * (投稿ページの og:description はリンクプレビュー用の巡回ソフトにしか返らないため使わない)
 */
async function scrapeProfile(account) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ locale: "ja-JP", userAgent: UA });
    const res = await page.goto(`https://www.threads.com/@${account}`, { waitUntil: "domcontentloaded" });
    if (!res || res.status() !== 200) throw new Error(`プロフィールが開けません: HTTP ${res ? res.status() : "none"}`);
    await page.waitForTimeout(6000);
    for (let i = 0; i < 3; i++) {
      await page.mouse.wheel(0, 2500);
      await page.waitForTimeout(1500);
    }
    return await page.evaluate((acct) => {
      const prefix = `/@${acct}/post/`;
      const codeOf = (a) => {
        const m = (a.getAttribute("href") || "").match(/^\/@[^/]+\/post\/([A-Za-z0-9_-]+)/);
        return m ? m[1] : null;
      };
      const codesIn = (el) => new Set([...el.querySelectorAll(`a[href^="${prefix}"]`)].map(codeOf).filter(Boolean));
      const out = new Map();
      for (const a of document.querySelectorAll(`a[href^="${prefix}"]`)) {
        const code = codeOf(a);
        if (!code || out.has(code)) continue;
        let box = a;
        while (box.parentElement && codesIn(box.parentElement).size === 1) box = box.parentElement;
        const t = box.querySelector("time");
        out.set(code, { code, text: box.innerText || "", publishedAt: t ? t.getAttribute("datetime") : null });
      }
      return [...out.values()];
    }, account);
  } finally {
    await browser.close();
  }
}

async function main() {
  const apply = process.argv.includes("--apply");
  const account = arg("--account") || "stats47jp";
  const now = new Date();

  const found = await scrapeProfile(account);
  const scraped = found
    .filter((p) => p.text.trim())
    .map((p) => ({ permalink: `https://www.threads.com/@${account}/post/${p.code}`, text: p.text, publishedAt: p.publishedAt }));
  console.log(`[verify-threads-posted] @${account}: 公開プロフィールで見えた投稿 ${found.length} 件 / 本文取得 ${scraped.length} 件`);
  for (const s of scraped.slice(0, 5)) console.log(`  ${s.permalink} ${s.publishedAt || "-"} ${s.text.replace(/\s+/g, " ").slice(0, 40)}`);

  if (account !== "stats47jp") return; // 取得経路の確認だけ

  const rows = store.loadAll();
  const { updates, overdue } = core.matchPosted(rows, scraped, now);
  for (const u of updates) {
    const r = rows.find((x) => x.id === u.id);
    console.log(`  ✅ ${r.content_key} → ${u.post_url}`);
    if (apply) store.updateById(u.id, { status: "posted", post_url: u.post_url, posted_at: u.posted_at });
  }
  for (const id of overdue) {
    const r = rows.find((x) => x.id === id);
    console.log(`  ⚠️  予約時刻から 24 時間以上たっても公開を確認できない: ${r.content_key} (${r.scheduled_at})`);
  }
  console.log(`[verify-threads-posted]${apply ? "" : " (dry-run)"} posted ${updates.length} 件 / 未確認 (24h 超) ${overdue.length} 件`);
  if (overdue.length > 0 && scraped.length === 0) {
    console.error("公開投稿が 1 件も見えません。ログイン壁か画面の変更を疑ってください");
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
