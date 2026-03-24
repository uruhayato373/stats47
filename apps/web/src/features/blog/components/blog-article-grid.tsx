import Image from "next/image";
import Link from "next/link";

import type { Article } from "../types/article.types";

const R2_PUBLIC_URL =
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";

interface BlogArticleGridProps {
    articles: Article[];
}

export function BlogArticleGrid({ articles }: BlogArticleGridProps) {
    if (articles.length === 0) {
        return (
            <p className="py-12 text-center text-muted-foreground">
                条件に一致する記事が見つかりませんでした
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
                <Link
                    key={article.slug}
                    href={`/blog/${article.slug}`}
                    className="group block overflow-hidden rounded-lg transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                >
                    <div className="relative aspect-[1200/630] w-full bg-muted">
                        <Image
                            src={`${R2_PUBLIC_URL}/blog/${article.slug}/thumbnail-light.webp`}
                            alt={article.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-200 group-hover:scale-105 dark:hidden"
                        />
                        <Image
                            src={`${R2_PUBLIC_URL}/blog/${article.slug}/thumbnail-dark.webp`}
                            alt={article.title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover transition-transform duration-200 group-hover:scale-105 hidden dark:block"
                        />
                    </div>
                </Link>
            ))}
        </div>
    );
}
