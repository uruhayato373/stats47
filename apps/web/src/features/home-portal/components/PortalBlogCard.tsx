"use client";

import { hrefFor } from "@stats47/data-configs/content/href";

import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";
import {
  PORTAL_CARD_ASPECT_CLASS,
  PORTAL_CARD_PADDING_CLASS,
  PORTAL_CARD_TITLE_CLASS,
  SurfaceLinkCard,
} from "@/components/surface";

import { trackNavClick } from "@/lib/analytics/events";
import { blogThumbnailUrl } from "@/lib/metadata/ogp-image";

interface PortalBlogCardProps {
  slug: string;
  title: string;
  /** 配置面ごとにホームとカテゴリのクリックを分離する。 */
  surface?: "home_blog" | "category_blog";
}

/**
 * 「統計を読み解く」の画像付き blog カード。
 * FeaturedRankingCardと同じタイトル階層・余白で表示する。
 * 640×336の文字なしサムネイルはタイトルの下に置き、タイトルはDOMを正典とする。
 * クリックで配置面に対応する nav_click を送る (analytics 失敗で遷移を止めない)。
 */
export function PortalBlogCard({
  slug,
  title,
  surface = "home_blog",
}: PortalBlogCardProps) {
  const href = hrefFor("blog", { slug });
  return (
    <SurfaceLinkCard
      href={href}
      onClick={() => {
        try {
          trackNavClick({ label: title, href, surface });
        } catch {
          // analytics 失敗で遷移を止めない
        }
      }}
      className={`${PORTAL_CARD_ASPECT_CLASS} ${PORTAL_CARD_PADDING_CLASS} group flex flex-col gap-1 overflow-hidden`}
    >
      {/* タイトルは全幅、サムネイルはタイトルの下の残りの高さに置く (文字と図版を重ねない) */}
      <span className="text-xs leading-none text-muted-foreground">統計ブログ</span>
      <p className={PORTAL_CARD_TITLE_CLASS} title={title}>{title}</p>
      <span className="relative mt-1 min-h-0 flex-1 overflow-hidden rounded-sm bg-muted">
        <ThemeAwareImage
          lightSrc={blogThumbnailUrl(slug, "light")}
          darkSrc={blogThumbnailUrl(slug, "dark")}
          alt=""
          width={640}
          height={336}
          sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 50vw, 85vw"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
        />
      </span>
    </SurfaceLinkCard>
  );
}
