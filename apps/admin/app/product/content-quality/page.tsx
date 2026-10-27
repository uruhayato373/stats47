import { MediaWorkspace } from '@/components/content/media-workspace';
import { PageHeading } from '@/components/ops/primitives';
import { qualityOverview } from '@/lib/server/content-quality';
export const dynamic = 'force-dynamic';
export const metadata = { title: '記事・投稿の改善 — stats47 admin' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    owner?: string;
    image?: string;
    channel?: string;
    q?: string;
    template?: string;
  }>;
}) {
  const query = await searchParams;
  return (
    <>
      <PageHeading
        accessLabel="改善方針・画像候補を保存できます"
        title="記事・投稿の改善"
        source="記事・投稿台帳 / R2 / 品質記録"
      >
        <p className="text-sm text-muted-foreground">
          実際の画像と本文を確認しながら、改善方針と確認結果を残します。
        </p>
      </PageHeading>
      <MediaWorkspace
        key={JSON.stringify(query)}
        initial={qualityOverview()}
        mode="articles"
        initialOwner={query.owner}
        initialImage={query.image}
        initialChannel={query.channel}
        initialQuery={query.q}
        initialTemplate={query.template}
      />
    </>
  );
}
