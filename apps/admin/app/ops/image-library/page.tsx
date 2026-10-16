import { MediaWorkspace } from '@/components/content/media-workspace';
import { PageHeading } from '@/components/ops/primitives';
import { qualityOverview } from '@/lib/server/content-quality';
export const dynamic = 'force-dynamic';
export const metadata = { title: '画像ライブラリ — stats47 admin' };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    owner?: string;
    image?: string;
    channel?: string;
    view?: string;
    usage?: string;
    format?: string;
    collection?: string;
    q?: string;
    template?: string;
  }>;
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
          OGP・リンクカード・ブログSVG・note・SNS・共通素材の実画像、元データ、使用先、改善方針をここで管理します。
        </p>
      </PageHeading>
      <MediaWorkspace
        key={JSON.stringify(query)}
        initial={qualityOverview()}
        mode={
          query.view === 'templates'
            ? 'templates'
            : query.view === 'articles'
              ? 'articles'
              : 'images'
        }
        initialOwner={query.owner}
        initialImage={query.image}
        initialChannel={query.channel}
        initialUsage={query.usage}
        initialFormat={query.format}
        initialCollection={query.collection}
        initialQuery={query.q}
        initialTemplate={query.template}
      />
    </div>
  );
}
