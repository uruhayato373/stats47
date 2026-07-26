"use client";

import type { ComponentProps } from "react";

import Link from "next/link";

import { trackNavClick } from "@/lib/analytics/events";

interface TrackedPortalCategoryLinkProps extends ComponentProps<typeof Link> {
  label: string;
}

export function TrackedPortalCategoryLink({
  label,
  href,
  onClick,
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
            surface: "home_category",
          });
        } catch {
          // analytics失敗で遷移を止めない
        }
      }}
    />
  );
}
