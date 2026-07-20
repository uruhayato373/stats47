import Link from "next/link";

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

import { PageShell, PageHeader } from "@/components/layout";

import { TagCloud } from "@/features/blog";
import { listAllTagsWithCount } from "@/features/blog/server";

import { AdSenseAd, CONTENT_FOOTER } from "@/lib/google-adsense";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

const TAGS_TITLE = "タグ一覧 | ブログ | stats47";
const TAGS_DESCRIPTION = "都道府県統計ブログの記事をタグから探す。";

export const metadata: Metadata = {
    title: TAGS_TITLE,
    description: TAGS_DESCRIPTION,
    alternates: {
        canonical: "/blog/tags",
    },
    // 一覧ページは静的 /og-image.jpg を明示 (ランタイム opengraph-image 自動注入=Worker 500 回避)。
    ...generateOGMetadata({
        title: TAGS_TITLE,
        description: TAGS_DESCRIPTION,
        imageUrl: "/og-image.jpg",
        url: "https://stats47.jp/blog/tags",
    }),
};

export default async function TagsIndexPage() {
    const tags = await listAllTagsWithCount().catch(() => []);

    return (
        <PageShell>
            <Breadcrumb className="mb-4">
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

            <PageHeader title="タグ一覧" description="タグから記事を探す" />

            {tags.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">
                    タグはまだありません
                </p>
            ) : (
                <TagCloud tags={tags} />
            )}

            <div className="mt-8">
                <AdSenseAd format={CONTENT_FOOTER.format} slotId={CONTENT_FOOTER.slotId} />
            </div>
        </PageShell>
    );
}
