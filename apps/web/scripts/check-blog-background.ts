#!/usr/bin/env tsx
/**
 * 送り箱の記事に、今の内容に合う背景があるかを判定して JSON を 1 行出す (読み取り専用)。
 * quality-gate.mjs が push 前に呼ぶ。判定の規則は lib/blog-background-status.ts。
 *
 *   npx tsx apps/web/scripts/check-blog-background.ts --article contents/blog/<slug>/article.md
 *
 * R2 は公開 URL を読むだけで、書き込みも認証情報も使わない。
 */
import { readFileSync } from 'node:fs';
import { basename, dirname, join, relative } from 'node:path';
import { SITE } from '@stats47/types';
import {
  parseBlogArticleImageContext,
  resolveArticleBackgroundSource,
} from './lib/blog-article-background';
import {
  backgroundRecord,
  decideBlogBackgroundStatus,
} from './lib/blog-background-status';
import { resolveCodexBackgroundSource } from './lib/blog-codex-background-workflow';
import {
  computeLegacyPromptHashV1,
  computePromptHash,
  parseOgpVisualFrontmatter,
  resolveOgpVisual,
} from './lib/blog-ogp-visual';
import {
  deriveOgpFromFrontmatter,
  parseFrontmatter,
} from './lib/blog-thumbnail-render';

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, '../../..');
const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? SITE.r2PublicBaseUrl;
const FETCH_TIMEOUT_MS = 15_000;

async function readPublishedBackground(
  slug: string
): Promise<Record<string, unknown> | null | 'unavailable'> {
  for (const key of ['ogp/generation.json', 'ogp/ogp.json']) {
    try {
      const response = await fetch(`${PUBLIC_URL}/app/blog/${slug}/${key}`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (response.status === 404) continue;
      if (!response.ok) return 'unavailable';
      const background = backgroundRecord(await response.json());
      if (background) return background;
    } catch {
      return 'unavailable';
    }
  }
  return null;
}

async function main(): Promise<void> {
  const index = process.argv.indexOf('--article');
  const articleArg = index === -1 ? undefined : process.argv[index + 1];
  if (!articleArg) {
    console.error('usage: check-blog-background.ts --article <path/to/article.md>');
    process.exit(2);
  }
  const markdown = readFileSync(articleArg, 'utf8');
  const slug = basename(dirname(articleArg));
  const articlePath = relative(PROJECT_ROOT, articleArg) || articleArg;
  const derived = deriveOgpFromFrontmatter(parseFrontmatter(markdown));
  if (!derived) {
    console.log(JSON.stringify({ slug, kind: 'missing', ok: false, message: 'frontmatter の title がありません' }));
    return;
  }
  const visual = resolveOgpVisual(parseOgpVisualFrontmatter(markdown));
  const promptArgs = { ...visual, title: derived.title };
  // 公開時と同じく、記事固有背景と旧カタログは画像の形式・寸法まで検証して使う。壊れていれば例外になる
  const [articleSource, codexSource] = await Promise.all([
    resolveArticleBackgroundSource(PROJECT_ROOT, parseBlogArticleImageContext(slug, markdown)),
    resolveCodexBackgroundSource(PROJECT_ROOT, slug),
  ]);
  const publishedBackground =
    articleSource || codexSource ? null : await readPublishedBackground(slug);
  const status = decideBlogBackgroundStatus({
    slug,
    articlePath,
    hasArticleAsset: articleSource !== null,
    hasCodexCatalog: codexSource !== null,
    publishedBackground,
    currentPromptHashes: [computePromptHash(promptArgs), computeLegacyPromptHashV1(promptArgs)].filter(
      (hash): hash is string => typeof hash === 'string'
    ),
  });
  console.log(JSON.stringify({ slug, ...status }));
}

main().catch((error) => {
  console.log(
    JSON.stringify({
      kind: 'missing',
      ok: false,
      message: `背景を検証できません: ${error instanceof Error ? error.message : String(error)}`,
    })
  );
});
