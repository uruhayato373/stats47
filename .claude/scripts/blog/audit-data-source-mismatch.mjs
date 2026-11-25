#!/usr/bin/env node
/**
 * audit-data-source-mismatch.mjs — 公開中のブログ記事の `<data-source>` タグを、データから導出した出典と突き合わせる
 * (CHART-SOURCE-DERIVE-01 の ①)。読み取りだけで、R2 にもリポジトリにも書かない。
 *
 *   node .claude/scripts/blog/audit-data-source-mismatch.mjs                  # 件数を出す
 *   node .claude/scripts/blog/audit-data-source-mismatch.mjs --tsv <path>     # 全件を TSV に書く
 *   node .claude/scripts/blog/audit-data-source-mismatch.mjs --no-head        # リンクの到達確認を省く
 *
 * 入力 (公開 R2): app/blog/all.json (記事ごとの導出済み sources)・app/blog/<slug>/article.md・
 *                 app/blog/<slug>/data/<base>.source.json。
 * 食い違い・リンク切れの定義と限界は packages/ops/src/blog/lint/data-source-mismatch.mjs の冒頭。
 * 外部ホストへの HEAD は 1 ホストあたり同時 2 本まで。
 */
import fs from "node:fs";

import {
  articleSourceReferences,
  checkUrlsPerHost,
  compareTagToDerived,
  extractDataSourceTags,
  figureSourceReferences,
} from "../../../packages/ops/src/blog/lint/data-source-mismatch.mjs";
import { R2_PUBLIC_BASE_URL } from "../../../packages/types/mirror/site-config.cjs";

const BASE = (process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL).replace(/\/+$/, "");
const FETCH_CONCURRENCY = 8;
const HEAD_TIMEOUT_MS = 15000;
const args = process.argv.slice(2);
const optionValue = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const TSV_PATH = optionValue("--tsv");
const SKIP_HEAD = args.includes("--no-head");

async function getText(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) return null;
  return res.text();
}

async function pool(items, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(FETCH_CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

async function headStatus(url) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(HEAD_TIMEOUT_MS) });
    return res.status;
  } catch {
    return 0;
  }
}

const all = JSON.parse((await getText(`${BASE}/app/blog/all.json`)) ?? "null");
if (!all?.articles) {
  console.error("all.json を読めない");
  process.exit(1);
}
const published = all.articles.filter((a) => a.published !== false);

const perArticle = await pool(published, async (article) => {
  const md = await getText(`${BASE}/app/blog/${article.slug}/article.md`);
  const tags = md ? extractDataSourceTags(md) : [];
  if (tags.length === 0) return { article, tags: [], figureRefs: new Map() };
  const bases = [...new Set(tags.map((t) => t.figureBase).filter(Boolean))];
  const figureRefs = new Map();
  for (const base of bases) {
    const text = await getText(`${BASE}/app/blog/${article.slug}/data/${base}.source.json`);
    let json = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = null;
    }
    figureRefs.set(base, { exists: json !== null, refs: figureSourceReferences(json) });
  }
  return { article, tags, figureRefs };
});

const rows = [];
for (const { article, tags, figureRefs } of perArticle) {
  const articleRefs = articleSourceReferences(article.sources);
  for (const tag of tags) {
    const figure = tag.figureBase ? figureRefs.get(tag.figureBase) : undefined;
    const problems = compareTagToDerived(tag, figure?.refs ?? { labels: [], urls: [] }, articleRefs);
    if (tag.figureBase && figure && !figure.exists) problems.push("FIGURE_SOURCE_JSON_MISSING");
    rows.push({ slug: article.slug, line: tag.line, figure: tag.figureBase ?? "", label: tag.label, url: tag.url, problems, status: "" });
  }
}

if (!SKIP_HEAD) {
  const statuses = await checkUrlsPerHost(rows.map((r) => r.url).filter(Boolean), headStatus, 2);
  for (const row of rows) {
    if (!row.url) continue;
    const status = statuses.get(row.url);
    row.status = status === undefined ? "" : String(status);
    if (status !== undefined && status !== 200) row.problems.push("BROKEN_LINK");
  }
}

const count = (p) => rows.filter((r) => r.problems.includes(p)).length;
const flagged = rows.filter((r) => r.problems.length > 0);
if (TSV_PATH) {
  const header = ["slug", "line", "figure", "label", "url", "head_status", "problems"].join("\t");
  const body = flagged.map((r) => [r.slug, r.line, r.figure, r.label, r.url, r.status, r.problems.join(",")].join("\t"));
  fs.writeFileSync(TSV_PATH, `${[header, ...body].join("\n")}\n`);
}
console.log(
  `data-source タグ ${rows.length} 件 (記事 ${perArticle.filter((p) => p.tags.length > 0).length} 本 / 公開 ${published.length} 本) / 指摘あり ${flagged.length} 件` +
    ` — LABEL_MISMATCH ${count("LABEL_MISMATCH")} / URL_MISMATCH ${count("URL_MISMATCH")} / NO_DERIVED_SOURCE ${count("NO_DERIVED_SOURCE")}` +
    ` / FIGURE_SOURCE_JSON_MISSING ${count("FIGURE_SOURCE_JSON_MISSING")} / BROKEN_LINK ${count("BROKEN_LINK")}${SKIP_HEAD ? " (到達確認は省略)" : ""}`,
);
