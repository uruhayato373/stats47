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
 * 入力 (読むだけ):
 *   - 対象の記事と本文の所在: 記事台帳 data/note/articles.json (stats47-note で本文を R2 に保存済みの記事)
 *   - 記事のファイル一覧: 台帳の body.manifest が指す private R2 のマニフェスト (note-archive/manifests/<key>/<sha>.json)
 *   - draft.md: 台帳の body.store が指すバケット (無料は公開 R2、有料は private R2)
 *
 * 出力 (R2 へは書かない):
 *   docs/31_note記事原稿/<key>/data-provenance.json   (記事の作業コピー。無ければ保存済みの全ファイルを取り出してから置く)
 *   /tmp/.../note-provenance-backfill.json            (triage レポート)
 *
 * R2 への反映は、置いた作業コピーを `npm run note:article -- save <key>` で保存する (衝突検査と旧版の退避を通り、台帳のマニフェストが更新される)。
 * 作業コピーに未保存の変更がある記事には置かない (local-modified)。保存済みの復元マニフェストと同じ内容なら作業コピーを作らない (unchanged)。
 *
 * Usage:
 *   node .claude/scripts/note/catalog/backfill-note-data-provenance.mjs [--limit N] [--slug a,b]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { tmpdir } from "os";
import { R2_PUBLIC_BASE_URL } from "../../lib/site-config.cjs";
import { hasStoredBody, readArticleLedger } from "../lib/article-ledger.mjs";
import { createArticleStores, loadArticleFiles, readLocalFiles, readManifest, sha256, workingDir } from "../lib/article-store.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../../..");
const R2 = R2_PUBLIC_BASE_URL;
export const PROVENANCE_FILE = "data-provenance.json";

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

/**
 * 復元マニフェストを記事の作業コピーへ置く。作業コピーが無ければ保存済みの全ファイルを取り出す
 * (note:article save は作業コピーに無いファイルを R2 から消すので、復元マニフェストだけの作業コピーは作らない)。
 * 作業コピーが保存済みと違う (未保存の変更がある) ときは何もせず false を返す。
 */
async function placeInWorkingCopy(article, manifest, bytes, stores, root) {
  const dir = workingDir(article, root);
  if (existsSync(join(dir, "draft.md"))) {
    // 前回この backfill が置いた復元マニフェストだけは、保存済みと違っていてよい
    const local = readLocalFiles(dir).filter((f) => f.name !== PROVENANCE_FILE);
    const saved = manifest.files.filter((f) => f.name !== PROVENANCE_FILE);
    const same = local.length === saved.length && local.every((f, i) => f.name === saved[i].name && sha256(f.bytes) === saved[i].sha256);
    if (!same) return false;
  } else {
    const files = await loadArticleFiles(article, stores);
    rmSync(dir, { recursive: true, force: true });
    for (const f of files) {
      const target = join(dir, ...f.name.split("/"));
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, f.bytes);
    }
  }
  writeFileSync(join(dir, PROVENANCE_FILE), bytes);
  return true;
}

/**
 * 記事 1 本の復元マニフェストを導出し、作業コピーへ置く。R2 へは書かない。
 *
 * @param {object} article 記事台帳の 1 行
 * @param {object} deps
 * @param {{ body: object, archive: object }} deps.stores 本文のバケットと private R2 のマニフェスト置き場 (読むだけ)
 * @param {Set<string>} deps.known 公開中の ranking key
 * @param {(rankingKey: string) => Promise<object | null>} deps.fetchValues app/ranking/<key>/values.json
 * @param {string} deps.root 作業コピーの基準になるリポジトリのルート
 */
export async function backfillArticle(article, { stores, known, fetchValues, root }) {
  const t = { slug: article.key, r2Path: article.r2Path, title: article.title };
  if (!hasStoredBody(article)) return { ...t, status: "no-r2" };
  const manifest = await readManifest(article, stores.archive);
  const draftBytes = await stores.body.get(`${article.r2Path}/draft.md`);
  if (!draftBytes) return { ...t, status: "no-r2" };
  const draft = draftBytes.toString("utf8");

  const charts = chartImages(manifest.files.map((f) => f.name));
  if (!charts.length) return { ...t, status: "no-chart" };

  // rankingKey 候補: slug 由来 + 本文リンク
  const slugKey = t.slug.replace(/^[Aa]-/, "");
  const linkKeys = [...draft.matchAll(/stats47\.jp\/ranking\/([a-z0-9-]+)/g)].map((m) => m[1]);
  const candidates = [slugKey, ...linkKeys].filter((k, i, a) => known.has(k) && a.indexOf(k) === i);
  if (!candidates.length) return { ...t, status: "ambiguous", reason: "rankingKey 未解決", charts };

  const year = parseYear(t.title, draft);
  const cited = parseCited(draft);

  // 候補を値照合で確定 (rank1 の県名一致を優先)
  let best = null;
  for (const key of candidates) {
    const values = await fetchValues(key);
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
  const bytes = Buffer.from(JSON.stringify(provenance, null, 2) + "\n");
  const saved = manifest.files.find((f) => f.name === PROVENANCE_FILE);
  const output =
    saved?.sha256 === sha256(bytes)
      ? "unchanged"
      : (await placeInWorkingCopy(article, manifest, bytes, stores, root))
        ? "working-copy"
        : "local-modified";

  return {
    ...t,
    status: confirmed ? "confirmed" : "partial",
    output,
    rankingKey: best.key,
    year: best.year,
    charts,
    match: `${best.match1 ? "1位✓" : "1位✗"}/${best.match47 ? "47位✓" : "47位✗"}`,
  };
}

async function main() {
  const { default: dotenv } = await import("dotenv");
  dotenv.config({ path: join(ROOT, ".env.local"), quiet: true });
  const REPORT = join(process.env.SCRATCHPAD || tmpdir(), "note-provenance-backfill.json");

  const argv = process.argv.slice(2);
  const LIMIT = argv.includes("--limit") ? Number(argv[argv.indexOf("--limit") + 1]) : Infinity;
  const ONLY = argv.includes("--slug") ? argv[argv.indexOf("--slug") + 1].split(",") : null;

  // KNOWN ranking keys
  const knownSrc = readFileSync(join(ROOT, "packages/ranking/src/config/known-ranking-keys.ts"), "utf8");
  const known = new Set(
    [...knownSrc.slice(knownSrc.indexOf("new Set([")).matchAll(/"([a-z0-9-]{3,})"/g)].map((m) => m[1]),
  );

  // 対象: 記事台帳の stats47-note (本文を R2 に保存していない記事は no-r2 に数える)
  let targets = readArticleLedger(ROOT).articles.filter((a) => a.vertical === "stats47-note");
  if (ONLY) targets = targets.filter((a) => ONLY.includes(a.key));
  targets = targets.slice(0, LIMIT);

  const results = await pool(targets, 8, (article) =>
    backfillArticle(article, {
      stores: hasStoredBody(article) ? createArticleStores(article) : null,
      known,
      fetchValues: (key) => fetchJson(`${R2}/app/ranking/${key}/values.json`),
      root: ROOT,
    }),
  );

  const by = (s) => results.filter((r) => r.status === s);
  const placed = (output) => results.filter((r) => r.output === output);
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
    output: {
      "working-copy": placed("working-copy").length,
      unchanged: placed("unchanged").length,
      "local-modified": placed("local-modified").length,
    },
    ambiguous: by("ambiguous").map((r) => ({ slug: r.slug, reason: r.reason })),
    partial: by("partial").map((r) => ({ slug: r.slug, rankingKey: r.rankingKey, match: r.match })),
    results,
  };
  mkdirSync(dirname(REPORT), { recursive: true });
  writeFileSync(REPORT, JSON.stringify(report, null, 2) + "\n");

  console.log("=== note data-provenance backfill ===");
  console.log(`対象: ${report.total} 件 (記事台帳の stats47-note)`);
  console.log(`  confirmed (rank1+47 一致): ${report.counts.confirmed}`);
  console.log(`  partial   (一部一致):       ${report.counts.partial}`);
  console.log(`  ambiguous (要手当て):       ${report.counts.ambiguous}`);
  console.log(`  no-chart  (チャート無):     ${report.counts["no-chart"]}`);
  console.log(`  no-r2     (R2 に本文なし):  ${report.counts["no-r2"]}`);
  console.log(`\n作業コピーへ置いた: ${report.output["working-copy"]} 件 / 保存済みと同じ: ${report.output.unchanged} 件 / 未保存の変更があり置かなかった: ${report.output["local-modified"]} 件`);
  const keysOf = (status) => placed("working-copy").filter((r) => r.status === status).map((r) => r.slug);
  if (keysOf("confirmed").length) console.log(`保存: npm run note:article -- save ${keysOf("confirmed").join(" ")}`);
  if (keysOf("partial").length) console.log(`一部一致 (作業コピーを目視してから save。捨てるなら checkout --force): ${keysOf("partial").join(" ")}`);
  console.log(`report:  ${REPORT}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
