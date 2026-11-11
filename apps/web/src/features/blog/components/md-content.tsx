"use client";

import { type ReactNode, useMemo } from "react";


import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@stats47/components";
import { hrefFor } from "@stats47/data-configs/content/href";
import { ArrowRight, BookOpenText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

import Link from "@/components/atoms/SiteLink";
import { SurfaceLinkCard, SurfaceSection } from "@/components/surface";

import { AdCell, AdRow, type AdRowCell, AffiliateTextAdList, BannerAd } from "@/features/ads";
import type { AffiliateCategory } from "@/features/ads/constants/affiliate-category";
import { MANUAL_AD_DESKTOP_ONLY_CLASS } from "@/features/ads/constants/manual-ad-policy";

import { adSlotBox } from "@/lib/ad-placements";
import {
    ADSENSE_DISPLAY_ENABLED,
    AdSenseAd,
    BLOG_ARTICLE_INLINE,
} from "@/lib/google-adsense";

import { R2_PUBLIC_BASE_URL } from "@/config/site";

import { injectAdRows } from "../lib/ad-row-positions";
import { buildHeadingSlug } from "../lib/heading-slug";
import { blogR2Key } from "../r2-key";

import { Callout } from "./Callout";
import { toCalloutType } from "./callout-config";
import { preprocessCallouts } from "./md-preprocessor";
import { RankingLinkCard } from "./RankingLinkCard";
import { ResponsiveArticleImage } from "./ResponsiveArticleImage";

/** 見出しの children から純粋なテキストを抽出 (TOC anchor 用) */
function extractTextFromChildren(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(extractTextFromChildren).join("");
  if (children && typeof children === "object" && "props" in children) {
    const props = (children as { props?: { children?: ReactNode } }).props;
    return extractTextFromChildren(props?.children);
  }
  return "";
}

interface AffiliateBannerData {
    id?: string;
    href: string;
    imageUrl: string;
    trackingPixelUrl?: string | null;
    width?: number | null;
    height?: number | null;
    title?: string;
}

/** 本文インラインのテキストリンク広告 1 件 (サーバー側で vertical 解決済み)。 */
interface AffiliateTextAdData {
    id: string;
    title: string;
    href: string;
    trackingPixelUrl?: string | null;
    /** GA4 `affiliate_vertical` に送る広告自身の意図軸。解決層 (`toTextAd`) が確定させる。 */
    vertical: AffiliateCategory | null;
}

interface MDContentProps {
    source: string;
    slug?: string;
    relatedArticleTitles?: Record<string, string>;
    affiliateBannersByCategory?: Record<string, AffiliateBannerData>;
    /** 本文中に差し込むテキストリンク。記事の tagKeys から解決済みで、順に 1 件ずつ消費する。 */
    affiliateTextAds?: AffiliateTextAdData[];
    /** テキストリンクのテーマ色に使う vertical。 */
    affiliateVertical?: AffiliateCategory | null;
    /**
     * 広告の段 (AdSense と PR。2026-11-03 オーナー決定)。最後の 1 段を記事の末尾に、残りを本文の h2 の
     * 2・4・6 番目の直前に置く (`<ad-row index="N">`)。見出しが足りなければ本文の段は減らす
     */
    adRows?: AdRowCell[][];
}

interface ComponentProps {
    children?: ReactNode;
    [key: string]: unknown;
}

function makeMdComponents(
    slug?: string,
    affiliateBannersByCategory?: Record<string, AffiliateBannerData>,
    affiliateTextAds?: AffiliateTextAdData[],
    affiliateVertical?: AffiliateCategory | null,
    adRows?: AdRowCell[][],
): Record<string, React.ComponentType<ComponentProps>> {
    return {
        // 見出し・リンクの見た目は globals.css の .blog-news-article が持つ (Soft Editorial)。
        // コンポーネント側は id / scroll 位置などの構造のみ担当する。
        h2: ({ children, ...props }: ComponentProps) => {
            const id = buildHeadingSlug(extractTextFromChildren(children));
            return (
                <h2 id={id} className="scroll-mt-20" {...props}>
                    {children}
                </h2>
            );
        },
        h3: ({ children, ...props }: ComponentProps) => {
            const id = buildHeadingSlug(extractTextFromChildren(children));
            return (
                <h3 id={id} className="scroll-mt-20" {...props}>
                    {children}
                </h3>
            );
        },

        a: ({ href, children, ...props }: ComponentProps & { href?: string }) => {
            const isExternal = typeof href === "string" && href.startsWith("http");
            if (isExternal) {
                return (
                    <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
                        {children}
                    </a>
                );
            }
            return (
                <Link href={typeof href === "string" ? href : "#"} data-nav-surface="blog_body">
                    {children}
                </Link>
            );
        },

        img: ({ src, alt }: ComponentProps & { src?: string; alt?: string }) => {
            if (typeof src !== "string") return null;
            const altText = typeof alt === "string" ? alt : "";
            const resolvedSrc =
                slug && !src.startsWith("http") && !src.startsWith("/")
                    ? `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL || R2_PUBLIC_BASE_URL}/${blogR2Key(slug, src)}`
                    : src;
            const isSvg = resolvedSrc.endsWith(".svg");
            return (
                <span
                    className={`block mt-2 overflow-x-hidden not-prose ${isSvg ? "-mx-4 md:mx-auto md:max-w-2xl" : "-mx-4"}`}
                >
                    <ResponsiveArticleImage src={resolvedSrc} alt={altText} />
                </span>
            );
        },

        table: ({ children, ...props }: ComponentProps) => (
            <div className="google-anno-skip my-6">
                <Table {...props}>
                    {children}
                </Table>
            </div>
        ),
        thead: ({ children, ...props }: ComponentProps) => (
            <TableHeader {...props}>
                {children}
            </TableHeader>
        ),
        tbody: ({ children, ...props }: ComponentProps) => (
            <TableBody {...props}>
                {children}
            </TableBody>
        ),
        tr: ({ children, ...props }: ComponentProps) => (
            <TableRow {...props}>
                {children}
            </TableRow>
        ),
        th: ({ children, ...props }: ComponentProps) => (
            <TableHead {...props}>
                {children}
            </TableHead>
        ),
        td: ({ children, ...props }: ComponentProps) => (
            <TableCell {...props}>
                {children}
            </TableCell>
        ),

        blockquote: ({ children }: ComponentProps) => (
            <blockquote className="google-anno-skip my-4 border-l-4 border-primary/30 pl-4 italic text-muted-foreground [quotes:none]">
                {children}
            </blockquote>
        ),

        pre: ({ children, ...props }: ComponentProps) => (
            <pre
                className="my-4 overflow-x-auto rounded-content border border-border bg-muted p-4 text-sm leading-relaxed text-foreground shadow-xs"
                {...props}
            >
                {children}
            </pre>
        ),
        code: ({ children, className: codeClassName, ...props }: ComponentProps & { className?: string }) => {
            // インラインコード: muted 背景 + 枠線 + 等幅で本文と区別する
            if (!codeClassName) {
                return (
                    <code
                        className="rounded border border-border bg-muted px-1.5 py-0.5 text-[0.92em] font-mono text-foreground"
                        {...props}
                    >
                        {children}
                    </code>
                );
            }
            // コードブロック内の <code>: 親 <pre> の配色を継承
            return (
                <code className={codeClassName} {...props}>
                    {children}
                </code>
            );
        },

        // 本文の .blog-news-article li (上下 0.4rem) より強い詳細度で項目間を 4px にする。
        // v4 の space-y は :where() で詳細度が低く、本文の li 指定に負けて項目間が広がる
        ul: ({ children, ...props }: ComponentProps) => (
            <ul className="my-4 list-disc pl-6 [&>li+li]:mt-1 [&>li+li]:mb-0" {...props}>
                {children}
            </ul>
        ),
        ol: ({ children, ...props }: ComponentProps) => (
            <ol className="my-4 list-decimal pl-6 [&>li+li]:mt-1 [&>li+li]:mb-0" {...props}>
                {children}
            </ol>
        ),

        p: ({ children, node, ...props }: ComponentProps & { node?: { children?: Array<{ type: string; tagName?: string }> } }) => {
            const nodeChildren = node?.children ?? [];
            const hasBlockElement =
                nodeChildren.length > 0 &&
                nodeChildren.every((c) => c.type === "element" && (c.tagName === "img" || c.tagName === "ad-slot" || c.tagName === "data-source" || c.tagName === "source-link" || c.tagName === "affiliate-banner" || c.tagName === "affiliate-text" || c.tagName === "site-link"));
            if (hasBlockElement) return <>{children}</>;
            return (
                // Zenn 準拠: 行間 1.9 / 連続段落間 24px (p+p{margin-top:1.5em} の移植)
                <p className="my-4 leading-[1.9] [&+p]:mt-6" {...props}>
                    {children}
                </p>
            );
        },

        hr: () => <hr className="my-8 border-border" />,

        svg: ({ children, ...props }: ComponentProps) => (
            <div className="max-w-3xl mx-auto my-8 overflow-x-auto">
                <svg {...props}>{children}</svg>
            </div>
        ),

        // 本文の広告の段 (injectAdRows が h2 の直前に差し込む)。中身が無い段は何も描かない
        "ad-row": ({ index }: ComponentProps & { index?: string }) => {
            const cells = adRows?.[Number(index)];
            if (!cells || cells.length === 0) return null;
            return (
                <div className="my-8 not-prose">
                    <AdRow cells={cells} position={`blog-row-${Number(index) + 1}`} trackingCategory={affiliateVertical ?? "other"} />
                </div>
            );
        },

        // 記事に手で置いた <ad-slot> (自動の差し込みは広告の段に移した)。モバイルでは描画しない (2026-08-04)。
        // 理由と実測は features/ads/constants/manual-ad-policy.ts を参照。
        "ad-slot": () =>
            ADSENSE_DISPLAY_ENABLED ? (
                <AdCell label="広告" className={`${MANUAL_AD_DESKTOP_ONLY_CLASS} my-8 not-prose px-0!`}>
                    <AdSenseAd
                        format={BLOG_ARTICLE_INLINE.format}
                        slotId={BLOG_ARTICLE_INLINE.slotId}
                        showLabel={false}
                        // 箱は広告の枠の台帳の「本文の AdSense」(本番の実測 幅いっぱい × 280px。デスクトップだけ)
                        slotBox={adSlotBox("adsense-body")}
                    />
                </AdCell>
            ) : null,

        "data-source": ({ url, label, year, note }: ComponentProps & { url?: string; label?: string; year?: string; note?: string }) => (
            <span className="google-anno-skip -mt-1 mb-6 flex justify-end not-prose">
                <span className="inline-flex items-start gap-1.5 text-xs text-muted-foreground">
                    <BookOpenText className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                    <span>
                        出典：{url ? (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
                                {label || url}
                            </a>
                        ) : (
                            <span>{label}</span>
                        )}
                        {year && <span className="ml-1">（{year}）</span>}
                        {note && <span className="ml-1">{note}</span>}
                    </span>
                </span>
            </span>
        ),

        // 図に属する導線なので上は詰め (直上の図・出典行との間)、下は次の本文と切り離す。
        "source-link": ({ href, children }: ComponentProps & { href?: string }) =>
            href ? (
                <span className="google-anno-skip mb-8 mt-4 block not-prose">
                    <RankingLinkCard href={href}>{children}</RankingLinkCard>
                </span>
            ) : null,

        // 本文インラインのテキストリンク広告。index 属性 (0 始まり) で解決済み配列から 1 件消費する。
        // 描画は既存 AffiliateTextAdList を再利用 (PR ラベル / rel="sponsored" / GA4 計装が入っている)。
        // 在庫が index に足りなければ何も出さない (空枠を残さない)。
        "affiliate-text": ({ index }: ComponentProps & { index?: string }) => {
            const i = Number(index);
            const ad = affiliateTextAds?.[Number.isFinite(i) ? i : 0];
            if (!ad) return null;
            return (
                <div className="my-8 not-prose">
                    <AffiliateTextAdList
                        ads={[ad]}
                        affiliateCategory={affiliateVertical ?? null}
                        position="article-inline"
                    />
                </div>
            );
        },

        "affiliate-banner": ({ src, href, tracking, width, height, label, category, index }: ComponentProps & { src?: string; href?: string; tracking?: string; width?: string; height?: string; label?: string; category?: string; index?: string }) => {
            // index 指定は旧来の自動挿入のバナー枠 (2026-11-03 に広告の段へ移した)。手で書く記法ではないので何も出さない
            if (index != null) return null;
            if (category && affiliateBannersByCategory?.[category]) {
                const b = affiliateBannersByCategory[category];
                return (
                    <div className="my-8 not-prose">
                        <BannerAd
                            href={b.href}
                            imageUrl={b.imageUrl}
                            trackingPixelUrl={b.trackingPixelUrl}
                            width={b.width ?? null}
                            height={b.height ?? null}
                            label={b.title ?? ""}
                            // 台帳の vertical キーをそのまま計測へ渡す (既定 "other" を流さない)。
                            category={category}
                            position="article-inline"
                            adId={b.id}
                        />
                    </div>
                );
            }
            return (
                <div className="my-8 not-prose">
                    <BannerAd
                        href={href ?? "#"}
                        imageUrl={src ?? ""}
                        trackingPixelUrl={tracking}
                        width={Number(width) || null}
                        height={Number(height) || null}
                        label={label ?? ""}
                        category={category ?? affiliateVertical ?? "other"}
                        position="article-inline"
                    />
                </div>
            );
        },

        // `> [!NOTE]` 等 (md-preprocessor が <callout type="note"> に変換)。見た目は Callout が持つ。
        callout: ({ type, children }: ComponentProps & { type?: string }) => {
            const calloutType = toCalloutType(type);
            return calloutType ? <Callout type={calloutType}>{children}</Callout> : <>{children}</>;
        },

        "related-articles": ({ children }: ComponentProps) => (
            <SurfaceSection className="google-anno-skip my-8 overflow-hidden border-primary/30 p-0">
                <div className="bg-primary/10 px-4 py-2.5">
                    <span className="text-sm font-bold text-primary">関連記事</span>
                </div>
                <div className="divide-y divide-border">{children}</div>
            </SurfaceSection>
        ),

        "related-article-link": ({ href, children }: ComponentProps & { href?: string }) => (
            <Link
                href={href ?? "#"}
                className="flex items-center gap-2 px-4 py-3 text-sm text-foreground transition-colors hover:bg-accent"
            >
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span>{children}</span>
            </Link>
        ),


        "site-link": ({ category }: ComponentProps & { category?: string }) => {
            if (!category) return null;
            return (
                <div className="my-6 not-prose">
                    <SurfaceLinkCard
                        href={hrefFor("category", { categoryKey: category })}
                        className="flex items-center justify-between border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10"
                    >
                        <span>このカテゴリの全ランキングを見る</span>
                        <ArrowRight className="h-4 w-4 shrink-0" />
                    </SurfaceLinkCard>
                </div>
            );
        },
    };
}

export function MDContent({
    source,
    slug,
    relatedArticleTitles,
    affiliateBannersByCategory,
    affiliateTextAds,
    affiliateVertical,
    adRows,
}: MDContentProps) {
    const mdComponents = useMemo(
        () =>
            makeMdComponents(
                slug,
                affiliateBannersByCategory,
                affiliateTextAds,
                affiliateVertical,
                adRows,
            ),
        [slug, affiliateBannersByCategory, affiliateTextAds, affiliateVertical, adRows],
    );
    const endRow = adRows?.[adRows.length - 1];
    const processed = useMemo(
        () =>
            // 最後の 1 段は記事の末尾 (下) に置くので、本文には残りを差し込む
            injectAdRows(preprocessCallouts(source, relatedArticleTitles), Math.max(0, (adRows?.length ?? 0) - 1)),
        [source, relatedArticleTitles, adRows],
    );
    return (
        <article
            className="blog-news-article prose prose-zinc dark:prose-invert max-w-none prose-pre:my-4 prose-pre:bg-muted prose-pre:text-foreground prose-pre:border prose-pre:border-border prose-pre:shadow-xs prose-pre:p-4 prose-code:before:content-none prose-code:after:content-none"
            suppressHydrationWarning
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={mdComponents}
            >
                {processed}
            </ReactMarkdown>
            {/* 記事の末尾の広告の段 (手で広告を置いた記事にも出す) */}
            {endRow && endRow.length > 0 && (
                <div className="my-8 not-prose">
                    <AdRow cells={endRow} position="blog-row-end" trackingCategory={affiliateVertical ?? "other"} />
                </div>
            )}
        </article>
    );
}
