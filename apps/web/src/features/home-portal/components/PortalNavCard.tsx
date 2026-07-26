"use client";

import type { ReactNode } from "react";

import {
  PORTAL_CARD_ASPECT_CLASS,
  SurfaceLinkCard,
} from "@/components/surface";

import { trackNavClick } from "@/lib/analytics/events";

type HomeSurface =
  | "home_category"
  | "home_use_case"
  | "home_area"
  | "home_buzz_map"
  | "home_blog";

interface PortalNavCardProps {
  href: string;
  label: string;
  description?: string;
  /**
   * 描画済みアイコン要素 (ReactNode)。Server Component からアイコン**コンポーネント**
   * (関数) を渡すと RSC 境界違反になるため、呼び出し側で `<Icon />` を描画して渡す。
   */
  icon?: ReactNode;
  surface: HomeSurface;
}

/**
 * home ポータルの発見カード (カテゴリ / 知りたいこと / 都道府県)。
 * カード全体が 1 つの Link。クリックで既存 nav_click を surface 別に送る
 * (analytics 失敗で遷移を止めない)。ネストした button/link を作らない。
 */
export function PortalNavCard({
  href,
  label,
  description,
  icon,
  surface,
}: PortalNavCardProps) {
  return (
    <SurfaceLinkCard
      href={href}
      onClick={() => {
        try {
          trackNavClick({ label, href, surface });
        } catch {
          // analytics 失敗で遷移を止めない
        }
      }}
      className={`${PORTAL_CARD_ASPECT_CLASS} group flex items-start gap-3 overflow-hidden`}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          {icon}
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-semibold text-foreground group-hover:text-primary">
          {label}
        </span>
        {description && (
          <span className="mt-0.5 block line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </SurfaceLinkCard>
  );
}
