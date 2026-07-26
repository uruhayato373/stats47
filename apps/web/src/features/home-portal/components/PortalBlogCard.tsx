"use client";

import { ArrowRight } from "lucide-react";

import {
  PORTAL_CARD_ASPECT_CLASS,
  SurfaceLinkCard,
} from "@/components/surface";

import { trackNavClick } from "@/lib/analytics/events";

interface PortalBlogCardProps {
  slug: string;
  title: string;
  description?: string | null;
}

/**
 * 「統計を読み解く」の高密度 blog カード。タイトルと要約の full-card link。
 * クリックで nav_click (surface=home_blog) を送る (analytics 失敗で遷移を止めない)。
 * OGP画像は外部共有用に維持し、home一覧は画像へ依存しない。
 */
export function PortalBlogCard({ slug, title, description }: PortalBlogCardProps) {
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
      className={`${PORTAL_CARD_ASPECT_CLASS} group flex flex-col overflow-hidden p-3`}
    >
      <p className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
        {title}
      </p>
      {description && (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      <div className="mt-auto flex justify-end pt-2">
        <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    </SurfaceLinkCard>
  );
}
