import { type ComponentPropsWithoutRef, type ReactNode } from "react";

import Link from "next/link";


import { cn } from "@stats47/components";

/* カード外枠はトークン解決に依存せず、サイト全体で明示的に角丸なし。 */
const surfaceCardClass =
  "rounded-none border bg-card p-4 shadow-sm transition-colors";

const interactiveSurfaceClass =
  "hover:border-primary/40 hover:bg-accent/40 hover:shadow-md";

/**
 * home の比較対象カードとcategory注目ランキングの共通比率。
 * 参照UIの実測約1.47:1に合わせ、各featureで比率を重複定義しない。
 */
export const PORTAL_CARD_ASPECT_CLASS = "aspect-[1.47/1]";

/** FeaturedRankingCardを基準にしたポータルカード共通の内側余白。 */
export const PORTAL_CARD_PADDING_CLASS = "p-3";

/** FeaturedRankingCardを基準にしたタイトル階層。 */
export const PORTAL_CARD_TITLE_CLASS =
  "relative z-10 line-clamp-2 min-h-[2.4rem] text-sm font-semibold leading-snug transition-colors group-hover:text-primary";

/** タイトル下に置く短い説明。カード本文なので12px未満にしない。 */
export const PORTAL_CARD_DESCRIPTION_CLASS =
  "relative z-10 line-clamp-2 text-[13px] leading-[1.5] text-muted-foreground";

interface SurfaceClassNameOptions {
  interactive?: boolean;
  className?: string;
}

export function getSurfaceCardClassName({
  interactive = false,
  className,
}: SurfaceClassNameOptions = {}) {
  return cn(surfaceCardClass, interactive && interactiveSurfaceClass, className);
}

interface SurfaceCardProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}

interface SurfaceSectionProps extends ComponentPropsWithoutRef<"section"> {
  children: ReactNode;
}

export function SurfaceCard({
  children,
  className,
  ...props
}: SurfaceCardProps) {
  return (
    <div className={getSurfaceCardClassName({ className })} {...props}>
      {children}
    </div>
  );
}

export function SurfaceSection({
  children,
  className,
  ...props
}: SurfaceSectionProps) {
  return (
    <section className={getSurfaceCardClassName({ className })} {...props}>
      {children}
    </section>
  );
}

interface SurfaceLinkCardProps extends ComponentPropsWithoutRef<typeof Link> {
  children: ReactNode;
}

export function SurfaceLinkCard({
  children,
  className,
  ...props
}: SurfaceLinkCardProps) {
  return (
    <Link
      className={getSurfaceCardClassName({ interactive: true, className })}
      {...props}
    >
      {children}
    </Link>
  );
}

/**
 * 記事本文を包むカード (reading zone 専用・Soft Editorial)。
 * 角丸なし + 通常カードと同じ shadow-sm。モバイル (sm 未満) では画面端までフルブリード。
 * ArticleShell のコンテナ px-4 を負マージンで打ち消して端まで届かせる。
 */
export function ArticleCard({
  children,
  className,
  ...props
}: SurfaceCardProps) {
  return (
    <div
      className={cn(
        "rounded-none border bg-card shadow-sm",
        "px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12",
        "max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface RailCardProps extends Omit<ComponentPropsWithoutRef<"section">, "title"> {
  title?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  headerAction?: ReactNode;
  bodyClassName?: string;
  titleClassName?: string;
}

export function RailCard({
  title,
  icon,
  children,
  headerAction,
  className,
  bodyClassName,
  titleClassName,
  ...props
}: RailCardProps) {
  return (
    <SurfaceSection className={cn("p-0", className)} {...props}>
      {(title || icon || headerAction) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            {icon}
            {title && (
              <h3
                className={cn(
                  "truncate text-sm font-medium text-muted-foreground",
                  titleClassName,
                )}
              >
                {title}
              </h3>
            )}
          </div>
          {headerAction}
        </div>
      )}
      <div className={cn("px-4 pb-4 pt-3", bodyClassName)}>{children}</div>
    </SurfaceSection>
  );
}

interface RailLinkListProps extends ComponentPropsWithoutRef<"nav"> {
  children: ReactNode;
}

export function RailLinkList({
  children,
  className,
  ...props
}: RailLinkListProps) {
  return (
    <nav className={cn("flex flex-col gap-0.5", className)} {...props}>
      {children}
    </nav>
  );
}

interface RailLinkItemProps extends ComponentPropsWithoutRef<typeof Link> {
  children: ReactNode;
}

export function RailLinkItem({
  children,
  className,
  ...props
}: RailLinkItemProps) {
  return (
    <Link
      className={cn(
        "group flex items-center py-1.5 text-xs transition-colors hover:text-primary",
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
