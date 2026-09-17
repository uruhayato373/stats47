import { type ComponentPropsWithoutRef, type ReactNode } from "react";

import Link from "next/link";


import { cn } from "@stats47/components";
import { ChevronDown, ChevronRight } from "lucide-react";

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

interface HeaderedSurfaceCardProps extends Omit<ComponentPropsWithoutRef<"section">, "title"> {
  variant: "rail" | "section";
  title?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  headerAction?: ReactNode;
  bodyClassName?: string;
  titleClassName?: string;
  /**
   * details/summary で本文を折りたたむ (狭幅で本文下へ積まれるレール用)。
   * 見出しが summary になり、折りたたみ時の見た目も左右レールで共通になる。
   */
  collapsible?: boolean;
  /** collapsible のときの初期状態 (既定: 閉) */
  defaultOpen?: boolean;
}

const HEADER_CLASS = "flex items-center justify-between gap-3 border-b border-border px-4 py-3";

function HeaderedSurfaceCard({
  variant,
  title,
  icon,
  children,
  headerAction,
  className,
  bodyClassName,
  titleClassName,
  collapsible = false,
  defaultOpen = false,
  ...props
}: HeaderedSurfaceCardProps) {
  const heading = title ? (
    <h3
      className={cn(
        variant === "rail"
          ? "truncate text-sm font-medium text-muted-foreground"
          : "text-sm font-semibold text-foreground",
        titleClassName,
      )}
    >
      {title}
    </h3>
  ) : null;
  const body = (
    <div
      className={cn(
        variant === "rail" ? "px-4 pb-4 pt-3" : "p-4",
        bodyClassName,
      )}
    >
      {children}
    </div>
  );

  if (collapsible) {
    return (
      <SurfaceSection className={cn("overflow-hidden p-0", className)} {...props}>
        <details className="group" open={defaultOpen || undefined}>
          <summary
            className={cn(
              HEADER_CLASS,
              "min-h-12 cursor-pointer list-none [&::-webkit-details-marker]:hidden",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            )}
          >
            <div className="flex min-w-0 items-center gap-2">
              {icon}
              {heading}
            </div>
            <ChevronDown
              aria-hidden="true"
              className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            />
          </summary>
          {body}
        </details>
      </SurfaceSection>
    );
  }

  return (
    <SurfaceSection className={cn("p-0", className)} {...props}>
      {(title || icon || headerAction) && (
        <div className={HEADER_CLASS}>
          <div className="flex min-w-0 items-center gap-2">
            {icon}
            {heading}
          </div>
          {headerAction}
        </div>
      )}
      {body}
    </SurfaceSection>
  );
}

interface RailCardProps extends Omit<ComponentPropsWithoutRef<"section">, "title"> {
  title?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  headerAction?: ReactNode;
  bodyClassName?: string;
  titleClassName?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

/**
 * レール内の独立したまとまり 1 つ = RailCard 1 枚 (左右レール共通の Surface 契約)。
 * 外枠 (bg-card / 全周 border / shadow-sm / rounded-none)、見出し、本文 padding、
 * 折りたたみの見た目をここだけが持つ。レール側で独自の枠・背景・padding を足さない。
 * 正典: docs/01_技術設計/04_デザインシステム.md「レール UI 契約」
 */
export function RailCard(props: RailCardProps) {
  return <HeaderedSurfaceCard variant="rail" {...props} />;
}

/**
 * 見出し付きコンテンツカード（本文中の非チャートカード）。
 * ヘッダー/本文の視覚契約は ChartPanel と共有する (border-b px-4 py-3 / h3 text-sm font-semibold / p-4)。
 */
export function SectionCard(props: RailCardProps) {
  return <HeaderedSurfaceCard variant="section" {...props} />;
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

export type RailNavRowDensity = "compact" | "default";

/**
 * レール内リンク行の共通 class。左右レール・カテゴリ導線・ページ内ナビが同じ行を使う。
 *
 * - 通常行は透明背景。hover と選択中 (aria-current / aria-pressed) だけ背景を変える
 * - モバイルのタップ領域は 44px (`min-h-11`)。sm 以上では密度を上げる
 * - active はカラーバー (inset shadow / border-l) ではなく `bg-accent font-semibold text-primary`
 */
export function railNavRowClassName({
  density = "compact",
  active = false,
  className,
}: {
  density?: RailNavRowDensity;
  active?: boolean;
  className?: string;
} = {}) {
  return cn(
    "group flex w-full items-center justify-between gap-2 px-2 text-left text-foreground transition-colors",
    "hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
    density === "compact"
      ? "min-h-11 py-1.5 text-sm sm:min-h-9"
      : "min-h-11 py-2 text-[15px] sm:min-h-10",
    active && "bg-accent font-semibold text-primary",
    className,
  );
}

interface RailNavRowProps extends Omit<ComponentPropsWithoutRef<typeof Link>, "children"> {
  children: ReactNode;
  density?: RailNavRowDensity;
  /** 選択中 (現在ページ)。aria-current="page" と active 表示を同時に出す */
  active?: boolean;
  /** 右端に添える件数などの補助テキスト */
  trailing?: ReactNode;
  /** 右向き矢印を出す (既定: 出す) */
  chevron?: boolean;
}

/** レール内のリンク行 1 本。`RailLinkList` / `RailCategoryList` の中で使う */
export function RailNavRow({
  children,
  className,
  density,
  active = false,
  trailing,
  chevron = true,
  ...props
}: RailNavRowProps) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={railNavRowClassName({ density, active, className })}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing !== undefined && trailing !== null && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {trailing}
        </span>
      )}
      {chevron && (
        <ChevronRight
          aria-hidden="true"
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
        />
      )}
    </Link>
  );
}

interface RailNavRowButtonProps extends ComponentPropsWithoutRef<"button"> {
  children: ReactNode;
  density?: RailNavRowDensity;
  /** 押下状態 (フィルタなど)。aria-pressed と active 表示を同時に出す */
  pressed?: boolean;
  trailing?: ReactNode;
}

/** リンクではなく状態を切り替える行 (aria-pressed)。見た目は RailNavRow と同じ */
export function RailNavRowButton({
  children,
  className,
  density,
  pressed = false,
  trailing,
  ...props
}: RailNavRowButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={railNavRowClassName({ density, active: pressed, className })}
      {...props}
    >
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {trailing !== undefined && trailing !== null && (
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
          {trailing}
        </span>
      )}
    </button>
  );
}
