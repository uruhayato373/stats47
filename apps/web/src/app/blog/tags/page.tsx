import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

import Link from "@/components/atoms/SiteLink";
import { PageShell, PageHeader } from "@/components/layout";

import { FooterAdSlot } from "@/features/ads";
import { TagCloud } from "@/features/blog";
import { listAllTagsWithCount } from "@/features/blog/server";

import { generateOGMetadata } from "@/lib/metadata/og-generator";
import { formatOgpTitle } from "@/lib/metadata/site-title";

import { DEFAULT_OGP_IMAGE_PATH, SITE_ORIGIN } from "@/config/site";

import type { Metadata } from "next";

const TAGS_TITLE = "タグ一覧 | ブログ";
const TAGS_DESCRIPTION = "都道府県統計ブログの記事をタグから探す。";

export const metadata: Metadata = {
    title: TAGS_TITLE,
    description: TAGS_DESCRIPTION,
    alternates: {
        canonical: "/blog/tags",
    },
    // 一覧ページは静的 /og-image.jpg を明示 (ランタイム opengraph-image 自動注入=Worker 500 回避)。
    ...generateOGMetadata({
        title: formatOgpTitle(TAGS_TITLE),
        description: TAGS_DESCRIPTION,
        imageUrl: DEFAULT_OGP_IMAGE_PATH,
        url: `${SITE_ORIGIN}/blog/tags`,
    }),
};

export default async function TagsIndexPage() {
    const tags = await listAllTagsWithCount().catch(() => []);

    return (
        <PageShell>
            <Breadcrumb className="mb-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink render={<Link href="/" />}>ホーム</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink render={<Link href="/blog" />}>ブログ</BreadcrumbLink>
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

            <FooterAdSlot />
        </PageShell>
    );
}
