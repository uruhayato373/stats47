#!/usr/bin/env node
/**
 * find-chart-metric.mjs — 元データを失ったチャートの metric を **指紋照合** で特定する。
 *
 * ## なぜ要るか
 *
 * `regenerate-tile-maps.ts` / `regenerate-ranking-cards.mjs` は「記事本文の `/ranking/<key>`
 * リンク」だけを候補にして SSOT と照合する。だが実際には**記事がリンクしていない指標**で
 * 描かれた図が多く、その場合 triage は必ず失敗する。
 *
 * 2026-07-29 実測: ssot-restore のタイルマップ 10 枚のうち triage で確証できたのは 1 枚だけ。
 * 失敗例 `savings-balance-gap/savings-map` は SVG タイトルが「貯蓄現在高」で記事リンクも
 * `current-savings-balance-multi-person-households` だったが、実データは
 * **`financial-assets-balance-multi-person-households` の 2019 年**だった (47/47 一致)。
 * タイトルもリンクも当てにならず、**値そのもので突き合わせる**しかない。
 *
 * ## やること
 *
 * 1. 既存 SVG の `<title>県：値単位</title>` から 47 県の表示値を取り出す (万/千/億 を実値化)
 * 2. 指標レジストリ (git TS・2295 件) を **単位の族**で絞り、SVG タイトルとの語の重なりで並べる
 * 3. 候補の `app/ranking/<key>/values.json` を年ごとに突合し、一致率 >= しきい値で確定
 * 4. `{ "<slug>/<base>": { key, year } }` 形式の mapping を出力
 *    → `regenerate-tile-maps.ts --mapping <file>` が triage を飛ばして復元に使う
 *
 * **SVG から値を復元するのではない**。SVG は「どの指標か」を当てる照合材料にだけ使い、
 * 実データは必ず SSOT (`app/ranking`) から取る (§1.6 の捏造禁止)。
 *
 * Usage:
 *   node .claude/scripts/blog/find-chart-metric.mjs                     # ssot-restore 全件
 *   node .claude/scripts/blog/find-chart-metric.mjs --limit 5
 *   node .claude/scripts/blog/find-chart-metric.mjs --candidates 60      # 1枚あたり候補数
 *   node .claude/scripts/blog/find-chart-metric.mjs --min-rate 0.95
 *
 * 前提: /tmp/metric-registry.json (key/title/unit/isActive) — 無ければ作り方を案内する
 * 出力: .claude/state/blog/chart-metric-mapping.json
 *
 * 正典: .claude/rules/blog-data-schema.md §1.6 / §1.7
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/blog");
const REGISTRY = "/tmp/metric-registry.json";
const argv = process.argv.slice(2);
const num = (flag, def) => (argv.includes(flag) ? Number(argv[argv.indexOf(flag) + 1]) : def);
const LIMIT = num("--limit", null);
const MAX_CANDIDATES = num("--candidates", 60);
const MIN_RATE = num("--min-rate", 0.95);
const CONC = 12;

/** CDN は 404 もキャッシュするので監査/照合では origin まで読む (§1.7)。 */
const noCache = (u) => `${u}${u.includes("?") ? "&" : "?"}__r=${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
async function getText(u) {
  try {
    const r = await fetch(noCache(u), { signal: AbortSignal.timeout(20000) });
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
}
async function getJson(u) {
  const t = await getText(u);
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}
async function pool(items, fn) {
  const out = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONC, items.length) }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k]);
      }
    }),
  );
  return out;
}

/**
 * 日本語の桁接頭辞 → 実値倍率。**長いものから順に見る**。
 * 先頭 1 文字だけで判定すると `百万円` (レジストリに 85 指標) を等倍と誤読する。
 */
const SCALE_PREFIXES = [
  ["兆", 1e12],
  ["億", 1e8],
  ["百万", 1e6],
  ["十万", 1e5],
  ["万", 1e4],
  ["千", 1e3],
];
/** 文字列先頭の桁接頭辞を倍率にする (無ければ 1)。 */
function scaleOf(s) {
  const t = String(s ?? "").trim();
  for (const [p, mul] of SCALE_PREFIXES) if (t.startsWith(p)) return mul;
  return 1;
}
/** 数値直後に付く桁接頭辞 (SVG 表示の `58.0兆円` 等) の倍率。 */
const SCALE = { 兆: 1e12, 億: 1e8, 万: 1e4, 千: 1e3 };

/** 単位の族。SSOT の unit と SVG の表示単位が違っても同じ量なら比較できるようにする。 */
function unitFamily(u) {
  const s = String(u ?? "").trim();
  if (/円/.test(s)) return "money";
  if (/[%％]/.test(s)) return "pct";
  if (/^(人|世帯|人口)/.test(s)) return "people";
  if (/(所|箇所|件|軒|施設|店|校|台|戸|棟)/.test(s)) return "count";
  if (/(ha|ｈａ|km|ｋｍ|m2|㎡)/i.test(s)) return "area";
  if (/(年|歳|日|時間|分)/.test(s)) return "time";
  if (/(t|ｔ|kg|トン)/i.test(s)) return "weight";
  return "other";
}

/**
 * `1,234.5兆円` のような表示文字列を実値・単位・**表示の刻み**に分解する。
 *
 * `step` は「表示の最小桁が表す実値の幅」。`0.7兆円` なら 0.1兆 = 1e11、`58.0兆円` も 1e11。
 * 照合の許容をこの刻みから決めるために要る。相対 2% 固定にすると、下位県の粗い丸め
 * (有効 1 桁) が必ず外れる (2026-07-29 実測: manufacturing-ranking が 16/20 で止まった)。
 */
function parseDisplayNumber(text) {
  const m = String(text).trim().match(/^(-?[\d,]+(?:\.\d+)?)\s*(兆|億|万|千)?\s*(.*)$/);
  if (!m) return null;
  const digits = m[1].replace(/,/g, "");
  const n = parseFloat(digits);
  if (!Number.isFinite(n)) return null;
  const decimals = digits.includes(".") ? digits.split(".")[1].length : 0;
  const scale = SCALE[m[2]] ?? 1;
  return { value: n * scale, unit: (m[2] ?? "") + (m[3] ?? "").trim(), step: Math.pow(10, -decimals) * scale };
}

/**
 * SVG から { 県名 → 実値 } と代表単位を取り出す。2 形式に対応する。
 *
 * A) コロプレス: `<title>県名：値単位</title>` が 47 件並ぶ
 * B) ランキング棒: `<text>` が 順位 / 県名 / 値 の順に並ぶ (上位N・下位N なので 10〜20 件)
 *
 * B が要る理由: ssot-restore の 22 枚は ranking で、A の形式を持たないため
 * 初版では値が 1 件も取れず候補照合に入れなかった (2026-07-29 実測)。
 * 20 件でも指紋としては十分機能する (照合は 10 件以上を要求)。
 */
function extractSvgValues(svg) {
  const s = String(svg);
  const title = s.match(/<title>([^：<]*)<\/title>/)?.[1] ?? "";

  // --- A) コロプレスの <title> 形式 ---
  const values = new Map();
  const units = new Map();
  const steps = new Map();
  for (const m of s.matchAll(/<title>([^：<]+)：([\d,.\-]+)(万|千|億|兆)?([^<]*)<\/title>/g)) {
    const n = parseFloat(m[2].replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    const dec = m[2].includes(".") ? m[2].split(".")[1].length : 0;
    const sc = SCALE[m[3]] ?? 1;
    values.set(m[1].trim(), n * sc);
    steps.set(m[1].trim(), Math.pow(10, -dec) * sc);
    const u = (m[3] ?? "") + (m[4] ?? "").trim();
    units.set(u, (units.get(u) ?? 0) + 1);
  }
  if (values.size >= 10) {
    return { values, steps, unit: [...units.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "", title, form: "title" };
  }

  // --- B) ランキング棒: text/tspan を文書順に並べ「県名 → 直後の数値」を拾う ---
  const texts = [...s.matchAll(/<(?:text|tspan)\b[^>]*>([^<]+)</g)].map((m) => m[1].trim()).filter(Boolean);
  const v2 = new Map();
  const u2 = new Map();
  const s2 = new Map();
  for (let i = 0; i < texts.length - 1; i++) {
    const name = texts[i];
    if (!PREF_NAMES.has(name)) continue;
    // 県名の直後、または 1 つ飛ばした位置に値が来る形の両方を許す
    for (const j of [i + 1, i + 2]) {
      if (j >= texts.length) break;
      const p = parseDisplayNumber(texts[j]);
      if (!p) continue;
      const key = name === "北海道" ? name : name.replace(/[都府県]$/, "");
      if (!v2.has(key)) {
        v2.set(key, p.value);
        s2.set(key, p.step);
        u2.set(p.unit, (u2.get(p.unit) ?? 0) + 1);
      }
      break;
    }
  }
  if (v2.size > values.size) {
    return { values: v2, steps: s2, unit: [...u2.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "", title, form: "ranking-text" };
  }
  return { values, steps, unit: [...units.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "", title, form: "title" };
}

/** SSOT の値を実値へ (unit が 千円/百万円 等なら倍率を掛ける)。 */
function ssotToReal(value, unit) {
  return value * scaleOf(unit);
}

/** タイトルの語の重なり (2文字以上の部分列の共有数)。候補の並べ替えに使う。 */
function titleAffinity(a, b) {
  const A = String(a ?? "");
  const B = String(b ?? "");
  let n = 0;
  for (let i = 0; i + 2 <= A.length; i++) if (B.includes(A.slice(i, i + 2))) n++;
  return n;
}

// ---------- 入力 ----------
if (!fs.existsSync(REGISTRY)) {
  console.error(
    `[find-metric] ${REGISTRY} が無い。次で作る:\n` +
      `  cat > /tmp/reg.ts <<'EOF'\n` +
      `  import { METRICS_REGISTRY } from "${PROJECT_ROOT}/packages/data-configs/src/index";\n` +
      `  const R = METRICS_REGISTRY as Record<string, any>;\n` +
      `  require("node:fs").writeFileSync("${REGISTRY}", JSON.stringify(Object.keys(R).map(k=>({key:k,title:R[k].title,unit:R[k].unit,isActive:R[k].isActive!==false}))));\n` +
      `  EOF\n  npx tsx /tmp/reg.ts`,
  );
  process.exit(1);
}
const registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8")).filter((m) => m.isActive);

const lineagePath = path.join(STATE_DIR, "svg-lineage-queue.json");
if (!fs.existsSync(lineagePath)) {
  console.error("[find-metric] svg-lineage-queue.json が無い。先に build-lineage-queue.mjs を実行");
  process.exit(1);
}
let targets = JSON.parse(fs.readFileSync(lineagePath, "utf8")).entries.filter(
  (e) => e.restoreMethod === "ssot-restore",
);
if (LIMIT) targets = targets.slice(0, LIMIT);
console.error(`[find-metric] 対象 ${targets.length} 枚 / 候補プール ${registry.length} 指標 (active)`);

// values.json は候補が重なるのでプロセス内キャッシュする
const valuesCache = new Map();
async function fetchValues(key) {
  if (!valuesCache.has(key)) {
    valuesCache.set(key, await getJson(`${R2}/app/ranking/${encodeURIComponent(key)}/values.json`));
  }
  return valuesCache.get(key);
}

const PREF = JSON.parse(
  fs.readFileSync(path.join(PROJECT_ROOT, "packages/area/src/data/prefectures.json"), "utf8"),
);
const code2short = new Map(
  PREF.map((p) => [
    String(p.prefCode).slice(0, 2),
    p.prefName === "北海道" ? p.prefName : p.prefName.replace(/[都府県]$/, ""),
  ]),
);
/** 県名の許容集合 (正式・短縮の両方)。ranking 棒の text 走査で「県名か」を判定する。 */
const PREF_NAMES = new Set(PREF.flatMap((p) => [p.prefName, p.prefName.replace(/[都道府県]$/, "")]));

/** 1 候補 × 全年で一致率の最大を返す。 */
function matchRate(payload, disp, steps) {
  if (!payload?.partitions) return null;
  let best = null;
  for (const p of payload.partitions) {
    let hit = 0;
    let tot = 0;
    for (const row of p.values ?? []) {
      const nm = code2short.get(String(row.areaCode).slice(0, 2));
      if (!nm || !disp.has(nm)) continue;
      tot++;
      const a = ssotToReal(row.value, row.unit);
      const b = disp.get(nm);
      // 許容は「相対 2%」と「表示刻みの半分」の大きい方。粗く丸められた表示 (0.7兆円 等) を
      // 相対誤差だけで判定すると必ず外れる。
      const tol = Math.max(Math.abs(b) * 0.02, ((steps?.get(nm) ?? 0) / 2) * 1.001);
      if (Math.abs(a - b) <= tol) hit++;
    }
    if (tot >= 10) {
      const rate = hit / tot;
      if (!best || rate > best.rate) best = { year: String(p.yearCode), rate, hit, tot };
    }
  }
  return best;
}

const results = [];
for (const t of targets) {
  const svg = await getText(`${R2}/app/blog/${t.slug}/data/${t.base}.svg`);
  if (!svg) {
    results.push({ ...t, status: "svg-missing" });
    continue;
  }
  const { values: disp, steps, unit, title } = extractSvgValues(svg);
  if (disp.size < 10) {
    results.push({ ...t, status: "no-values", detail: `SVG から取れた値 ${disp.size} 件` });
    continue;
  }
  const fam = unitFamily(unit);
  // 単位の族が一致する候補を、タイトルの語の重なり順に並べる
  const ranked = registry
    .filter((m) => unitFamily(m.unit) === fam)
    .map((m) => ({ ...m, aff: titleAffinity(title, m.title) }))
    .sort((a, b) => b.aff - a.aff)
    .slice(0, MAX_CANDIDATES);

  let found = null;
  const checked = await pool(ranked, async (c) => ({ c, m: matchRate(await fetchValues(c.key), disp, steps) }));
  for (const { c, m } of checked) {
    if (m && m.rate >= MIN_RATE && (!found || m.rate > found.rate)) {
      found = { key: c.key, title: c.title, unit: c.unit, ...m };
    }
  }
  if (found) {
    results.push({ ...t, status: "found", svgTitle: title, svgUnit: unit, ...found });
    console.error(`  ✓ ${t.slug}/${t.base}  → ${found.key} (${found.year}) ${(found.rate * 100).toFixed(0)}% [${found.hit}/${found.tot}]`);
  } else {
    const near = checked.filter((x) => x.m).sort((a, b) => b.m.rate - a.m.rate)[0];
    results.push({
      ...t,
      status: "not-found",
      svgTitle: title,
      svgUnit: unit,
      candidates: ranked.length,
      bestRate: near ? Number((near.m.rate * 100).toFixed(1)) : 0,
      bestKey: near?.c.key ?? null,
    });
    console.error(`  x ${t.slug}/${t.base}  最良 ${near ? `${near.c.key} ${(near.m.rate * 100).toFixed(0)}%` : "なし"} (候補 ${ranked.length})`);
  }
}

const found = results.filter((r) => r.status === "found");
const mapping = {};
for (const f of found) mapping[`${f.slug}/${f.base}`] = { key: f.key, year: f.year };

fs.mkdirSync(STATE_DIR, { recursive: true });
// ★mapping は **トップレベルが `"<slug>/<base>": {key,year}` のフラット形**でなければならない。
// regenerate-tile-maps.ts は `Object.entries(JSON.parse(file))` をそのまま回すので、
// メタ情報で包むと `generatedAt` 等がチャート名として扱われ全件失敗する (2026-07-29 に踏んだ)。
fs.writeFileSync(path.join(STATE_DIR, "chart-metric-mapping.json"), JSON.stringify(mapping, null, 2));
// 詳細 (未特定の最良候補・一致率) は別ファイル。mapping を汚さない。
fs.writeFileSync(
  path.join(STATE_DIR, "chart-metric-mapping-report.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), minRate: MIN_RATE, results }, null, 2),
);
console.error(
  `\n[find-metric] 特定 ${found.length} / 未特定 ${results.length - found.length} (計 ${results.length})\n` +
    `  mapping (フラット): .claude/state/blog/chart-metric-mapping.json\n` +
    `  詳細レポート      : .claude/state/blog/chart-metric-mapping-report.json\n` +
    `  復元: npx tsx .claude/scripts/blog/regenerate-tile-maps.ts --mapping .claude/state/blog/chart-metric-mapping.json`,
);
process.exit(found.length > 0 ? 0 : 3);
