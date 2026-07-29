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

/** 日本語短縮単位を実値倍率に。 */
const SCALE = { 万: 1e4, 千: 1e3, 億: 1e8, 兆: 1e12 };

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

/** SVG の <title>県：値単位</title> を { 県名 → 実値 } と単位に分解する。 */
function extractSvgValues(svg) {
  const values = new Map();
  const units = new Map();
  for (const m of String(svg).matchAll(/<title>([^：<]+)：([\d,.\-]+)(万|千|億|兆)?([^<]*)<\/title>/g)) {
    const n = parseFloat(m[2].replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    values.set(m[1].trim(), n * (SCALE[m[3]] ?? 1));
    const u = (m[3] ?? "") + (m[4] ?? "").trim();
    units.set(u, (units.get(u) ?? 0) + 1);
  }
  const unit = [...units.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  const title = String(svg).match(/<title>([^：<]*)<\/title>/)?.[1] ?? "";
  return { values, unit, title };
}

/** SSOT の値を実値へ (unit が 千円/万円 等なら倍率を掛ける)。 */
function ssotToReal(value, unit) {
  const head = String(unit ?? "").trim()[0];
  return value * (SCALE[head] ?? 1);
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

/** 1 候補 × 全年で一致率の最大を返す。 */
function matchRate(payload, disp) {
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
      if (Math.abs(a - b) / Math.max(Math.abs(b), 1e-9) < 0.02) hit++;
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
  const { values: disp, unit, title } = extractSvgValues(svg);
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
  const checked = await pool(ranked, async (c) => ({ c, m: matchRate(await fetchValues(c.key), disp) }));
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
