#!/usr/bin/env node
/**
 * R2 snapshot freshness check
 *
 * .claude/skills/db/export-snapshots/snapshots.config.json を読み、
 * 各 snapshot prefix の最新 uploaded タイムスタンプを Cloudflare R2 REST API で取得して
 * maxAgeDays を超えていれば stale としてレポートする。
 *
 * Exit codes:
 *   0 — すべて健全
 *   1 — 1 件以上が stale (snapshot 古い)
 *   2 — 1 件以上の prefix で R2 list 失敗
 *
 * Usage:
 *   node .claude/scripts/snapshots/check-freshness.mjs              # human report to stdout
 *   node .claude/scripts/snapshots/check-freshness.mjs --json       # JSON to stdout
 *   node .claude/scripts/snapshots/check-freshness.mjs --markdown   # GitHub-friendly markdown
 *
 * Required env:
 *   CLOUDFLARE_API_TOKEN     R2 read 権限
 *   CLOUDFLARE_ACCOUNT_ID
 *   CLOUDFLARE_R2_BUCKET_NAME (default "stats47")
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const CONFIG_PATH = path.resolve(
  PROJECT_ROOT,
  ".claude/skills/db/export-snapshots/snapshots.config.json",
);

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;
const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || "stats47";

if (!accountId || !apiToken) {
  console.error(
    "❌ CLOUDFLARE_ACCOUNT_ID または CLOUDFLARE_API_TOKEN が未設定です",
  );
  process.exit(3);
}

const args = process.argv.slice(2);
const outputFormat = args.includes("--json")
  ? "json"
  : args.includes("--markdown")
    ? "markdown"
    : "human";

if (!fs.existsSync(CONFIG_PATH)) {
  console.error(`❌ 設定ファイルが見つかりません: ${CONFIG_PATH}`);
  process.exit(3);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));

/**
 * R2 REST API で prefix の最新 last_modified を取得。
 *
 * 注意: Cloudflare R2 REST API の list は per_page=20 でハードキャップされている
 * （limit パラメータを送っても無視される）。partitioned snapshot
 * (correlation 1830, ranking-values 29K) を全件 scan するのは現実的でない。
 *
 * Freshness check の目的は「操作者が /export-snapshots を忘れている」検知なので、
 * その場合は prefix 配下の全ファイルが同じ古さで stale になる前提が成り立つ。
 * 先頭 5 ページ (100 オブジェクト) のサンプルで最新タイムスタンプを判定する。
 *
 * 一時的な HTTP エラー (502, 504 等) は最大 3 回 retry。
 */
const MAX_PAGES_SAMPLE = 5;
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1500;

async function fetchPage(prefix, cursor) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const params = new URLSearchParams({ prefix });
    if (cursor) params.set("cursor", cursor);

    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects?${params}`;
    try {
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      if (response.ok) {
        const json = await response.json();
        if (!json.success) {
          throw new Error(
            `R2 list ${prefix}: API error: ${JSON.stringify(json.errors)}`,
          );
        }
        return json;
      }
      lastError = new Error(
        `R2 list ${prefix}: HTTP ${response.status} ${response.statusText}`,
      );
      if (response.status >= 500 && attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
        continue;
      }
      throw lastError;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS * attempt));
      }
    }
  }
  throw lastError ?? new Error(`R2 list ${prefix}: unknown error`);
}

async function getLatestUploaded(prefix) {
  let cursor;
  let latest = null;
  let totalObjects = 0;
  let pageCount = 0;

  do {
    const json = await fetchPage(prefix, cursor);
    pageCount++;
    for (const obj of json.result || []) {
      totalObjects++;
      const uploaded = obj.last_modified ? new Date(obj.last_modified) : null;
      if (uploaded && (!latest || uploaded > latest)) {
        latest = uploaded;
      }
    }
    cursor = json.result_info?.is_truncated ? json.result_info.cursor : null;
    if (pageCount >= MAX_PAGES_SAMPLE) break;
  } while (cursor);

  return { latest, totalObjects, sampledPages: pageCount, isComplete: !cursor };
}

function ageDays(date) {
  return (Date.now() - date.getTime()) / (24 * 60 * 60 * 1000);
}

function fmtAge(d) {
  if (d < 1) return `${(d * 24).toFixed(1)}h`;
  if (d < 30) return `${d.toFixed(1)}d`;
  return `${(d / 30).toFixed(1)}mo`;
}

const results = [];

for (const snap of config.snapshots) {
  const startedAt = Date.now();
  try {
    const { latest, totalObjects } = await getLatestUploaded(snap.r2Prefix);
    if (!latest) {
      results.push({
        label: snap.label,
        prefix: snap.r2Prefix,
        status: "missing",
        totalObjects,
        latest: null,
        ageDays: null,
        maxAgeDays: snap.maxAgeDays,
        durationMs: Date.now() - startedAt,
      });
      continue;
    }
    const age = ageDays(latest);
    results.push({
      label: snap.label,
      prefix: snap.r2Prefix,
      status: age > snap.maxAgeDays ? "stale" : "fresh",
      totalObjects,
      latest: latest.toISOString(),
      ageDays: age,
      maxAgeDays: snap.maxAgeDays,
      durationMs: Date.now() - startedAt,
    });
  } catch (error) {
    results.push({
      label: snap.label,
      prefix: snap.r2Prefix,
      status: "error",
      error: error.message,
      maxAgeDays: snap.maxAgeDays,
      durationMs: Date.now() - startedAt,
    });
  }
}

const stale = results.filter((r) => r.status === "stale" || r.status === "missing");
const errors = results.filter((r) => r.status === "error");

if (outputFormat === "json") {
  console.log(JSON.stringify({ checkedAt: new Date().toISOString(), results }, null, 2));
} else if (outputFormat === "markdown") {
  console.log("# 📦 Snapshot Freshness Report");
  console.log("");
  console.log(`Checked at: \`${new Date().toISOString()}\``);
  console.log("");
  console.log("| Snapshot | Prefix | Latest | Age | Max | Status |");
  console.log("|---|---|---|---|---|---|");
  for (const r of results) {
    const icon = r.status === "fresh" ? "✅" : r.status === "stale" ? "⚠️ stale" : r.status === "missing" ? "❌ missing" : "💥 error";
    const latest = r.latest ? r.latest.slice(0, 10) : "—";
    const age = r.ageDays !== null && r.ageDays !== undefined ? fmtAge(r.ageDays) : "—";
    console.log(
      `| ${r.label} | \`${r.prefix}\` | ${latest} | ${age} | ${r.maxAgeDays}d | ${icon} |`,
    );
  }
  if (stale.length > 0) {
    console.log("");
    console.log(`## ⚠️ Stale snapshots (${stale.length})`);
    console.log("");
    for (const r of stale) {
      const ageFmt =
        r.ageDays !== null && r.ageDays !== undefined ? fmtAge(r.ageDays) : "missing";
      console.log(
        `- **${r.label}** — ${ageFmt} old (max ${r.maxAgeDays}d). Run \`/export-snapshots --only ${r.label}\` → \`/push-r2 --prefix ${r.prefix}\``,
      );
    }
  }
  if (errors.length > 0) {
    console.log("");
    console.log(`## 💥 Errors (${errors.length})`);
    for (const r of errors) {
      console.log(`- **${r.label}** (\`${r.prefix}\`): ${r.error}`);
    }
  }
} else {
  console.log("");
  console.log("📦 Snapshot Freshness Report");
  console.log("─".repeat(80));
  for (const r of results) {
    const icon =
      r.status === "fresh" ? "✅" : r.status === "stale" ? "⚠️ " : r.status === "missing" ? "❌" : "💥";
    const ageFmt =
      r.ageDays !== null && r.ageDays !== undefined
        ? fmtAge(r.ageDays).padStart(7)
        : "    —  ";
    const latest = r.latest ? r.latest.slice(0, 10) : "(none)";
    if (r.status === "error") {
      console.log(`${icon} ${r.label.padEnd(20)} ${r.error}`);
    } else {
      console.log(
        `${icon} ${r.label.padEnd(20)} ${ageFmt} (max ${String(r.maxAgeDays).padStart(2)}d) latest=${latest} objects=${r.totalObjects}`,
      );
    }
  }
  console.log("─".repeat(80));
  console.log(
    `Total: ${results.length} | fresh: ${results.length - stale.length - errors.length} | stale: ${stale.length} | error: ${errors.length}`,
  );
}

if (errors.length > 0) process.exit(2);
if (stale.length > 0) process.exit(1);
process.exit(0);
