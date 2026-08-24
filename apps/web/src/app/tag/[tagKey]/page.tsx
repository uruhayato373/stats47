import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PageShell, PageHeader, Breadcrumbs } from '@/components/layout';
import { SurfaceCard } from '@/components/surface';

import { FooterAdSlot, NativeAffiliateRow } from '@/features/ads';
import { resolveAffiliateBanners } from '@/features/ads/server';
import {
  listAllUniqueTags,
  listArticleSummariesByTagKey,
} from '@/features/blog/server';

import { MIN_INDEXABLE_TAG_ARTICLES } from '@/lib/url-policy';

import type { Metadata } from 'next';

export async function generateStaticParams() {
  const tagKeys = await listAllUniqueTags().catch(() => []);
  return tagKeys.map((tagKey) => ({ tagKey }));
}

/**
 * URL セグメントの tagKey を、記事データ側のキー (日本語生文字列) に揃える。
 *
 * ★ここを間違えると全タグページが 404 になる。params は非 ASCII タグでは
 * percent-encoded (`%E5%AE%B6...`) で渡るため、そのまま
 * `listArticleSummariesByTagKey` に投げると `t.tagKey === "家計調査"` に一致せず
 * 記事 0 本 → notFound() に落ちる (2026-07-24 実測)。
 * 既にデコード済みの文字列を渡された場合 (% を含まない) は no-op、
 * 不正な % シーケンスでも例外を投げず原文を返す。
 */
function decodeTagKey(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

interface PageProps {
  params: Promise<{ tagKey: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { tagKey } = await params;
  const tag = decodeTagKey(tagKey);

  // sitemap と同じ閾値未満のタグは thin content として noindex。
  // 0 本の場合はページ本体で notFound() が呼ばれる。
  const articles = await listArticleSummariesByTagKey(
    tag,
    MIN_INDEXABLE_TAG_ARTICLES
  );
  const indexable = articles.length >= MIN_INDEXABLE_TAG_ARTICLES;

  const title = `「${tag}」タグの記事一覧`;
  const description = `「${tag}」タグが付いた都道府県統計ブログの記事一覧。`;

  return {
    title,
    description,
    alternates: {
      canonical: `/tag/${tagKey}`,
    },
    robots: indexable ? 'index, follow' : 'noindex, follow',
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default async function TagArticlesPage({ params }: PageProps) {
  const { tagKey } = await params;
  const tag = decodeTagKey(tagKey);
  const [articles, nativeBanners] = await Promise.all([
    listArticleSummariesByTagKey(tag, 50),
    // limit 8 = 縦長を描画側で除外しても 4 件残すための余裕
    resolveAffiliateBanners([tag], 8).catch(() => []),
  ]);

  if (articles.length === 0) {
    notFound();
  }

  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: 'ブログ', href: '/blog' },
          { label: 'タグ一覧', href: '/blog/tags' },
          { label: tag },
        ]}
      />

      <PageHeader
        eyebrow="タグ"
        title={tag}
        description={`「${tag}」タグが付いた都道府県統計ブログの記事 ${articles.length} 本を掲載しています。`}
        stats={`全 ${articles.length} 記事`}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/blog/${article.slug}`}
            className="group block h-full"
          >
            <SurfaceCard className="flex h-full flex-col rounded-none transition-colors hover:border-primary/50 hover:shadow-md">
              <div className="py-3 px-4 pb-3 flex flex-col items-start gap-2 space-y-0 border-b border-border">
                <div className="mb-2 flex items-center gap-2">
                  {article.description && (
                    <span className="text-xs text-muted-foreground">
                      {article.slug}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold leading-none text-lg transition-colors group-hover:text-primary">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {article.description}
                  </p>
                )}
              </div>
            </SurfaceCard>
          </Link>
        ))}
      </div>

      {/* 記事内広告（一覧グリッド後。slotId 未発行の間は非表示） */}
      {/*
              記事内広告は置かない。この面は単一の記事グリッドしか無く、直後の
              ネイティブアフィリエイトは在庫ゼロで消えるため、置くとアフィリ在庫が
              無い日にフッター広告と隣接して広告 2 連になる (2026-07-29 是正)。
            */}
      {/* ネイティブアフィリエイト (D Phase 4) */}
      {nativeBanners.length > 0 && (
        <div className="mt-10">
          <NativeAffiliateRow
            banners={nativeBanners}
            position="tag-native"
            trackingCategory={`tag-${tagKey}`}
          />
        </div>
      )}

      {/* コンテンツ末尾の全幅フッター広告 */}
      <FooterAdSlot />
    </PageShell>
  );
}
