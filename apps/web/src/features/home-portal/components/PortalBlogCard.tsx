"use client";

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
 * FeaturedRankingCardと同じタイトル階層・余白・右下ビジュアルで表示する。
 * 640×336の文字なしサムネイルは右下へ裁断配置し、タイトルはDOMを正典とする。
 * クリックで配置面に対応する nav_click を送る (analytics 失敗で遷移を止めない)。
 */
export function PortalBlogCard({
  slug,
  title,
  surface = "home_blog",
}: PortalBlogCardProps) {
  const href = `/blog/${slug}`;
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
      className={`${PORTAL_CARD_ASPECT_CLASS} ${PORTAL_CARD_PADDING_CLASS} group relative block overflow-hidden`}
    >
      <ThemeAwareImage
        lightSrc={blogThumbnailUrl(slug, "light")}
        darkSrc={blogThumbnailUrl(slug, "dark")}
        alt=""
        width={640}
        height={336}
        sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 50vw, 85vw"
        className="pointer-events-none absolute -bottom-2 -right-4 h-[77%] w-[74%] object-cover object-[64%_center] [mask-image:linear-gradient(to_right,transparent_0%,black_24%)] transition-transform duration-200 group-hover:scale-[1.01]"
      />
      <p className={`${PORTAL_CARD_TITLE_CLASS} w-[60%]`}>{title}</p>
      <span className="absolute bottom-3 left-3 z-10 text-[11px] leading-none text-muted-foreground">
        統計ブログ
      </span>
    </SurfaceLinkCard>
  );
}
