'use client';
import { StatusBadge, type Tone } from '@/components/admin-ui';
import { NoteCoverImage } from '@/components/content/note-cover-image';
import { Stack } from '@/components/layout-primitives';
import { COVER_PUBLICATIONS, COVER_REVIEWS } from '@/lib/note-cover-view';
import type { NoteCoverReview, NoteCoverRow } from '@/lib/server/note-covers';

const REVIEW_TONE: Record<NoteCoverReview, Tone> = { pass: 'good', 'needs-revision': 'warn', pending: 'neutral', missing: 'neutral', unavailable: 'warn' };
export function CoverReviewBadge({ review }: { review: NoteCoverReview }) {
  return <StatusBadge tone={REVIEW_TONE[review]}>{COVER_REVIEWS.find(r => r.key === review)?.label}</StatusBadge>;
}
export function CoverPublicationBadge({ publication }: { publication: NoteCoverRow['publication'] }) {
  return <StatusBadge tone={publication === 'published' ? 'good' : 'neutral'}>{COVER_PUBLICATIONS.find(p => p.key === publication)?.label}</StatusBadge>;
}
export function NoteCoverComparison({ row }: { row: NoteCoverRow }) {
  return <Stack>
    <div className="flex flex-wrap gap-2">
      <CoverReviewBadge review={row.review} />
      <CoverPublicationBadge publication={row.publication} />
      {row.stale && <StatusBadge tone="warn">公開画像の再確認が必要</StatusBadge>}
    </div>
    <div className="grid gap-4 sm:grid-cols-2">
      <figure>
        <figcaption className="mb-2 text-xs text-console-muted">公開カバー{row.coverObservedAt ? `（${new Date(row.coverObservedAt).toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' })}確認）` : ''}</figcaption>
        {row.currentImageUrl ? <NoteCoverImage key={row.currentImageUrl} src={row.currentImageUrl} alt={`${row.title} 公開カバー`} /> : <p className="text-sm text-console-muted">公開画像なし</p>}
      </figure>
      <figure>
        <figcaption className="mb-2 text-xs text-console-muted">差し替え候補{row.candidateVersion ? `（${row.candidateVersion}）` : ''}</figcaption>
        {row.candidateImageUrl ? <NoteCoverImage key={row.candidateImageUrl} src={row.candidateImageUrl} alt={`${row.title} 差し替え候補`} /> : <p className="text-sm text-console-muted">{row.review === 'unavailable' ? '旧候補の画像は未回収です' : '候補なし'}</p>}
      </figure>
    </div>
    {row.reviewReason && <p className="text-sm text-console-muted">{row.reviewReason}</p>}
    {row.missingVersions.length > 0 && <p className="text-xs text-console-muted">未回収の旧版: {row.missingVersions.join('、')}。表示中の候補とは別の版です。</p>}
    {row.archivedVersions.length > 0 && <details className="text-sm text-console-muted">
      <summary className="cursor-pointer">過去の保管版 {row.archivedVersions.length} 件</summary>
      <div className="grid gap-4 pt-3 sm:grid-cols-2">{row.archivedVersions.map(r => <figure key={r.id}>
        <figcaption className="mb-2 text-xs">{r.version}</figcaption>
        <NoteCoverImage src={r.imageUrl} alt={`${row.title} 過去の保管版`} />
      </figure>)}</div>
    </details>}
  </Stack>;
}
