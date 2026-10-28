import type { ReactNode } from "react";

import { cn, SectionCard } from "@stats47/components";

/**
 * 題名つきの区画。公開サイトと同じ SectionCard (@stats47/components) で描く (見出し行 + 下の線 + 本文)。
 * 題名は <h2>、外側は <section id>。ページ内リンクの着地 (id)・見出しでの移動・e2e の `section#id` の探し方が保たれる。
 * description は SectionCard に口が無いので、本文の先頭に muted の 1 行として置く。
 */
export function PanelCard({
  id,
  title,
  description,
  action,
  icon,
  children,
  className,
}: {
  /** ページ内リンク (#id) の着地 */
  id?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** lucide のアイコン要素 (例: <TrendingUpIcon />) */
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SectionCard
      id={id}
      title={title}
      icon={icon}
      headerAction={action}
      headingAs="h2"
      className={cn("scroll-mt-16", className)}
      bodyClassName={description ? "flex flex-col gap-3" : undefined}
    >
      {description ? <p className="m-0 text-sm text-muted-foreground">{description}</p> : null}
      {children}
    </SectionCard>
  );
}
