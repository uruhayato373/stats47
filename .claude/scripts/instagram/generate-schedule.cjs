#!/usr/bin/env node
/**
 * Instagram スケジュール自動生成
 *
 * D1 sns_posts + ig-posted-log.jsonl から投稿済みキーを収集し、
 * 未投稿かつアセット準備済みのキーを候補として次スケジュールを生成する。
 *
 * 実行例:
 *   node .claude/scripts/instagram/generate-schedule.cjs \
 *     --from 2026-06-11 --to 2026-07-01 \
 *     --images 14 --reels 3 \
 *     --out .claude/state/instagram-w20-schedule.json
 *
 * オプション:
 *   --from YYYY-MM-DD  開始日（デフォルト: 翌日）
 *   --to   YYYY-MM-DD  終了日（デフォルト: from+20日）
 *   --images N         ranking 画像スロット数（デフォルト: 18）
 *   --reels  N         bar-chart-race リールスロット数（デフォルト: 3）
 *   --out  PATH        出力先（デフォルト: stdout のみ、書き込まない）
 *   --dry-run          候補一覧だけ表示してスケジュール生成しない
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..", "..", "..");
const D1_PATH = path.join(
  ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite"
);
const LOG_PATH = path.join(ROOT, ".claude/state/ig-posted-log.jsonl");
const SNS_RANKING = path.join(ROOT, ".local/r2/sns/ranking");
const SNS_BCR = path.join(ROOT, ".local/r2/sns/bar-chart-race");
const APP_RANKING = path.join(ROOT, ".local/r2/app/ranking");
const STATE_DIR = path.join(ROOT, ".claude/state");

// ---------------------------------------------------------
// 引数解析
// ---------------------------------------------------------

const args = process.argv.slice(2);
const get = (flag) => { const i = args.indexOf(flag); return i !== -1 ? args[i + 1] : null; };
const has = (flag) => args.includes(flag);

const dryRun = has("--dry-run");
const outPath = get("--out");
const nImages = parseInt(get("--images") || "18", 10);
const nReels  = parseInt(get("--reels")  || "3",  10);

const today = new Date();
const defaultFrom = new Date(today);
defaultFrom.setDate(defaultFrom.getDate() + 1);
const fromDate = get("--from") || defaultFrom.toISOString().slice(0, 10);
const defaultTo = new Date(fromDate);
defaultTo.setDate(defaultTo.getDate() + 20);
const toDate = get("--to") || defaultTo.toISOString().slice(0, 10);

// ---------------------------------------------------------
// 投稿済みセットを収集
// ---------------------------------------------------------

function loadPostedSet() {
  const posted = new Set(); // "domain::content_key"

  // 1. D1 from local sqlite (optional — skip if not available)
  try {
    const Database = require("better-sqlite3");
    const db = new Database(D1_PATH, { readonly: true });
    const rows = db.prepare(
      `SELECT domain, content_key FROM sns_posts WHERE platform='instagram' AND status='posted'`
    ).all();
    db.close();
    for (const r of rows) posted.add(`${r.domain}::${r.content_key}`);
    console.log(`[D1] ${rows.length} 件の投稿済みレコードを取得`);
  } catch (e) {
    console.warn(`[D1] スキップ (${e.message.slice(0, 60)})`);
  }

  // 2. ig-posted-log.jsonl
  if (fs.existsSync(LOG_PATH)) {
    let logCount = 0;
    for (const line of fs.readFileSync(LOG_PATH, "utf8").trim().split("\n")) {
      if (!line) continue;
      try {
        const e = JSON.parse(line);
        posted.add(`${e.domain}::${e.content_key}`);
        logCount++;
      } catch {}
    }
    console.log(`[log] ${logCount} 件の投稿済みログを取得`);
  }

  // 3. 既存スケジュール JSON のキー（投稿済み/未投稿問わず除外）
  const scheduleFiles = fs.readdirSync(STATE_DIR)
    .filter((f) => f.match(/^instagram-w\d+-schedule\.json$/));
  let schedCount = 0;
  for (const sf of scheduleFiles) {
    try {
      const entries = JSON.parse(fs.readFileSync(path.join(STATE_DIR, sf), "utf8"));
      for (const e of entries) {
        posted.add(`${e.domain}::${e.content_key}`);
        schedCount++;
      }
    } catch {}
  }
  if (schedCount > 0) {
    console.log(`[schedule] ${scheduleFiles.length} ファイル, ${schedCount} エントリを除外`);
  }

  return posted;
}

// ---------------------------------------------------------
// データ品質チェック
// ---------------------------------------------------------

function checkRankingQuality(key) {
  const vPath = path.join(APP_RANKING, key, "values.json");
  if (!fs.existsSync(vPath)) return null;
  try {
    const v = JSON.parse(fs.readFileSync(vPath, "utf8"));
    const p = v.partitions?.[0];
    if (!p) return null;
    const vals = p.values || [];
    if (vals.length < 47) return null;
    if (vals.every((x) => !x.value || x.value === 0)) return null;
    const sorted = [...vals].sort((a, b) => a.rank - b.rank);
    const r1 = sorted[0], r47 = sorted[sorted.length - 1];
    return { count: vals.length, yearCode: p.yearCode, r1, r47, unit: vals[0]?.unit || "" };
  } catch { return null; }
}

function hasRankingAssets(key) {
  const stills = path.join(SNS_RANKING, key, "instagram", "stills");
  return (
    fs.existsSync(path.join(stills, "slide-1-cover-1080x1350.png")) &&
    fs.existsSync(path.join(stills, "slide-2-table-1080x1350.png")) &&
    fs.existsSync(path.join(stills, "slide-3-cta-1080x1350.png"))
  );
}

function hasBcrAssets(key) {
  const base = path.join(SNS_BCR, key, "instagram");
  return (
    fs.existsSync(path.join(base, "reel.mp4")) &&
    fs.existsSync(path.join(base, "caption.txt"))
  );
}

// ---------------------------------------------------------
// 候補スキャン
// ---------------------------------------------------------

function scanRankingCandidates(posted) {
  if (!fs.existsSync(SNS_RANKING)) return [];
  return fs
    .readdirSync(SNS_RANKING, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((key) => !posted.has(`ranking::${key}`))
    .filter((key) => hasRankingAssets(key))
    .map((key) => {
      const q = checkRankingQuality(key);
      if (!q) return null;
      return { key, domain: "ranking", ...q };
    })
    .filter(Boolean)
    .sort((a, b) => b.yearCode - a.yearCode); // 新しいデータ優先
}

function scanBcrCandidates(posted) {
  if (!fs.existsSync(SNS_BCR)) return [];
  return fs
    .readdirSync(SNS_BCR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((key) => !posted.has(`bar-chart-race::${key}`))
    .filter((key) => hasBcrAssets(key))
    .map((key) => ({ key, domain: "bar-chart-race" }));
}

// ---------------------------------------------------------
// スケジュール日付生成
// ---------------------------------------------------------

function dateRange(from, to) {
  const dates = [];
  let d = new Date(from + "T00:00:00Z");
  const end = new Date(to + "T00:00:00Z");
  while (d <= end) {
    dates.push(d.toISOString().slice(0, 10));
    d = new Date(d.getTime() + 86400000);
  }
  return dates;
}

// リールを均等に配置（週1を基本）
function assignSlots(dates, nImages, nReels) {
  const total = nImages + nReels;
  if (dates.length < total) {
    console.warn(`⚠️ 日数 ${dates.length} < 必要スロット数 ${total}。利用可能分のみ割当`);
  }

  // リール枠: 7日おきに配置（最初を 5日目以降に）
  const slots = dates.slice(0, Math.min(dates.length, total)).map((date, i) => ({
    date,
    type: null,
    domain: null,
    content_key: null,
  }));

  // リール位置を均等に配置（週の中盤）
  const step = Math.floor(slots.length / (nReels + 1));
  const reelIdxs = new Set();
  for (let r = 1; r <= nReels; r++) {
    reelIdxs.add(Math.min(r * step, slots.length - 1));
  }

  let imageSlots = [], reelSlots = [];
  slots.forEach((s, i) => {
    if (reelIdxs.has(i)) reelSlots.push(s);
    else imageSlots.push(s);
  });

  return { imageSlots, reelSlots, allSlots: slots };
}

// ---------------------------------------------------------
// メイン
// ---------------------------------------------------------

function main() {
  console.log(`\n📅 スケジュール生成: ${fromDate} 〜 ${toDate}`);
  console.log(`   画像: ${nImages} 枠 / リール: ${nReels} 枠\n`);

  const posted = loadPostedSet();
  console.log(`\n🚫 投稿済みセット: ${posted.size} キー\n`);

  const rankingCandidates = scanRankingCandidates(posted);
  const bcrCandidates = scanBcrCandidates(posted);

  console.log(`📸 ranking 候補: ${rankingCandidates.length} 件`);
  for (const c of rankingCandidates.slice(0, Math.min(rankingCandidates.length, nImages + 5))) {
    console.log(`  ${c.key} (${c.yearCode}, ${c.count}都道府県)`);
    console.log(`    1位: ${c.r1.areaName} ${c.r1.value}${c.unit} / 47位: ${c.r47.areaName} ${c.r47.value}${c.unit}`);
  }
  if (rankingCandidates.length > nImages + 5) {
    console.log(`  ... 他 ${rankingCandidates.length - nImages - 5} 件`);
  }

  console.log(`\n🎬 bar-chart-race 候補: ${bcrCandidates.length} 件`);
  for (const c of bcrCandidates) {
    console.log(`  ${c.key}`);
  }

  if (dryRun) {
    console.log("\n🏁 Dry run — スケジュール生成はスキップ");
    return;
  }

  if (rankingCandidates.length < nImages) {
    console.error(`❌ ranking 候補数 (${rankingCandidates.length}) が必要数 (${nImages}) に足りません`);
    console.error("   /render-sns-stills で新しいアセットを追加してください");
    process.exit(1);
  }
  if (bcrCandidates.length < nReels) {
    console.error(`❌ bar-chart-race 候補数 (${bcrCandidates.length}) が必要数 (${nReels}) に足りません`);
    console.error("   /render-bar-chart-race で新しいリールを追加してください");
    process.exit(1);
  }

  const dates = dateRange(fromDate, toDate);
  const { imageSlots, reelSlots } = assignSlots(dates, nImages, nReels);

  const schedule = [];

  // image スロットを ranking 候補で埋める
  const selectedImages = rankingCandidates.slice(0, nImages);
  imageSlots.forEach((slot, i) => {
    if (!selectedImages[i]) return;
    schedule.push({
      date: slot.date,
      type: "image",
      domain: "ranking",
      content_key: selectedImages[i].key,
    });
  });

  // reel スロットを bar-chart-race 候補で埋める
  const selectedReels = bcrCandidates.slice(0, nReels);
  reelSlots.forEach((slot, i) => {
    if (!selectedReels[i]) return;
    schedule.push({
      date: slot.date,
      type: "reels",
      domain: "bar-chart-race",
      content_key: selectedReels[i].key,
    });
  });

  // 日付順に並び替え
  schedule.sort((a, b) => a.date.localeCompare(b.date));

  console.log(`\n📋 生成スケジュール (${schedule.length} 件):\n`);
  for (const e of schedule) {
    console.log(`  ${e.date} [${e.type}] ${e.domain}/${e.content_key}`);
  }

  if (outPath) {
    const absOut = path.resolve(outPath);
    fs.writeFileSync(absOut, JSON.stringify(schedule, null, 2) + "\n");
    console.log(`\n✅ 書き出し完了: ${absOut}`);
  } else {
    console.log("\n（--out を指定するとファイルに書き出せます）");
  }
}

main();
