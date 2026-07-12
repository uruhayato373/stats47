#!/usr/bin/env node
/**
 * build-expansion-queue.mjs — ランキング拡充「キュー」を構築/更新する単一の頭脳。
 *
 * ブログ是正ループ (build-remediation-queue.mjs) と同型の「継続計測ループ」の状態SSOT。
 * SSDS 候補プールを需要ファーストでスコアし、生成/公開/計測の状態を upsert で保持する。
 *
 * 状態ライフサイクル (candidate → generated → published → measured):
 *   - candidate : まだ config 未生成 (queue の pending)
 *   - generated : config が存在 ((statsDataId,cdCat01) が metrics に有る) が未公開
 *   - published : KNOWN_RANKING_KEYS に有る (本番 200 想定)
 *   - measured  : GSC 実測済 (measure-expansion-impact.mjs が gsc を付与)
 *
 * 優先度 = 需要スコア (キーワード + 単位 + 認知度) − 細分ブレークダウン penalty。
 * ★計測ゲート: measured の gsc 流入を categoryTraffic に集計し、流入の付いたカテゴリの
 *   pending を優先する (闇雲に増やさず「流入が付いた系統だけ深掘り」= thin-content 回避)。
 *
 * 真実源: .claude/state/estat/expansion-queue.json (git tracked, 状態を保持)
 * 入力  : .claude/state/estat/ssds-candidates.json (enumerate-ssds-indicators.mjs → CI で再生成)
 *
 * Usage:
 *   node .claude/scripts/estat/build-expansion-queue.mjs                 # 構築/更新 (状態を保ったまま upsert)
 *   node .claude/scripts/estat/build-expansion-queue.mjs --next 30       # 次に生成すべき pending 上位 N (JSONL)
 *   node .claude/scripts/estat/build-expansion-queue.mjs --mark-generated <statsDataId> <cdCat01> <key>
 *   node .claude/scripts/estat/build-expansion-queue.mjs --mark-published <key>
 *   node .claude/scripts/estat/build-expansion-queue.mjs --summary       # 集計のみ
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const CAND_FILE = path.join(ROOT, ".claude/state/estat/ssds-candidates.json");
const QUEUE_FILE = path.join(ROOT, ".claude/state/estat/expansion-queue.json");
const METRICS_DIR = path.join(ROOT, "packages/data-configs/src/metrics");
const KNOWN_FILE = path.join(ROOT, "packages/ranking/src/config/known-ranking-keys.ts");

const CAT = { A: "population", B: "landweather", C: "economy", D: "administrativefinancial",
  E: "educationsports", F: "laborwage", G: "educationsports", H: "infrastructure",
  I: "socialsecurity", J: "socialsecurity", K: "safetyenvironment", L: "economy" };

const DEMAND = /所得|収入|貯蓄|負債|消費|支出|生産|産出|出荷|販売|物価|地価|家賃|持ち家|住宅|世帯|医師|看護|病床|病院|診療所|保育|待機児童|大学|高校|進学|図書館|公園|博物館|失業|求人|就業|給与|年収|犯罪|交通事故|火災|災害|ごみ|水道|下水|電力|通信|農業|製造|小売|事業所|観光|外国人|移動|転入|転出|通勤|婚姻|離婚|出生|死亡|高齢|自給率|普及率|保険|財政|税|教員|学級|農家|漁業/;
// 細分ブレークダウン (低需要・キュー下位/除外)
const FINE = /（男）|（女）|・男|・女|構成比|再掲|自然度|ボランティア|行動者率|詳細票|（\d+～?\d*歳|（子供が|（母親の年齢|（\d+人）|（\d+区分|（\d+\.?\d*ha/;

const clean = (n) => n.replace(/（(平成|昭和)\d+年基準）/g, "").replace(/^[A-Z]\d+(_|＿)/, "").trim();
const norm = (t) => t.replace(/[（(][^）)]*[）)]/g, "").replace(/\s/g, "").trim();
const hasParen = (t) => /（[^）]+）\s*$/.test(t);

function loadExisting() {
  const pairs = new Set(), exactTitles = new Set(), normTitles = new Set();
  const pairToKey = new Map();
  for (const f of fs.readdirSync(METRICS_DIR)) {
    if (!f.endsWith(".ts") || f === "index.ts") continue;
    const t = fs.readFileSync(path.join(METRICS_DIR, f), "utf8");
    const sid = t.match(/"statsDataId":\s*"([^"]+)"/);
    const cat = t.match(/"cdCat01":\s*"([^"]+)"/);
    const ti = t.match(/"title":\s*"([^"]+)"/);
    const key = t.match(/"key":\s*"([^"]+)"/);
    if (sid && cat) { pairs.add(`${sid[1]}|${cat[1]}`); if (key) pairToKey.set(`${sid[1]}|${cat[1]}`, key[1]); }
    if (ti) { exactTitles.add(ti[1]); normTitles.add(norm(ti[1])); }
  }
  return { pairs, exactTitles, normTitles, pairToKey };
}

function loadKnown() {
  try {
    const t = fs.readFileSync(KNOWN_FILE, "utf8");
    return new Set([...t.matchAll(/"([a-z0-9][a-z0-9-]*)"/g)].map((m) => m[1]));
  } catch { return new Set(); }
}

function score(title, unit) {
  let s = 0;
  if (DEMAND.test(title)) s += 3;
  if (unit === "％") s += 3;
  else if (unit === "円" || unit === "千円" || unit === "百万円") s += 2;
  else if (["世帯", "施設", "所", "件", "床", "人口", "校", "人", "戸", "事業体", "学級"].includes(unit)) s += 1;
  if (clean(title).length <= 10) s += 1;
  return s;
}

function buildQueue() {
  const cands = JSON.parse(fs.readFileSync(CAND_FILE, "utf8"));
  const ex = loadExisting();
  const known = loadKnown();
  const prev = fs.existsSync(QUEUE_FILE) ? JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8")) : { queue: [] };
  const prevById = new Map((prev.queue || []).map((e) => [e.id, e]));

  const seenNorm = new Set();
  const entries = [];
  for (const c of cands) {
    const id = `${c.statsDataId}|${c.cdCat01}`;
    const title = clean(c.name);
    if (!title || title.length < 2) continue;
    const nt = norm(title);
    // 生成済み ((statsDataId,cdCat01) に config 有り) は dedup に関わらず必ず追跡する
    const generated = ex.pairs.has(id);
    if (!generated) {
      // 未生成のみ追加可否判定: 完全一致 title は真の重複 / 正規化一致は subtitle 可(括弧あり)なら追加可
      if (ex.exactTitles.has(title)) continue;
      const isVariant = ex.normTitles.has(nt) || seenNorm.has(nt);
      if (isVariant && !hasParen(c.name)) continue; // 区別不能な重複
    }
    seenNorm.add(nt);

    // 状態判定
    const genKey = generated ? ex.pairToKey.get(id) : null;
    const published = genKey ? known.has(genKey) : false;
    let status = "candidate";
    if (published) status = "published";
    else if (generated) status = "generated";
    // measured は measure スクリプトが gsc を付けたら昇格 (prev を尊重)
    const p = prevById.get(id);
    const gsc = p?.gsc ?? null;
    if (status === "published" && gsc && (gsc.impressions > 0 || gsc.clicks > 0)) status = "measured";

    entries.push({
      id, statsDataId: c.statsDataId, cdCat01: c.cdCat01,
      title, subtitleHint: hasParen(c.name) ? (c.name.match(/（([^）]+)）\s*$/)?.[1] ?? null) : null,
      category: CAT[c.cdCat01[0]] || "population", unit: c.unit || null,
      key: genKey, status,
      score: score(title, c.unit || ""),
      fine: FINE.test(c.name),
      gsc,
    });
  }

  // ★計測ゲート: measured の実測流入をカテゴリ別に集計 → pending 優先度に反映
  const catTraffic = {};
  for (const e of entries) if (e.gsc) catTraffic[e.category] = (catTraffic[e.category] || 0) + (e.gsc.impressions || 0);

  const prio = (e) => {
    let p = e.score;
    if (e.fine) p -= 3;                                   // 細分は下位
    p += Math.min(3, (catTraffic[e.category] || 0) / 50); // 流入が付いたカテゴリを優先
    return p;
  };
  entries.forEach((e) => (e.priority = Math.round(prio(e) * 100) / 100));
  // pending (candidate) を優先度降順、その後 status 順
  const order = { candidate: 0, generated: 1, published: 2, measured: 3 };
  entries.sort((a, b) => (order[a.status] - order[b.status]) || (b.priority - a.priority));

  const byStatus = {}; for (const e of entries) byStatus[e.status] = (byStatus[e.status] || 0) + 1;
  const out = {
    generatedAt: process.env.EXPANSION_QUEUE_NOW || new Date().toISOString(),
    doctrine: "計測ゲート付き需要ファースト。公開→GSC実測→流入が付いたカテゴリのみ深掘り (thin-content回避)。",
    summary: {
      totalCandidates: entries.length, byStatus,
      addablePending: entries.filter((e) => e.status === "candidate" && !e.fine).length,
      categoryTraffic: catTraffic,
    },
    queue: entries,
  };
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(out, null, 1));
  return out;
}

// ── CLI ──
const args = process.argv.slice(2);
if (args[0] === "--mark-generated") {
  const [sid, cat, key] = [args[1], args[2], args[3]];
  const q = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
  const e = q.queue.find((x) => x.id === `${sid}|${cat}`);
  if (e) { e.status = "generated"; e.key = key; fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 1)); console.log(`generated: ${key}`); }
  else console.error("not found:", sid, cat);
} else if (args[0] === "--mark-published") {
  const key = args[1];
  const q = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
  const e = q.queue.find((x) => x.key === key);
  if (e) { e.status = "published"; fs.writeFileSync(QUEUE_FILE, JSON.stringify(q, null, 1)); console.log(`published: ${key}`); }
  else console.error("not found:", key);
} else if (args[0] === "--next") {
  const n = parseInt(args[1] || "30", 10);
  const q = fs.existsSync(QUEUE_FILE) ? JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8")) : buildQueue();
  const next = q.queue.filter((e) => e.status === "candidate" && !e.fine).slice(0, n);
  for (const e of next) console.log(JSON.stringify(e));
  console.error(`\n次に生成すべき pending: ${next.length} 件 (score降順・細分除外)`);
} else if (args[0] === "--summary") {
  const q = JSON.parse(fs.readFileSync(QUEUE_FILE, "utf8"));
  console.log(JSON.stringify(q.summary, null, 2));
} else {
  const out = buildQueue();
  console.log("expansion-queue 構築:", JSON.stringify(out.summary, null, 2));
}
