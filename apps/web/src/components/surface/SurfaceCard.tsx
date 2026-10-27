import { type ComponentPropsWithoutRef, type ReactNode } from "react";



import {
  CARD_SURFACE_CLASS,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
} from "@stats47/components";
import { ChevronDown, ChevronRight } from "lucide-react";

import Link from "@/components/atoms/SiteLink";

/*
 * カードはテンプレートの Card (@stats47/components の ui/card) で組み立てる (2026-10-27 オーナー決定)。
 * 余白・間隔・線・地は Card と <html class="style-lyra"> の .cn-card が決め、ここでは足さない。
 * 外枠の角丸・線色のトークン (CARD_SURFACE_CLASS) は従来どおり合成する (契約テストが固定)。
 *
 * テンプレートから外す点は 2 つだけ:
 * - 見出しも本文の区切りも無いカード (SurfaceCard / SurfaceSection / ArticleCard) は子を CardContent で
 *   包まずに Card の直下へ置くので、CardContent と同じ px-4 を Card に付ける。呼び出し側の
 *   className (p-0 / p-5 など 118 件) がそのまま効くようにするため。
 * - Card は要素を選べないので、<section> で描く SurfaceSection / RailCard / SectionCard は
 *   Card と同じクラスを section に付ける (CARD_SECTION_CLASS)。region の役割と aria-label を保つため。
 *   角丸は Card 既定の大きい角丸を写さず、CARD_SURFACE_CLASS の rounded-card で決める。
 */
const CARD_SECTION_CLASS =
  "cn-card group/card flex flex-col gap-4 overflow-hidden bg-card py-4 text-sm text-card-foreground ring-1 ring-foreground/10";

/** CardContent と同じ横余白。子を CardContent で包まないカードだけが使う。 */
const CARD_CONTENT_INSET_CLASS = "px-4";

/*
 * Link を外枠にするカード (SurfaceLinkCard と getSurfaceCardClassName の利用側 25 件) は Card を使えないため、
 * クラス文字列のまま残す。Card の py-4 + CardContent の px-4 と同じ p-4。
 */
const surfaceCardClass = cn(CARD_SURFACE_CLASS, "p-4 transition-colors");

const interactiveSurfaceClass =
  "hover:border-primary/40 hover:bg-accent/40";

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
  "relative z-10 line-clamp-2 text-[13px] leading-normal text-muted-foreground";

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

/** Card と同じ見た目の <section>。見出しの有無にかかわらず section の役割を保つ。 */
function CardSection({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      data-slot="card"
      data-size="default"
      className={cn(CARD_SECTION_CLASS, CARD_SURFACE_CLASS, className)}
      {...props}
    />
  );
}

export function SurfaceCard({
  children,
  className,
  ...props
}: SurfaceCardProps) {
  return (
    <Card
      className={cn(CARD_SURFACE_CLASS, CARD_CONTENT_INSET_CLASS, className)}
      {...props}
    >
      {children}
    </Card>
  );
}

export function SurfaceSection({
  children,
  className,
  ...props
}: SurfaceSectionProps) {
  return (
    <CardSection className={cn(CARD_CONTENT_INSET_CLASS, className)} {...props}>
      {children}
    </CardSection>
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
 * 記事本文を包むカード (reading zone 専用)。
 * 外枠は通常カードと同じ Card。モバイル (sm 未満) では画面端までフルブリード。
 * ルートレイアウトの main の p-4 を負マージンで打ち消して端まで届かせる。
 */
export function ArticleCard({
  children,
  className,
  ...props
}: SurfaceCardProps) {
  return (
    <Card
      className={cn(
        CARD_SURFACE_CLASS,
        CARD_CONTENT_INSET_CLASS,
        "max-sm:-mx-4 max-sm:rounded-none max-sm:border-x-0",
        className,
      )}
      {...props}
    >
      {children}
    </Card>
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
        variant === "rail" && "truncate text-muted-foreground",
        titleClassName,
      )}
    >
      {title}
    </h3>
  ) : null;
  const titleRow = (
    <CardTitle className="flex min-w-0 items-center gap-2">
      {icon}
      {heading}
    </CardTitle>
  );
  const body = <CardContent className={bodyClassName}>{children}</CardContent>;

  if (collapsible) {
    return (
      <CardSection className={className} {...props}>
        <details className="group space-y-4" open={defaultOpen || undefined}>
          <summary className="cursor-pointer list-none focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            <CardHeader>
              {titleRow}
              <CardAction>
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 text-muted-foreground transition-transform group-open:rotate-180"
                />
              </CardAction>
            </CardHeader>
          </summary>
          {body}
        </details>
      </CardSection>
    );
  }

  return (
    <CardSection className={className} {...props}>
      {(title || icon || headerAction) && (
        <CardHeader className="border-b">
          {titleRow}
          {headerAction && <CardAction>{headerAction}</CardAction>}
        </CardHeader>
      )}
      {body}
    </CardSection>
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
 * Card + CardHeader (border-b) + CardTitle (h3) + CardAction + CardContent で組む。
 * レール側で独自の枠・背景・padding を足さない。
 * 正典: docs/01_技術設計/04_デザインシステム.md「レール UI 契約」
 */
export function RailCard(props: RailCardProps) {
  return <HeaderedSurfaceCard variant="rail" {...props} />;
}

/**
 * 見出し付きコンテンツカード（本文中の非チャートカード）。RailCard と同じ Card の組み立てで、
 * 見出しの色だけが違う (rail は muted、section は foreground)。
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
    "hover:bg-accent/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
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
