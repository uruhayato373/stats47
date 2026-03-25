import Link from "next/link";
import { notFound } from "next/navigation";

import { TagBadge } from "@/features/blog";
import { listAllUniqueTags, listArticleSummariesByTagKey } from "@/features/blog/server";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";
import { getDrizzle, tags as tagsTable } from "@stats47/database/server";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

export const revalidate = 86400;

export async function generateStaticParams() {
    try {
        getDrizzle();
    } catch {
        return [];
    }
    const tagKeys = await listAllUniqueTags();
    return tagKeys.map((tagKey) => ({ tagKey }));
}

interface PageProps {
    params: Promise<{ tagKey: string }>;
}

async function getTagName(tagKey: string): Promise<string> {
    try {
        const db = getDrizzle();
        const result = await db
            .select({ tagName: tagsTable.tagName })
            .from(tagsTable)
            .where(eq(tagsTable.tagKey, tagKey))
            .limit(1);
        return result[0]?.tagName ?? tagKey;
    } catch {
        return tagKey;
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { tagKey } = await params;
    const tagName = await getTagName(tagKey);

    const title = `「${tagName}」の記事一覧 | ブログ | stats47`;
    const description = `「${tagName}」タグが付いた都道府県統計ブログの記事一覧。`;

    return {
        title,
        description,
        alternates: {
            canonical: `/tag/${tagKey}`,
        },
        openGraph: {
            title,
            description,
            type: "website",
        },
        twitter: {
            card: "summary",
            title,
            description,
        },
    };
}

export default async function TagArticlesPage({ params }: PageProps) {
    const { tagKey } = await params;
    const tagName = await getTagName(tagKey);
    const articles = await listArticleSummariesByTagKey(tagKey, 50);

    return (
        <>
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
                            <BreadcrumbLink asChild>
                                <Link href="/blog">ブログ</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link href="/blog/tags">タグ一覧</Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage>{tagName}</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="container mx-auto px-4 py-8">
                <h1 className="mb-2 text-lg font-bold">「{tagName}」の記事一覧</h1>
                <p className="mb-8 text-muted-foreground">
                    {articles.length} 件の記事
                </p>

                {articles.length === 0 ? (
                    notFound()
                ) : (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {articles.map((article) => (
                            <Link
                                key={article.slug}
                                href={`/blog/${article.slug}`}
                                className="group block h-full"
                            >
                                <Card className="flex h-full flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-primary/50">
                                    <CardHeader className="pb-3">
                                        <div className="mb-2 flex items-center gap-2">
                                            {article.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    {article.slug}
                                                </span>
                                            )}
                                        </div>
                                        <CardTitle className="text-lg transition-colors group-hover:text-primary">
                                            {article.title}
                                        </CardTitle>
                                        {article.description && (
                                            <CardDescription className="line-clamp-2">
                                                {article.description}
                                            </CardDescription>
                                        )}
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
