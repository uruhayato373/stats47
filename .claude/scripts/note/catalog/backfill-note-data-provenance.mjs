#!/usr/bin/env node
/**
 * note ランキング記事に「データ復元マニフェスト」(data-provenance.json) を後付けする backfill。
 *
 * blog の source.json (系譜マニフェスト) の note 版。データ本体はコピーせず、stats47 R2 の
 * 観測値 SSOT (app/ranking/<key>/values.json) を指すだけ (二重 SSOT を作らない / 完全DBレス準拠)。
 * これでリライト時に「どの ranking の何年か」を辿ってチャート再生成・数値検算ができる。
 *
 * 導出 (捏造しない):
 *   - rankingKey: slug (a-<key>) + draft.md 内の stats47.jp/ranking/<key> リンク
 *   - year:       title の 【YYYY年...】
 *   - 裏取り:     app/ranking/<key>/values.json の該当年 partition の rank1/rank47 を
 *                 draft.md 記載の「1位/47位」と照合 (一致しなければ ambiguous に分類)
 *
 * 出力 (read-only 導出 + staging。R2 push はしない):
 *   .local/r2/note/<vertical>/<slug>/data-provenance.json   (staging = R2 レイアウトのミラー)
 *   /tmp/.../note-provenance-backfill.json                  (triage レポート)
 *
 * R2 反映は creds を持つ CI / セッションで push-note-provenance.mjs (別途) が行う。
 *
 * Usage:
 *   node .claude/scripts/note/catalog/backfill-note-data-provenance.mjs [--limit N] [--slug a,b]
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../../..");
const R2 = "https://storage.stats47.jp";
const STAGE = join(ROOT, ".local/r2");
const REPORT = join(process.env.SCRATCHPAD || tmpdir(), "note-provenance-backfill.json");

const argv = process.argv.slice(2);
const LIMIT = argv.includes("--limit") ? Number(argv[argv.indexOf("--limit") + 1]) : Infinity;
const ONLY = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1].split(",") : null;

// KNOWN ranking keys
const knownSrc = readFileSync(
  join(ROOT, "packages/ranking/src/config/known-ranking-keys.ts"),
  "utf8",
);
const KNOWN = new Set(
  [...knownSrc.slice(knownSrc.indexOf("new Set([")).matchAll(/"([a-z0-9-]{3,})"/g)].map(
    (m) => m[1],
  ),
);

// 対象: stats47-note の published + draft (R2 本体を持つものだけ後段で残る)
const pub = JSON.parse(
  readFileSync(join(ROOT, ".claude/state/note-published-urls.json"), "utf8"),
).articles;
const dft = JSON.parse(
  readFileSync(join(ROOT, ".claude/state/note-draft-index.json"), "utf8"),
).drafts;
const byKey = new Map();
for (const [slug, v] of Object.entries(pub))
  if (!slug.startsWith("_") && v.vertical === "stats47-note")
    byKey.set(slug, { slug, r2Path: v.r2_path || `note/stats47-note/${slug}`, title: v.title });
for (const [slug, v] of Object.entries(dft))
  if (v.vertical === "stats47-note" && !byKey.has(slug))
    byKey.set(slug, { slug, r2Path: v.r2_path || `note/stats47-note/${slug}`, title: slug });
let targets = [...byKey.values()];
if (ONLY) targets = targets.filter((t) => ONLY.includes(t.slug));
targets = targets.slice(0, LIMIT);

async function fetchText(url) {
  try {
    const r = await fetch(url);
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
}
async function fetchJson(url) {
  const t = await fetchText(url);
  if (!t) return null;
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

function parseYear(title, body) {
  const m = (title || "").match(/【(\d{4})年/) || (body || "").match(/【(\d{4})年/) || (body || "").match(/(\d{4})年、/);
  return m ? m[1] : null;
}
/** draft.md の「1位: 熊本県（36.2…」「47位: 北海道（28.4…」を抽出 */
function parseCited(body) {
  const g = (re) => {
    const m = body.match(re);
    return m ? { area: m[1].replace(/[（(].*$/, "").trim(), value: parseFloat(m[2]) } : null;
  };
  return {
    rank1: g(/1位[:：]\s*([^\s（(]+[都道府県])[（(]?\s*([\d.]+)/),
    rank47: g(/47位[:：]\s*([^\s（(]+[都道府県])[（(]?\s*([\d.]+)/),
  };
}
function chartImages(files) {
  return (files || []).filter(
    (f) => f.startsWith("images/") && /\.(png|svg)$/.test(f) && !/cover-/.test(f),
  );
}
function partitionForYear(values, year) {
  const parts = values?.partitions || [];
  if (!parts.length) return null;
  if (year) {
    const p = parts.find((p) => String(p.yearCode) === String(year));
    if (p) return p;
  }
  // 年不明 or 不一致 → 最新年
  return parts.slice().sort((a, b) => String(b.yearCode).localeCompare(String(a.yearCode)))[0];
}

async function pool(items, n, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return out;
}

const results = await pool(targets, 8, async (t) => {
  const manifest = await fetchJson(`${R2}/${t.r2Path}/manifest.json`);
  const draft = await fetchText(`${R2}/${t.r2Path}/draft.md`);
  if (!manifest || !draft) return { ...t, status: "no-r2" };

  const charts = chartImages(manifest.files);
  if (!charts.length) return { ...t, status: "no-chart" };

  // rankingKey 候補: slug 由来 + 本文リンク
  const slugKey = t.slug.replace(/^[Aa]-/, "");
  const linkKeys = [...draft.matchAll(/stats47\.jp\/ranking\/([a-z0-9-]+)/g)].map((m) => m[1]);
  const candidates = [slugKey, ...linkKeys].filter((k, i, a) => KNOWN.has(k) && a.indexOf(k) === i);
  if (!candidates.length) return { ...t, status: "ambiguous", reason: "rankingKey 未解決", charts };

  const year = parseYear(t.title, draft);
  const cited = parseCited(draft);

  // 候補を値照合で確定 (rank1 の県名一致を優先)
  let best = null;
  for (const key of candidates) {
    const values = await fetchJson(`${R2}/app/ranking/${key}/values.json`);
    const part = partitionForYear(values, year);
    if (!part) continue;
    const byRank = Object.fromEntries((part.values || []).map((v) => [v.rank, v]));
    const r1 = byRank[1];
    const r47 = byRank[47] || byRank[Math.max(...Object.keys(byRank).map(Number))];
    const match1 = cited.rank1 && r1 && r1.areaName.startsWith(cited.rank1.area.replace(/[都道府県]$/, ""));
    const match47 = cited.rank47 && r47 && r47.areaName.startsWith(cited.rank47.area.replace(/[都道府県]$/, ""));
    const score = (match1 ? 1 : 0) + (match47 ? 1 : 0) + (key === slugKey ? 0.5 : 0);
    if (!best || score > best.score)
      best = { key, year: String(part.yearCode), score, match1: !!match1, match47: !!match47 };
    if (match1 && match47) break;
  }
  if (!best) return { ...t, status: "ambiguous", reason: "values.json 取得不可", charts, candidates };

  const confirmed = best.match1 && best.match47;
  const provenance = {
    slug: t.slug,
    vertical: "stats47-note",
    kind: "ranking",
    rankingKey: best.key,
    year: best.year,
    charts,
    source: `r2:app/ranking/${best.key}/values.json`,
    restore: `curl -sf ${R2}/app/ranking/${best.key}/values.json`,
    verifiedMatch: { rank1: best.match1, rank47: best.match47, year: best.year },
    generatedBy: "backfill-note-data-provenance.mjs",
    note: "データ本体は stats47 R2 が SSOT。本ファイルは復元マニフェスト (コピーではない)。",
  };
  // staging へ書き出し
  const dir = join(STAGE, t.r2Path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "data-provenance.json"), JSON.stringify(provenance, null, 2) + "\n");

  return {
    ...t,
    status: confirmed ? "confirmed" : "partial",
    rankingKey: best.key,
    year: best.year,
    match: `${best.match1 ? "1位✓" : "1位✗"}/${best.match47 ? "47位✓" : "47位✗"}`,
  };
});

const by = (s) => results.filter((r) => r.status === s);
const report = {
  generatedAt: new Date().toISOString(),
  total: results.length,
  counts: {
    confirmed: by("confirmed").length,
    partial: by("partial").length,
    ambiguous: by("ambiguous").length,
    "no-chart": by("no-chart").length,
    "no-r2": by("no-r2").length,
  },
  ambiguous: by("ambiguous").map((r) => ({ slug: r.slug, reason: r.reason })),
  partial: by("partial").map((r) => ({ slug: r.slug, rankingKey: r.rankingKey, match: r.match })),
  results,
};
mkdirSync(dirname(REPORT), { recursive: true });
writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n");

console.log("=== note data-provenance backfill ===");
console.log(`対象: ${report.total} 件 (published stats47-note)`);
console.log(`  confirmed (rank1+47 一致): ${report.counts.confirmed}`);
console.log(`  partial   (一部一致):       ${report.counts.partial}`);
console.log(`  ambiguous (要手当て):       ${report.counts.ambiguous}`);
console.log(`  no-chart  (チャート無):     ${report.counts["no-chart"]}`);
console.log(`  no-r2     (R2 未取得):      ${report.counts["no-r2"]}`);
console.log(`\nstaging: .local/r2/note/stats47-note/<slug>/data-provenance.json`);
console.log(`report:  ${REPORT}`);
