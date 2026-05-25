#!/usr/bin/env node
/**
 * submit-cities-indexing.mjs
 *
 * cities pages (PHASE_1_SSG_CITIES) を Google Indexing API (URL_UPDATED) で
 * 強制再クロール promotion する。1 回 200 件 (Indexing API daily quota の上限)。
 *
 * 用途:
 *   - URL Inspection 診断で「Blocked by robots.txt (古い cache)」「Unknown to Google」と
 *     判定された cities pages を、最新コンテンツとして Google に再認識させる
 *   - cities-revival deploy (2026-05-16) 以降の indexed 化を加速
 *
 * Usage:
 *   node .claude/scripts/gsc/submit-cities-indexing.mjs --dry-run
 *   node .claude/scripts/gsc/submit-cities-indexing.mjs --execute
 *   node .claude/scripts/gsc/submit-cities-indexing.mjs --execute --limit 50
 *
 * 認証: GOOGLE_SERVICE_ACCOUNT_KEY_JSON env var or stats47-*.json
 *
 * 関連:
 *   docs/02_実装計画/cities-revival-plan.md
 *   .claude/scripts/gsc/auto-resubmit.mjs (本スクリプトは同じ pattern を使用)
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../../..");

const SITE_ORIGIN = "https://stats47.jp";
const DAILY_QUOTA = 200;
const REQUEST_INTERVAL_MS = 250;
const KEY_CANDIDATES = ["stats47-f6b5dae19196.json", "stats47-31b18ee67144.json"];

// ---------- CLI ----------
const args = process.argv.slice(2);
const DRY_RUN = !args.includes("--execute");
const LIMIT_IDX = args.indexOf("--limit");
const LIMIT = LIMIT_IDX >= 0 ? parseInt(args[LIMIT_IDX + 1], 10) : DAILY_QUOTA;

// ---------- auth ----------
function loadAuth() {
  const envKeyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
  let credentials = null;
  let keyFile = null;
  if (envKeyJson) {
    credentials = JSON.parse(envKeyJson);
  } else {
    keyFile = KEY_CANDIDATES.map((f) => path.join(PROJECT_ROOT, f)).find((p) =>
      fs.existsSync(p)
    );
    if (!keyFile) {
      console.error("[error] service account key not found");
      process.exit(1);
    }
  }
  const auth = new google.auth.GoogleAuth({
    ...(credentials ? { credentials } : { keyFile }),
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  return google.indexing({ version: "v3", auth });
}

// ---------- city URLs ----------
function loadCityUrls() {
  const tsPath = path.join(
    PROJECT_ROOT,
    "apps/web/src/features/area-profile/constants/stage-1-cities.ts"
  );
  const text = fs.readFileSync(tsPath, "utf8");
  const re = /areaCode:\s*"(\d+)"\s*,\s*cityCode:\s*"(\d+)"/g;
  const all = [];
  let m;
  while ((m = re.exec(text)) !== null) {
    all.push(`${SITE_ORIGIN}/areas/${m[1]}/cities/${m[2]}`);
  }
  return all;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- main ----------
async function main() {
  const allUrls = loadCityUrls();
  const targets = allUrls.slice(0, LIMIT);

  console.log(`[info] total cities: ${allUrls.length}, submitting: ${targets.length}`);
  console.log(`[info] mode: ${DRY_RUN ? "DRY-RUN" : "EXECUTE"}`);

  if (DRY_RUN) {
    console.log(`\n[dry-run] 最初の 5 URL:`);
    for (const u of targets.slice(0, 5)) console.log(`  ${u}`);
    console.log(`...`);
    console.log(`\n[dry-run] 実送信するには --execute を付けて再実行`);
    return;
  }

  const indexing = loadAuth();
  let ok = 0;
  let fail = 0;
  const failures = [];

  for (let i = 0; i < targets.length; i++) {
    const url = targets[i];
    try {
      await indexing.urlNotifications.publish({
        requestBody: { url, type: "URL_UPDATED" },
      });
      ok++;
      if ((i + 1) % 25 === 0 || i + 1 === targets.length) {
        console.log(`  [${i + 1}/${targets.length}] ok=${ok}, fail=${fail}`);
      }
    } catch (err) {
      const msg = err?.message || String(err);
      failures.push({ url, error: msg.slice(0, 120) });
      fail++;
    }
    await sleep(REQUEST_INTERVAL_MS);
  }

  console.log(`\n========== RESULT ==========`);
  console.log(`ok: ${ok} / fail: ${fail} / total: ${targets.length}`);
  if (failures.length > 0 && failures.length <= 10) {
    console.log(`\nfailures:`);
    for (const f of failures) console.log(`  ${f.url}: ${f.error}`);
  } else if (failures.length > 10) {
    console.log(`\n(${failures.length} failures, showing first 10)`);
    for (const f of failures.slice(0, 10)) console.log(`  ${f.url}: ${f.error}`);
  }
  console.log(`\n[done] 1-3 日以内に Google が再クロールするはず。`);
  console.log(`次回 URL Inspection 再診断: 7-14 日後に inspect-cities-sample.cjs を再実行`);
}

main().catch((e) => {
  console.error(`Fatal: ${e.stack || e.message}`);
  process.exit(2);
});
