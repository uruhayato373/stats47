"use client";

import type { ComponentProps } from "react";

import Link from "next/link";

import { trackNavClick } from "@/lib/analytics/events";

type NavSurface = Parameters<typeof trackNavClick>[0]["surface"];

interface TrackedPortalCategoryLinkProps extends ComponentProps<typeof Link> {
  label: string;
  /**
   * GA4 `nav_surface` の値。既定は home の左ペイン。
   * 他ページで同じリストを使うときは必ず別の値を渡す
   * (既定のままだと home の click と混ざって導線別の内訳が取れない)。
   * 台帳: `.claude/rules/analytics-event-standards.md`
   */
  surface?: NavSurface;
}

export function TrackedPortalCategoryLink({
  label,
  href,
  onClick,
  surface = "home_category",
  ...props
}: TrackedPortalCategoryLinkProps) {
  return (
    <Link
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);
        try {
          trackNavClick({
            label,
            href: typeof href === "string" ? href : href.pathname ?? "",
            surface,
          });
        } catch {
          // analytics失敗で遷移を止めない
        }
      }}
    />
  );
}
