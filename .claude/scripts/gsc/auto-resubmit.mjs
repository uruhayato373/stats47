#!/usr/bin/env node
/**
 * GSC URL Inspection / Coverage Drilldown 結果から未 INDEXED な URL を抽出し、
 * Google Indexing API で URL_UPDATED 通知を自動再送信する CLI スクリプト。
 *
 * - quota 200/day/project (公式: developers.google.com/search/apis/indexing-api/v3/quota)
 * - 7 日以内の重複再送信を防止 (.claude/state/metrics/gsc/resubmit-history.json)
 * - --dry-run default (--execute で初めて実送信)
 *
 * 入力 CSV: .claude/state/metrics/gsc/coverage-drilldown/{YYYY-Www}/{category}-urls.csv
 *   - フォーマット: 「URL,前回のクロール」のヘッダー + 1 列目に URL
 *   - ファイル名末尾 `indexed-submitted-urls.csv` は INDEXED 済なので除外
 *
 * 使い方:
 *   node .claude/scripts/gsc/auto-resubmit.mjs                  # dry-run (デフォルト)
 *   node .claude/scripts/gsc/auto-resubmit.mjs --execute        # 実送信
 *   node .claude/scripts/gsc/auto-resubmit.mjs --max 50         # 上限 50 件
 *   node .claude/scripts/gsc/auto-resubmit.mjs --input <csv>    # 任意 CSV を入力
 *
 * 認証: サービスアカウント鍵 (リポジトリルートの stats47-*.json)
 * scope: https://www.googleapis.com/auth/indexing
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { google } from "googleapis";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
};
const DRY_RUN = !args.includes("--execute");
const MAX = Number(getArg("--max") || 200);
const INPUT = getArg("--input");

const KEY_CANDIDATES = ["stats47-f6b5dae19196.json", "stats47-31b18ee67144.json"];
const HISTORY_PATH = path.join(
  PROJECT_ROOT,
  ".claude/state/metrics/gsc/resubmit-history.json"
);
const DRILLDOWN_DIR = path.join(
  PROJECT_ROOT,
  ".claude/state/metrics/gsc/coverage-drilldown"
);

const DAILY_QUOTA = 200;
const REQUEST_INTERVAL_MS = 200;
const DEDUP_WINDOW_DAYS = 7;

// ---------- helpers ----------

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function todayJST() {
  const d = new Date();
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10); // YYYY-MM-DD
}

function nowISO() {
  return new Date().toISOString();
}

/**
 * drilldown ディレクトリ以下の全 CSV パスを返す (indexed-submitted を除く)。
 * CI では checkout 後の mtime が全ファイル同一になり「最新 1 件」選択が
 * 非決定的になるため、全 CSV を集約して dedup を上位レイヤ (recentlyResubmitted) に委ねる。
 */
function findAllCsvs(dir) {
  if (!fs.existsSync(dir)) return [];
  const paths = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const subDir = path.join(dir, entry.name);
      for (const file of fs.readdirSync(subDir)) {
        if (!file.endsWith(".csv")) continue;
        if (file === "indexed-submitted-urls.csv") continue;
        paths.push(path.join(subDir, file));
      }
    } else if (entry.isFile() && entry.name.endsWith(".csv")) {
      if (entry.name === "history.csv") continue;
      paths.push(path.join(dir, entry.name));
    }
  }
  return paths;
}

/**
 * Drilldown CSV から URL を抽出する。
 * ファイル名末尾 (indexed-submitted-urls.csv) は事前に除外済みのため、
 * 残りはすべて未 INDEXED として扱う。
 * 第 2 列 (前回のクロール) は coverageState の代替として表示用に保持。
 */
function extractNonIndexed(csvPath) {
  const filename = path.basename(csvPath);
  // category 推定: ファイル名から `-urls.csv` を取り除いた残り
  const category = filename.replace(/-urls\.csv$/, "");
  const text = fs.readFileSync(csvPath, "utf8");
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (i === 0 && line.startsWith("URL")) continue; // header
    const cols = line.split(",");
    const url = cols[0]?.trim();
    if (!url || !url.startsWith("http")) continue;
    out.push({
      url,
      coverageState: category,
      lastCrawl: cols[1]?.trim() ?? "",
    });
  }
  return out;
}

function loadHistory() {
  if (!fs.existsSync(HISTORY_PATH)) {
    fs.mkdirSync(path.dirname(HISTORY_PATH), { recursive: true });
    fs.writeFileSync(HISTORY_PATH, "[]\n", "utf8");
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(HISTORY_PATH, "utf8"));
  } catch {
    return [];
  }
}

function recentlyResubmitted(url, history, windowDays) {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  for (const row of history) {
    if (row.url !== url) continue;
    if (row.status !== "success") continue;
    const ts = new Date(row.timestamp).getTime();
    if (ts >= cutoff) return ts;
  }
  return null;
}

function lastResubmitDate(url, history) {
  let latest = null;
  for (const row of history) {
    if (row.url !== url) continue;
    const ts = new Date(row.timestamp).getTime();
    if (latest === null || ts > latest) latest = ts;
  }
  return latest ? new Date(latest).toISOString().slice(0, 10) : "";
}

function countToday(history) {
  const today = todayJST();
  let n = 0;
  for (const row of history) {
    // timestamp は UTC ISO だが、Google quota は UTC 24h 区切り想定でも
    // 実運用上 JST 日付ベースで OK (1 日 1 回 cron 想定)
    const day = new Date(
      new Date(row.timestamp).getTime() + 9 * 60 * 60 * 1000
    )
      .toISOString()
      .slice(0, 10);
    if (day === today && row.status === "success") n++;
  }
  return n;
}

function appendHistory(url, status, extra = {}) {
  const history = loadHistory();
  history.push({
    timestamp: nowISO(),
    url,
    status,
    ...extra,
  });
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2) + "\n", "utf8");
}

// ---------- auth ----------

function loadAuth() {
  // GitHub Actions では GOOGLE_SERVICE_ACCOUNT_KEY_JSON env var に鍵 JSON が入っている。
  // ローカルではプロジェクトルートの JSON ファイルを使う。
  const envKeyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_JSON;
  let credentials = null;
  let keyFile = null;

  if (envKeyJson) {
    try {
      credentials = JSON.parse(envKeyJson);
    } catch (e) {
      console.error(
        "[error] GOOGLE_SERVICE_ACCOUNT_KEY_JSON の JSON パース失敗: " + e.message
      );
      process.exit(1);
    }
  } else {
    keyFile = KEY_CANDIDATES.map((f) => path.join(PROJECT_ROOT, f)).find((p) =>
      fs.existsSync(p)
    );
    if (!keyFile) {
      console.error(
        "[error] サービスアカウント鍵が見つかりません: " +
          KEY_CANDIDATES.join(", ") +
          " (環境変数 GOOGLE_SERVICE_ACCOUNT_KEY_JSON も未設定)"
      );
      process.exit(1);
    }
  }

  const auth = new google.auth.GoogleAuth({
    ...(credentials ? { credentials } : { keyFile }),
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  return google.indexing({ version: "v3", auth });
}

// ---------- main ----------

async function main() {
  // 1. 入力 CSV 特定 (--input 指定時は単一ファイル、省略時は全 CSV 集約)
  let csvPaths;
  if (INPUT) {
    const p = path.resolve(INPUT);
    if (!fs.existsSync(p)) {
      console.log(`[skip] 指定 CSV が存在しません: ${p}`);
      process.exit(0);
    }
    csvPaths = [p];
  } else {
    csvPaths = findAllCsvs(DRILLDOWN_DIR);
  }

  if (csvPaths.length === 0) {
    console.log(
      `[skip] 入力 CSV なし (DRILLDOWN_DIR=${DRILLDOWN_DIR})。終了します。`
    );
    process.exit(0);
  }
  console.log(`[input] ${csvPaths.length} CSV ファイル: ${csvPaths.map(p => path.relative(PROJECT_ROOT, p)).join(", ")}`);

  // 2. 未 INDEXED 抽出 (全 CSV を集約して URL 重複は Set で排除)
  const urlSeen = new Set();
  const allCandidates = [];
  for (const csvPath of csvPaths) {
    for (const c of extractNonIndexed(csvPath)) {
      if (!urlSeen.has(c.url)) {
        urlSeen.add(c.url);
        allCandidates.push(c);
      }
    }
  }
  const candidates = allCandidates;
  console.log(`[extract] non-indexed URLs: ${candidates.length} (${csvPaths.length} CSV 集約)`);

  // 3. 履歴 dedup (7 日以内除外)
  const history = loadHistory();
  const filtered = candidates.filter(
    (c) => !recentlyResubmitted(c.url, history, DEDUP_WINDOW_DAYS)
  );
  console.log(
    `[dedup] after ${DEDUP_WINDOW_DAYS}-day dedup: ${filtered.length} (skipped ${candidates.length - filtered.length})`
  );

  // 4. quota 確認
  const todayCount = countToday(history);
  const remainingQuota = Math.max(0, DAILY_QUOTA - todayCount);
  const willSend = Math.min(filtered.length, remainingQuota, MAX);
  console.log(
    `[quota] today=${todayCount}/${DAILY_QUOTA}, max=${MAX}, will_send=${willSend}`
  );

  // 5. 出力
  const targets = filtered.slice(0, willSend);
  if (DRY_RUN) {
    console.log(
      `[dry-run] candidates=${filtered.length}, today_quota=${todayCount}/${DAILY_QUOTA}, will_send=${willSend}`
    );
    console.log("URL | coverageState | last_resubmit | will_send");
    for (const c of targets) {
      const last = lastResubmitDate(c.url, history) || "-";
      console.log(`  ${c.url} | ${c.coverageState} | ${last} | Y`);
    }
    if (filtered.length > willSend) {
      console.log(
        `  ... (${filtered.length - willSend} more skipped: quota/max)`
      );
    }
    console.log(
      `[dry-run] 実送信するには --execute を付けて再実行してください。`
    );
    return;
  }

  // 6. 実送信
  const indexing = loadAuth();
  let ok = 0;
  let fail = 0;
  for (const c of targets) {
    try {
      await indexing.urlNotifications.publish({
        requestBody: { url: c.url, type: "URL_UPDATED" },
      });
      appendHistory(c.url, "success", {
        coverageState: c.coverageState,
      });
      ok++;
      console.log(`  [ok] ${c.url}`);
    } catch (err) {
      const msg = err?.message || String(err);
      appendHistory(c.url, "error", {
        coverageState: c.coverageState,
        error: msg,
      });
      fail++;
      console.log(`  [error] ${c.url} -- ${msg}`);
    }
    await sleep(REQUEST_INTERVAL_MS);
  }

  // 7. 集計
  const remainingAfter = Math.max(0, DAILY_QUOTA - (todayCount + ok));
  console.log(
    `[done] ok=${ok}, fail=${fail}, remaining_quota=${remainingAfter}/${DAILY_QUOTA}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
