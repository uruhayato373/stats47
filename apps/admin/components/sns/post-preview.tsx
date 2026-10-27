'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/admin-ui/status-badge';
import { MediaPreview } from '@/components/media-preview';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { PostDTO } from '@/lib/contracts/types';
import {
  candidatesFor,
  candidateStage,
  CANDIDATE_STAGES,
  canEditDraft,
  formatJst,
  formatLabel,
  PLATFORM_LABELS,
  statusLabel,
  statusTone,
  type GalleryItem,
  orderedPostAssets,
} from '@/lib/sns-ledger';
import { DraftCaptionEditor } from './draft-caption-editor';

export function PostPreview({
  item,
  onClose,
  onSaved,
}: {
  item: GalleryItem;
  onClose: () => void;
  onSaved: (post: PostDTO) => void;
}) {
  const [dirty, setDirty] = useState(false);
  const [assetIndex, setAssetIndex] = useState(0);
  const archived = orderedPostAssets(item.assets ?? [])
    .filter((a) => a.state === 'archived' && (a.drive_path || a.r2));
  const selected = archived[assetIndex];
  const candidates =
    assetIndex > 0 && selected && item.id
      ? [
          {
            url: `/sns-asset/${item.id}/${encodeURIComponent(selected.drive_path?.split('/').pop() ?? (selected.role + '-' + selected.order + '.' + (selected.mime?.split('/')[1] ?? 'png')))}`,
            source: selected.r2 ? 'r2' : 'drive',
          },
        ]
      : candidatesFor(item);
  const close = () => {
    if (!dirty || window.confirm('未保存の変更を破棄して閉じますか？'))
      onClose();
  };
  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-5xl">
        <SheetHeader>
          <SheetTitle>
            {item.id ? `投稿 #${item.id}` : '未登録素材'} ·{' '}
            {formatLabel(item.domain)}
          </SheetTitle>
          <SheetDescription>
            {PLATFORM_LABELS[item.platform] ?? item.platform} ·{' '}
            {item.content_key}
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-6 px-4 pb-6 md:grid-cols-2">
          <div className="space-y-3">
            <MediaPreview
              key={`${item.id}-${assetIndex}`}
              candidates={candidates}
              aspectClassName="aspect-4/5"
              alt={`投稿 #${item.id ?? '未登録'} の素材 ${assetIndex + 1}`}
            />
            {archived.length > 1 && (
              <div className="flex flex-wrap gap-2" aria-label="投稿素材">
                {archived.map((a, i) => (
                  <Button
                    key={`${a.role}-${a.order}`}
                    variant={assetIndex === i ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setAssetIndex(i)}
                  >
                    {item.domain === 'note' ? a.role === 'thumbnail' ? '参考原図（note）' : `投稿用 ${a.order}` : `素材 ${i + 1}`}
                  </Button>
                ))}
              </div>
            )}
          </div>
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone={statusTone(item.status)}>
                {statusLabel(item.status)}
              </StatusBadge>
              {item.approval?.state === 'pending' && (
                <StatusBadge tone="warn">承認待ち</StatusBadge>
              )}
            </div>
            {item.planning && (
              <div className="space-y-2 text-sm">
                <h3 className="font-semibold">{item.planning.title}</h3>
                <StatusBadge tone="info">
                  {CANDIDATE_STAGES[candidateStage(item)]}
                </StatusBadge>
                <p className="break-all">{item.planning.note}</p>
                <p className="text-console-muted">
                  {item.planning.origin === 'new-format'
                    ? '新しい型の追加企画'
                    : '既存素材から整理'}{' '}
                  · {item.planning.batch}
                </p>
              </div>
            )}
            {item.scheduled_at && (
              <p className="text-sm">
                予約日時: {formatJst(item.scheduled_at)} JST
              </p>
            )}
            {item.posted_at && (
              <p className="text-sm">
                投稿日時: {formatJst(item.posted_at)} JST
              </p>
            )}
            {item.template && (
              <p className="break-all text-xs text-console-muted">
                画像テンプレート: {item.template}
              </p>
            )}
            {item.domain === 'geo' && (
              <p className="break-all text-xs text-console-muted">
                Geo role: {String(item.geo_role || '—')} · 指標:{' '}
                {String(item.claim_metric_key || '—')} · 分析ID:{' '}
                {String(item.analysis_ids || '—')}
              </p>
            )}
            {canEditDraft(item) ? (
              <DraftCaptionEditor
                post={item}
                onSaved={onSaved}
                onDirtyChange={setDirty}
              />
            ) : (
              <div className="space-y-2">
                <h3 className="font-semibold">投稿本文</h3>
                <p className="whitespace-pre-wrap break-words text-sm">
                  {item.caption || '本文はまだ登録されていません'}
                </p>
                {item.status === 'scheduled' && (
                  <p className="text-xs text-console-muted">
                    予約済みの本文です。内容の変更は投稿先の予約にも反映する必要があります。
                  </p>
                )}
              </div>
            )}
            {item.id && (
              <Button variant="outline" nativeButton={false} render={<a href={`/sns/${item.id}`}
                  onClick={(e) => {
                    if (
                      dirty &&
                      !window.confirm(
                        '未保存の変更を破棄して詳細へ移動しますか？'
                      )
                    )
                      e.preventDefault();
                  }} />}>
                  ID台帳の詳細・出典・指標
                </Button>
            )}
            {typeof item.post_url === 'string' && (
              <p>
                <a
                  className="text-sm text-console-accent hover:underline"
                  href={item.post_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  投稿先で見る ↗
                </a>
              </p>
            )}
            {typeof item.utm_url === 'string' && (
              <p>
                <a
                  className="text-sm text-console-accent hover:underline"
                  href={item.utm_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  着地ページを見る ↗
                </a>
              </p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
