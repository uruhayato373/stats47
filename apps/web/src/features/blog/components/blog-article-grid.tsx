import Link from "next/link";

import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";

import type { Article } from "../types";

const R2_PUBLIC_URL =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";

/** ISO 文字列を YYYY.MM.DD へ整形。無効値は null。 */
function formatCardDate(iso: string | null): string | null {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}.${mm}.${dd}`;
}

interface BlogArticleGridProps {
    articles: Article[];
    /** ページ1のとき true → 先頭画像に priority を付与して LCP 最適化 */
    firstPagePriority?: boolean;
}

export function BlogArticleGrid({ articles, firstPagePriority = false }: BlogArticleGridProps) {
    if (articles.length === 0) {
        return (
            <p className="py-12 text-center text-muted-foreground">
                条件に一致する記事が見つかりませんでした
            </p>
        );
    }

    return (
        // 右レール有無で本文カラム幅が変動するため、列数はビューポートでなく
        // コンテナクエリで決める (ui-components.md のカードグリッド規約)。
        // @container は祖先要素にしか効かないため wrapper で包む
        <div className="@container">
        <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2 @md:grid-cols-3">
            {articles.map((article, index) => {
                // LCP 対象: page 1 の先頭画像に priority (preload + fetchpriority=high)。
                // mobile(1列) は縦長で先頭行 ~4 枚が above-fold になり、その中の lazy 画像が
                // LCP 要素になっていた (PSI 診断: LCP=index 1 の lazy サムネ)。above-fold は
                // lazy にせず eager で読む (lazy above-fold アンチパターンの解消)。
                const isLcp = firstPagePriority && index === 0;
                const isAboveFold = firstPagePriority && index < 4;
                // 一覧カードはサムネ画像のみだと本文(タイトル/日付)が視認できず、
                // サムネ内の焼き込み文字だけに依存していた。DOM テキストで
                // タイトル+更新日を出し、アクセシビリティ/回遊/SEO を担保する。
                const cardDate = formatCardDate(article.updatedAt ?? article.publishedAt);
                return (
                    <Link
                        key={article.slug}
                        href={`/blog/${article.slug}`}
                        className="group flex flex-col overflow-hidden rounded-none border transition-shadow duration-200 hover:shadow-md"
                    >
                        <div className="relative aspect-[1200/630] w-full bg-muted overflow-hidden">
                            <ThemeAwareImage
                                lightSrc={`${R2_PUBLIC_URL}/app/blog/${article.slug}/thumbnail-light.webp`}
                                darkSrc={`${R2_PUBLIC_URL}/app/blog/${article.slug}/thumbnail-dark.webp`}
                                alt={article.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                                className="object-cover transition-transform duration-200 group-hover:scale-105"
                                priority={isLcp}
                                loading={isLcp ? undefined : isAboveFold ? "eager" : "lazy"}
                            />
                        </div>
                        <div className="flex flex-1 flex-col gap-1 p-3">
                            <p className="line-clamp-2 text-sm font-semibold leading-snug text-foreground">
                                {article.title}
                            </p>
                            {cardDate && (
                                <time
                                    dateTime={article.updatedAt ?? article.publishedAt ?? undefined}
                                    className="mt-auto text-xs text-muted-foreground"
                                >
                                    {cardDate}
                                </time>
                            )}
                        </div>
                    </Link>
                );
            })}
        </div>
        </div>
    );
}
