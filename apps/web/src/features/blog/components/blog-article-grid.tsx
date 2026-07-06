import Link from "next/link";

import { ThemeAwareImage } from "@/components/atoms/ThemeAwareImage";

import type { Article } from "../types";

const R2_PUBLIC_URL =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";

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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {articles.map((article, index) => {
                // LCP 対象: page 1 の先頭画像に priority (preload + fetchpriority=high)。
                // mobile(1列) は縦長で先頭行 ~4 枚が above-fold になり、その中の lazy 画像が
                // LCP 要素になっていた (PSI 診断: LCP=index 1 の lazy サムネ)。above-fold は
                // lazy にせず eager で読む (lazy above-fold アンチパターンの解消)。
                const isLcp = firstPagePriority && index === 0;
                const isAboveFold = firstPagePriority && index < 4;
                return (
                    <Link
                        key={article.slug}
                        href={`/blog/${article.slug}`}
                        className="group block overflow-hidden rounded-none border transition-shadow duration-200 hover:shadow-md"
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
                    </Link>
                );
            })}
        </div>
    );
}
