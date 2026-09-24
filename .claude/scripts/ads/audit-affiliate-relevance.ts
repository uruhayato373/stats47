#!/usr/bin/env npx tsx
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SITEMAP_BLOG_ENTRIES } from "../../../apps/web/src/config/sitemap-blog-entries";
import {
  AFFILIATE_VERTICALS,
  resolveContentVertical,
  SURVEY_AFFILIATE_MAP,
  TAG_AFFILIATE_MAP,
} from "../../../apps/web/src/features/ads/constants/affiliate-category";
import {
  applyBlogAffiliatePolicy,
  BLOG_AFFILIATE_POLICY,
  isRegionalFoodCultureTitle,
  resolveBlogBannerInput,
} from "../../../apps/web/src/features/ads/constants/blog-affiliate-policy";

import {
  auditBlogAffiliatePolicyCatalog,
  auditBlogAffiliateRelevance,
} from "./lib/affiliate-relevance-core.mjs";

const args = new Set(process.argv.slice(2));
const live = args.has("--live");
const check = args.has("--check");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const statePath = path.join(root, ".claude/state/ads/relevance-latest.json");

async function main() {
  const catalogErrors = auditBlogAffiliatePolicyCatalog(
    BLOG_AFFILIATE_POLICY,
    SITEMAP_BLOG_ENTRIES.map((entry) => entry.slug),
    AFFILIATE_VERTICALS,
  );

  if (catalogErrors.length > 0) {
    for (const error of catalogErrors) console.error(`- ❌ ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`✅ blog affiliate policy: ${Object.keys(BLOG_AFFILIATE_POLICY).length}件、構造違反なし`);
  }

  if (live) {
    const base = process.env.R2_PUBLIC_FETCH_URL ?? process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "https://storage.stats47.jp";
    const response = await fetch(`${base.replace(/\/$/, "")}/app/blog/all.json`);
    if (!response.ok) throw new Error(`blog snapshot fetch failed: HTTP ${response.status}`);
    const snapshot = await response.json() as { articles?: unknown[] };
    const result = auditBlogAffiliateRelevance({
      articles: snapshot.articles ?? [],
      policies: BLOG_AFFILIATE_POLICY,
      surveyMap: SURVEY_AFFILIATE_MAP,
      tagMap: TAG_AFFILIATE_MAP,
    });
    const resolvedCounts = result.rows.reduce<Record<string, number>>((counts, row) => {
      const key = row.effectiveVertical ?? "none";
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {});
    const explicitPolicies = result.rows.filter((row: { source: string }) => row.source === "explicit");
    const bannerPolicy = auditBannerPolicy(snapshot.articles ?? []);
    if (bannerPolicy.violations.length > 0) {
      for (const slug of bannerPolicy.violations) {
        console.error(`- ❌ ${slug}: 出典調査だけで furusato の非地域記事に A8 バナーが残る`);
      }
      process.exitCode = 1;
    }
    const state = {
      generatedAt: new Date().toISOString(),
      articleCount: result.rows.length,
      explicitPolicyCount: explicitPolicies.length,
      reviewFindingCount: result.findings.length,
      resolvedCounts,
      bannerPolicy,
      explicitPolicies,
      findings: result.findings,
    };
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
    console.log(`ℹ️ 関連性レビュー候補: ${state.reviewFindingCount}件 / ${state.articleCount}記事`);
    console.log(
      `ℹ️ A8 バナー: 出典調査だけで furusato ${bannerPolicy.surveyFurusato}件 → 抑止 ${bannerPolicy.suppressed} / ` +
        `地域の食卓・特産品で維持 ${bannerPolicy.keptRegional} / 違反 ${bannerPolicy.violations.length}`,
    );
    console.log(`ℹ️ state: ${path.relative(root, statePath)}`);
  }

  if (check && process.exitCode) process.exit(process.exitCode);
}

/**
 * 全公開記事について、ページ (`apps/web/src/app/blog/[slug]/page.tsx`) と同じ `resolveBlogBannerInput` で
 * A8 バナーの分野を出し、「出典調査だけで furusato になる非地域記事にはバナーを出さない」規則を確かめる。
 * 規則と実装がずれたり、SURVEY_AFFILIATE_MAP の変更で対象が増減したりしたことを週次で見えるようにする。
 */
function auditBannerPolicy(articles: unknown[]) {
  let surveyFurusato = 0;
  let suppressed = 0;
  let keptRegional = 0;
  const violations: string[] = [];
  for (const raw of articles) {
    const article = raw as { slug?: string; title?: string; published?: boolean; surveyIds?: string[]; tags?: Array<{ tagKey: string }> };
    if (!article.slug || article.published === false) continue;
    const input = { surveyIds: article.surveyIds ?? [], tagKeys: (article.tags ?? []).map((tag) => tag.tagKey) };
    const base = resolveContentVertical(applyBlogAffiliatePolicy(article.slug, input));
    if (base.source !== "survey" || base.vertical !== "furusato") continue;
    surveyFurusato += 1;
    const banner = resolveContentVertical(resolveBlogBannerInput(article.slug, input, { title: article.title ?? "" }));
    const regional = isRegionalFoodCultureTitle(article.title ?? "");
    if (regional) keptRegional += 1;
    else if (banner.vertical === null) suppressed += 1;
    else violations.push(article.slug);
  }
  return { surveyFurusato, suppressed, keptRegional, violations };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
