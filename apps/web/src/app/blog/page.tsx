import Link from "next/link";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

import { BlogArticleGrid } from "@/features/blog";
import { listLatestArticles } from "@/features/blog/server";

import type { Metadata } from "next";


export const metadata: Metadata = {
    title: "ブログ | stats47",
    description: "都道府県の統計データを分析した記事一覧。人口、経済、教育、福祉などのランキングや時系列分析を掲載。",
    alternates: {
        canonical: "/blog",
    },
};

export default async function BlogIndexPage() {
    const articles = await listLatestArticles(200).catch(() => []);

    return (
        <>
            {/* パンくずナビゲーション */}
            <div className="container mx-auto px-4 pt-4">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/">ホーム</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>ブログ</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="container mx-auto px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-lg font-bold mb-1">ブログ</h1>
                    <p className="text-sm text-muted-foreground">
                        都道府県の統計データを分析した記事を掲載しています
                    </p>
                </div>
                <div className="mb-6 flex flex-wrap gap-4">
                    <Link href="/search?type=blog" className="text-sm text-primary hover:underline">
                        記事を検索する →
                    </Link>
                    <Link href="/blog/tags" className="text-sm text-primary hover:underline">
                        タグ一覧から記事を探す →
                    </Link>
                </div>

                <p className="mb-4 text-sm text-muted-foreground">
                    {articles.length} 件の記事
                </p>
                <BlogArticleGrid articles={articles} />
            </div>
        </>
    );
}
