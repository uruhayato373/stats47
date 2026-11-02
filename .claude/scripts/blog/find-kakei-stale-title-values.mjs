#!/usr/bin/env node
/**
 * 家計調査に紐づく公開ブログのうち、題 (title / seoTitle) の「県名 + 数値」が最新年ではなく過去の年の値と
 * 一致する記事を一覧する。家計調査の年次値を 2025 年へ更新したあとも、題に 2024 年の値が残っていた (2026-11-02 実測 138 本)。
 *
 *   node .claude/scripts/blog/find-kakei-stale-title-values.mjs          # 表を出す
 *   node .claude/scripts/blog/find-kakei-stale-title-values.mjs --json   # JSON で出す
 *
 * 入力: R2 の app/blog/all.json (rankingArticleIndex) と各ランキングの app/ranking/<key>/values.json、
 * 家計調査の指標の集合は台帳 data/estat/kakei-ledger/ledger.json。read-only (公開 URL を読むだけ)。
 * 数値は県名と同じ題に並ぶものだけを照合するので、県名を書かない題の数値や 3 年平均の値は拾わない (一覧は下限)。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { datasetPath } from "../../../config/datasets.mjs";
import { R2_PUBLIC_BASE_URL } from "../lib/site-config.cjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
/** 年 (1990〜2030) と 100 未満の数 (順位・倍率) は値として照合しない */
const MIN_VALUE = 100;
const YEAR_RANGE = [1990, 2030];

async function fetchJson(key) {
  const res = await fetch(`${R2_BASE}/${key}`);
  if (!res.ok) return null;
  return res.json();
}

const shortPrefName = (name) => name.replace(/(都|府|県)$/, "");

function titleNumbers(title) {
  return [...title.matchAll(/([0-9][0-9,]*(?:\.[0-9]+)?)/g)]
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => n >= MIN_VALUE && !(n >= YEAR_RANGE[0] && n <= YEAR_RANGE[1]));
}

async function main() {
  const asJson = process.argv.includes("--json");
  const ledger = JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, datasetPath("estat.kakei-ledger")), "utf8"));
  const kakeiKeys = new Set(ledger.tables.flatMap((t) => t.metrics));
  const blog = await fetchJson("app/blog/all.json");
  if (!blog) throw new Error("app/blog/all.json を読めない");
  const bySlug = new Map(blog.articles.map((a) => [a.slug, a]));

  const found = new Map();
  for (const [key, slugs] of Object.entries(blog.rankingArticleIndex ?? {})) {
    if (!kakeiKeys.has(key)) continue;
    const candidates = slugs.map((slug) => bySlug.get(slug)).filter(Boolean);
    if (!candidates.some((a) => titleNumbers(`${a.title} ${a.seoTitle ?? ""}`).length)) continue;
    const values = await fetchJson(`app/ranking/${key}/values.json`);
    if (!values?.partitions?.length) continue;
    const latest = values.partitions.map((p) => p.yearCode).sort().at(-1);
    for (const article of candidates) {
      const title = `${article.title} ${article.seoTitle ?? ""}`;
      for (const n of titleNumbers(title)) {
        const hits = values.partitions.flatMap((p) =>
          p.values
            .filter((v) => Math.round(v.value) === Math.round(n) && title.includes(shortPrefName(v.areaName)))
            .map((v) => ({ area: v.areaName, year: p.yearCode })),
        );
        if (!hits.length || hits.some((h) => h.year === latest)) continue;
        const id = `${article.slug}:${n}`;
        if (!found.has(id)) {
          found.set(id, { slug: article.slug, rankingKey: key, latestYear: latest, value: n, matched: hits.map((h) => `${h.area}${h.year}`).join("/"), title: article.title });
        }
      }
    }
  }

  const rows = [...found.values()];
  if (asJson) {
    console.log(JSON.stringify(rows, null, 1));
  } else {
    for (const r of rows) console.log(`${r.slug}\t${r.value}\t${r.matched} (最新 ${r.latestYear})\t${r.title}`);
  }
  console.error(`旧年の値が題に残る記事: ${new Set(rows.map((r) => r.slug)).size} 本 (数値 ${rows.length} 件)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
