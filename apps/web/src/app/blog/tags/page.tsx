import Link from "next/link";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";
import { getDrizzle } from "@stats47/database/server";

import { TagCloud } from "@/features/blog";
import { listAllTagsWithCount } from "@/features/blog/server";

import type { Metadata } from "next";


export const metadata: Metadata = {
    title: "タグ一覧 | ブログ | stats47",
    description: "都道府県統計ブログの記事をタグから探す。",
    alternates: {
        canonical: "/blog/tags",
    },
};

export default async function TagsIndexPage() {
    let tags: Awaited<ReturnType<typeof listAllTagsWithCount>> = [];
    try {
        getDrizzle();
        tags = await listAllTagsWithCount();
    } catch {
        // CI ビルド時など D1 が利用できない場合は空データで SSG し、ISR で再生成
    }

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
                            <BreadcrumbPage>タグ一覧</BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </div>

            <div className="container mx-auto px-4 py-8">
                <h1 className="mb-2 text-lg font-bold">タグ一覧</h1>
                <p className="mb-8 text-muted-foreground">
                    タグから記事を探す
                </p>

                {tags.length === 0 ? (
                    <p className="py-12 text-center text-muted-foreground">
                        タグはまだありません
                    </p>
                ) : (
                    <TagCloud tags={tags} />
                )}
            </div>
        </>
    );
}
