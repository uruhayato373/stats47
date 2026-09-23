#!/usr/bin/env node
"use strict";

/**
 * X の公開済み確認。ログイン済みの専用プロファイル (.local/playwright-x-profile) で自アカウントの
 * タイムラインを開き、見えた投稿の status URL・本文・時刻を集めて、台帳 posts.json の X 行
 * (status=scheduled で予約時刻を過ぎたもの) と本文 1 行目で突き合わせる。一致した行だけ
 * status=posted + post_url にする。時刻の経過だけでは posted にしない (memory feedback_x_post_url_integrity)。
 * 判定は lib/sns-posted-core.cjs (テスト付き)。
 *
 * X はログインしないとプロフィールが 403 になる (2026-09-23 実測) ため CI では動かせない。
 * Mac の launchd (scripts/scheduled/x-verify-posted.sh) が毎晩 --record で動かし、確認できた URL を
 * .local/x-posted.jsonl (git 管理外) に残す。無人の実行は git も R2 も触らない (R2 state の書き手は CI だけ)。
 * 台帳への反映はコミットするときに --apply で行う (記録ファイル + その時点のタイムラインの両方を使う)。
 *
 * usage:
 *   node .claude/scripts/sns/verify-x-posted.cjs --dry-run   (照合結果を表示するだけ)
 *   node .claude/scripts/sns/verify-x-posted.cjs --record    (記録ファイルへ追記。launchd)
 *   node .claude/scripts/sns/verify-x-posted.cjs --apply     (記録ファイル + タイムラインで posts.json を更新)
 *
 * 終了コード: 0 = 確認できた / 1 = 未ログイン・別アカウント・取得失敗 /
 * 3 = 予約時刻から 24 時間以上たっても公開を確認できない行がある (launchd が通知する)
 */

const path = require("node:path");
const { chromium } = require("playwright");
const store = require(path.join(__dirname, "../lib/sns-posts-store.cjs"));
const core = require(path.join(__dirname, "../lib/sns-posted-core.cjs"));
const fs = require("node:fs");

// publish-x と同じ専用プロファイル
const PROFILE_DIR = "/Users/minamidaisuke/stats47/.local/playwright-x-profile";
const ACCOUNT = "stats47jp373";
const SCROLLS = 6;
/** 確認できた status URL の記録 (git 管理外)。台帳への反映は --apply */
const LOG_PATH = path.resolve(__dirname, "../../../.local/x-posted.jsonl");

function readLog() {
  if (!fs.existsSync(LOG_PATH)) return [];
  return fs.readFileSync(LOG_PATH, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
}

async function scrapeTimeline() {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    args: ["--disable-blink-features=AutomationControlled"],
  });
  try {
    const page = context.pages()[0] || (await context.newPage());
    await page.goto(`https://x.com/${ACCOUNT}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
    const loggedIn = await page.locator('[data-testid="AppTabBar_Profile_Link"]').getAttribute("href").catch(() => null);
    if (!loggedIn || loggedIn.replace(/^\//, "").toLowerCase() !== ACCOUNT.toLowerCase()) {
      throw new Error(`@${ACCOUNT} でログインしていません (プロフィールリンク: ${loggedIn || "なし"})`);
    }
    const seen = new Map();
    for (let i = 0; i <= SCROLLS; i++) {
      const batch = await page.evaluate((acct) => {
        const out = [];
        for (const art of document.querySelectorAll('article[data-testid="tweet"]')) {
          const link = [...art.querySelectorAll('a[href*="/status/"]')].find((a) =>
            new RegExp(`^/${acct}/status/\\d+$`, "i").test(a.getAttribute("href") || ""),
          );
          if (!link) continue;
          const text = art.querySelector('[data-testid="tweetText"]');
          const time = link.querySelector("time") || art.querySelector("time");
          out.push({
            href: link.getAttribute("href"),
            text: text ? text.innerText : "",
            publishedAt: time ? time.getAttribute("datetime") : null,
          });
        }
        return out;
      }, ACCOUNT);
      for (const b of batch) if (!seen.has(b.href)) seen.set(b.href, b);
      await page.mouse.wheel(0, 2500);
      await page.waitForTimeout(1500);
    }
    return [...seen.values()];
  } finally {
    await context.close();
  }
}

async function main() {
  const mode = process.argv.includes("--apply") ? "apply" : process.argv.includes("--record") ? "record" : "dry-run";
  const now = new Date();
  const found = await scrapeTimeline();
  const scraped = found
    .filter((p) => p.text.trim())
    .map((p) => ({ permalink: `https://x.com${p.href}`, text: p.text, publishedAt: p.publishedAt }));
  console.log(`[verify-x-posted] @${ACCOUNT}: タイムラインで見えた投稿 ${scraped.length} 件`);

  const rows = store.loadAll();
  const { updates, overdue: overdueNow } = core.matchPosted(rows, scraped, now, { platform: "x", statuses: ["scheduled"] });
  // 過去の実行で記録済みの一致 (タイムラインから流れて見えなくなった分) も使う
  const logged = readLog();
  const byId = new Map(logged.map((e) => [e.id, e]));
  for (const u of updates) byId.set(u.id, u);
  const matched = [...byId.values()].filter((u) => {
    const r = rows.find((x) => x.id === u.id);
    return r && r.platform === "x" && r.status === "scheduled";
  });
  const overdue = overdueNow.filter((id) => !byId.has(id));

  for (const u of matched) {
    const r = rows.find((x) => x.id === u.id);
    console.log(`  ✅ ${r.content_key} → ${u.post_url}`);
  }
  for (const id of overdue) {
    const r = rows.find((x) => x.id === id);
    console.log(`  ⚠️  予約時刻から 24 時間以上たっても公開を確認できない: ${r.content_key} (${r.scheduled_at})`);
  }

  if (mode === "record") {
    const known = new Set(logged.map((e) => e.id));
    const fresh = updates.filter((u) => !known.has(u.id));
    if (fresh.length) {
      fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
      fs.appendFileSync(LOG_PATH, fresh.map((u) => JSON.stringify({ ...u, at: now.toISOString() })).join("\n") + "\n");
    }
    console.log(`[verify-x-posted] 記録ファイルへ追記 ${fresh.length} 件 (未反映の一致 ${matched.length} 件)`);
  } else if (mode === "apply") {
    for (const u of matched) store.updateById(u.id, { status: "posted", post_url: u.post_url, posted_at: u.posted_at });
    console.log(`[verify-x-posted] posts.json を posted に更新 ${matched.length} 件`);
  } else {
    console.log(`[verify-x-posted] (dry-run) 一致 ${matched.length} 件`);
  }
  console.log(`[verify-x-posted] 未確認 (24h 超) ${overdue.length} 件`);

  if (overdue.length > 0 && scraped.length === 0) {
    console.error("投稿が 1 件も見えません。ログインか画面の変更を疑ってください");
    process.exitCode = 1;
  } else if (overdue.length > 0) {
    process.exitCode = 3;
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message || e);
    process.exitCode = 1;
  });
}

module.exports = { scrapeTimeline };
