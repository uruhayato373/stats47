import { ImageResponse } from 'next/og';

import { findArticleBySlug } from '@/features/blog/server';
import { BlogOgp, type BlogOgpData } from '@/features/ogp/BlogOgp';
import { loadOgpFonts } from '@/features/ogp/font-loader';

export const alt = 'ブログ記事';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const revalidate = 2592000; // 30d

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await findArticleBySlug(slug).catch(() => null);

  const data: BlogOgpData = article
    ? {
        title: article.frontmatter.seoTitle ?? article.frontmatter.title,
        subtitle: article.frontmatter.subtitle ?? null,
        date: article.frontmatter.publishedAt
          ? article.frontmatter.publishedAt.slice(0, 10).replace(/-/g, '.')
          : '',
        category: article.frontmatter.tags?.[0]?.toUpperCase() ?? 'BLOG',
      }
    : {
        title: 'ブログ — stats47',
        subtitle: null,
        date: '',
        category: 'BLOG',
      };

  return new ImageResponse(<BlogOgp data={data} />, {
    ...size,
    fonts: await loadOgpFonts(),
  });
}
