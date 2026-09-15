"use client";

import { type ComponentPropsWithoutRef } from "react";

import Link from "next/link";

import { trackNavClick, type NavSurface } from "@/lib/analytics/events";

interface TrackedThemeLinkProps
  extends Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "onClick"> {
  href: string;
  trackingLabel: string;
  /** GA4 nav_surface (`.claude/rules/analytics-event-standards.md`)。呼び出し元ごとに固定値を渡す。 */
  surface: NavSurface;
}

/** テーマページからの内部遷移を既存 nav_click で計測する (server component から使う共有 client parts)。 */
export function TrackedThemeLink({
  trackingLabel,
  href,
  surface,
  ...props
}: TrackedThemeLinkProps) {
  return (
    <Link
      href={href}
      onClick={() =>
        trackNavClick({
          label: trackingLabel,
          href,
          surface,
        })
      }
      {...props}
    />
  );
}
