/**
 * Blog snapshot exporter (完全DBレス: docs/01_技術設計/02_データアーキテクチャ.md)
 *
 * 記事メタの SSOT は R2 `app/blog/<slug>/article.{md,mdx}` の YAML frontmatter。
 * D1 articles テーブルは廃止したため、frontmatter を直接読んで `app/blog/all.json` を生成する。
 *
 * published 判定 (重要): 古い記事は frontmatter に `published` を持たず publishedAt のみでライブな
 * ため、frontmatter だけからは published を完全復元できない (旧 D1 が sticky 状態を保持していた)。
 * よって旧 sync-articles-from-r2 と同じ **sticky 方式**: frontmatter の `published` boolean が
 * 最優先、無ければ配信中 all.json の状態を保持、初回生成時のみ publishedAt の有無で推定。
 * 全記事集合も「配信中 all.json ∪ ローカル」の和でローカルミラー欠落分を取りこぼさない。
 * title/seoTitle/description/tags 等は常に現行 frontmatter で refresh (brushup 反映)。
 *
 * 使用方法:
 *   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' npx tsx scripts/export-blog-snapshot.ts
 *   → 公開 URL から read。list 不可なので slug は committed seed (packages/database/seed/articles.json) から列挙
 */

import fs from 'fs';
import path from 'path';

import {
  fetchFromR2AsJson,
  fetchFromR2AsString,
  listFromR2,
  saveToR2,
} from '@stats47/r2-storage/server';
import dotenv from 'dotenv';
import yaml from 'js-yaml';

import { GONE_BLOG_SLUGS } from '../src/config/gone-blog-slugs';
import { blogPublicationContract } from '../../../packages/r2-storage/src/scripts/lib/blog-publication-guard';

import { resolveArticleSurveyIds } from '../src/features/blog/services/article-survey-taxonomy';
import {
  BLOG_SNAPSHOT_KEY,
  buildSurveyArticleIndex,
  type BlogSnapshot,
  type SnapshotArticle,
  type SnapshotTagMeta,
} from '../src/features/blog/types/snapshot';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const BLOG_PREFIX = 'app/blog/';

interface Frontmatter {
  title?: string;
  seoTitle?: string;
  description?: string;
  tags?: unknown;
  publishedAt?: unknown;
  updatedAt?: unknown;
  published?: boolean;
  ogImage?: string;
  [key: string]: unknown;
}

function parseFrontmatter(content: string): Frontmatter {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  try {
    return (yaml.load(match[1]) as Frontmatter) ?? {};
  } catch {
    return {};
  }
}

function normalizeDate(v: unknown): string | null {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (v && /^\d{4}-\d{2}-\d{2}/.test(String(v))) return String(v).slice(0, 10);
  return null;
}

interface SlugInfo {
  ext: 'md' | 'mdx' | null;
  hasCharts: boolean;
}

/** committed seed (frontmatter から再構成済) の最小形 */
interface ArticleSeedRow {
  slug: string;
  format?: string;
  has_charts?: number | boolean;
}

/**
 * slug → {ext, hasCharts} を列挙する。
 *  1. R2 list (ローカル FS / S3) — data/*.json まで見て hasCharts を実測
 *  2. 不可なら committed seed (packages/database/seed/articles.json) から列挙
 *     (公開URL専用環境。format/has_charts は seed 値を採用)
 */
function collectSlugInfoFromSeed(): Map<string, SlugInfo> {
  const seedPath = path.resolve(
    __dirname,
    '../../../packages/database/seed/articles.json'
  );
  const seed = JSON.parse(
    fs.readFileSync(seedPath, 'utf8')
  ) as ArticleSeedRow[];
  const map = new Map<string, SlugInfo>();
  for (const row of seed) {
    const ext = row.format === 'mdx' ? 'mdx' : 'md';
    map.set(row.slug, { ext, hasCharts: !!row.has_charts });
  }
  return map;
}

async function collectSlugInfo(): Promise<Map<string, SlugInfo>> {
  try {
    const keys = await listFromR2(BLOG_PREFIX);
    if (keys.length > 0) {
      const slugInfo = new Map<string, SlugInfo>();
      for (const key of keys) {
        const rest = key.slice(BLOG_PREFIX.length); // <slug>/...
        const slash = rest.indexOf('/');
        if (slash < 0) continue;
        const slug = rest.slice(0, slash);
        const file = rest.slice(slash + 1);
        const info = slugInfo.get(slug) ?? { ext: null, hasCharts: false };
        if (file === 'article.mdx') info.ext = 'mdx';
        else if (file === 'article.md' && info.ext !== 'mdx') info.ext = 'md';
        if (file.startsWith('data/') && file.endsWith('.json'))
          info.hasCharts = true;
        slugInfo.set(slug, info);
      }
      return slugInfo;
    }
  } catch {
    // R2 list 不可 (公開URL専用環境) → seed 列挙へ
  }
  console.log(
    'ℹ️  R2 list 不可。committed seed (articles.json) から slug を列挙します'
  );
  return collectSlugInfoFromSeed();
}

function hasValidPublishedAt(v: unknown): boolean {
  if (v instanceof Date) return true;
  return !!v && /^\d{4}-\d{2}-\d{2}/.test(String(v));
}

async function main() {
  // 配信中の all.json = published 状態の真実源 (旧 D1 articles の sticky 状態のブリッジ)。
  // 古い記事は frontmatter に `published` を持たず publishedAt のみでライブなので、
  // frontmatter だけからは published を完全復元できない。旧 sync-articles-from-r2 と同じく
  // 「frontmatter の published 明示が最優先、無ければ配信中の状態を保持」する sticky 方式にする。
  //
  // 運用注意: prior は「配信中 (cloud) の all.json」が真。R2_PUBLIC_FETCH_URL を設定して
  // cloud を読ませること (公開 URL 経由が標準)。
  const prior = await fetchFromR2AsJson<BlogSnapshot>(BLOG_SNAPSHOT_KEY);
  const priorBySlug = new Map<string, SnapshotArticle>(
    (prior?.articles ?? []).map((a) => [a.slug, a])
  );

  const slugInfo = await collectSlugInfo();

  // 全 slug = 配信中 all.json ∪ ローカル (article.md を持つもの)。
  // 配信側にしか無い記事 (ローカルミラー欠落分) も拾う。
  const allSlugs = new Set<string>([
    ...priorBySlug.keys(),
    ...[...slugInfo.entries()]
      .filter(([, v]) => v.ext !== null)
      .map(([s]) => s),
  ]);
  // 旧本文・sticky prior・seed が残っていても終了記事を再掲載しない。
  const slugs = [...allSlugs].filter((slug) => !GONE_BLOG_SLUGS.has(slug)).sort();
  console.log(
    `📄 対象記事: ${slugs.length} 件 (配信 ${priorBySlug.size} ∪ ローカル ${slugInfo.size})`
  );

  const articles: SnapshotArticle[] = [];
  for (const slug of slugs) {
    const info = slugInfo.get(slug);
    const prev = priorBySlug.get(slug);
    const ext: 'md' | 'mdx' =
      info?.ext ?? (prev?.format === 'mdx' ? 'mdx' : 'md');
    const content = await fetchFromR2AsString(
      `${BLOG_PREFIX}${slug}/article.${ext}`
    );
    if (content === null) {
      // 本文を取得できない場合は配信中エントリをそのまま保持 (記事を消さない)
      if (prev) {
        articles.push(prev);
      } else {
        console.warn(`⚠️  本文を読めず配信エントリも無いためスキップ: ${slug}`);
      }
      continue;
    }
    const fm = parseFrontmatter(content);
    const tags = (Array.isArray(fm.tags) ? (fm.tags as string[]) : []).map(
      (tagKey) => ({ tagKey: String(tagKey) })
    );
    // sticky: frontmatter の boolean が最優先 → 配信状態 → (初回生成時のみ) publishedAt 推定
    const published =
      typeof fm.published === 'boolean'
        ? fm.published
        : prev
          ? prev.published
          : hasValidPublishedAt(fm.publishedAt);
    const surveyIds = published
      ? await resolveArticleSurveyIds({ slug, content })
      : [];
    articles.push({
      slug,
      title: fm.title ?? slug,
      seoTitle: fm.seoTitle ?? null,
      description: fm.description ?? null,
      filePath: `blog/${slug}/article.${ext}`,
      format: ext,
      hasCharts: info?.hasCharts ?? prev?.hasCharts ?? false,
      published,
      publishedAt: normalizeDate(fm.publishedAt),
      ogImageType:
        typeof fm.ogImage === 'string' ? 'static' : (prev?.ogImageType ?? null),
      proofreadAt: prev?.proofreadAt ?? null,
      createdAt: prev?.createdAt ?? null,
      updatedAt: normalizeDate(fm.updatedAt) ?? prev?.updatedAt ?? null,
      tags,
      surveyIds,
    });
  }

  const tagMetaCounter = new Map<string, number>();
  for (const a of articles) {
    if (!a.published) continue;
    for (const t of a.tags) {
      tagMetaCounter.set(t.tagKey, (tagMetaCounter.get(t.tagKey) ?? 0) + 1);
    }
  }
  const tagMeta: SnapshotTagMeta[] = [...tagMetaCounter.entries()]
    .map(([tagKey, articleCount]) => ({ tagKey, articleCount }))
    .sort((a, b) => b.articleCount - a.articleCount);

  const snapshot: BlogSnapshot = {
    publication: blogPublicationContract(prior),
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    articles,
    tagMeta,
    surveyArticleIndex: buildSurveyArticleIndex(articles),
  };

  const body = JSON.stringify(snapshot);
  const result = await saveToR2(BLOG_SNAPSHOT_KEY, body, {
    contentType: 'application/json; charset=utf-8',
  });

  const publishedCount = articles.filter((a) => a.published).length;
  console.log(
    `✅ blog snapshot: articles=${snapshot.articles.length} published=${publishedCount} tags=${snapshot.tagMeta.length} bytes=${result.size} key=${result.key}`
  );
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
