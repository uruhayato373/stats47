#!/usr/bin/env node
/**
 * build-stale-data-years.mjs — 図に描いた年が指標の最新年より古い公開記事の一覧を作る。
 *
 * ブログの図と本文は書いた時点の年のまま固定されるので、取り込みで新しい年が増えると記事だけが古くなる
 * (本文中の source-link カードは最新年を出すので、1 本の記事に 2 つの年が並ぶ)。blog snapshot の
 * `rankingRefs` (記事が使う指標と図の年。export-blog-snapshot.ts が焼く) と ranking item の `latestYear` を
 * 突き合わせ、データを取り直す候補を出す。判定は lib/stale-data-years.mjs。
 *
 * 是正キュー (build-remediation-queue.mjs) がこの一覧を読み、該当記事を data-refresh レーンに入れる。
 * 取り直しは refresh-article-data-years.mjs (図の data JSON・source.json・SVG を最新年で作り直す) →
 * 本文の年と数値の書き直し → critic (/brushup-blog の focus 最新データ更新)。
 * source.json に yearPinnedReason がある図 (意図して過去の年を描いた図) は年を持たないので一覧に出ない。
 *
 *   node .claude/scripts/blog/build-stale-data-years.mjs
 *
 * 出力: data/blog/stale-data-years.json (全件) / data/blog/stale-data-years.md (上位の一覧)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { datasetDir } from "../../../config/datasets.mjs";
import { R2_PUBLIC_BASE_URL } from "../lib/site-config.cjs";
import { findStaleDataYears } from "./lib/stale-data-years.mjs";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const OUT_DIR = path.join(PROJECT_ROOT, datasetDir("blog.operations"));
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const REPORT_ROWS = 50;

async function getJson(key) {
  const res = await fetch(`${R2}/${key}?cb=${Date.now()}`);
  if (!res.ok) throw new Error(`${key} を取得できない (HTTP ${res.status})`);
  return res.json();
}

async function main() {
  const [blog, items] = await Promise.all([getJson("app/blog/all.json"), getJson("app/ranking-items/all.json")]);
  const latest = new Map(
    (items.items ?? [])
      .filter((it) => it.areaType === "prefecture" && it.latestYear?.yearCode)
      .map((it) => [it.rankingKey, String(it.latestYear.yearCode)]),
  );
  const published = (blog.articles ?? []).filter((a) => a.published === true);
  const withRefs = published.filter((a) => (a.rankingRefs ?? []).length > 0).length;
  const stale = findStaleDataYears(published, latest);

  const generatedAt = new Date().toISOString();
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(OUT_DIR, "stale-data-years.json"),
    `${JSON.stringify({ generatedAt, published: published.length, withRankingRefs: withRefs, stale }, null, 2)}\n`,
  );
  const md = [
    "# 図の年が古い公開記事 (stale-data-years)",
    "",
    `- 生成: ${generatedAt}`,
    `- 公開記事 ${published.length} 件のうち、使う指標を snapshot から読めた記事 ${withRefs} 件を判定` +
      (withRefs === 0 ? " (blog snapshot に rankingRefs がまだ無い。次の sync-snapshots の blog task で入る)" : ""),
    `- 図の年が指標の最新年より古い記事: **${stale.length} 件**。遅れの大きい順`,
    "- 直し方: `node .claude/scripts/blog/refresh-article-data-years.mjs --slug <slug> --pull --apply` で図を最新年で作り直す → 本文の年と数値を書き直して critic を通す (`/brushup-blog` の focus `最新データ更新`)。意図して古い年を描いた図は取り直さず source.json に `yearPinnedReason` を書く",
    "",
    ...(stale.length === 0
      ? ["なし"]
      : [
          "| 記事 | 指標 (図の年 → 最新年) |",
          "|---|---|",
          ...stale
            .slice(0, REPORT_ROWS)
            .map((s) => `| \`${s.slug}\` | ${s.stale.map((x) => `\`${x.rankingKey}\` ${x.articleYear} → ${x.latestYear}`).join("<br>")} |`),
          ...(stale.length > REPORT_ROWS ? ["", `ほか ${stale.length - REPORT_ROWS} 件 (全件は stale-data-years.json)`] : []),
        ]),
    "",
  ].join("\n");
  fs.writeFileSync(path.join(OUT_DIR, "stale-data-years.md"), md);
  console.log(`図の年が古い公開記事: ${stale.length} 件 (判定できた記事 ${withRefs} / 公開 ${published.length})`);
}

main().catch((e) => {
  console.error(`::error::[build-stale-data-years] ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
