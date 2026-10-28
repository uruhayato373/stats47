import { type ComponentPropsWithoutRef, type ReactNode } from "react";

import { ChevronDown } from "lucide-react";

import {
  CARD_SURFACE_CLASS,
  CardAction,
  CardHeader,
  CardTitle,
} from "../atoms/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../atoms/ui/collapsible";
import { cn } from "../lib/cn";

/*
 * 公開サイト・管理画面・動画アプリが共有するパネル部品 (2026-10-28 に apps/web/src/components/surface/SurfaceCard.tsx から移した)。
 * リンクとして描く部品 (SurfaceLinkCard・RailNavRow) は各アプリのリンク部品を使うので、アプリ側に残し、ここはクラスを返す関数だけを持つ。
 *
 * カードはテンプレートの Card (ui/card) の組み立て (data-slot="card" / card-header /
 * card-title / card-action / card-content) で描く (2026-10-27 オーナー決定)。
 *
 * 外枠と本文の要素は Card / CardContent の部品を通さず、同じ data-slot の要素をここで描く。
 * <html class="style-lyra"> の .cn-card / .cn-card-content はレイヤーの外で当たり、素の utility
 * (gap-0・py-0・bg-card・border・呼び出し側の p-0 / px-0 など) に必ず勝つため (2026-10-28 3 巡目。
 * 見出しの下の gap-4 と本文の px-4 が消えず、カルーセルのセルが縁から 32px 内側に寄っていた)。
 * cn-card を付けなければ、外枠の地・線・角丸は CARD_SURFACE_CLASS のトークン、余白は下の値と呼び出し側の
 * className だけで決まる。線は ring ではなく border (CARD_SURFACE_CLASS) で引く。カード同士を接ぐ節
 * (PageSections) は間に点線の帯を挟むので、線が二重に重ならない。
 *
 * 文字の大きさと行の高さは Card 部品 (.cn-card) と同じ text-sm/relaxed (見本の 14px / 22.75px。2026-10-28 に 12px から変更)。
 * <section> で描く SurfaceSection / RailCard / SectionCard は region の役割と aria-label を保つ。
 */
const CARD_LAYOUT_CLASS =
  "group/card flex flex-col gap-4 overflow-hidden py-4 text-sm/relaxed";

/** カード本文の横余白 (テンプレートの CardContent の px-4)。見出しの無いカードは外枠に付ける。 */
const CARD_CONTENT_INSET_CLASS = "px-4";

/*
 * Link を外枠にするカード (SurfaceLinkCard と getSurfaceCardClassName の利用側) はクラス文字列で描く。
 * 余白はテンプレートの CardContent と同じ p-4。
 */
const surfaceCardClass = cn(CARD_SURFACE_CLASS, "p-4 transition-colors");

const interactiveSurfaceClass =
  "hover:border-primary/40 hover:bg-accent/40";

/**
 * ポータルカード (注目ランキング・ブログ・知りたいこと) の画像枠の比率。
 * カード全体の比率は固定しない (中身の高さで伸ばす。2026-10-28 に固定比率 1.47:1 をやめた。
 * 390px で値と地図が潰れ、ブログ画像が帯になっていた)。
 */
export const PORTAL_CARD_ASPECT_CLASS = "aspect-video";

/** ポータルカードの内側余白。テンプレートの CardContent / KPI セルと同じ p-4。 */
export const PORTAL_CARD_PADDING_CLASS = "p-4";

/**
 * カルーセルのカード見出し (HorizontalCardCarouselFrame) の中に並ぶときは、
 * カードを入れ子にせずテンプレートの KPI 行と同じ区切り線のセルにする (枠・角丸・地を外す)。
 * 区切り線はカルーセル側の divide-x が持つ。
 */
export const PORTAL_CARD_CELL_CLASS =
  "in-data-[carousel=cells]:rounded-none in-data-[carousel=cells]:border-0 in-data-[carousel=cells]:bg-transparent";

/**
 * ポータルカードの題名。語の途中で切らない: 行数で省略せず、日本語は文節で折り返し
 * (word-break: auto-phrase)、最後の行が 1 語だけにならないよう text-pretty にする。
 */
export const PORTAL_CARD_TITLE_CLASS =
  "relative z-10 text-sm font-semibold leading-snug text-pretty [word-break:auto-phrase] transition-colors group-hover:text-primary";

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

/** テンプレートの Card と同じ組み立ての <section>。見出しの有無にかかわらず section の役割を保つ。 */
function CardSection({ className, ...props }: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      data-slot="card"
      data-size="default"
      className={cn(CARD_SURFACE_CLASS, CARD_LAYOUT_CLASS, className)}
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
    <div
      data-slot="card"
      data-size="default"
      className={cn(CARD_SURFACE_CLASS, CARD_LAYOUT_CLASS, CARD_CONTENT_INSET_CLASS, className)}
      {...props}
    >
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
    <CardSection className={cn(CARD_CONTENT_INSET_CLASS, className)} {...props}>
      {children}
    </CardSection>
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
    <div
      data-slot="card"
      data-size="default"
      className={cn(
        CARD_SURFACE_CLASS,
        CARD_LAYOUT_CLASS,
        CARD_CONTENT_INSET_CLASS,
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
  /** 見出しの左に置くアイコン (lucide)。大きさと色はここで size-4 / muted に揃える */
  icon?: ReactNode;
  children?: ReactNode;
  headerAction?: ReactNode;
  bodyClassName?: string;
  /**
   * 本文を折りたたむ (狭幅で本文下へ積まれるレール用)。テンプレートの Collapsible (Base UI) で描き、
   * 閉じているときは見出し行の高さだけになる。本文は DOM に残す (keepMounted。リンクをクロールさせるため)。
   */
  collapsible?: boolean;
  /** collapsible のときの初期状態 (既定: 閉) */
  defaultOpen?: boolean;
  /** 見出しの要素 (既定 h3)。ページの節見出しとして使うカードは h2 にする */
  headingAs?: "h2" | "h3";
}

/*
 * 見出し行と本文の余白 (見本の実測。ChartPanel と同じ値。docs/01_技術設計/04_デザインシステム.md「見本の実測値と部品の仕様」):
 * - 見出し行は px-4 pt-4 pb-4 + 下罫線。題は CardTitle の 16px / 22px・500 なので、見出し行は約 55px
 * - 操作 (CardAction) は常に見出しと同じ行の右端に置く (狭い幅でも下の行へ折り返さない)
 * - 本文は罫線から 16px (pt-4) で始め、下端も 16px (pb-4) で閉じる。レールのリンク行は自分で上下 6px
 *   (py-1.5) を持つので、本文の上下を 10px にして文字までを 16px に揃える
 * 外枠の py-4 と gap-4 は見出しがあるときに外し (py-0 gap-0)、余白は見出し行と本文が持つ。
 */
const BODY_PADDING_CLASS = {
  rail: "pt-2.5 pb-2.5",
  section: "pt-4 pb-4",
} as const;

/** 見出し行。下罫線付きの下の余白 16px は CardHeader の lyra ([.border-b]:pb-4) が持つ */
const HEADER_CLASS = "items-center px-4 pt-4 pb-4";

/** 題の文字の色 (大きさ・行の高さ・太さは CardTitle が持つ。ここで変えない)。 */
const HEADING_TEXT_CLASS = "font-medium text-foreground";

/**
 * 見出しの文字。日本語は文節で折り返し (word-break: auto-phrase)、行の長さを揃える (text-balance)。
 * 「全41件のランキン / グ」のような語中の折れを防ぐ。
 */
const HEADING_WRAP_CLASS = "text-balance [word-break:auto-phrase]";

/** 操作は見出しの 1 行だけにまたがらせ、縦の中央を見出しと揃える (CardAction 既定の row-span-2 を外す) */
const ACTION_CLASS = "row-span-1 flex items-center gap-2 self-center";

function HeaderedSurfaceCard({
  variant,
  title,
  icon,
  children,
  headerAction,
  className,
  bodyClassName,
  collapsible = false,
  defaultOpen = false,
  headingAs: Heading = "h3",
  ...props
}: HeaderedSurfaceCardProps) {
  const hasHeader = Boolean(title || icon || headerAction || collapsible);
  const hasBody = children !== undefined && children !== null && children !== false;
  const iconSlot = icon ? (
    <span
      aria-hidden="true"
      className="flex shrink-0 text-muted-foreground [&_svg]:size-4"
    >
      {icon}
    </span>
  ) : null;
  const headingClassName = cn(
    "min-w-0",
    HEADING_TEXT_CLASS,
    variant === "rail" ? "truncate" : HEADING_WRAP_CLASS,
  );
  // 本文は CardContent と同じ data-slot の要素で描く (.cn-card-content の px-4 に呼び出し側の px-0 が負けないように)
  const body = hasBody ? (
    <div
      data-slot="card-content"
      className={cn(
        CARD_CONTENT_INSET_CLASS,
        hasHeader ? BODY_PADDING_CLASS[variant] : undefined,
        bodyClassName,
      )}
    >
      {children}
    </div>
  ) : null;

  if (collapsible) {
    return (
      <Collapsible
        defaultOpen={defaultOpen}
        render={<section />}
        data-slot="card"
        data-size="default"
        className={cn(CARD_SURFACE_CLASS, CARD_LAYOUT_CLASS, "group/collapsible gap-0 py-0", className)}
        {...props}
      >
        <CardHeader
          className={cn(
            HEADER_CLASS,
            "relative has-focus-visible:ring-2 has-focus-visible:ring-inset has-focus-visible:ring-ring",
          )}
        >
          <CardTitle className="flex min-w-0 items-center gap-2">
            {iconSlot}
            <Heading className={headingClassName}>
              {/* 見出しの中にボタンを置く (見出しの役割を保つ)。after で見出し行全体を押せるようにする */}
              <CollapsibleTrigger className="text-left outline-hidden after:absolute after:inset-0 after:content-['']">
                {title}
              </CollapsibleTrigger>
            </Heading>
          </CardTitle>
          <CardAction className={cn(ACTION_CLASS, "relative")}>
            {headerAction && <span className="relative z-10">{headerAction}</span>}
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none size-4 text-muted-foreground transition-transform group-data-open/collapsible:rotate-180"
            />
          </CardAction>
        </CardHeader>
        {/* 見出しと本文の区切りはこの罫線 1 本だけ (本文の上余白は BODY_PADDING_CLASS が持つ) */}
        {body && (
          <CollapsibleContent keepMounted className="border-t">
            {body}
          </CollapsibleContent>
        )}
      </Collapsible>
    );
  }

  return (
    <CardSection className={cn(hasHeader && "gap-0 py-0", className)} {...props}>
      {hasHeader && (
        <CardHeader className={cn(HEADER_CLASS, hasBody && "border-b")}>
          <CardTitle className="flex min-w-0 items-center gap-2">
            {iconSlot}
            {title && <Heading className={headingClassName}>{title}</Heading>}
          </CardTitle>
          {headerAction && <CardAction className={ACTION_CLASS}>{headerAction}</CardAction>}
        </CardHeader>
      )}
      {body}
    </CardSection>
  );
}

interface RailCardProps extends Omit<ComponentPropsWithoutRef<"section">, "title"> {
  title?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  headerAction?: ReactNode;
  bodyClassName?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  headingAs?: "h2" | "h3";
}

/**
 * レール内の独立したまとまり 1 つ = RailCard 1 枚 (左右レール共通の Surface 契約)。
 * Card + CardHeader (border-b) + CardTitle (アイコン + h3) + CardAction + CardContent で組む。
 * 見出しは左右レール・本文カードとも text-foreground font-medium。本文が空なら CardContent を描かない。
 * レール側で独自の枠・背景・padding を足さない。
 * 正典: docs/01_技術設計/04_デザインシステム.md「レール UI 契約」
 */
export function RailCard(props: RailCardProps) {
  return <HeaderedSurfaceCard variant="rail" {...props} />;
}

/**
 * 見出し付きコンテンツカード（本文中の非チャートカード）。RailCard と同じ Card の組み立てで、
 * 違いは見出しの省略 (rail は 1 行で truncate) と本文上の余白だけ。
 */
export function SectionCard(props: RailCardProps) {
  return <HeaderedSurfaceCard variant="section" {...props} />;
}

interface RailLinkListProps extends ComponentPropsWithoutRef<"nav"> {
  children: ReactNode;
  /** 行の間に区切り線を引く (既定: 引かない) */
  divided?: boolean;
}

export function RailLinkList({
  children,
  className,
  divided = false,
  ...props
}: RailLinkListProps) {
  return (
    <nav
      className={cn("flex flex-col", divided && "divide-y divide-border", className)}
      {...props}
    >
      {children}
    </nav>
  );
}

/**
 * リンクの行の寸法。見本 (shadcndashboard のサイドバーの項目) の値: 文字 14px・余白 8px・最小の高さ 40px。
 * モバイルはタップ領域 44px (`min-h-11`)、sm 以上で 40px (`sm:min-h-10`)。
 * 左右の余白 8px は行の外へ -mx-2 で出し、文字の左端をカード本文の端 (見出しの文字) にそろえる
 * (見本のサイドバーもグループの余白 8px + 項目の余白 8px で文字が見出しとそろう)。
 * `RailNavRow`・`RailNavRowButton`・`RailLinksCard` の記事の行 (ContentNavigation) が共有する。
 * 呼び出し側で文字の大きさ・余白・高さを上書きしない (`design-system:check` の `link-row-no-size-override`)。
 * 正典: docs/01_技術設計/04_デザインシステム.md「見本の実測値と部品の仕様」のリンクの行
 */
export const LINK_ROW_SIZE_CLASS =
  "-mx-2 w-[calc(100%+1rem)] min-h-11 p-2 text-sm sm:min-h-10";

/**
 * レール内リンク行の共通 class。左右レール・カテゴリ導線・ページ内ナビが同じ行を使う。
 *
 * - 寸法は `LINK_ROW_SIZE_CLASS` の 1 種類 (密度の切り替えは持たない)
 * - 通常行は透明背景。hover と選択中 (aria-current / aria-pressed) だけ背景を変える
 * - active はカラーバー (inset shadow / border-l) ではなく `bg-accent font-semibold text-primary`
 */
export function railNavRowClassName({
  active = false,
  className,
}: {
  active?: boolean;
  className?: string;
} = {}) {
  return cn(
    "group flex items-center justify-between gap-2 text-left text-foreground transition-colors",
    LINK_ROW_SIZE_CLASS,
    "hover:bg-accent/50 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
    active && "bg-accent font-semibold text-primary",
    className,
  );
}

interface RailNavRowButtonProps extends ComponentPropsWithoutRef<"button"> {
  children: ReactNode;
  /** 押下状態 (フィルタなど)。aria-pressed と active 表示を同時に出す */
  pressed?: boolean;
  trailing?: ReactNode;
}

/** リンクではなく状態を切り替える行 (aria-pressed)。見た目は RailNavRow と同じ */
export function RailNavRowButton({
  children,
  className,
  pressed = false,
  trailing,
  ...props
}: RailNavRowButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={railNavRowClassName({ active: pressed, className })}
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
