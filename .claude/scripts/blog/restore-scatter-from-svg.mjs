#!/usr/bin/env node
/**
 * restore-scatter-from-svg.mjs — neither(json/source.json 消失=絵だけ) の **scatter** SVG を
 * SSOT(R2 app/ranking) から再生成して 3点セット(json/source.json/svg)に戻す。
 *
 * scatter は ranking と違い **点(circle)に数値テキストが無い**。点値照合は不可。
 * よって 2軸の metric を「**軸名一致 AND 軸目盛レンジ一致**」の両面で確定する (片方のみは flag)。
 * SVG の点座標から値を逆算して SSOT を書き換えることはしない (捏造防止)。SSOT の値域が
 * 軸名・軸レンジと整合するか自己検証するだけ。確信が持てなければ resolved にせず flag。
 *
 * 手順 (各 neither scatter base について):
 *   1. 旧SVG `app/blog/<slug>/data/<base>.svg` を取得し以下を抽出:
 *        - タイトル (先頭の bold text)。`×`/`✕`/`x`/`vs`/`と`/`対` で x軸名・y軸名に分割
 *        - 軸ラベル: rotate(-90) を持つ text = Y軸ラベル、bottom 付近の非回転 text = X軸ラベル
 *        - 軸目盛: text-anchor="middle" かつ y が大 = X目盛 / text-anchor="end" かつ x が小(左) = Y目盛
 *          → 各軸の目盛数値から [min,max] を得る (単位 %/％/円/万円… は除去)
 *   2. 候補key = 記事 /ranking/<key> リンク + 各軸名(タイトル/軸ラベル)を all.json の
 *      rankingName/title で名前検索。命名ドリフトは実在key補正(404でない実在keyのみ採用)
 *   3. 各軸について「候補key の SSOT 最新 partition 値域[min,max]」が「SVG 目盛レンジ」を
 *      おおむね包含(相対20%許容)するかで range 検証。SSOT が無分散(壊れ)なら退化ガードで棄却
 *   4. x軸 と y軸 の **両方が name一致 AND range一致** したときだけ resolved。
 *      片方のみ → x-only / y-only。両方なし → no-match。SVG取得/抽出不能 → extraction-fail
 *   5. (--apply 時のみ) 両keyのSSOT値を県でjoin → points[{label,x,y}] + xLabel/yLabel/xUnit/yUnit/title
 *      の `<base>.json`(§1.5 scatter schema) + `<base>.source.json`(kind:scatter, xKey,yKey,year,
 *      verifiedBy:"axis-range+name") を staging に書き、generate-article-charts.ts で SVG 生成。
 *
 * この回は **--probe-only(既定)** = 照合の表だけ。staging書込/R2 push/queue再構築はしない。
 *
 * Usage:
 *   node .claude/scripts/blog/restore-scatter-from-svg.mjs                  # 全 neither scatter を probe
 *   node .claude/scripts/blog/restore-scatter-from-svg.mjs --base s/x       # 指定 slug/base のみ
 *   node .claude/scripts/blog/restore-scatter-from-svg.mjs --apply          # staging 書込 (人間レビュー後)
 *
 * 正典: .claude/rules/blog-data-schema.md §1.5/§1.6/§1.7、手法: .claude/state/blog/neither-restore-method.md
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const STAGE_REL = ".local/r2/app/blog";
const STAGE_ABS = path.join(PROJECT_ROOT, STAGE_REL);
const ALL_RANKING_PATH = "/tmp/all-ranking.json";
// 軸レンジ照合の許容: SSOT 値域が SVG 目盛レンジを「おおむね包含」する相対許容 (20%)。
// 値域の桁が合うことを見るだけ。極端スケールで無理に一致させない。
const RANGE_TOL = 0.2;

// ---------- CLI ----------
const args = process.argv.slice(2);
const getArg = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const SLUGS_ARG = getArg("--slugs");
const BASE_ARG = getArg("--base");
const APPLY = args.includes("--apply");
const PROBE_ONLY = !APPLY; // 既定は probe-only。--apply 明示時のみ staging 書込

// ---------- 都道府県 ----------
const PREFS = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];
const normPref = (s) => String(s || "").replace(/[都道府県]$/, "").replace(/^北海$/, "北海道").trim();
const NORM_PREFS = PREFS.map((p) => ({ norm: normPref(p), full: p })).sort((a, b) => b.norm.length - a.norm.length);
/** トークン内に現れる都道府県(省略名/フル名)を1つ返す。最長一致優先。 */
function findPrefInToken(tok) {
  for (const p of [...PREFS].sort((a, b) => b.length - a.length)) if (tok.includes(p)) return normPref(p);
  for (const { norm } of NORM_PREFS) if (tok.includes(norm)) return norm;
  return null;
}

// ---------- SVG パース ----------
/** <text> 要素を {raw(内側text), attrs} の配列で返す (x/y/anchor/rotate 判定に使う) */
function svgTextEls(svg) {
  return [...svg.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)].map((m) => {
    const attrs = m[1];
    const raw = m[2].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim();
    const num = (re) => { const mm = attrs.match(re); return mm ? parseFloat(mm[1]) : null; };
    return {
      raw,
      x: num(/\bx="([\d.]+)"/),
      y: num(/\by="([\d.]+)"/),
      anchor: (attrs.match(/text-anchor="([^"]+)"/) || [])[1] || "",
      bold: /font-weight="bold"/.test(attrs),
      rotated: /rotate\(-?90/.test(attrs),
      fontSize: num(/font-size="([\d.]+)"/),
    };
  });
}

/** 目盛/軸ラベル文字列から数値を取り出す (単位 %/％/円/万円/mm/日/件 等を除去)。順位や年は弾く。 */
function parseAxisNumber(t) {
  // 末尾/先頭の単位記号を許容しつつ純粋な数値を抽出。"8％" "2,500" "-2%" "1.4" 等
  const m = String(t).trim().match(/^(-?[\d,]+(?:\.\d+)?)\s*(?:％|%|円|万円|億円|千円|人|件|日|mm|km|m|歳|度|台|戸|世帯|社|店|ha|ｈａ|kg|分|時間|％点|ポイント)?\s*$/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  return isFinite(n) ? n : null;
}

/** SVG から x軸/y軸の目盛レンジ・軸名・タイトル等を抽出 */
function extractScatterMeta(svg) {
  const els = svgTextEls(svg);
  if (!els.length) return null;

  // タイトル = 最初の bold text (無ければ最初の text)
  const titleEl = els.find((e) => e.bold) || els[0];
  const title = titleEl ? titleEl.raw : "";

  // 軸ラベル: rotate(-90) を持つ非空 text = Y軸ラベル。
  //   X軸ラベル = 回転なし・anchor=middle・y が最下部付近の非数値 text (タイトル除く)。
  const yAxisLabelEl = els.find((e) => e.rotated && e.raw && parseAxisNumber(e.raw) == null);
  const yAxisLabel = yAxisLabelEl ? yAxisLabelEl.raw : "";

  // 目盛候補: 県名でない・数値としてパースできる text
  const ticks = els
    .map((e) => ({ ...e, val: parseAxisNumber(e.raw) }))
    .filter((e) => e.val != null && !findPrefInToken(e.raw));

  // X目盛 = anchor=middle (or 既定) で、y がほぼ同一の大きい値に集まる群 (プロット下端)。
  // Y目盛 = anchor=end で、x がほぼ同一の小さい値 (プロット左端) に集まる群。
  const yMid = ticks.length ? median(ticks.map((t) => t.y ?? 0)) : 0;
  const xTicks = ticks.filter((t) => (t.anchor === "middle" || t.anchor === "") && t.y != null && t.y >= yMid);
  const yTicks = ticks.filter((t) => t.anchor === "end" && t.x != null);

  // フォールバック: anchor 情報が乏しい場合は座標クラスタで再分類
  let xVals = uniqNums(xTicks.map((t) => t.val));
  let yVals = uniqNums(yTicks.map((t) => t.val));
  if (xVals.length < 2 || yVals.length < 2) {
    // anchor=end が無い等。x座標で左端(小) クラスタ=Y、下端(大y) クラスタ=X に振り分け
    const xs = ticks.map((t) => t.x ?? Infinity);
    const minX = Math.min(...xs);
    const yByLeftX = ticks.filter((t) => t.x != null && t.x <= minX + 12);
    const xByBottomY = ticks.filter((t) => !yByLeftX.includes(t));
    if (xVals.length < 2) xVals = uniqNums(xByBottomY.map((t) => t.val));
    if (yVals.length < 2) yVals = uniqNums(yByLeftX.map((t) => t.val));
  }

  // 軸単位: 目盛文字列の単位サフィックス (最頻)
  const xUnit = mostCommonUnit(xTicks.map((t) => t.raw));
  const yUnit = mostCommonUnit(yTicks.map((t) => t.raw));

  // X軸ラベル: rotate なし・タイトルでない・数値でない・anchor=middle で y が最大付近の text
  const xAxisLabelEl = els
    .filter((e) => !e.rotated && e !== titleEl && e.raw && parseAxisNumber(e.raw) == null && !findPrefInToken(e.raw))
    .filter((e) => e.anchor === "middle" && e.y != null)
    .sort((a, b) => (b.y ?? 0) - (a.y ?? 0))[0];
  const xAxisLabel = xAxisLabelEl ? xAxisLabelEl.raw : "";

  return {
    title,
    xAxisLabel, yAxisLabel,
    xUnit, yUnit,
    xRange: xVals.length >= 2 ? [Math.min(...xVals), Math.max(...xVals)] : null,
    yRange: yVals.length >= 2 ? [Math.min(...yVals), Math.max(...yVals)] : null,
    nPrefLabels: els.filter((e) => findPrefInToken(e.raw)).length,
  };
}
function median(a) { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; }
function uniqNums(a) { return [...new Set(a)].filter((n) => isFinite(n)); }
function mostCommonUnit(strs) {
  const c = {};
  for (const s of strs) {
    const m = String(s).match(/(％|%|円|万円|億円|千円|人|件|日|mm|km|歳|度|台|戸|世帯|社|店|ha|ｈａ|kg|ポイント)\s*$/);
    if (m) c[m[1]] = (c[m[1]] || 0) + 1;
  }
  const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "";
}

/** タイトルを x軸名・y軸名に分割。区切りは ×/✕/x/vs/と/対。後置サフィックス(47都道府県 等)は除去 */
function splitTitleAxes(title) {
  let t = String(title || "")
    .replace(/47都道府県/g, "")
    .replace(/上位\d+[・,，]下位\d+/g, "")
    .replace(/ランキング/g, "")
    .trim();
  // 区切り (優先順): 全角×✕ / vs(空白/括弧境界どちらでも) / 半角x(空白/括弧境界) / と / 対 / 男女比較等は単一指標
  // 「）vs 」「）x 」のように括弧直後で空白が無いケースも拾う。半角x は前境界が空白か全角閉じ括弧のときだけ
  // (語中の x= ローマ字を誤分割しないため)。
  const seps = [
    /[×✕]/,
    /\s*\bvs\.?\b\s*/i,
    /(?<=[）)\s])\s*[xX]\s+/,   // 「）x 」「 x 」: 前が括弧/空白、後ろが空白
    /と/,
    /対/,
  ];
  for (const re of seps) {
    const parts = t.split(re);
    if (parts.length === 2 && parts[0].trim() && parts[1].trim()) {
      return [cleanAxisName(parts[0]), cleanAxisName(parts[1])];
    }
  }
  return [null, null];
}
/** 軸名文字列を catalog 検索用に正規化 (括弧内・単位・年・矢印を除去) */
function cleanAxisName(s) {
  return String(s || "")
    .replace(/[（(].*?[)）]/g, "")     // 括弧内 (単位/年) を除去
    .replace(/→|↑|↓/g, "")
    .replace(/\s+/g, "")
    .replace(/[、,，。.]/g, "")
    .trim();
}

// ---------- catalog ----------
let CATALOG = null;
let NAME_TO_KEYS = null; // 正規化 rankingName → [key,…] (同名 key の多重度を測る)
function loadCatalog() {
  if (CATALOG) return CATALOG;
  if (!fs.existsSync(ALL_RANKING_PATH)) {
    throw new Error(`${ALL_RANKING_PATH} が無い。curl -s ${R2}/app/ranking-items/all.json > ${ALL_RANKING_PATH} を先に実行`);
  }
  const raw = JSON.parse(fs.readFileSync(ALL_RANKING_PATH, "utf8"));
  CATALOG = (raw.items || raw.rankings || raw.data || (Array.isArray(raw) ? raw : []))
    .filter((x) => x && x.rankingKey && (x.areaType === "prefecture" || !x.areaType));
  // 同名 multiplicity: 「事業所数」のような generic 名は 16+ key に対応するので名前一致の確信を与えない
  NAME_TO_KEYS = new Map();
  for (const it of CATALOG) {
    const nm = catName(it.rankingName || it.title || "");
    if (!nm) continue;
    if (!NAME_TO_KEYS.has(nm)) NAME_TO_KEYS.set(nm, []);
    NAME_TO_KEYS.get(nm).push(it.rankingKey);
  }
  return CATALOG;
}
/** catalog 名の正規化 (括弧内/空白/年/記号を除去して比較しやすく) */
function catName(s) {
  return String(s || "")
    .replace(/[（(].*?[)）]/g, "")
    .replace(/\s+/g, "")
    .replace(/[、,，。.・]/g, "")
    .trim();
}
/**
 * 軸名(日本語) で catalog を名前検索。**確信度(score)は曖昧一致に与えない** (捏造の元)。
 *  - score 100: 正規化名が axis名と完全一致、かつ **その名前が単一 key にしか対応しない** (unambiguous)
 *  - score 90 : axis名が catalog名を完全に含む / catalog名が axis名を含む、かつ unambiguous
 *  - score 30 : 上記だが同名 key が複数 (ambiguous generic 名 = 単独で resolved にしない)
 *  - 曖昧な部分文字列一致 (longestCommonSubstr) は **score を与えない** (false positive 源だったため撤去)
 * nameOk の閾値 (>=70) は unambiguous な強一致のみが超える。
 */
function searchKeysByName(axisName) {
  const q = catName(axisName);
  if (!q || q.length < 2) return [];
  loadCatalog();
  const hits = [];
  for (const it of CATALOG) {
    const nm = catName(it.rankingName || it.title || "");
    if (nm.length < 2) continue;
    let score = 0;
    let relation = "";
    if (nm === q) { score = 100; relation = "eq"; }
    else if (q.includes(nm) && nm.length >= 3) { score = 90; relation = "q⊃nm"; }
    else if (nm.includes(q) && q.length >= 3) { score = 88; relation = "nm⊃q"; }
    else continue; // 曖昧一致は採らない
    // 同名 multiplicity でディスカウント: この catalog 名が複数 key に対応するなら generic → 確信なし
    const mult = (NAME_TO_KEYS.get(nm) || []).length;
    if (mult > 1) score = Math.min(score, 30); // ambiguous generic 名
    hits.push({ key: it.rankingKey, name: nm, score, relation, mult, unit: it.unit || "" });
  }
  // 同 score は名前が短い (= より具体的に axis名を覆う) 方を優先
  hits.sort((a, b) => b.score - a.score || a.name.length - b.name.length);
  return hits.slice(0, 12);
}

// ---------- SSOT ----------
async function fj(u) { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }
const ssotCache = new Map();
async function ssotLatest(key) {
  if (ssotCache.has(key)) return ssotCache.get(key);
  let res = null;
  try {
    const v = await fj(`${R2}/app/ranking/${key}/values.json`);
    const parts = (v.partitions || []).slice().sort((a, b) => (a.yearCode > b.yearCode ? 1 : -1));
    if (parts.length) {
      const p = parts[parts.length - 1];
      const vals = p.values.map((x) => x.value).filter((n) => typeof n === "number" && isFinite(n));
      res = {
        key, year: p.yearCode,
        unit: p.values?.[0]?.unit || "",
        min: vals.length ? Math.min(...vals) : null,
        max: vals.length ? Math.max(...vals) : null,
        n: vals.length,
        values: p.values,
      };
    }
  } catch { res = null; } // 404 = 未取込
  ssotCache.set(key, res);
  return res;
}

/**
 * SVG 軸目盛レンジ [tmin,tmax] が SSOT 値域 [smin,smax] と整合するか。
 * 「SSOT 値域が 目盛レンジを おおむね包含」する相対許容で判定。退化(無分散) は棄却。
 * 単位ズレ(%↔比率 等) を考慮し、SVG値×{1,100,0.01,1000,0.001,1e4} で best を探す。
 */
function rangeMatch(svgRange, ssot) {
  if (!svgRange || !ssot || ssot.min == null || ssot.max == null) return { ok: false, scale: 1 };
  const [tmin, tmax] = svgRange;
  const tspan = tmax - tmin;
  const sspan = ssot.max - ssot.min;
  // 退化ガード: SSOT 値域がほぼ0 (無分散・壊れデータ) は棄却
  const meanAbs = (Math.abs(ssot.min) + Math.abs(ssot.max)) / 2;
  if (sspan <= Math.max(meanAbs * 0.01, 1e-9)) return { ok: false, scale: 1, degenerate: true };
  if (tspan <= 0) return { ok: false, scale: 1 };
  const SCALES = [1, 100, 0.01, 1000, 0.001, 1e4, 1e-4, 10, 0.1];
  let best = { ok: false, scale: 1, cov: 0 };
  for (const scale of SCALES) {
    const a = tmin * scale, b = tmax * scale;
    // SSOT 値域が [a,b] を相対許容で包含するか。境界に RANGE_TOL の遊びを足す
    const pad = Math.abs(sspan) * RANGE_TOL;
    const contains = ssot.min <= a + pad && ssot.max >= b - pad;
    // かつ桁(スパン)が合う: scale 後の目盛スパンが SSOT スパンの 0.3〜3 倍
    const spanRatio = (Math.abs(b - a) + 1e-9) / (Math.abs(sspan) + 1e-9);
    const spanOk = spanRatio >= 0.3 && spanRatio <= 3.5;
    if (contains && spanOk) {
      // カバレッジ(SSOT値域に対する目盛レンジの占有率) が大きい scale を優先
      const cov = Math.min(Math.abs(b - a), Math.abs(sspan)) / Math.max(Math.abs(sspan), 1e-9);
      if (!best.ok || cov > best.cov) best = { ok: true, scale, cov: +cov.toFixed(3) };
    }
  }
  return best;
}

// ---------- 軸 → key 確定 ----------
/**
 * 1軸ぶんの key 確定: 候補key群(名前一致 + 記事リンク) を SSOT range と照合。
 * name一致 AND range一致 の最良候補を返す。range だけ/name だけは flag に落とす。
 * @returns {key, year, scale, nameScore, rangeOk, rangeCov} | null
 */
async function resolveAxis(axisName, linkKeys, svgRange) {
  // 候補: 名前検索 hits + 記事リンク key (リンクは name 不明なので score=低)
  const nameHits = searchKeysByName(axisName);
  const seen = new Set();
  const cands = [];
  for (const h of nameHits) { if (!seen.has(h.key)) { seen.add(h.key); cands.push({ ...h, fromName: true }); } }
  for (const k of linkKeys) { if (!seen.has(k)) { seen.add(k); cands.push({ key: k, name: "", score: 10, fromName: false }); } }

  let best = null;
  for (const c of cands) {
    const ssot = await ssotLatest(c.key);
    if (!ssot) continue; // 404 未取込
    const rm = rangeMatch(svgRange, ssot);
    // name一致の判定: 名前検索由来 (fromName) かつ **unambiguous な強一致 score>=70**。
    // ambiguous generic 名 (score=30) や記事リンクのみ (score=10) は name確信を与えない (捏造防止)。
    const nameOk = c.fromName && c.score >= 70;
    const cand = {
      key: c.key, name: c.name, nameScore: c.score, fromName: c.fromName,
      year: ssot.year, ssotUnit: ssot.unit,
      rangeOk: rm.ok, rangeScale: rm.scale, rangeCov: rm.cov || 0, degenerate: !!rm.degenerate,
      nameOk,
    };
    // 採点: name一致かつrange一致を最優先。次に name のみ、range のみ
    const rank = (cand.nameOk && cand.rangeOk) ? 3 : cand.nameOk ? 2 : cand.rangeOk ? 1 : 0;
    cand.rank = rank;
    cand.composite = rank * 1000 + cand.nameScore + cand.rangeCov * 10;
    if (!best || cand.composite > best.composite) best = cand;
  }
  return best;
}

// ---------- queue から neither scatter を取得 ----------
function loadTargets() {
  const q = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, ".claude/state/blog/svg-lineage-queue.json"), "utf8"));
  let entries = q.entries.filter((e) => e.status === "neither" && e.chartType === "scatter").map((e) => ({ slug: e.slug, base: e.base }));
  if (BASE_ARG) { const [s, b] = BASE_ARG.split("/"); entries = entries.filter((e) => e.slug === s && e.base === b); }
  else if (SLUGS_ARG) { const want = new Set(SLUGS_ARG.split(",").map((s) => s.trim())); entries = entries.filter((e) => want.has(e.slug)); }
  return entries;
}

async function fetchText(u) { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }

// ---------- 3点セット生成 (--apply 時のみ) ----------
/** 両軸 key 確定後: SSOT を県で join して points を作り json/source.json を書く */
async function buildScatterJson(slug, base, xRes, yRes, meta) {
  const dir = path.join(STAGE_ABS, slug);
  fs.mkdirSync(path.join(dir, "data"), { recursive: true });
  const xs = await ssotLatest(xRes.key);
  const ys = await ssotLatest(yRes.key);
  const yMap = new Map(ys.values.map((v) => [v.areaCode, v]));
  const points = [];
  for (const xv of xs.values) {
    const yv = yMap.get(xv.areaCode);
    if (!yv || typeof xv.value !== "number" || typeof yv.value !== "number") continue;
    points.push({
      label: xv.areaName,
      code: String(xv.areaCode).slice(0, 2),
      // scale を SVG表示単位に合わせず SSOT raw を採用 (記事本文照合は別途)。
      x: xv.value, y: yv.value,
    });
  }
  const xName = meta.xAxisLabel || cleanAxisName(splitTitleAxes(meta.title)[0] || "") || xs.key;
  const yName = meta.yAxisLabel || cleanAxisName(splitTitleAxes(meta.title)[1] || "") || ys.key;
  const json = {
    title: meta.title || `${xName} × ${yName}`,
    xLabel: xName, yLabel: yName,
    xUnit: xs.unit || meta.xUnit || "",
    yUnit: ys.unit || meta.yUnit || "",
    points,
    generatedBy: "restore-scatter-from-svg.mjs",
  };
  const source = {
    kind: "scatter",
    xKey: xRes.key, yKey: yRes.key,
    year: `x:${xs.year}/y:${ys.year}`,
    xSource: `r2:app/ranking/${xRes.key}/values.json`,
    ySource: `r2:app/ranking/${yRes.key}/values.json`,
    verifiedBy: "axis-range+name",
    // 点値照合をしていないため verifiedMatchRate は付けない (§タスク指示)。range一致である旨を note に。
    note: "2軸の軸名(catalog一致) と 軸目盛レンジ(SSOT値域が包含) で確定。点値照合は不可のため verifiedMatchRate なし。",
    rangeVerification: {
      x: { svgRange: meta.xRange, ssotRange: [xs.min, xs.max], scale: xRes.rangeScale, cov: xRes.rangeCov },
      y: { svgRange: meta.yRange, ssotRange: [ys.min, ys.max], scale: yRes.rangeScale, cov: yRes.rangeCov },
    },
    restoredFrom: "restore-scatter-from-svg.mjs",
    restore: `node .claude/scripts/blog/restore-scatter-from-svg.mjs --base ${slug}/${base} --apply`,
    fetchedAt: new Date().toISOString(),
  };
  const jsonPath = path.join(dir, "data", `${base}.json`);
  const sourcePath = path.join(dir, "data", `${base}.source.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));
  fs.writeFileSync(sourcePath, JSON.stringify(source, null, 2));
  // article.md を staging に用意 (generate-article-charts.ts が dir を要求)
  if (!fs.existsSync(path.join(dir, "article.md"))) {
    try { const md = await fetchText(`${R2}/app/blog/${slug}/article.md`); fs.writeFileSync(path.join(dir, "article.md"), md, "utf8"); }
    catch { fs.writeFileSync(path.join(dir, "article.md"), "", "utf8"); }
  }
  // SVG 生成
  execFileSync("npx", ["tsx", ".claude/scripts/blog/generate-article-charts.ts", "--slug", slug, "--base", STAGE_REL], {
    cwd: PROJECT_ROOT, stdio: "pipe", env: { ...process.env, NODE_OPTIONS: "--conditions react-server" },
  });
  return { jsonPath, sourcePath, svg: path.join(dir, "data", `${base}.svg`), nPoints: points.length };
}

// ---------- main ----------
const targets = loadTargets();
console.error(`[restore-scatter] ${targets.length} neither scatter SVG を ${APPLY ? "生成(apply)" : "probe"}`);
loadCatalog();

const results = [];
for (const { slug, base } of targets) {
  const rec = { slug, base, result: "no-match", xKey: null, yKey: null, note: "" };
  let svg;
  try { svg = await fetchText(`${R2}/app/blog/${slug}/data/${base}.svg`); }
  catch (e) { rec.result = "extraction-fail"; rec.note = `svg取得失敗 ${e.message}`; results.push(rec); continue; }

  const meta = extractScatterMeta(svg);
  if (!meta) { rec.result = "extraction-fail"; rec.note = "text 要素なし"; results.push(rec); continue; }
  const [xTitleName, yTitleName] = splitTitleAxes(meta.title);
  const xName = cleanAxisName(meta.xAxisLabel) || xTitleName;
  const yName = cleanAxisName(meta.yAxisLabel) || yTitleName;
  rec.xName = xName; rec.yName = yName;
  rec.xRange = meta.xRange; rec.yRange = meta.yRange;

  if (!xName && !yName) { rec.result = "extraction-fail"; rec.note = `軸名抽出不能 title="${meta.title.slice(0, 30)}"`; results.push(rec); continue; }

  // 記事リンク key (両軸の候補補強)
  let linkKeys = [];
  try { const md = await fetchText(`${R2}/app/blog/${slug}/article.md`); linkKeys = [...new Set([...md.matchAll(/\/ranking\/([a-z0-9-]+)/gi)].map((m) => m[1]))]; } catch {}

  const xRes = xName ? await resolveAxis(xName, linkKeys, meta.xRange) : null;
  const yRes = yName ? await resolveAxis(yName, linkKeys, meta.yRange) : null;

  const xResolved = xRes && xRes.nameOk && xRes.rangeOk;
  const yResolved = yRes && yRes.nameOk && yRes.rangeOk;

  if (xRes) { rec.xKey = xRes.key; rec.xNameOk = xRes.nameOk; rec.xRangeOk = xRes.rangeOk; rec.xScale = xRes.rangeScale; }
  if (yRes) { rec.yKey = yRes.key; rec.yNameOk = yRes.nameOk; rec.yRangeOk = yRes.rangeOk; rec.yScale = yRes.rangeScale; }

  if (xResolved && yResolved) {
    rec.result = "resolved";
    rec.note = `x=${xRes.key}(name+range) y=${yRes.key}(name+range)`;
  } else if (xResolved && !yResolved) {
    rec.result = "x-only";
    rec.note = `x=${xRes.key} ok / y=${yRes ? `${yRes.key} name=${yRes.nameOk} range=${yRes.rangeOk}` : "候補なし"}`;
  } else if (!xResolved && yResolved) {
    rec.result = "y-only";
    rec.note = `y=${yRes.key} ok / x=${xRes ? `${xRes.key} name=${xRes.nameOk} range=${xRes.rangeOk}` : "候補なし"}`;
  } else {
    rec.result = "no-match";
    rec.note = `x=${xRes ? `${xRes.key} n=${xRes.nameOk} r=${xRes.rangeOk}` : "なし"} / y=${yRes ? `${yRes.key} n=${yRes.nameOk} r=${yRes.rangeOk}` : "なし"}`;
  }

  // --apply: resolved のみ生成 (probe ではスキップ)
  if (APPLY && rec.result === "resolved") {
    try {
      const out = await buildScatterJson(slug, base, xRes, yRes, meta);
      rec.note = `staged x=${xRes.key} y=${yRes.key} points=${out.nPoints}`;
    } catch (e) {
      rec.result = "extraction-fail";
      rec.note = `生成失敗 ${String(e.message).slice(0, 100)}`;
    }
  }
  results.push(rec);
}

// ---------- レポート ----------
const counts = {};
for (const r of results) counts[r.result] = (counts[r.result] || 0) + 1;
fs.writeFileSync("/tmp/restore-scatter-results.json", JSON.stringify({ counts, results }, null, 2));
console.error("\n=== 結果 ===");
for (const r of results) {
  console.error(`  ${r.result.padEnd(15)} ${r.slug}/${r.base}  ${r.xKey ? `x=${r.xKey}` : ""}${r.yKey ? ` y=${r.yKey}` : ""}  ${r.note}`);
}
console.error(`\ncounts: ${JSON.stringify(counts)}`);
const resolved = counts.resolved || 0;
console.error(`resolved ${resolved} / ${results.length} → /tmp/restore-scatter-results.json`);
console.log(JSON.stringify({ counts, resolved, total: results.length, applied: APPLY }, null, 2));
