#!/usr/bin/env node
/**
 * 投稿の素材 (画像・動画) を Google Drive (stats47/SNS素材/<platform>/<id>/) へ保全し、台帳の assets[] に
 * drive_path・sha256・bytes を記録する。Drive のマウントがある Mac で実行する (CI に Drive は無い)。
 *
 * 取得元は次の順に探す (見つかった最初の 1 つ):
 *   1. 行の media_path (repo 相対のローカルファイル / R2 key / 公開 URL)
 *   2. Instagram: 予約表 (instagram-w*-schedule.json) の slides・種類と、R2 sns/<domain>/<key>/instagram/ の命名規約
 *   3. YouTube: .local/r2/sns/<domain>/<key>/youtube-normal/video.mp4 とその R2 key
 * どれも無ければ state: "missing" と理由を記録する (R2 の mp4 は投稿 30 日後、.local/r2 は 7 日で消える)。
 * 404 以外の取得失敗は missing にせず止める (通信の失敗を「素材が無い」と記録しない)。
 * 引用 RT など画像を持たない投稿は assets: [] を正とする。
 *
 * usage:
 *   node .claude/scripts/sns/archive-sns-assets.mjs --id 922 [--dry-run]
 *   node .claude/scripts/sns/archive-sns-assets.mjs --all [--dry-run]          # posted / scheduled で未保全の行
 *   node .claude/scripts/sns/archive-sns-assets.mjs --since 2026-10-01         # この日以降に作られた・投稿された行
 *   ... [--recheck]  保全済みの行も取得元を探し直す
 *
 * 契約: .claude/rules/sns-content-standards.md §3
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { archiveFile, mimeOf, resolveDriveRoot } from "./lib/sns-drive-assets.mjs";
import { datasetDir } from "../../../config/datasets.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
const store = require("../lib/sns-posts-store.cjs");
const { R2_PUBLIC_BASE_URL: R2 } = require("../lib/site-config.cjs");

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const DRY = flag("--dry-run");
const RECHECK = flag("--recheck");
const ONLY_ID = value("--id") ? Number(value("--id")) : null;
const SINCE = value("--since");
if (!ONLY_ID && !SINCE && !flag("--all")) {
  console.error("usage: archive-sns-assets.mjs --id N | --all | --since YYYY-MM-DD [--dry-run] [--recheck]");
  process.exit(1);
}

const TEXT_ONLY = (row) => row.post_type === "quote_rt" || row.template === "quote-rt";

function loadScheduleIndex() {
  const dir = path.join(PROJECT_ROOT, datasetDir("sns.instagram-schedules"));
  const index = new Map();
  for (const f of fs.readdirSync(dir).filter((n) => /^instagram-w.+-schedule\.json$/.test(n))) {
    const json = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    for (const e of Array.isArray(json) ? json : json.entries ?? []) index.set(`${e.domain}|${e.content_key}`, e);
  }
  return index;
}

const roleOfFile = (file) => (mimeOf(file)?.startsWith("video/") ? "video" : "image");
const local = (rel) => ({ kind: "local", rel });
const r2 = (key) => ({ kind: "url", url: `${R2}/${key}`, source: key });

/** 行ごとに「素材 1 件 = 取得元候補の列」を返す。空配列 = 画像を持たない投稿 */
function plannedAssets(row, scheduleIndex) {
  if (TEXT_ONLY(row)) return [];
  const mp = row.media_path;
  // "video.mp4" だけの値と末尾 / のディレクトリ (カルーセルの stills/ 等) はファイルを指さないので規約で探す
  if (mp && mp !== "video.mp4" && !mp.endsWith("/")) {
    const cand = /^https?:\/\//.test(mp) ? { kind: "url", url: mp, source: mp } : mp.startsWith("sns/") ? r2(mp) : local(mp);
    return [{ role: roleOfFile(mp), order: 1, candidates: [cand] }];
  }
  const base = `sns/${row.domain}/${row.content_key}`;
  if (row.platform === "instagram") {
    const e = scheduleIndex.get(`${row.domain}|${row.content_key}`);
    const type = e?.type ?? (row.post_type === "reel" ? "reels" : row.post_type === "carousel" ? "carousel" : "image");
    // 投稿に使ったのは R2 の実体なので R2 を先に、無ければ同名のローカル staging を探す
    const both = (rel) => [r2(`${base}/instagram/${rel}`), local(`.local/r2/${base}/instagram/${rel}`)];
    if (type === "carousel") {
      if (!e?.slides?.length) return [{ role: "slide", order: 1, candidates: [], reason: "カルーセルの slides が予約表に無い" }];
      return e.slides.map((file, i) => ({ role: "slide", order: i + 1, candidates: both(`stills/${file}`) }));
    }
    if (type === "reels") return [{ role: "video", order: 1, candidates: both("reel.mp4") }];
    return [{ role: "image", order: 1, candidates: both("stills/slide-1-cover-1080x1350.png") }];
  }
  if (row.platform === "youtube" && row.content_key) {
    // バーチャートレースの長尺は key が bcr-<指標>-<開始年>-<終了年>、素材は bar-chart-race/<指標>/ (id 580 の media_path と同じ規約)
    const bcr = row.content_key.match(/^bcr-(.+)-\d{4}-\d{4}$/);
    const dir = bcr ? `sns/bar-chart-race/${bcr[1]}` : base;
    return [{
      role: "video",
      order: 1,
      candidates: [local(`.local/r2/${dir}/youtube-normal/video.mp4`), r2(`${dir}/youtube-normal/video.mp4`)],
    }];
  }
  return [{ role: row.post_type === "reel" ? "video" : "image", order: 1, candidates: [], reason: "台帳に素材の記録が無い" }];
}

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-sns-archive-"));

/** 候補を順に試し、ローカルファイルのパスと取得元ラベルを返す。全て無ければ { missing: 理由 } */
async function fetchCandidate(candidates) {
  const reasons = [];
  for (const c of candidates) {
    if (c.kind === "local") {
      const abs = path.join(PROJECT_ROOT, c.rel);
      if (fs.existsSync(abs)) return { file: abs, source: c.rel };
      reasons.push(`ローカルに無い (${c.rel}。.local/r2 は 7 日で消える)`);
      continue;
    }
    const res = await fetch(c.url);
    if (res.status === 404) {
      reasons.push(`R2 に無い (${c.source})`);
      continue;
    }
    if (!res.ok) throw new Error(`取得失敗 HTTP ${res.status}: ${c.url}`);
    const file = path.join(TMP, `${Date.now()}-${path.basename(new URL(c.url).pathname)}`);
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    return { file, source: c.source };
  }
  return { missing: reasons.join(" / ") || "取得元の候補が無い" };
}

const scheduleIndex = loadScheduleIndex();
const rows = store.loadAll().filter((row) => {
  if (ONLY_ID) return row.id === ONLY_ID;
  if (row.platform === "note" || row.deleted_at || !["posted", "scheduled"].includes(row.status)) return false;
  if (!RECHECK && Array.isArray(row.assets)) return false;
  if (SINCE) return (row.created_at ?? "") >= SINCE || (row.posted_at ?? "") >= SINCE;
  return true;
});

const driveRoot = DRY ? null : await resolveDriveRoot();
const patches = [];
const tally = { archived: 0, missing: 0, textOnly: 0 };
for (const row of rows) {
  const plan = plannedAssets(row, scheduleIndex);
  if (!plan.length) tally.textOnly++;
  const assets = [];
  for (const item of plan) {
    const got = item.candidates.length ? await fetchCandidate(item.candidates) : { missing: item.reason };
    if (got.missing) {
      assets.push({ role: item.role, order: item.order, state: "missing", reason: got.missing });
      tally.missing++;
      continue;
    }
    if (DRY) {
      assets.push({ role: item.role, order: item.order, state: "archived", source: got.source });
    } else {
      assets.push(await archiveFile({ driveRoot, platform: row.platform, id: row.id, role: item.role, order: item.order, sourceFile: got.file, source: got.source }));
    }
    tally.archived++;
  }
  patches.push({ id: row.id, patch: { assets } });
  if (DRY && ONLY_ID) console.log(JSON.stringify({ id: row.id, assets }, null, 2));
}

fs.rmSync(TMP, { recursive: true, force: true });
console.log(`${DRY ? "dry-run" : "APPLY"}: 対象 ${rows.length} 行 / 保全 ${tally.archived} 件 / missing ${tally.missing} 件 / 画像なしの投稿 ${tally.textOnly} 行`);
if (!DRY && patches.length) store.updateMany(patches);
