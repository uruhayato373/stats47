"use client";

import { useState } from "react";

import Image from "next/image";

interface Props {
  src: string;
  alt: string;
  /** 画像が無い/失敗した時に表示するイニシャル (品名の先頭1字) */
  fallbackInitial: string;
}

/**
 * 特産品イラスト。R2 に webp があれば表示し、404/読込失敗時はイニシャルタイルに degrade する。
 * 画像は Codex MCP で生成し R2 `app/areas/<code>/specialty/<slug>.webp` に配置 (未生成の県はイニシャル)。
 */
export function SpecialtyImage({ src, alt, fallbackInitial }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground">
        {fallbackInitial}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="64px"
      className="object-cover"
      onError={() => setFailed(true)}
    />
  );
}
