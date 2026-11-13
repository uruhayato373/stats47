import { Children, type ReactNode } from 'react';

import { PanelGrid, cn } from '@stats47/components';
import { normalizeUnitsInText } from '@stats47/data-configs/unit';

import { ThemeAwareImage } from '@/components/atoms/ThemeAwareImage';

import { navSurfaceProps, type NavSurface } from '@/lib/analytics/events';
import { BLOG_THUMBNAIL_ASPECT_CLASS } from '@/lib/metadata/ogp-image';

import { SurfaceLinkCard } from './SurfaceCard';

/*
 * 記事カードと記事カードの格子 (部品の種類「記事カード」。2026-10-29)。見本の Blog app の記事カードに寄せる:
 * 画像が上 (サムネイルと同じ 40:21) → 題名 2 行 → 補足 1 行 (日付など)。並べる所は記事カードの格子に入れ、
 * 列の数は本文の幅で 1 → 2 → 3 列 (上限は枚数)。カード同士は線の格子で接ぎ、間を空けない。
 * 仕様の正本は部品の台帳 data/design/components.json の article-teaser-card / card-grid。
 */

interface ArticleTeaserCardProps {
  href: string;
  /** 記事の題名 (2 行まで。はみ出しは省略) */
  title: string;
  /** サムネイル (ライト・ダーク)。media を渡すときは省く */
  thumbnail?: { lightSrc: string; darkSrc: string };
  /** 画像の代わりに枠いっぱいに描く中身 (Geo の一覧の見本の地図 SVG など。2026-11-03) */
  media?: ReactNode;
  /** 題名の下の説明 (2 行まで)。一覧で記事を選ぶ材料が要るときだけ */
  description?: ReactNode;
  /** 下端の補足 1 行 (更新日など) */
  meta?: ReactNode;
  /** クリック計測の導線名 (共通のクリック監視が data-nav-surface を読む) */
  navSurface?: NavSurface;
  /** タイトル変更に左右されない記事 ID (表示・クリックの突合に使う) */
  contentId?: string;
  /** 最初の画面に入るカードは先に読み込む */
  eager?: boolean;
}

export function ArticleTeaserCard({
  href,
  title,
  thumbnail,
  media,
  description,
  meta,
  navSurface,
  contentId,
  eager = false,
}: ArticleTeaserCardProps) {
  return (
    <SurfaceLinkCard
      href={href}
      // 線の格子はカード (data-slot="card") を余白なしのセルとして扱う。付けないと文章のセルと同じ 16px の余白が入る
      data-slot="card"
      data-slot-kind="article-teaser-card"
      data-content-id={contentId}
      {...(navSurface ? { ...navSurfaceProps(navSurface), 'data-nav-label': contentId ?? title } : {})}
      className="group flex h-full flex-col overflow-hidden p-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* 縦横比の枠を縮ませない (shrink-0)。縮むと object-cover が上下を切り、絵の端が欠ける */}
      <div className={cn('relative w-full shrink-0 overflow-hidden border-b border-border bg-muted', BLOG_THUMBNAIL_ASPECT_CLASS)}>
        {media ??
          (thumbnail && (
            <ThemeAwareImage
              lightSrc={thumbnail.lightSrc}
              darkSrc={thumbnail.darkSrc}
              alt=""
              fill
              loading={eager ? 'eager' : 'lazy'}
              sizes="(min-width: 1280px) 400px, (min-width: 768px) 33vw, (min-width: 480px) 50vw, 100vw"
              className="object-cover"
            />
          ))}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-base leading-snug font-semibold text-foreground group-hover:text-primary">
          {/* 題と説明は原稿のまま届く。数字の直後の全角の単位を、同じページの表と同じ半角にそろえる */}
          {normalizeUnitsInText(title)}
        </h3>
        {description ? (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
            {typeof description === 'string' ? normalizeUnitsInText(description) : description}
          </p>
        ) : null}
        {meta ? <p className="mt-auto pt-2 text-xs text-muted-foreground">{meta}</p> : null}
      </div>
    </SurfaceLinkCard>
  );
}

/** 枚数から列の数の上限を決める (1 枚 = 1 列、2 枚 = 2 列、3 枚以上 = 3 列) */
export function cardGridColumns(count: number): 1 | 2 | 3 {
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
export function cardGridFillers(count: number): string[] {
  const columns = cardGridColumns(count);
  const two = columns >= 2 ? remainder(count, 2) : 0;
  const three = columns === 3 ? remainder(count, 3) : 0;
  return Array.from({ length: Math.max(two, three) }, (_, i) =>
    cn('hidden', i < two && '@sm:block', columns === 3 && (i < three ? '@md:block' : '@md:hidden'))
  );
}

interface CardGridProps {
  /** 記事カード (ArticleTeaserCard) */
  children: ReactNode;
  /**
   * index 件目の後に、格子が 1 列のときだけ出す要素 (記事の一覧の中のインフィード広告。2026-11-12)。2 列以上では隠れるので、
   * 子の数 (列の数と最後の行の埋め草) には数えない。index が子の数以上なら出さない (一覧の最後には置かない)。
   * 長い一覧では複数を渡せる (ブログ一覧の 2 か所。2026-11-13)
   */
  insertAfter?: CardGridInsert | readonly CardGridInsert[];
}

interface CardGridInsert {
  index: number;
  node: ReactNode;
}

export function CardGrid({ children, insertAfter }: CardGridProps) {
  const items = Children.toArray(children);
  const count = items.length;
  if (count === 0) return null;
  const inserts = (Array.isArray(insertAfter) ? insertAfter : insertAfter ? [insertAfter] : []) as readonly CardGridInsert[];
  const inserted = items.flatMap((item, i) => {
    const after = inserts.filter((insert) => insert.index === i + 1 && insert.index < count);
    return [
      item,
      ...after.map((insert) => (
        <div key={`card-grid-insert-${insert.index}`} className="@sm:hidden">{insert.node}</div>
      )),
    ];
  });
  return (
    <div data-slot-kind="card-grid" className="@container">
      <PanelGrid className={COLUMN_CLASS[cardGridColumns(count)]}>
        {inserted}
        {cardGridFillers(count).map((className, i) => (
          <div key={`filler-${i}`} aria-hidden="true" data-cell="flush" className={className} />
        ))}
      </PanelGrid>
    </div>
  );
}
