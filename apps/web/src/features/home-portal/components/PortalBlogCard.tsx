"use client";

import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";
import { SurfaceLinkCard } from "@/components/surface";

import { trackNavClick } from "@/lib/analytics/events";

interface PortalBlogCardProps {
  slug: string;
  title: string;
  /** R2 公開 URL のベース (thumbnail 解決用)。 */
  r2Url: string;
}

/**
 * 「統計を読み解く」の blog カード。画像 + タイトル (DOM text) の full-card link。
 * クリックで nav_click (surface=home_blog) を送る (analytics 失敗で遷移を止めない)。
 * ランキングカードと同じ 1200:630 の画像比率・metadata hierarchy に揃える。
 */
export function PortalBlogCard({ slug, title, r2Url }: PortalBlogCardProps) {
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
      className="group block overflow-hidden p-0"
    >
      <div className="relative aspect-[1200/630] w-full overflow-hidden bg-muted">
        <ThemeAwareImage
          lightSrc={`${r2Url}/app/blog/${slug}/thumbnail-light.webp`}
          darkSrc={`${r2Url}/app/blog/${slug}/thumbnail-dark.webp`}
          alt={title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-semibold leading-snug">{title}</p>
      </div>
    </SurfaceLinkCard>
  );
}
