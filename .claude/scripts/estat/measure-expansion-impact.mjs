#!/usr/bin/env node
/**
 * measure-expansion-impact.mjs — 公開した拡充ランキングの GSC 流入を計測しキューに反映する。
 *
 * ブログの measure-gsc-impact.mjs と同型。継続計測ループの「計測」担当。
 * 公開済 (status published/measured・key 有り) の queue エントリについて、最新 GSC の
 * /ranking/<key> の impressions/clicks を拾って gsc フィールドに書き込む。
 * → 次の build-expansion-queue が categoryTraffic に集計し、流入が付いたカテゴリの pending を優先する。
 *
 * 真実源: .claude/state/estat/expansion-queue.json (gsc を upsert)
 * 入力  : .claude/skills/analytics/gsc-improvement/reference/snapshots/<week>/pages.csv (最新週)
 *
 * Usage:
 *   node .claude/scripts/estat/measure-expansion-impact.mjs            # 最新週で計測
 *   node .claude/scripts/estat/measure-expansion-impact.mjs --week 2026-W28
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const QUEUE_FILE = path.join(ROOT, ".claude/state/estat/expansion-queue.json");
const SNAP_DIR = path.join(ROOT, ".claude/skills/analytics/gsc-improvement/reference/snapshots");

const args = process.argv.slice(2);
const weekArg = args.includes("--week") ? args[args.indexOf("--week") + 1] : null;

function latestWeek() {
  const weeks = fs.readdirSync(SNAP_DIR)
    .filter((d) => /^\d{4}-W\d{2}$/.test(d) && fs.existsSync(path.join(SNAP_DIR, d, "pages.csv")))
    .sort();
  return weeks[weeks.length - 1];
}

const week = weekArg || latestWeek();
if (!week) { console.error("GSC snapshot 週が見つかりません"); process.exit(1); }

// pages.csv → key -> {imp,clk,ctr,pos}
const rows = fs.readFileSync(path.join(SNAP_DIR, week, "pages.csv"), "utf8").split(/\r?\n/);
const gscByKey = new Map();
for (let i = 1; i < rows.length; i++) {
  const cols = rows[i].split(",");
  if (cols.length < 5 || !cols[0].includes("/ranking/")) continue;
  const key = cols[0].split("/ranking/")[1].replace(/\/$/, "");
  gscByKey.set(key, {
    impressions: Number(cols[2]) || 0, clicks: Number(cols[1]) || 0,
    ctr: Number(cols[3]) || 0, position: Number(cols[4]) || 0,
  });
}

const q = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
let measured = 0, withTraffic = 0;
for (const e of q.queue) {
  if (!e.key || (e.status !== "published" && e.status !== "measured" && e.status !== "generated")) continue;
  const g = gscByKey.get(e.key);
  if (!g) continue;
  e.gsc = { ...g, week };
  if (e.status === "published" || e.status === "measured") e.status = "measured";
  measured++;
  if (g.impressions > 0) withTraffic++;
}
q.measuredAt = process.env.EXPANSION_QUEUE_NOW || new Date().toISOString();
q.measuredWeek = week;
fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 1));
console.log(`計測 (${week}): 公開済で GSC 一致 ${measured} 件 / うち流入あり ${withTraffic} 件`);
console.log("→ build-expansion-queue を再実行すると categoryTraffic に反映され、流入カテゴリの pending が優先される");
