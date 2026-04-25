#!/usr/bin/env node
/**
 * priority-100-ranking-keys.csv を生成
 *
 * GSC pages.csv の /ranking/{key} 上位 100（Impressions 順）を抽出し、
 * ranking_ai_content の有無、Position、Clicks、CTR を付帯。
 *
 * 親 issue #115 Phase 4（C 案）の準備データ。
 *
 * 出力: .claude/skills/analytics/gsc-improvement/reference/priority-100-ranking-keys.csv
 */

const path = require("node:path");
const fs = require("node:fs");
const Database = require("/Users/minamidaisuke/stats47/node_modules/better-sqlite3");

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const D1_PATH = path.join(
  PROJECT_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);

function log(m) {
  process.stderr.write(`[priority-100] ${m}\n`);
}

function readCsv(p) {
  const txt = fs.readFileSync(p, "utf-8");
  const lines = txt.trim().split("\n");
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    const r = {};
    headers.forEach((h, i) => (r[h] = cols[i]));
    return r;
  });
}

function getLatestSnapshotDir() {
  const dir = path.join(
    PROJECT_ROOT,
    ".claude/skills/analytics/gsc-improvement/reference/snapshots",
  );
  const weeks = fs
    .readdirSync(dir)
    .filter((n) => /^\d{4}-W\d{2}$/.test(n))
    .sort()
    .reverse();
  return weeks[0] ? path.join(dir, weeks[0]) : null;
}

function extractRankingKey(url) {
  const m = url.match(/^https?:\/\/[^/]+\/ranking\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : null;
}

function escCsv(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function main() {
  const snap = getLatestSnapshotDir();
  if (!snap) throw new Error("No GSC snapshot");

  const pages = readCsv(path.join(snap, "pages.csv"));

  // /ranking/{key} 集計
  const stats = new Map();
  for (const r of pages) {
    const k = extractRankingKey(r.page);
    if (!k) continue;
    const cur = stats.get(k) || {
      key: k,
      impressions: 0,
      clicks: 0,
      ctrSum: 0,
      positionSum: 0,
      n: 0,
    };
    cur.impressions += parseInt(r.impressions, 10) || 0;
    cur.clicks += parseInt(r.clicks, 10) || 0;
    cur.ctrSum += parseFloat(r.ctr) || 0;
    cur.positionSum += parseFloat(r.position) || 0;
    cur.n += 1;
    stats.set(k, cur);
  }

  const ranked = Array.from(stats.values())
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 100);

  // ranking_ai_content 有無
  const db = new Database(D1_PATH, { readonly: true });
  const aiKeys = new Set(
    db
      .prepare(
        "SELECT DISTINCT ranking_key FROM ranking_ai_content WHERE is_active=1",
      )
      .all()
      .map((r) => r.ranking_key),
  );
  const itemMeta = new Map();
  for (const r of db
    .prepare(
      "SELECT ranking_key, title FROM ranking_items WHERE area_type='prefecture'",
    )
    .all()) {
    itemMeta.set(r.ranking_key, r.title);
  }
  db.close();

  const headers = [
    "rank",
    "ranking_key",
    "title",
    "impressions",
    "clicks",
    "ctr_avg",
    "position_avg",
    "has_ai_content",
  ];
  const lines = [headers.join(",")];
  ranked.forEach((s, i) => {
    const ctrAvg = s.n > 0 ? (s.ctrSum / s.n).toFixed(4) : "0";
    const posAvg = s.n > 0 ? (s.positionSum / s.n).toFixed(2) : "0";
    const row = [
      i + 1,
      s.key,
      itemMeta.get(s.key) || "",
      s.impressions,
      s.clicks,
      ctrAvg,
      posAvg,
      aiKeys.has(s.key) ? "1" : "0",
    ];
    lines.push(row.map(escCsv).join(","));
  });

  const outDir = path.join(
    PROJECT_ROOT,
    ".claude/skills/analytics/gsc-improvement/reference",
  );
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "priority-100-ranking-keys.csv");
  fs.writeFileSync(outPath, lines.join("\n") + "\n");
  log(`Wrote ${path.relative(PROJECT_ROOT, outPath)} (${ranked.length} keys)`);

  // 簡易サマリー
  const withAi = ranked.filter((s) => aiKeys.has(s.key)).length;
  const withoutAi = ranked.length - withAi;
  log(`AI コンテンツあり: ${withAi} / なし: ${withoutAi}`);
  log(`Top 5:`);
  for (const s of ranked.slice(0, 5)) {
    log(
      `  #${ranked.indexOf(s) + 1} ${s.impressions.toString().padStart(4)} impr  ${s.key}`,
    );
  }
}

main();
