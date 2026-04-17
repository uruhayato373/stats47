"use client";

import { type ReactNode, useMemo } from "react";

import Image from "next/image";
import Link from "next/link";

import { ArrowRight, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

import { BannerAd } from "@/features/ads";

import { AdSenseAd, RANKING_PAGE_FOOTER } from "@/lib/google-adsense";

import { preprocessCallouts } from "./md-preprocessor";
import { MarkdownRankingTable } from "./tables/MarkdownRankingTable";

interface MDContentProps {
    source: string;
    slug?: string;
    relatedArticleTitles?: Record<string, string>;
}

interface ComponentProps {
    children?: ReactNode;
    [key: string]: unknown;
}

function makeMdComponents(slug?: string): Record<string, React.ComponentType<ComponentProps>> {
    return {
        h2: ({ children, ...props }: ComponentProps) => (
            <h2
                className="mt-12 mb-6 scroll-mt-20 border-y border-border py-3 text-center text-2xl font-bold"
                {...props}
            >
                {children}
            </h2>
        ),
        h3: ({ children, ...props }: ComponentProps) => (
            <h3
                className="mt-8 mb-3 scroll-mt-20 text-xl font-semibold"
                {...props}
            >
                {children}
            </h3>
        ),

        a: ({ href, children, ...props }: ComponentProps & { href?: string }) => {
            const isExternal = typeof href === "string" && href.startsWith("http");
            if (isExternal) {
                return (
                    <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-4 hover:text-primary/80"
                        {...props}
                    >
                        {children}
                    </a>
                );
            }
            return (
                <Link
                    href={typeof href === "string" ? href : "#"}
                    className="text-primary underline underline-offset-4 hover:text-primary/80"
                >
                    {children}
                </Link>
            );
        },

        img: ({ src, alt }: ComponentProps & { src?: string; alt?: string }) => {
            if (typeof src !== "string") return null;
            const altText = typeof alt === "string" ? alt : "";
            const resolvedSrc =
                slug && !src.startsWith("http") && !src.startsWith("/")
                    ? `https://storage.stats47.jp/blog/${slug}/${src}`
                    : src;
            // SVG はファイル名で判定してアスペクト比予約 (CLS 対策)。
            // 2026-04 Web Analytics で spending-ranking.svg が LCP 5,496ms、CLS 原因の 1 つ。
            // 実サイズは frontmatter 未導入のため 16:9 (800:450) を予約し、CSS の aspect-ratio で
            // レンダリング前にレイアウト確定させる。
            const isSvg = resolvedSrc.toLowerCase().endsWith(".svg");
            return (
                <span
                    className="block mt-2 -mx-6 sm:-mx-8 overflow-x-auto"
                    style={{ aspectRatio: isSvg ? "16 / 9" : undefined }}
                >
                    <Image
                        src={resolvedSrc}
                        alt={altText}
                        width={800}
                        height={450}
                        className="h-auto w-full rounded-lg"
                        sizes="(max-width: 800px) 100vw, 800px"
                        decoding="async"
                        loading="lazy"
                        unoptimized
                    />
                </span>
            );
        },

        table: ({ children, ...props }: ComponentProps) => (
            <div className="my-6 overflow-x-auto">
                <table className="min-w-full border-collapse text-sm" {...props}>
                    {children}
                </table>
            </div>
        ),
        thead: ({ children, ...props }: ComponentProps) => (
            <thead className="border-b bg-muted/50" {...props}>
                {children}
            </thead>
        ),
        th: ({ children, ...props }: ComponentProps) => (
            <th className="px-4 py-2 text-left font-semibold" {...props}>
                {children}
            </th>
        ),
        td: ({ children, ...props }: ComponentProps) => (
            <td className="border-b px-4 py-2" {...props}>
                {children}
            </td>
        ),

        blockquote: ({ children }: ComponentProps) => (
            <blockquote className="my-4 border-l-4 border-primary/30 pl-4 italic text-muted-foreground [quotes:none]">
                {children}
            </blockquote>
        ),

        pre: ({ children, ...props }: ComponentProps) => (
            <pre
                className="my-4 overflow-x-auto rounded-lg bg-muted p-4 text-sm"
                {...props}
            >
                {children}
            </pre>
        ),
        code: ({ children, className: codeClassName, ...props }: ComponentProps & { className?: string }) => {
            if (!codeClassName) {
                return (
                    <code className="rounded bg-muted px-1.5 py-0.5 text-sm" {...props}>
                        {children}
                    </code>
                );
            }
            return (
                <code className={codeClassName} {...props}>
                    {children}
                </code>
            );
        },

        ul: ({ children, ...props }: ComponentProps) => (
            <ul className="my-4 list-disc space-y-1 pl-6" {...props}>
                {children}
            </ul>
        ),
        ol: ({ children, ...props }: ComponentProps) => (
            <ol className="my-4 list-decimal space-y-1 pl-6" {...props}>
                {children}
            </ol>
        ),

        p: ({ children, node, ...props }: ComponentProps & { node?: { children?: Array<{ type: string; tagName?: string }> } }) => {
            const nodeChildren = node?.children ?? [];
            const hasBlockElement =
                nodeChildren.length > 0 &&
                nodeChildren.every((c) => c.type === "element" && (c.tagName === "img" || c.tagName === "ad-slot" || c.tagName === "data-source" || c.tagName === "source-link" || c.tagName === "affiliate-banner" || c.tagName === "ranking-table" || c.tagName === "site-link"));
            if (hasBlockElement) return <>{children}</>;
            return (
                <p className="my-3 leading-7" {...props}>
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

        "ad-slot": () => (
            <div className="my-8 flex justify-center not-prose">
                <AdSenseAd
                    format={RANKING_PAGE_FOOTER.format}
                    slotId={RANKING_PAGE_FOOTER.slotId}
                />
            </div>
        ),

        "data-source": ({ url, label, year, note }: ComponentProps & { url?: string; label?: string; year?: string; note?: string }) => (
            <span className="-mt-1 mb-6 flex justify-end not-prose">
                <span className="inline-flex items-start gap-1.5 text-xs text-muted-foreground">
                    <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
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

        "source-link": ({ href, children }: ComponentProps & { href?: string }) => (
            <span className="my-4 block not-prose">
                <Link
                    href={href ?? "#"}
                    className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                >
                    <span className="flex items-center gap-2">
                        {children}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                </Link>
            </span>
        ),

        "affiliate-banner": ({ src, href, tracking, width, height, label }: ComponentProps & { src?: string; href?: string; tracking?: string; width?: string; height?: string; label?: string }) => (
            <div className="my-8 not-prose">
                <BannerAd
                    href={href ?? "#"}
                    imageUrl={src ?? ""}
                    trackingPixelUrl={tracking}
                    width={Number(width) || null}
                    height={Number(height) || null}
                    label={label ?? ""}
                    position="article-inline"
                />
            </div>
        ),

        "related-articles": ({ children }: ComponentProps) => (
            <div className="my-8 not-prose overflow-hidden rounded-lg border-2 border-primary/30">
                <div className="bg-primary/10 px-4 py-2.5">
                    <span className="text-sm font-bold text-primary">関連記事</span>
                </div>
                <div className="divide-y divide-border">{children}</div>
            </div>
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

        "ranking-table": ({ "ranking-key": rankingKey, title, "value-label": valueLabel, limit, order, paginated, "display-unit": displayUnit }: ComponentProps & { "ranking-key"?: string; "value-label"?: string; "display-unit"?: string }) => {
            if (!rankingKey) return null;
            return (
                <div className="my-6 not-prose">
                    <MarkdownRankingTable
                        rankingKey={rankingKey as string}
                        title={title as string | undefined}
                        valueLabel={valueLabel as string | undefined}
                        limit={limit != null ? Number(limit) : undefined}
                        order={order as "top" | "bottom" | undefined}
                        paginated={paginated === "true"}
                        displayUnit={displayUnit as string | undefined}
                    />
                </div>
            );
        },

        "site-link": ({ category }: ComponentProps & { category?: string }) => {
            if (!category) return null;
            return (
                <div className="my-6 not-prose">
                    <Link
                        href={`/category/${category}`}
                        className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                    >
                        <span>このカテゴリの全ランキングを見る</span>
                        <ArrowRight className="h-4 w-4 shrink-0" />
                    </Link>
                </div>
            );
        },
    };
}

export function MDContent({ source, slug, relatedArticleTitles }: MDContentProps) {
    const mdComponents = useMemo(() => makeMdComponents(slug), [slug]);
    const processed = useMemo(() => preprocessCallouts(source, relatedArticleTitles), [source, relatedArticleTitles]);
    return (
        <article className="prose prose-zinc dark:prose-invert max-w-none" suppressHydrationWarning>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={mdComponents}
            >
                {processed}
            </ReactMarkdown>
        </article>
    );
}
