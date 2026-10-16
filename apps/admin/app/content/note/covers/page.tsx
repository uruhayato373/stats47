import Link from 'next/link';
import { NoteCoversBrowser } from '@/components/content/note-covers-browser';
import { Stack } from '@/components/layout-primitives';
import { PageHeading } from '@/components/ops/primitives';
import { Button } from '@/components/ui/button';
import { NOTE_COVER_CATEGORIES, noteCoverManagement } from '@/lib/server/note-covers';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'noteカバー管理 — stats47 admin' };

export default function NoteCoversPage() {
  const data = noteCoverManagement();
  return <Stack gap="lg">
    <PageHeading title="noteカバー管理" source="記事・画像の共通台帳" accessLabel="制作内容・確認結果を保存できます">
      <p className="text-sm text-console-muted">カテゴリの方針を選び、制作IDごとにコピー・題材・プロンプトを管理します。画像を比較し、確認・採用を順に進められます。</p>
      <Button asChild variant="outline" size="sm"><Link href="/content/note">記事管理へ戻る</Link></Button>
    </PageHeading>
    <NoteCoversBrowser rows={data.rows} categories={NOTE_COVER_CATEGORIES} updatedAt={data.updatedAt} />
  </Stack>;
}
