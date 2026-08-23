"use client";

import type { MouseEvent, ReactNode } from "react";

import { trackNavClick, type NavSurface } from "@/lib/analytics/events";

interface SurveyOutboundLinkAreaProps {
  children: ReactNode;
  surface: Extract<NavSurface, "survey_ranking" | "survey_theme" | "survey_blog">;
}

/**
 * 調査ハブから各 taxonomy 面へ戻るリンクを一括計測する。
 * server component のカードを client 化せず、リンク領域だけで event delegation する。
 */
export function SurveyOutboundLinkArea({
  children,
  surface,
}: SurveyOutboundLinkAreaProps) {
  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest<HTMLAnchorElement>("a[href]");
    if (!link || !event.currentTarget.contains(link)) return;
    const href = link.getAttribute("href");
    if (!href) return;
    const label = href.split(/[?#]/, 1)[0].split("/").filter(Boolean).at(-1) ?? href;
    trackNavClick({ label, href, surface });
  }

  return <div onClick={handleClick}>{children}</div>;
}
