'use client';
/* eslint-disable @next/next/no-img-element -- exact private revision through local proxy */
import { useState } from 'react';

export function NoteCoverImage({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div className="aspect-[1.91] rounded border border-console-border p-2 text-xs text-console-muted" role="status">画像を取得できません。ストレージの接続を確認してページを再読込してください。</div>;
  return <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className="aspect-[1.91] w-full rounded border border-console-border object-contain" />;
}
