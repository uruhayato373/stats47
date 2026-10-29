import { Children, type ReactNode } from 'react';

import { PanelGrid, cn } from '@stats47/components';

import { ThemeAwareImage } from '@/components/atoms/ThemeAwareImage';

import { navSurfaceProps, type NavSurface } from '@/lib/analytics/events';
import { BLOG_THUMBNAIL_ASPECT_CLASS } from '@/lib/metadata/ogp-image';

import { SurfaceLinkCard } from './SurfaceCard';

/*
 * 記事カードと記事カードの格子 (部品の種類「記事カード」。2026-10-29)。見本の Blog app の記事カードに寄せる:
 * 画像が上 (サムネイルと同じ 40:21) → 題名 2 行 → 補足 1 行 (日付など)。並べる所は記事カードの格子に入れ、
 * 列の数は本文の幅で 1 → 2 → 3 列 (上限は枚数)。カード同士は線の格子で接ぎ、間を空けない。
 * 仕様の正本は部品の台帳 data/design/components.json の article-teaser-card / article-teaser-grid。
 */

interface ArticleTeaserCardProps {
  href: string;
  /** 記事の題名 (2 行まで。はみ出しは省略) */
  title: string;
  /** サムネイル (ライト・ダーク) */
  thumbnail: { lightSrc: string; darkSrc: string };
  /** 題名の下の説明 (2 行まで)。一覧で記事を選ぶ材料が要るときだけ */
  description?: ReactNode;
  /** 下端の補足 1 行 (更新日など) */
  meta?: ReactNode;
  /** クリック計測の導線名 (共通のクリック監視が data-nav-surface を読む) */
  navSurface?: NavSurface;
  /** 最初の画面に入るカードは先に読み込む */
  eager?: boolean;
}

export function ArticleTeaserCard({
  href,
  title,
  thumbnail,
  description,
  meta,
  navSurface,
  eager = false,
}: ArticleTeaserCardProps) {
  return (
    <SurfaceLinkCard
      href={href}
      // 線の格子はカード (data-slot="card") を余白なしのセルとして扱う。付けないと文章のセルと同じ 16px の余白が入る
      data-slot="card"
      data-slot-kind="article-teaser-card"
      {...(navSurface ? { ...navSurfaceProps(navSurface), 'data-nav-label': title } : {})}
      className="group flex h-full flex-col overflow-hidden p-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* 縦横比の枠を縮ませない (shrink-0)。縮むと object-cover が上下を切り、絵の端が欠ける */}
      <div className={cn('relative w-full shrink-0 overflow-hidden border-b border-border bg-muted', BLOG_THUMBNAIL_ASPECT_CLASS)}>
        <ThemeAwareImage
          lightSrc={thumbnail.lightSrc}
          darkSrc={thumbnail.darkSrc}
          alt=""
          fill
          loading={eager ? 'eager' : 'lazy'}
          sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base leading-snug font-semibold text-foreground group-hover:text-primary">
          {title}
        </h3>
        {description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
        {meta ? <p className="mt-auto pt-2 text-xs text-muted-foreground">{meta}</p> : null}
      </div>
    </SurfaceLinkCard>
  );
}

/** 枚数から列の数の上限を決める (1 枚 = 1 列、2 枚 = 2 列、3 枚以上 = 3 列) */
export function articleTeaserGridColumns(count: number): 1 | 2 | 3 {
  if (count <= 1) return 1;
  if (count === 2) return 2;
  return 3;
}

const COLUMN_CLASS: Record<1 | 2 | 3, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 @sm:grid-cols-2',
  3: 'grid-cols-1 @sm:grid-cols-2 @md:grid-cols-3',
};

function remainder(n: number, cols: number): number {
  return (cols - (n % cols)) % cols;
}

/** 最終行の空きマスを埋める白いセル。2 列の幅と 3 列の幅で必要な数が違うので、幅ごとに出し分ける */
export function articleTeaserGridFillers(count: number): string[] {
  const columns = articleTeaserGridColumns(count);
  const two = columns >= 2 ? remainder(count, 2) : 0;
  const three = columns === 3 ? remainder(count, 3) : 0;
  return Array.from({ length: Math.max(two, three) }, (_, i) =>
    cn('hidden', i < two && '@sm:block', columns === 3 && (i < three ? '@md:block' : '@md:hidden'))
  );
}

interface ArticleTeaserGridProps {
  /** 記事カード (ArticleTeaserCard) */
  children: ReactNode;
}

export function ArticleTeaserGrid({ children }: ArticleTeaserGridProps) {
  const count = Children.toArray(children).length;
  if (count === 0) return null;
  return (
    <div data-slot-kind="article-teaser-grid" className="@container">
      <PanelGrid className={COLUMN_CLASS[articleTeaserGridColumns(count)]}>
        {children}
        {articleTeaserGridFillers(count).map((className, i) => (
          <div key={`filler-${i}`} aria-hidden="true" data-cell="flush" className={className} />
        ))}
      </PanelGrid>
    </div>
  );
}
