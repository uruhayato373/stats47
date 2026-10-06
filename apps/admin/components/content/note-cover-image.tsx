'use client';
/* eslint-disable @next/next/no-img-element -- exact private revision through local proxy */
import { useState } from 'react';

const FALLBACK = '画像を取得できません。ストレージの接続を確認してページを再読込してください。';

export function NoteCoverImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState<string | null>(null);
  // <img> の onError は理由を持たないので、proxy が返す理由を一度だけ読む。
  const fail = () => {
    setError(FALLBACK);
    fetch(src).then((res) => res.json()).then((body: { error?: unknown }) => {
      if (typeof body.error === 'string') setError(body.error);
    }).catch(() => {});
  };
  if (error) return <div className="aspect-[1.91] rounded border border-console-border p-2 text-xs whitespace-normal text-console-muted" role="status">{error}</div>;
  return <img src={src} alt={alt} loading="lazy" onError={fail} className="aspect-[1.91] w-full rounded border border-console-border object-contain" />;
}
