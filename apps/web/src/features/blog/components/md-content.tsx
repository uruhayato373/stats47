"use client";

import { type ReactNode, useMemo } from "react";

import Image from "next/image";
import Link from "next/link";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@stats47/components";
import { ArrowRight, ExternalLink } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";


import { SurfaceLinkCard, SurfaceSection } from "@/components/surface";

import { AffiliateTextAdList, BannerAd } from "@/features/ads";
import type { AffiliateCategory } from "@/features/ads/constants/affiliate-category";
import { MANUAL_AD_DESKTOP_ONLY_CLASS } from "@/features/ads/constants/manual-ad-policy";

import {
    ADSENSE_DISPLAY_ENABLED,
    AdSenseAd,
    BLOG_ARTICLE_INLINE,
} from "@/lib/google-adsense";

import { buildHeadingSlug } from "../lib/heading-slug";
import { type InlineAffiliateBanner } from "../utils";

import { preprocessCallouts } from "./md-preprocessor";
import { MarkdownRankingTable } from "./tables/MarkdownRankingTable";

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
     * 本文・記事末尾に差し込む 300x250 バナー。記事の tagKeys から解決済みで、
     * `<affiliate-banner index="N">` が順に 1 件ずつ消費する。
     */
    affiliateBanners?: InlineAffiliateBanner[];
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
    affiliateBanners?: InlineAffiliateBanner[],
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
                <Link href={typeof href === "string" ? href : "#"}>
                    {children}
                </Link>
            );
        },

        img: ({ src, alt }: ComponentProps & { src?: string; alt?: string }) => {
            if (typeof src !== "string") return null;
            const altText = typeof alt === "string" ? alt : "";
            const resolvedSrc =
                slug && !src.startsWith("http") && !src.startsWith("/")
                    ? `https://storage.stats47.jp/app/blog/${slug}/${src}`
                    : src;
            const isSvg = resolvedSrc.endsWith(".svg");
            return (
                <span
                    className={`block mt-2 overflow-x-hidden not-prose ${isSvg ? "-mx-5 sm:-mx-8 md:mx-auto md:max-w-2xl" : "-mx-5 sm:-mx-8"}`}
                >
                    <Image
                        src={resolvedSrc}
                        alt={altText}
                        width={800}
                        height={450}
                        className="h-auto w-full rounded-lg"
                        sizes="(max-width: 768px) 100vw, 672px"
                        decoding="async"
                        loading="lazy"
                        unoptimized
                    />
                </span>
            );
        },

        table: ({ children, ...props }: ComponentProps) => (
            <div className="my-6">
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
            <blockquote className="my-4 border-l-4 border-primary/30 pl-4 italic text-muted-foreground [quotes:none]">
                {children}
            </blockquote>
        ),

        pre: ({ children, ...props }: ComponentProps) => (
            <pre
                className="my-4 overflow-x-auto rounded-lg border border-slate-700 bg-slate-900 p-4 text-sm leading-relaxed text-slate-100 shadow-sm"
                {...props}
            >
                {children}
            </pre>
        ),
        code: ({ children, className: codeClassName, ...props }: ComponentProps & { className?: string }) => {
            // インラインコード: 明るい灰色背景 + 濃い赤茶系文字 (本文との対比を確保)
            if (!codeClassName) {
                return (
                    <code
                        className="rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[0.92em] font-mono text-red-700"
                        {...props}
                    >
                        {children}
                    </code>
                );
            }
            // コードブロック内の <code>: 親 <pre> の dark 配色を継承 (text-slate-100)
            return (
                <code className={`${codeClassName} text-slate-100`} {...props}>
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
                nodeChildren.every((c) => c.type === "element" && (c.tagName === "img" || c.tagName === "ad-slot" || c.tagName === "data-source" || c.tagName === "source-link" || c.tagName === "affiliate-banner" || c.tagName === "affiliate-text" || c.tagName === "ranking-table" || c.tagName === "site-link"));
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

        // モバイルでは手置き枠を描画しない (2026-08-04)。
        // 理由と実測は features/ads/constants/manual-ad-policy.ts を参照。
        "ad-slot": () =>
            ADSENSE_DISPLAY_ENABLED ? (
                <div className={`${MANUAL_AD_DESKTOP_ONLY_CLASS} my-8 not-prose`}>
                    <AdSenseAd
                        format={BLOG_ARTICLE_INLINE.format}
                        slotId={BLOG_ARTICLE_INLINE.slotId}
                        showLabel={false}
                    />
                </div>
            ) : null,

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
                <SurfaceLinkCard
                    href={href ?? "#"}
                    className="flex items-center justify-between border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10"
                >
                    <span className="flex items-center gap-2">
                        {children}
                    </span>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                </SurfaceLinkCard>
            </span>
        ),

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

        "affiliate-banner": ({ src, href, tracking, width, height, label, category, index, slot }: ComponentProps & { src?: string; href?: string; tracking?: string; width?: string; height?: string; label?: string; category?: string; index?: string; slot?: string }) => {
            // index 指定 = 自動挿入されたバナー枠。解決済み配列から 1 件消費する。
            // 在庫が index に足りなければ何も出さない (空枠を残さない)。
            if (index != null) {
                const i = Number(index);
                const b = affiliateBanners?.[Number.isFinite(i) ? i : 0];
                if (!b) return null;
                return (
                    <div className="my-8 not-prose">
                        <BannerAd
                            href={b.href}
                            imageUrl={b.imageUrl}
                            trackingPixelUrl={b.trackingPixelUrl}
                            width={b.width}
                            height={b.height}
                            label={b.title}
                            // ★ vertical を渡さないと BannerAd の既定 "other" が
                            //   affiliate_vertical に流れ内訳が壊れる。
                            category={b.vertical ?? affiliateVertical ?? "other"}
                            position={slot === "end" ? "article-end" : "article-inline"}
                            adId={b.id}
                            creativeSize={`${b.width}x${b.height}`}
                        />
                    </div>
                );
            }
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
                        position="article-inline"
                    />
                </div>
            );
        },

        "related-articles": ({ children }: ComponentProps) => (
            <SurfaceSection className="my-8 overflow-hidden border-primary/30 p-0">
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
                    <SurfaceLinkCard
                        href={`/category/${category}`}
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

/**
 * 手動 <ad-slot> 未設置の記事に、本文中盤の <ad-slot> を注入する。
 * 記事末尾 1 枠より viewability が高い中盤配置にするための処理。
 * h2 見出しの 2 番目・中盤の直前に挿入し、手動配置記事の ~2 枠パターンに合わせる。
 */
function injectAdSlots(md: string): string {
    if (md.includes("<ad-slot")) return md; // 手動配置済みの記事は触らない
    const lines = md.split("\n");
    // h2 見出し行を収集（コードフェンス内の "## " は誤検出しないよう除外）
    const h2Indices: number[] = [];
    let inFence = false;
    lines.forEach((line, i) => {
        if (line.trimStart().startsWith("```")) {
            inFence = !inFence;
        } else if (!inFence && /^##\s/.test(line)) {
            h2Indices.push(i);
        }
    });
    if (h2Indices.length < 2) return md; // 見出しが少ない記事は対象外
    const targets = [h2Indices[1]];
    if (h2Indices.length >= 5) targets.push(h2Indices[Math.floor(h2Indices.length / 2)]);
    const result = [...lines];
    // 行番号のズレを防ぐため後ろから挿入する
    for (const idx of [...new Set(targets)].sort((a, b) => b - a)) {
        result.splice(idx, 0, "", "<ad-slot></ad-slot>", "");
    }
    return result.join("\n");
}

/**
 * 本文中と記事末尾に広告枠を自動挿入する。
 *
 * 読了文脈に乗るのは本文中なので、テキストリンクだけでなく画像バナーも本文へ出す。
 * 手動で `<affiliate-text` / `<affiliate-banner` を置いた記事は一切触らない。
 *
 * 配置:
 *   - 本文: h2 見出しの2・4・6番目の直前に最大3枠の300x250バナー。
 *   - 記事末尾: バナー1枠（読了直後は完読者で意図が強い）。
 *
 * `injectAdSlots` が使う h2 (2 番目・中盤) と重ならないよう、衝突する位置は 1 つ後ろの h2 へずらす。
 * 在庫を超えては挿入しない — 空枠を作らないため。
 */
// export はユニットテスト用 (inject-affiliate-units.test.ts)。本文への広告挿入は
// 位置計算・衝突回避・在庫不足時の抑制が絡み、目視では退行を検知できないため。
export function injectAffiliateUnits(
    md: string,
    opts: { bannerCount: number },
): string {
    const { bannerCount } = opts;
    // 記事末尾のバナー1本を残し、残りを本文枠へ使う。
    const bodyStock = Math.max(0, bannerCount - 1);
    const hasEndBanner = bannerCount > 0;
    if (bodyStock <= 0 && !hasEndBanner) return md;
    // 手動配置済みの記事は触らない
    if (md.includes("<affiliate-text") || md.includes("<affiliate-banner")) return md;
    const availableCount = bodyStock;

    const lines = md.split("\n");
    const h2Indices: number[] = [];
    let inFence = false;
    lines.forEach((line, i) => {
        if (line.trimStart().startsWith("```")) {
            inFence = !inFence;
        } else if (!inFence && /^##\s/.test(line)) {
            h2Indices.push(i);
        }
    });

    // injectAdSlots が既に <ad-slot> を差し込んだ行を避ける (広告が連続して並ぶのを防ぐ)
    const adSlotLines = new Set<number>();
    lines.forEach((line, i) => {
        if (line.includes("<ad-slot")) adSlotLines.add(i);
    });
    const collidesWithAdSlot = (h2Index: number) =>
        adSlotLines.has(h2Index - 1) || adSlotLines.has(h2Index - 2);

    const bodySlots = Math.min(availableCount, 3);
    const targets: number[] = [];
    for (let n = 1; targets.length < bodySlots && n < h2Indices.length; n += 2) {
        // 2・4・6 番目の h2 (0 始まりで 1,3,5)
        let idx = h2Indices[n];
        if (collidesWithAdSlot(idx) && h2Indices[n + 1] != null) idx = h2Indices[n + 1];
        if (!targets.includes(idx)) targets.push(idx);
    }

    const result = [...lines];
    // 行番号のズレを防ぐため後ろから挿入する
    const unit = (i: number) => `<affiliate-banner index="${i}"></affiliate-banner>`;
    let slot = targets.length - 1;
    for (const idx of [...targets].sort((a, b) => b - a)) {
        result.splice(idx, 0, "", unit(slot), "");
        slot--;
    }
    // 記事末尾は本文で使った分の次を消費する。
    if (hasEndBanner) {
        const endIndex = targets.length;
        result.push("", `<affiliate-banner index="${endIndex}" slot="end"></affiliate-banner>`, "");
    }
    return result.join("\n");
}

export function MDContent({
    source,
    slug,
    relatedArticleTitles,
    affiliateBannersByCategory,
    affiliateTextAds,
    affiliateVertical,
    affiliateBanners,
}: MDContentProps) {
    const mdComponents = useMemo(
        () =>
            makeMdComponents(
                slug,
                affiliateBannersByCategory,
                affiliateTextAds,
                affiliateVertical,
                affiliateBanners,
            ),
        [slug, affiliateBannersByCategory, affiliateTextAds, affiliateVertical, affiliateBanners],
    );
    const processed = useMemo(
        () =>
            injectAffiliateUnits(
                injectAdSlots(preprocessCallouts(source, relatedArticleTitles)),
                {
                    bannerCount: affiliateBanners?.length ?? 0,
                },
            ),
        [source, relatedArticleTitles, affiliateBanners],
    );
    return (
        <article
            className="blog-news-article prose prose-zinc dark:prose-invert max-w-none prose-pre:my-4 prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-pre:border prose-pre:border-slate-700 prose-pre:shadow-sm prose-pre:p-4 prose-code:before:content-none prose-code:after:content-none"
            suppressHydrationWarning
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={mdComponents}
            >
                {processed}
            </ReactMarkdown>
            {/* 広告: 記事末尾。手動 <ad-slot> 未設置記事のみ（injectAdSlots の中盤 2 枠に加えて末尾 1 枠）。 */}
            {ADSENSE_DISPLAY_ENABLED && !source.includes("<ad-slot") && (
                <div className="my-8 not-prose">
                    <AdSenseAd
                        format={BLOG_ARTICLE_INLINE.format}
                        slotId={BLOG_ARTICLE_INLINE.slotId}
                        showLabel={false}
                    />
                </div>
            )}
        </article>
    );
}
