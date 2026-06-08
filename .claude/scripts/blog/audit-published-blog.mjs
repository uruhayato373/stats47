#!/usr/bin/env node
/**
 * audit-published-blog.mjs — 公開済みブログ全記事の表現品質を一括棚卸し (cloud 可)
 *
 * 既存の audit-article-structure / audit-chart-quality / quality-gate はローカル FS
 * (.local/r2 or docs/21) 前提で、クラウド環境からは全公開記事を見られない。本スクリプトは
 * R2 公開 URL (https://storage.stats47.jp) から all.json + 各 article.md を取得し、
 * quality-gate と同じ【決定的な表現チェック】を全 published 記事へ適用して棚卸し表を出す。
 *
 * これは「機械的フロア」層 (品質判定ではない)。意味的品質は blog-critic が別途判断する。
 *
 * 使い方:
 *   node .claude/scripts/blog/audit-published-blog.mjs            # 全 published を監査
 *   node .claude/scripts/blog/audit-published-blog.mjs --json /tmp/out.json
 *   node .claude/scripts/blog/audit-published-blog.mjs --limit 20 # 先頭 20 件だけ (動作確認)
 *
 * 出力: 違反の多い順にソートした markdown 表 (stdout) + 詳細 JSON (--json で指定 or /tmp)
 */
import fs from "node:fs";

const BASE_URL = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";
const CONCURRENCY = 8;

function getArg(name, def) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const LIMIT = Number(getArg("--limit", "0")) || 0;
const JSON_OUT = getArg("--json", "/tmp/published-blog-audit.json");

async function fetchText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

// ── quality-gate と同じ決定的チェック (純テキスト部分のみ移植) ──────────────
const NG_TRUNCATED = /^\s*\|\s*(…|⋯|\.\.\.)\s*\|/m; // 省略行を含む部分複製表

function countCallouts(t) {
  return (t.match(/^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]/gim) || []).length;
}
function countInternalLinks(t) {
  // /ranking /areas /blog /category /themes /survey への相対リンク + source-link
  const md = (t.match(/\]\((\/(ranking|areas|blog|category|themes|survey)[^)]*)\)/g) || []).length;
  const sl = (t.match(/<source-link\s+href=/gi) || []).length;
  return md + sl;
}
function countSvg(t) {
  return (t.match(/!\[[^\]]*\]\([^)]*\.svg\)/g) || []).length + (t.match(/\.svg/g) || []).length > 0
    ? (t.match(/\.svg/g) || []).length
    : 0;
}
function countH2(t) {
  return (t.match(/^##\s+/gm) || []).length;
}
// prose (地の文) 文字数: frontmatter / 表 / 画像 / タグ / 見出し記号 / 引用記号 / code を除外
function proseCharCount(t) {
  let s = t.replace(/^---[\s\S]*?\n---\n/, ""); // frontmatter
  s = s.replace(/```[\s\S]*?```/g, ""); // code fence
  s = s.replace(/^\s*\|.*\|\s*$/gm, ""); // table rows
  s = s.replace(/!\[[^\]]*\]\([^)]*\)/g, ""); // images
  s = s.replace(/<[^>]+>/g, ""); // html tags (source-link etc)
  s = s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1"); // links → keep text
  s = s.replace(/^[#>\s-]+/gm, ""); // heading / quote markers
  s = s.replace(/[*_`~]/g, "");
  return s.replace(/\s/g, "").length;
}

// ── 文体チェック (2026-06-08: quality-gate.mjs とパリティ) ─────────────────
// 本文は ですます調 に統一する (正典: blog-quality-standards.md「文体」)。である調
// (である。/だ。/だった。/ではない。/だろう。/のだ。 等の plain copula 文末) を検出。
// 地の文のみ対象。callout/引用 (> 行)・見出し・表・コード・タグ・frontmatter は除外。
// これが無いと是正キューが文体違反を拾えず、である調記事が永遠に修正対象に載らない。
function getProseForTone(text) {
  let t = text.replace(/^---[\s\S]*?\n---\n/, ""); // frontmatter
  t = t.replace(/```[\s\S]*?```/g, ""); // code fence
  t = t.replace(/<[^>]+>[\s\S]*?<\/[^>]+>/g, ""); // ペアタグ
  t = t.replace(/<[^>]+>/g, ""); // 単独タグ
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, ""); // 画像
  t = t
    .split("\n")
    .filter((l) => !/^\s*\|/.test(l)) // 表行
    .filter((l) => !/^\s*>/.test(l)) // callout / blockquote
    .filter((l) => !/^\s*#{1,6}\s/.test(l)) // 見出し
    .join("\n");
  t = t.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1"); // リンク→テキスト
  return t;
}
const DEARU_ENDINGS = [
  /である[。、]/g,
  /であった[。、]/g,
  /だった[。、]/g,
  /ではない。/g, // 文末のみ。「ではなく、」「ではない、」等の連用中止は ですます と両立するため除外 (誤検知防止)
  /だろう[。、]/g,
  /のだ[。、]/g,
  /のである[。、]/g,
  /(?<![んでぐ])だ。/g, // 「だ。」終止 (んだ。/口語の ぐだ 等は除外)
];
function countDearuEndings(text) {
  const prose = getProseForTone(text);
  let n = 0;
  const samples = [];
  for (const p of DEARU_ENDINGS) {
    const m = prose.match(p) || [];
    n += m.length;
    if (m.length && samples.length < 4) samples.push(m[0]);
  }
  return { count: n, samples };
}

// ── 新規: ranking 表現の一貫性チェック (ユーザー指摘の核心) ────────────────
// 「順位」列を持つランキング表を検出。
function rankingTables(t) {
  const tables = [];
  const lines = t.split("\n");
  let cur = null;
  for (const ln of lines) {
    if (/^\s*\|.*\|\s*$/.test(ln)) {
      if (!cur) cur = [];
      cur.push(ln);
    } else if (cur) {
      tables.push(cur);
      cur = null;
    }
  }
  if (cur) tables.push(cur);
  // 順位列を持つ表だけ抽出し、行に現れる rank 数値の集合を返す
  return tables
    .filter((rows) => /順位|rank/i.test(rows[0] || ""))
    .map((rows) => {
      const ranks = [];
      for (const r of rows.slice(2)) {
        const m = r.match(/^\s*\|\s*(\d{1,2})\s*\|/);
        if (m) ranks.push(Number(m[1]));
      }
      return { rowCount: rows.length - 2, ranks, hasEllipsis: rows.some((r) => /\|\s*(…|⋯|\.\.\.)\s*\|/.test(r)) };
    });
}

function auditArticle(meta, body) {
  const flags = [];
  const sev = { blocker: 0, warning: 0 };

  if (NG_TRUNCATED.test(body)) {
    flags.push(["blocker", "truncated 表 (…省略の部分複製) — 全件 or SVG にすべき"]);
  }
  const callouts = countCallouts(body);
  if (callouts < 2) flags.push(["blocker", `callouts ${callouts}<2`]);
  const links = countInternalLinks(body);
  if (links < 3) flags.push(["blocker", `internalLinks ${links}<3`]);
  const h2 = countH2(body);
  if (h2 < 4) flags.push(["blocker", `H2 ${h2}<4`]);
  const prose = proseCharCount(body);
  if (prose < 1600) flags.push(["blocker", `prose ${prose}<1600 (薄い)`]);
  else if (prose < 2400) flags.push(["warning", `prose ${prose}<2400 (やや薄い)`]);
  const svg = countSvg(body);

  // 文体: ですます調統一 (である調 copula 文末を blocker。quality-gate.mjs とパリティ)。
  const dearu = countDearuEndings(body);
  if (dearu.count > 0) {
    flags.push([
      "blocker",
      `である調 文末 ${dearu.count}箇所 [${dearu.samples.join(",")}] — ですます調に統一 (である。→です。/だった。→でした。)`,
    ]);
  }

  // 図あたり prose 字数 (2026-06-06: quality-gate.mjs と一貫)。「図はあるが薄い」を弾く。
  // 比率には data 画像参照 (![](*.svg)) の正確な枚数を使う (countSvg の .svg 文字列カウントは過大)。
  const chartCount = (body.match(/!\[[^\]]*\]\([^)]*\.svg\)/g) || []).length;
  let prosePerChart = null;
  if (chartCount >= 1) {
    prosePerChart = Math.round(prose / chartCount);
    if (prosePerChart < 350) flags.push(["blocker", `prose/図 ${prosePerChart}<350 (図はあるが薄い)`]);
    else if (prosePerChart < 550) flags.push(["warning", `prose/図 ${prosePerChart}<550 (図あたりやや薄い)`]);
  }

  // ranking 表現の一貫性
  const rTables = rankingTables(body);
  const hasRankingTable = rTables.length > 0;
  if (hasRankingTable && svg === 0) {
    flags.push(["blocker", "ランキング表あり/チャート0 — 上位5+下位5 SVG に置換 (表だけ不可)"]);
  }
  // 上下非対称 (例 top10 + bottom3) を検出: rank 1 起点の連続数と 47 終点の連続数が違う
  for (const tb of rTables) {
    const rs = tb.ranks;
    if (rs.length < 4) continue;
    const topRun = rs.filter((r) => r <= 12).length;
    const bottomRun = rs.filter((r) => r >= 36).length;
    const gap = rs.some((r) => r > 12 && r < 36) === false && rs.length < 47;
    if (topRun >= 3 && bottomRun >= 1 && topRun !== bottomRun && gap) {
      flags.push(["blocker", `上下非対称ランキング表 (top${topRun}/bottom${bottomRun}) — 対称化 or SVG 化`]);
      break;
    }
  }
  // 表現の正典統一 (2026-06-02): chart-placeholder / インライン svg / 記事内関連セクション禁止
  if (/<chart-placeholder/.test(body)) {
    flags.push(["blocker", "chart-placeholder (未描画) — 生成画像 SVG に置換"]);
  }
  if (/<svg[\s>]/.test(body)) {
    flags.push(["blocker", "インライン <svg> — 生成画像 ![](data/*.svg) に統一"]);
  }
  if (/^#{2,3}\s*関連(ランキング|記事)/m.test(body)) {
    flags.push(["blocker", "記事内関連セクション — ページ側コンポーネントが正典 (記事から削除)"]);
  }

  // /ranking source-link の末尾集約 (2 個以上が末尾 1/4 に固まる)
  const slMatches = [...body.matchAll(/<source-link\s+href="(\/ranking\/[^"]+)"/gi)];
  if (slMatches.length >= 2) {
    const tailZone = body.length * 0.75;
    const tailCount = slMatches.filter((m) => m.index >= tailZone).length;
    if (tailCount >= 2) flags.push(["warning", `source-link 末尾集約 ${tailCount}個 — 各図直下へ分散`]);
  }

  for (const [s] of flags) sev[s]++;
  return {
    slug: meta.slug,
    publishedAt: meta.publishedAt,
    hasCharts: meta.hasCharts,
    prose,
    callouts,
    links,
    h2,
    svg,
    chartCount,
    prosePerChart,
    rankingTables: rTables.length,
    dearuEndings: dearu.count,
    blockers: sev.blocker,
    warnings: sev.warning,
    flags,
  };
}

async function mapLimit(items, n, fn) {
  const out = [];
  let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

async function main() {
  process.stderr.write(`Fetching all.json from ${BASE_URL} ...\n`);
  const all = JSON.parse(await fetchText(`${BASE_URL}/app/blog/all.json`));
  const arr = Array.isArray(all) ? all : all.articles || all.items || [];
  let published = arr.filter((a) => a.published === true || a.published === "true");
  if (LIMIT) published = published.slice(0, LIMIT);
  process.stderr.write(`Auditing ${published.length} published articles (concurrency ${CONCURRENCY}) ...\n`);

  let done = 0;
  const results = await mapLimit(published, CONCURRENCY, async (meta) => {
    try {
      const body = await fetchText(`${BASE_URL}/app/blog/${meta.slug}/article.md`);
      const r = auditArticle(meta, body);
      if (++done % 25 === 0) process.stderr.write(`  ${done}/${published.length}\n`);
      return r;
    } catch (e) {
      return { slug: meta.slug, error: String(e.message || e), blockers: -1, warnings: 0, flags: [] };
    }
  });

  results.sort((a, b) => b.blockers - a.blockers || b.warnings - a.warnings);
  fs.writeFileSync(JSON_OUT, JSON.stringify({ generatedAt: new Date().toISOString(), base: BASE_URL, total: results.length, results }, null, 2));

  const withBlocker = results.filter((r) => r.blockers > 0);
  const withWarn = results.filter((r) => r.blockers === 0 && r.warnings > 0);
  const clean = results.filter((r) => r.blockers === 0 && r.warnings === 0);
  const errored = results.filter((r) => r.blockers === -1);

  // 違反種別の集計
  const tally = {};
  for (const r of results) for (const [, name] of r.flags) {
    const key = name.split(" ")[0].split("(")[0];
    tally[key] = (tally[key] || 0) + 1;
  }

  console.log(`# 公開ブログ品質棚卸し (${results.length} 記事 / ${new Date().toISOString().slice(0, 10)})\n`);
  console.log(`- blocker あり: **${withBlocker.length}** / warning のみ: ${withWarn.length} / clean: ${clean.length} / 取得失敗: ${errored.length}`);
  console.log(`- 詳細 JSON: ${JSON_OUT}\n`);
  console.log(`## 違反種別 集計\n`);
  console.log(`| 違反 | 件数 |\n|---|---|`);
  for (const [k, v] of Object.entries(tally).sort((a, b) => b[1] - a[1])) console.log(`| ${k} | ${v} |`);
  console.log(`\n## blocker あり記事 (上位30)\n`);
  console.log(`| slug | B | W | prose | svg | rankTbl | 主な指摘 |\n|---|--|--|--|--|--|---|`);
  for (const r of withBlocker.slice(0, 30)) {
    const top = r.flags.filter((f) => f[0] === "blocker").map((f) => f[1]).slice(0, 2).join("; ");
    console.log(`| ${r.slug} | ${r.blockers} | ${r.warnings} | ${r.prose} | ${r.svg} | ${r.rankingTables} | ${top} |`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
