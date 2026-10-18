'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function ActualImage({
  src,
  alt,
  small = false,
  onDimensions,
  dimensions,
}: {
  src: string | null;
  alt: string;
  small?: boolean;
  onDimensions?: (size: { width: number; height: number }) => void;
  dimensions?: { width: number; height: number } | null;
}) {
  const [failed, setFailed] = useState(false);
  if (!src)
    return (
      <p className="p-6 text-sm text-console-muted">
        画像の保存記録がありません
      </p>
    );
  if (failed)
    return (
      <div className="space-y-2 p-4 text-sm text-console-muted">
        <p>
          画像を取得できません。保存先への接続・移行状況を確認してください。
        </p>
        <Button variant="outline" size="sm" onClick={() => setFailed(false)}>
          再取得
        </Button>
      </div>
    );
  // Exact ledger-owned proxy or a previously recorded public image URL.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      width={dimensions?.width}
      height={dimensions?.height}
      className={
        small
          ? 'mx-auto h-36 w-full object-contain'
          : 'mx-auto h-auto max-h-[600px] w-full object-contain'
      }
      onError={() => setFailed(true)}
      onLoad={(event) =>
        onDimensions?.({
          width: event.currentTarget.naturalWidth,
          height: event.currentTarget.naturalHeight,
        })
      }
    />
  );
}
