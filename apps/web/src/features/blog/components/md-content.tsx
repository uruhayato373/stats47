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

import { AdRow, type AdRowCell } from "@/features/ads";
import type { AffiliateCategory } from "@/features/ads/constants/affiliate-category";

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

interface MDContentProps {
    source: string;
    slug?: string;
    relatedArticleTitles?: Record<string, string>;
    /** 広告の段の計測に送る記事の意図軸 (GA4 の trackingCategory)。 */
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
                nodeChildren.every((c) => c.type === "element" && (c.tagName === "img" || c.tagName === "ad-slot" || c.tagName === "ad-row" || c.tagName === "data-source" || c.tagName === "source-link" || c.tagName === "affiliate-banner" || c.tagName === "affiliate-text" || c.tagName === "site-link"));
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
                    <AdRow cells={cells} position={`blog-row-${Number(index) + 1}`} trackingCategory={affiliateVertical ?? "other"} wide />
                </div>
            );
        },

        // 記事に手で置いた <ad-slot> は描かない (2026-11-12 オーナー決定)。手置きのある記事 (公開 861 本のうち 97 本・ブログの閲覧の 34%) は
        // 本文の段が入らず、手置きの枠もスマホでは出ないので、スマホの本文に広告が無かった。今は全記事に本文の段を入れる
        "ad-slot": () => null,

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

        // 記事に手で置いた PR のバナーとテキストリンクは描かない (2026-11-12 オーナー決定でアフィリエイトを止めた)。
        // 直接配置の台帳 (affiliate.direct-placements) と記事の原稿のタグは、戦略を練り直すときのために残す
        "affiliate-banner": () => null,
        "affiliate-text": () => null,

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
    affiliateVertical,
    adRows,
}: MDContentProps) {
    const mdComponents = useMemo(
        () =>
            makeMdComponents(
                slug,
                affiliateVertical,
                adRows,
            ),
        [slug, affiliateVertical, adRows],
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
                    <AdRow cells={endRow} position="blog-row-end" trackingCategory={affiliateVertical ?? "other"} wide />
                </div>
            )}
        </article>
    );
}
