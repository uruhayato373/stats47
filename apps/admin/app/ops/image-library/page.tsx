import { MediaWorkspace } from '@/components/content/media-workspace';
import { PageHeading } from '@/components/ops/primitives';
import { qualityOverview } from '@/lib/server/content-quality';
export const dynamic = 'force-dynamic';
export const metadata = { title: '画像ライブラリ — stats47 admin' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ owner?: string; image?: string; channel?: string }>;
}) {
  const query = await searchParams;
  return (
    <div className="space-y-6">
      <PageHeading
        accessLabel="改善方針・画像候補を保存できます"
        title="画像ライブラリ"
        source="R2 / 画像・投稿台帳"
      >
        <p className="text-sm text-console-muted">
          note・X・Instagramなどの実画像、使用先、改善候補と元データをまとめて確認します。
        </p>
      </PageHeading>
      <MediaWorkspace
        initial={qualityOverview()}
        mode="images"
        initialOwner={query.owner}
        initialImage={query.image}
        initialChannel={query.channel}
      />
    </div>
  );
}
