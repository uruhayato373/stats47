'use client';

import { StatusBadge } from '@/components/admin-ui/status-badge';
import { MediaPreview } from '@/components/media-preview';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  candidatesFor,
  candidateStage,
  isCandidate,
  CANDIDATE_STAGES,
  canEditDraft,
  formatJst,
  formatLabel,
  mediaAspect,
  PLATFORM_LABELS,
  statusLabel,
  statusTone,
  type GalleryItem,
} from '@/lib/sns-ledger';

export function PostCard({
  item,
  onPreview,
}: {
  item: GalleryItem;
  onPreview: () => void;
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="flex items-center justify-between gap-2 p-3">
        {item.id ? (
          <a
            className="font-mono font-semibold underline-offset-4 hover:underline"
            href={`/sns/${item.id}`}
          >
            #{item.id}
          </a>
        ) : (
          <span className="text-sm text-muted-foreground">ID未登録</span>
        )}
        <StatusBadge tone={statusTone(item.status)}>
          {statusLabel(item.status)}
        </StatusBadge>
      </div>
      <MediaPreview
        candidates={candidatesFor(item)}
        aspectClassName={mediaAspect(item)}
        alt={`投稿 ${item.id ? `#${item.id}` : item.content_key} の画像`}
      />
      <div className="flex flex-1 flex-col gap-3 p-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{formatLabel(item.domain)}</span>
          <span className="text-muted-foreground">
            {PLATFORM_LABELS[item.platform] ?? item.platform}
          </span>
        </div>
        {item.planning && (
          <h3 className="font-semibold">{item.planning.title}</h3>
        )}
        {isCandidate(item) && (
          <div>
            <StatusBadge tone="info">
              {CANDIDATE_STAGES[candidateStage(item)]}
            </StatusBadge>
          </div>
        )}
        <p className="line-clamp-3 whitespace-pre-wrap break-words">
          {item.caption || '本文はまだ登録されていません'}
        </p>
        <p className="break-all text-xs text-muted-foreground">
          {item.content_key}
        </p>
        {item.scheduled_at && (
          <p className="text-xs">予約 {formatJst(item.scheduled_at)} JST</p>
        )}
        {item.posted_at && (
          <p className="text-xs text-muted-foreground">
            投稿 {formatJst(item.posted_at)} JST · 表示{' '}
            {item.impressions ?? '—'}
          </p>
        )}
        {item.approval?.state === 'pending' && (
          <div>
            <StatusBadge tone="warn">承認待ち</StatusBadge>
          </div>
        )}
        <div className="mt-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onPreview}
            aria-label={`投稿 ${item.id ? `#${item.id}` : item.content_key} の画像と本文を開く`}
          >
            {canEditDraft(item) ? '画像を確認・本文を編集' : '画像・本文を確認'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
