#!/usr/bin/env node
/**
 * restore-ranking-from-svg.mjs — neither(json/source.json 消失=絵だけ) の ranking SVG を
 * SSOT(R2 app/ranking) から再生成して 3点セット(json/source.json/columns+portrait svg)に戻す。
 *
 * 「絵だけ」になった ranking SVG (svg-lineage-queue の status=neither && chartType=ranking) を対象に、
 * **旧SVGの表示値を唯一の照合先**として SSOT を自己検証し、≥0.95 一致したときだけ再生成する。
 * SVGの絵から値を逆復元して SSOT を書き換えることはしない (捏造防止)。値が合わなければ flag。
 *
 * 手順 (各 neither ranking base について):
 *   1. 旧SVG `app/blog/<slug>/data/<base>.svg` を取得し県名→値マップを堅牢に抽出
 *      (順位 1..47 を値と誤抽出しない。値は小数/カンマ/単位付きで判別)
 *   2. 候補key = 記事 /ranking/<key> リンク + basename トークン + SVGタイトル を all.json で名前検索
 *      (命名ドリフトは実在keyへ補正)
 *   3. 各候補の SSOT partition(values)と旧SVG値を相対2%照合。scale(×1/1000/1e4/0.1/1e6 等)も試す
 *   4. best matchRate ≥0.95 を採用 → fetch-ranking-data-r2.mjs + generate-article-charts.ts で 3点セット生成
 *   5. push前検証: 生成 json の上位/下位値が旧SVG表示値と ≥0.95 一致を再確認。不一致なら stage せず flag
 *
 * push しない。`.local/r2/app/blog/<slug>/data/` に staging するのみ (人間がレビュー後 push)。
 *
 * Usage:
 *   node .claude/scripts/blog/restore-ranking-from-svg.mjs                 # 全 neither ranking
 *   node .claude/scripts/blog/restore-ranking-from-svg.mjs --slugs a,b     # 指定 slug のみ
 *   node .claude/scripts/blog/restore-ranking-from-svg.mjs --base s/x      # 指定 slug/base のみ
 *   node .claude/scripts/blog/restore-ranking-from-svg.mjs --probe-only    # 照合だけ (staging書込なし)
 *
 * 正典: .claude/rules/blog-data-schema.md §1.5/§1.7、手法: .claude/state/blog/neither-restore-method.md
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
const VERIFY_MIN = 0.95;
const ALL_RANKING_PATH = "/tmp/all-ranking.json";

// ---------- CLI ----------
const args = process.argv.slice(2);
const getArg = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const SLUGS_ARG = getArg("--slugs");
const BASE_ARG = getArg("--base");
const PROBE_ONLY = args.includes("--probe-only");

// ---------- 都道府県 ----------
const PREFS = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];
const normPref = (s) => String(s || "").replace(/[都道府県]$/, "").replace(/^北海$/, "北海道").trim();
// 正規化名 (県/府/都 を除いたもの) → フル名。SVG は省略名 (岩手・徳島・大阪) を使うことが多い。
// 長い名前を先に並べて、短い名前の誤一致 (例「京都」⊃「京」) を避ける。
const NORM_PREFS = PREFS.map((p) => ({ norm: normPref(p), full: p })).sort((a, b) => b.norm.length - a.norm.length);
/** トークン内に現れる都道府県 (省略名/フル名どちらでも) を1つ返す。最長一致優先。 */
function findPrefInToken(tok) {
  // フル名優先 (神奈川県/和歌山県/鹿児島県 等の長い名前を先に)
  for (const p of [...PREFS].sort((a, b) => b.length - a.length)) if (tok.includes(p)) return normPref(p);
  // 省略名 (最長一致順)。「京都」と「京都府」, 「大阪」と「大阪府」等は norm が一致するので安全。
  for (const { norm } of NORM_PREFS) if (tok.includes(norm)) return norm;
  return null;
}

// ---------- SVG 値抽出 (堅牢・順位を値と誤抽出しない) ----------
function svgTexts(svg) {
  return [...svg.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").trim())
    .filter(Boolean);
}
function parseVal(t) {
  // 数字を含み、先頭が数値であること。単位サフィックスを許容。順位 "1位"/"43." は値でない
  const m = String(t).match(/^([\d,]+(?:\.\d+)?)\s*(兆円|億円|百万円|万円|千円|円|件|人|％|%|世帯|戸|社|店|台|ha|ｈａ|kg|km|分|時間|歳|cm|度|kwh|kWh|GWh|億kwh)?/);
  if (!m) return null;
  const num = parseFloat(m[1].replace(/,/g, ""));
  if (!isFinite(num)) return null;
  return { num, unit: m[2] || "", hasComma: /,/.test(m[1]), hasDecimal: /\./.test(m[1]) };
}
/** 旧SVGの表示値マップ {県名(正規化) -> {num,unit}} を抽出。順位整数は値と誤抽出しない。 */
function extractSvgValues(svg) {
  const toks = svgTexts(svg);
  const out = new Map();
  const units = new Set();
  for (let i = 0; i < toks.length; i++) {
    // findPrefInToken は省略名(徳島/大阪)もフル名(徳島県)も拾う。カード型 "4.8人 (1位)" 対応に必須
    const pref = findPrefInToken(toks[i]);
    if (!pref) continue;
    // 同一トークン内 (例 "茨城県 1位 49件" / "1. 茨城県") → 県名(フル/省略)と順位を除去して残りを解析
    let inline = toks[i].replace(new RegExp(pref + "[都道府県]?"), "").replace(/\d+\s*位/, "").replace(/^\s*\d+\.\s*/, "").trim();
    let v = inline ? parseVal(inline) : null;
    // inline が値でない or 順位っぽい(単位無し・小数無し・<=47) → 後続最大3トークンから値トークンを探す
    if (!v || (!v.unit && !v.hasDecimal && !v.hasComma && v.num <= 47)) {
      for (let j = i + 1; j < Math.min(i + 4, toks.length); j++) {
        if (PREFS.some((p) => toks[j].includes(p))) break;
        const cand = parseVal(toks[j]);
        if (cand && (cand.unit || cand.hasDecimal || cand.hasComma || cand.num > 47)) { v = cand; break; }
      }
    }
    if (v) {
      if (!out.has(pref)) out.set(pref, v); // pref は findPrefInToken の正規化名
      if (v.unit) units.add(v.unit);
    }
  }
  return { values: out, units: [...units] };
}

// ---------- 候補 key 解決 ----------
let CATALOG = null;
function loadCatalog() {
  if (CATALOG) return CATALOG;
  if (!fs.existsSync(ALL_RANKING_PATH)) {
    throw new Error(`${ALL_RANKING_PATH} が無い。curl -s ${R2}/app/ranking-items/all.json > ${ALL_RANKING_PATH} を先に実行`);
  }
  const raw = JSON.parse(fs.readFileSync(ALL_RANKING_PATH, "utf8"));
  CATALOG = (raw.items || raw.rankings || raw.data || (Array.isArray(raw) ? raw : []))
    .filter((x) => x && x.rankingKey && (x.areaType === "prefecture" || !x.areaType));
  return CATALOG;
}
/** basename を意味トークンに分解 (chartN-/-ranking/-rankings/-top5-bottom5 等の接辞を除く) */
function baseTokens(base) {
  return base
    .replace(/^chart\d+[-_]?/i, "")
    .replace(/-(rankings?|top\d+|bottom\d+|top-bottom|top5-bottom5|comparison|ranking|map)$/gi, "")
    .replace(/-(rankings?|top\d+|bottom\d+|top-bottom|top5-bottom5|comparison)$/gi, "")
    .split(/[-_]/)
    .filter((t) => t && !/^\d+$/.test(t) && t.length > 1);
}
/** 候補 key を集める: 記事リンク + basename/title トークンの名前検索 */
function resolveCandidates(slug, base, articleMd, svgTitleText) {
  const cands = new Set();
  // 1. 記事 /ranking/<key> リンク
  for (const m of articleMd.matchAll(/\/ranking\/([a-z0-9-]+)/gi)) cands.add(m[1]);
  // 2. basename トークン → catalog rankingKey の部分一致
  const catalog = loadCatalog();
  const toks = baseTokens(base);
  const tokLc = toks.map((t) => t.toLowerCase());
  for (const it of catalog) {
    const kl = it.rankingKey.toLowerCase();
    // basename トークンが key に全部含まれれば候補
    if (tokLc.length && tokLc.every((t) => kl.includes(t))) cands.add(it.rankingKey);
  }
  // 3. SVG タイトル (日本語) → catalog rankingName/title 部分一致
  const titleJa = String(svgTitleText || "")
    .replace(/上位\d+[・,，]下位\d+/g, "").replace(/[（(].*?[)）]/g, "")
    .replace(/都道府県別?/g, "").replace(/ランキング/g, "").replace(/[ 　]/g, "").trim();
  if (titleJa.length >= 2) {
    // タイトル日本語の長い部分文字列が rankingName に出る key を拾う
    for (const it of catalog) {
      const nm = String(it.rankingName || it.title || "");
      if (nm.length >= 2 && (nm.includes(titleJa) || (titleJa.length >= 4 && titleJa.includes(nm)))) cands.add(it.rankingKey);
      // タイトルの先頭4-6字が rankingName に含まれる緩い一致
      else if (titleJa.length >= 4 && nm.includes(titleJa.slice(0, Math.min(6, titleJa.length)))) cands.add(it.rankingKey);
    }
  }
  return [...cands];
}

// ---------- SSOT 照合 (scale 対応) ----------
async function fj(u) { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); }
async function ssotPartitions(key) {
  const v = await fj(`${R2}/app/ranking/${key}/values.json`);
  return (v.partitions || []).map((p) => ({ year: p.yearCode, values: p.values, unit: (p.values?.[0]?.unit) || "" }));
}
// 正気な単位換算のみ (円↔千円↔万円: ×1000/1e4、%↔比率: ×100/0.01、人↔千人: ×0.001 等)。
// 1e6/1e-6 等の極端スケールは、SSOT がほぼ0の壊れデータ(例 gini=0)に対し SVG値×極小≈0 で偽陽性を生むため除外。
const SCALES = [1, 10, 0.1, 100, 0.01, 1000, 0.001, 1e4, 1e-4];
/** svgMap(正規化県名→{num}) と ssot values を scale 込みで照合。{rate,scale,matched} */
function matchWithScale(svgMap, ssotVals) {
  let best = { rate: 0, scale: 1, matched: 0, n: 0 };
  for (const scale of SCALES) {
    let ok = 0, n = 0;
    const ssotMatched = [];
    for (const v of ssotVals) {
      const sv = svgMap.get(normPref(v.areaName));
      if (sv == null) continue;
      n++;
      ssotMatched.push(v.value);
      const target = sv.num * scale; // SVG表示値 × scale = SSOT raw 値 を狙う
      // 相対tol のみ (絶対下限を撤廃: 0.05 下限は 0付近で何でも一致する偽陽性源だった)
      const tol = Math.max(Math.abs(v.value), Math.abs(target)) * 0.02 + 1e-9;
      if (Math.abs(v.value - target) <= tol) ok++;
    }
    // 退化ガード: 一致対象の SSOT 値が無分散(全0/全同値)なら無意味な一致 → 不採用 (gini全0等)
    const range = ssotMatched.length ? Math.max(...ssotMatched) - Math.min(...ssotMatched) : 0;
    const meanAbs = ssotMatched.length ? ssotMatched.reduce((a, b) => a + Math.abs(b), 0) / ssotMatched.length : 0;
    if (range <= Math.max(meanAbs * 0.01, 1e-9)) continue;
    const rate = n >= 3 ? ok / n : 0;
    if (rate > best.rate) best = { rate, scale, matched: ok, n };
  }
  return best;
}

// ---------- queue から neither ranking を取得 ----------
function loadTargets() {
  const q = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, ".claude/state/blog/svg-lineage-queue.json"), "utf8"));
  let entries = q.entries.filter((e) => e.status === "neither" && e.chartType === "ranking").map((e) => ({ slug: e.slug, base: e.base }));
  if (BASE_ARG) { const [s, b] = BASE_ARG.split("/"); entries = entries.filter((e) => e.slug === s && e.base === b); }
  else if (SLUGS_ARG) { const want = new Set(SLUGS_ARG.split(",").map((s) => s.trim())); entries = entries.filter((e) => want.has(e.slug)); }
  return entries;
}

async function fetchText(u) { const r = await fetch(u); if (!r.ok) throw new Error("HTTP " + r.status); return r.text(); }

// ---------- 3点セット生成 (確定 key/scale で) ----------
function regenerate(slug, base, key, year) {
  const dir = path.join(STAGE_ABS, slug);
  fs.mkdirSync(path.join(dir, "data"), { recursive: true });
  // article.md が staging に無ければ R2 から取得済を書く必要がある (fetch スクリプトが読む)
  const yearArgs = year ? ["--year", String(year)] : [];
  execFileSync("node", [
    ".claude/scripts/blog/fetch-ranking-data-r2.mjs",
    "--slug", slug, "--base", STAGE_REL, "--keys", key, "--data-name", base, ...yearArgs,
  ], { cwd: PROJECT_ROOT, stdio: "pipe" });
  execFileSync((process.platform === "win32" ? "npx.cmd" : "npx"), [
    "tsx", ".claude/scripts/blog/generate-article-charts.ts", "--slug", slug, "--base", STAGE_REL,
  ], { cwd: PROJECT_ROOT, stdio: "pipe", env: { ...process.env, NODE_OPTIONS: "--conditions react-server" } });
  return {
    json: path.join(dir, "data", `${base}.json`),
    source: path.join(dir, "data", `${base}.source.json`),
    columns: path.join(dir, "data", `${base}.svg`),
    portrait: path.join(dir, "data", `${base}-ig.svg`),
  };
}
/** push前検証: 生成 json の値が旧SVG表示値と ≥0.95 一致 (scale込み) を再確認 */
function verifyGenerated(jsonPath, svgMap, scale) {
  const j = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const arr = Array.isArray(j) ? j : (j.data || []);
  let ok = 0, n = 0;
  for (const it of arr) {
    const nm = normPref(it.areaName ?? it.pref ?? it.label);
    const sv = svgMap.get(nm);
    if (sv == null || it.value == null) continue;
    n++;
    const target = sv.num * scale;
    const tol = Math.max(Math.abs(it.value) * 0.02, Math.abs(target) * 0.02, 0.05);
    if (Math.abs(it.value - target) <= tol) ok++;
  }
  return n >= 3 ? ok / n : 0;
}

// ---------- main ----------
const targets = loadTargets();
console.error(`[restore] ${targets.length} neither ranking SVG を処理`);
loadCatalog();

const results = [];
for (const { slug, base } of targets) {
  const rec = { slug, base, key: null, matchRate: 0, scale: 1, year: null, result: "no-match", note: "" };
  // 旧SVG
  let svg;
  try { svg = await fetchText(`${R2}/app/blog/${slug}/data/${base}.svg`); }
  catch (e) { rec.result = "extraction-fail"; rec.note = `svg取得失敗 ${e.message}`; results.push(rec); continue; }
  const { values: svgMap, units } = extractSvgValues(svg);
  rec.svgPrefs = svgMap.size;
  rec.svgUnits = units.join("/");
  if (svgMap.size < 5) { rec.result = "extraction-fail"; rec.note = `県名→値 ${svgMap.size}件のみ`; results.push(rec); continue; }
  // SVG タイトル (先頭 text)
  const svgTitle = svgTexts(svg)[0] || "";
  // 記事 md
  let md = "";
  try { md = await fetchText(`${R2}/app/blog/${slug}/article.md`); } catch {}
  const cands = resolveCandidates(slug, base, md, svgTitle);
  rec.candidates = cands.length;
  if (!cands.length) { rec.result = "missing-metric"; rec.note = "候補key無し(未取込/命名不明)"; results.push(rec); continue; }
  // 各候補を照合
  let best = null;
  for (const key of cands) {
    let parts;
    try { parts = await ssotPartitions(key); } catch { continue; } // 404 → 未取込候補
    for (const p of parts) {
      const m = matchWithScale(svgMap, p.values);
      if (!best || m.rate > best.rate) best = { key, year: p.year, ...m };
    }
  }
  if (!best || best.rate === 0) {
    // 全候補404 か全くマッチせず → 未取込 metric の可能性
    rec.result = "missing-metric"; rec.note = `候補 ${cands.length}個 全て不一致/404`; results.push(rec); continue;
  }
  rec.key = best.key; rec.matchRate = +best.rate.toFixed(3); rec.scale = best.scale; rec.year = best.year;
  if (best.rate < VERIFY_MIN) {
    rec.result = "no-match"; rec.note = `best ${(best.rate * 100).toFixed(0)}% (${best.key} ×${best.scale}) <95%`;
    results.push(rec); continue;
  }
  // 採用方法ラベル
  const method = best.scale === 1 ? "raw" : "scale";
  rec.result = best.scale === 1 ? "verified" : "scale-verified";

  if (PROBE_ONLY) { rec.note = `(probe) ${best.key} ×${best.scale} year=${best.year}`; results.push(rec); continue; }

  // 生成 (確定 key/year)
  try {
    // staging に article.md を用意 (fetch スクリプトが読む)
    const dir = path.join(STAGE_ABS, slug);
    fs.mkdirSync(path.join(dir, "data"), { recursive: true });
    if (md && !fs.existsSync(path.join(dir, "article.md"))) fs.writeFileSync(path.join(dir, "article.md"), md, "utf8");
    const out = regenerate(slug, base, best.key, best.year);
    // push前検証: 生成 json が旧SVG値と一致するか (scale込み)
    const vr = verifyGenerated(out.json, svgMap, best.scale);
    rec.verifyRate = +vr.toFixed(3);
    if (vr < VERIFY_MIN) {
      rec.result = "no-match"; rec.note = `生成後検証 ${(vr * 100).toFixed(0)}% <95% → flag (staging残置せず)`;
      // 生成物を撤去 (捏造防止: 検証不合格は stage しない)
      for (const f of [out.json, out.source, out.columns, out.portrait]) { try { fs.unlinkSync(f); } catch {} }
      results.push(rec); continue;
    }
    // source.json に確定方法を追記
    try {
      const sj = JSON.parse(fs.readFileSync(out.source, "utf8"));
      sj.verifiedMatchRate = Math.round(vr * 100);
      sj.restoredFrom = "restore-ranking-from-svg.mjs";
      sj.svgVerification = { matchedPrefs: svgMap.size, scale: best.scale, method, note: "旧SVG表示値とSSOT再取得値を相対2%で自己照合し確定 (捏造なし)" };
      if (best.scale !== 1) sj.scale = best.scale;
      fs.writeFileSync(out.source, JSON.stringify(sj, null, 2));
    } catch {}
    rec.note = `staged ${best.key} ×${best.scale} year=${best.year} verify=${rec.verifyRate}`;
  } catch (e) {
    rec.result = "extraction-fail"; rec.note = `生成失敗 ${String(e.message).slice(0, 100)}`;
  }
  results.push(rec);
}

// ---------- レポート ----------
const counts = {};
for (const r of results) counts[r.result] = (counts[r.result] || 0) + 1;
const staged = results.filter((r) => (r.result === "verified" || r.result === "scale-verified" || r.result === "derived-verified" || r.result === "drift-verified") && !PROBE_ONLY).length;
const flagged = results.length - staged;
fs.writeFileSync("/tmp/restore-ranking-results.json", JSON.stringify({ counts, results }, null, 2));
console.error("\n=== 結果 ===");
for (const r of results) {
  console.error(`  ${r.result.padEnd(16)} ${r.slug}/${r.base}  ${r.key ? `key=${r.key} ×${r.scale} ${(r.matchRate * 100).toFixed(0)}%` : ""}  ${r.note}`);
}
console.error(`\ncounts: ${JSON.stringify(counts)}`);
console.error(`staged ${staged}枚 / flagged ${flagged}枚 → /tmp/restore-ranking-results.json`);
console.log(JSON.stringify({ counts, staged, flagged, probeOnly: PROBE_ONLY }, null, 2));
