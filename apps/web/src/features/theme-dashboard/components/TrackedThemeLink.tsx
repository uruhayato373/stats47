"use client";

import { type ComponentPropsWithoutRef } from "react";

import Link from "next/link";

import { trackNavClick } from "@/lib/analytics/events";

interface TrackedThemeEvidenceLinkProps
  extends Omit<ComponentPropsWithoutRef<typeof Link>, "href" | "onClick"> {
  href: string;
  trackingLabel: string;
}

/** 白書論点セクションからの内部遷移を既存 nav_click で計測する。 */
export function TrackedThemeEvidenceLink({
  trackingLabel,
  href,
  ...props
}: TrackedThemeEvidenceLinkProps) {
  return (
    <Link
      href={href}
      onClick={() =>
        trackNavClick({
          label: trackingLabel,
          href,
          surface: "theme_evidence",
        })
      }
      {...props}
    />
  );
}
