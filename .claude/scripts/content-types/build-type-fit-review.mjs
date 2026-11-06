#!/usr/bin/env node
/**
 * 公開ブログの本文と GSC のクリックから、型に合っていない記事の一覧を作り直す (npm run content-types:fit)。
 * 記事は読むだけで変えない。decisions は人が書く欄なので作り直しでも残す。
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { datasetDir, datasetPath } from "../../../config/datasets.mjs";
import { parseCsv, pathOfUrl } from "../issues/issue-graph-core.mjs";
import { classifyAll } from "./classify-core.mjs";
import { readClassifyInputs } from "./content-types-io.mjs";
import { isoWeekRange } from "../metrics/lib/periods.mjs";
import { findMergePairs, isObservable, proposeAction, publishedDateOf } from "./type-fit-core.mjs";

const { R2_PUBLIC_BASE_URL } = createRequire(import.meta.url)("../lib/site-config.cjs");
const ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const BASE = process.env.R2_PUBLIC_FETCH_URL ?? R2_PUBLIC_BASE_URL;
const OUT = join(ROOT, datasetPath("content.type-fit-review"));
const CONCURRENCY = 8;
const WEEKS = 4;

async function fetchBody(slug) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${BASE}/app/blog/${slug}/article.md`, { signal: AbortSignal.timeout(20000) });
      if (res.status === 404) return null;
      if (res.ok) return await res.text();
    } catch {
      // 一時的な失敗は下で再試行する
    }
  }
  throw new Error(`本文を取得できない: ${slug}`);
}

async function fetchAll(slugs) {
  const bodies = new Map();
  let next = 0;
  await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
    while (next < slugs.length) {
      const slug = slugs[next++];
      bodies.set(slug, await fetchBody(slug));
    }
  }));
  return bodies;
}

function readTraffic() {
  const dir = join(ROOT, datasetDir("gsc.snapshots"));
  const weeks = readdirSync(dir).filter((w) => /^\d{4}-W\d{2}$/.test(w)).sort().slice(-WEEKS);
  const traffic = new Map();
  for (const week of weeks) {
    const file = join(dir, week, "pages.csv");
    if (!existsSync(file)) continue;
    for (const row of parseCsv(readFileSync(file, "utf8"))) {
      const path = pathOfUrl(row.page ?? row.url ?? "");
      if (!path) continue;
      const t = traffic.get(path) ?? { clicks: 0, impressions: 0 };
      t.clicks += Number(row.clicks) || 0;
      t.impressions += Number(row.impressions) || 0;
      traffic.set(path, t);
    }
  }
  return { weeks, traffic };
}

const inputs = readClassifyInputs(ROOT);
const classified = classifyAll(inputs);
const blogs = inputs.pages.filter((p) => p.kind === "blog" && p.published);
const { weeks, traffic } = readTraffic();
if (traffic.size === 0) {
  console.error("✗ GSC の週次記録が読めず、クリックで判定できない");
  process.exit(2);
}
const gscEnd = isoWeekRange(weeks.at(-1)).sunday;
const bodies = await fetchAll(blogs.map((b) => b.key));
const articles = blogs.flatMap((b) => {
  const body = bodies.get(b.key);
  if (body == null) return [];
  const t = traffic.get(b.href) ?? { clicks: 0, impressions: 0 };
  return [{ id: b.id, slug: b.key, title: b.title, type: classified.get(b.id).type, body, rankingKeys: b.rankingKeys ?? [], observable: isObservable(publishedDateOf(body), gscEnd), answers: inputs.answerPages.has(b.id), ...t }];
});
const pairs = findMergePairs(articles);
const items = articles.flatMap((a) => {
  const action = proposeAction(a, pairs.get(a.id));
  return action ? [{ id: a.id, title: a.title, type: a.type, ...action, clicks: a.clicks, impressions: a.impressions }] : [];
});
const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : { decisions: [] };
const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
writeFileSync(OUT, `${JSON.stringify({
  version: 1,
  observedAt: today,
  gscWeeks: weeks,
  dataNote: "公開ブログの本文の信号と GSC のクリックから作る処置の案。items は作り直しで置き換わり、decisions は人が書いて残す。note の有料本文は読まない。",
  articlesRead: articles.length,
  articlesUnobserved: articles.filter((a) => !a.observable).length,
  items,
  decisions: previous.decisions,
}, null, 2)}\n`);
const count = (p) => items.filter((i) => i.proposal === p).length;
console.log(`読んだ記事 ${articles.length} / ${blogs.length} / 書き直し ${count("rewrite")} / 統合 ${count("merge")} / 撤去 ${count("retire")} (GSC ${weeks[0]}〜${weeks.at(-1)}、計測の足りない記事 ${articles.filter((a) => !a.observable).length} 本はクリックで判定しない)`);
