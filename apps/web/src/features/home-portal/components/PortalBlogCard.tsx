"use client";

import { ArrowRight } from "lucide-react";

import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";
import {
  PORTAL_CARD_ASPECT_CLASS,
  SurfaceLinkCard,
} from "@/components/surface";

import { trackNavClick } from "@/lib/analytics/events";
import {
  BLOG_THUMBNAIL_ASPECT_CLASS,
  ogpImageUrl,
} from "@/lib/metadata/ogp-image";

interface PortalBlogCardProps {
  slug: string;
  title: string;
}

/**
 * 「統計を読み解く」の画像付き blog カード。
 * 1200×630のサムネイルを無裁断で表示し、下部に読みやすいタイトルを残す。
 * クリックで nav_click (surface=home_blog) を送る (analytics 失敗で遷移を止めない)。
 */
export function PortalBlogCard({ slug, title }: PortalBlogCardProps) {
  const href = `/blog/${slug}`;
  return (
    <SurfaceLinkCard
      href={href}
      onClick={() => {
        try {
          trackNavClick({ label: title, href, surface: "home_blog" });
        } catch {
          // analytics 失敗で遷移を止めない
        }
      }}
      className={`${PORTAL_CARD_ASPECT_CLASS} group flex flex-col overflow-hidden p-0`}
    >
      <div
        className={`relative ${BLOG_THUMBNAIL_ASPECT_CLASS} w-full shrink-0 overflow-hidden border-b border-border bg-muted`}
      >
        <ThemeAwareImage
          lightSrc={ogpImageUrl(
            `app/blog/${slug}/thumbnail-light.webp`,
          )}
          darkSrc={ogpImageUrl(`app/blog/${slug}/thumbnail-dark.webp`)}
          alt=""
          fill
          sizes="(min-width: 1280px) 18vw, (min-width: 1024px) 22vw, (min-width: 640px) 50vw, 85vw"
          className="object-contain transition-transform duration-200 group-hover:scale-[1.01]"
        />
      </div>
      <div className="flex min-h-0 flex-1 items-center gap-2 px-2.5">
        <p className="min-w-0 flex-1 truncate text-xs font-semibold group-hover:text-primary">
          {title}
        </p>
        <ArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </SurfaceLinkCard>
  );
}
