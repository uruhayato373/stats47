import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import type { OgpVisualType } from '@stats47/types';

import { BLOG_IMAGE_GENERATOR_SPEC } from '../data/image-generator-registry';
import {
  buildImageGenerationManifest,
  createImageGenerationPlan,
  serializeImageGenerationManifest,
  type ImageGenerationPlan,
} from './image-generation-manifest';

export const BLOG_IMAGE_STAGE_ROOT = '.local/image-staging/blog';
export const BLOG_IMAGE_PUBLISH_PLAN =
  '.local/image-generation-publish-plan-blog.json';

export interface BlogImageData {
  title: string;
  subtitle: string | null;
}

export type BlogBackgroundInput =
  | { source: 'brand' }
  | {
      source: 'shared';
      sha256: string;
      visualType: OgpVisualType;
    }
  | {
      source: 'ai';
      promptHash: string;
      sha256: string;
    };

export type BlogBackgroundMetadata =
  | { source: 'brand' }
  | {
      source: 'shared';
      sha256: string;
      model: string;
      promptVersion: string;
      visualType: OgpVisualType;
    }
  | {
      source: 'ai';
      promptHash: string;
      sha256: string;
      model: string;
      promptVersion: string;
      visualType: OgpVisualType;
      motif: string;
    };

export interface BlogImageMetadata {
  title: string;
  subtitle: string | null;
  background: BlogBackgroundMetadata;
}

/**
 * SHAを持たない旧AI背景を一度だけ共通manifestへ移行するための整合性確認。
 * 旧R2 objectの単一part ETag (MD5) と実bytesが一致しない限り採用しない。
 */
export function adoptLegacyAiBackgroundSha256(
  body: Buffer,
  etag: string | null
): string {
  const normalizedEtag = etag?.replace(/^"|"$/g, '').toLowerCase() ?? '';
  const md5 = createHash('md5').update(body).digest('hex');
  if (!/^[0-9a-f]{32}$/.test(normalizedEtag) || normalizedEtag !== md5) {
    throw new Error('legacy AI背景のR2 ETagと実bytesが一致しません');
  }
  return createHash('sha256').update(body).digest('hex');
}

export function publishedBlogSlugsFromIndex(value: unknown): string[] {
  const articles = Array.isArray(value)
    ? value
    : value &&
        typeof value === 'object' &&
        Array.isArray((value as { articles?: unknown }).articles)
      ? (value as { articles: unknown[] }).articles
      : null;
  if (!articles) throw new Error('app/blog/all.json schema が不正です');
  const invalidArticles = articles.filter(
    (article) =>
      !article ||
      typeof article !== 'object' ||
      typeof (article as { slug?: unknown }).slug !== 'string' ||
      !/^[a-z0-9][a-z0-9-]*$/.test((article as { slug?: string }).slug ?? '') ||
      typeof (article as { published?: unknown }).published !== 'boolean'
  );
  if (invalidArticles.length > 0) {
    throw new Error(
      `app/blog/all.json にschema不正の記事が${invalidArticles.length}件あります`
    );
  }
  const slugs = [
    ...new Set(
      articles.flatMap((article) =>
        (article as { published: boolean }).published
          ? [(article as { slug: string }).slug]
          : []
      )
    ),
  ].sort();
  if (slugs.length === 0) {
    throw new Error('app/blog/all.json に公開記事がありません');
  }
  return slugs;
}

export function blogImageKeys(slug: string) {
  const base = `app/blog/${slug}`;
  return {
    light: `${base}/thumbnail-light.webp`,
    dark: `${base}/thumbnail-dark.webp`,
    ogp: `${base}/ogp/ogp.png`,
    background: `${base}/ogp/background.jpg`,
    manifest: `${base}/ogp/generation.json`,
  } as const;
}

export function createBlogImagePlan(options: {
  slug: string;
  data: BlogImageData;
  background: BlogBackgroundInput;
  rendererHash: string;
}): ImageGenerationPlan {
  const keys = blogImageKeys(options.slug);
  const assets = [
    {
      key: keys.light,
      variant: 'light',
      contentType: 'image/webp' as const,
      width: 640,
      height: 336,
    },
    {
      key: keys.dark,
      variant: 'dark',
      contentType: 'image/webp' as const,
      width: 640,
      height: 336,
    },
    {
      key: keys.ogp,
      variant: 'ogp',
      contentType: 'image/png' as const,
      width: 1200,
      height: 630,
    },
    ...(options.background.source === 'ai'
      ? [
          {
            key: keys.background,
            variant: 'background',
            contentType: 'image/jpeg' as const,
            width: 1200,
            height: 630,
          },
        ]
      : []),
  ];
  return createImageGenerationPlan({
    generator: BLOG_IMAGE_GENERATOR_SPEC.generator,
    entityId: options.slug,
    manifestKey: keys.manifest,
    input: {
      data: {
        title: options.data.title,
        subtitle: options.data.subtitle,
        date: '',
        category: 'BLOG',
        domainPath: 'stats47.jp/blog',
      },
      background: options.background,
    },
    rendererHash: options.rendererHash,
    assets,
  });
}

export function stageBlogImagePath(
  projectRoot: string,
  plan: ImageGenerationPlan,
  key: string
): string {
  if (
    !plan.assets.some((asset) => asset.key === key) &&
    plan.manifestKey !== key
  ) {
    throw new Error(`blog image plan 外の staging key です: ${key}`);
  }
  if (
    key.startsWith('/') ||
    key.includes('\\') ||
    key.split('/').includes('..')
  ) {
    throw new Error(`blog image staging key が不正です: ${key}`);
  }
  const root = resolve(projectRoot, BLOG_IMAGE_STAGE_ROOT);
  const path = resolve(root, key);
  if (!path.startsWith(`${root}/`)) {
    throw new Error(`blog image staging外を指すkeyです: ${key}`);
  }
  mkdirSync(dirname(path), { recursive: true });
  return path;
}

export function writeBlogImageManifest(options: {
  projectRoot: string;
  plan: ImageGenerationPlan;
  assetFiles: ReadonlyMap<string, string>;
  metadata: BlogImageMetadata;
}) {
  const manifest = buildImageGenerationManifest({
    plan: options.plan,
    assetFiles: options.assetFiles,
    metadata: options.metadata,
  });
  const path = stageBlogImagePath(
    options.projectRoot,
    options.plan,
    options.plan.manifestKey
  );
  writeFileSync(path, serializeImageGenerationManifest(manifest));
  return manifest;
}
