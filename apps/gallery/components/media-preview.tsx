"use client";

import { useMemo, useState } from "react";

import { cn } from "@stats47/components";

export type MediaCandidate = {
  url: string;
  source: string;
};

/** light/dark 背景タグ表示や再生成対象の判別に使う任意のバリアント (旧 assets.html の img.variant 相当)。 */
export type MediaVariant = "light" | "dark" | "video" | "single" | "image";

function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)$/i.test(url);
}

/**
 * media_candidates (local → R2 等、優先順に並んだ候補配列) を順に試し、
 * onerror で次候補へフォールバックする。全滅したら「メディアなし」を表示する。
 * 旧 UI (sns.html mediaEl) の `i++; el.remove(); mount()` ループを React 化したもの。
 *
 * next/image は使わない: 候補 URL は local ファイルパス由来 (/media/...) や R2 署名なし公開
 * URL・SVG・動画が混在する動的ソースで、幅/高さが事前に分からず next/image の最適化前提
 * (既知サイズ・許可ドメイン) に合わないため。
 */
export function MediaPreview({
  candidates,
  alt = "",
  className,
  aspectClassName = "aspect-[16/10]",
  variant,
}: {
  candidates: MediaCandidate[];
  alt?: string;
  className?: string;
  aspectClassName?: string;
  /** light/dark 背景セルにしたい場合や variant タグを出したい場合に指定する。 */
  variant?: MediaVariant;
}) {
  const urls = useMemo(() => candidates.filter((c) => c.url), [candidates]);
  const [index, setIndex] = useState(0);

  const current = urls[index];
  const showVariantTag = variant && variant !== "single" && variant !== "image";

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        variant === "light" ? "bg-white" : variant === "dark" ? "bg-slate-950" : "bg-black",
        aspectClassName,
        className,
      )}
    >
      {showVariantTag ? (
        <span className="absolute left-1.5 top-1.5 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[9px] text-white">
          {variant}
        </span>
      ) : null}
      {!current ? (
        <span className="text-xs text-console-muted">メディアなし</span>
      ) : isVideoUrl(current.url) ? (
        <video
          key={current.url}
          src={current.url}
          controls
          preload="metadata"
          muted
          className="h-full w-full object-contain"
          onError={() => setIndex((i) => i + 1)}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={current.url}
          src={current.url}
          alt={alt}
          loading="lazy"
          className="h-full w-full object-contain"
          onError={() => setIndex((i) => i + 1)}
        />
      )}
      {current ? (
        <span className="absolute right-1.5 top-1.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white/70">
          {current.source}
        </span>
      ) : null}
    </div>
  );
}
