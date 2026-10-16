import { MediaWorkspace } from '@/components/content/media-workspace';
import { PageHeading } from '@/components/ops/primitives';
import { qualityOverview } from '@/lib/server/content-quality';
export const dynamic = 'force-dynamic';
export const metadata = { title: '図の型・媒体別方針 — stats47 admin' };
export default function Page() {
  return (
    <div className="space-y-6">
      <PageHeading
        accessLabel="改善方針・画像候補を保存できます"
        title="図の型・媒体別方針"
        source="画像テンプレート方針"
      >
        <p className="text-sm text-console-muted">
          共通の図の型と媒体ごとの見せ方を管理します。カバーの生成方針は専用画面から編集します。
        </p>
      </PageHeading>
      <MediaWorkspace initial={qualityOverview()} mode="templates" />
    </div>
  );
}
