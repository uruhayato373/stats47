"use client";

import { useRef, type ComponentProps } from "react";

// eslint-disable-next-line no-restricted-imports -- next/link を包む唯一の場所
import NextLink from "next/link";
import { useRouter } from "next/navigation";

type SiteLinkProps = ComponentProps<typeof NextLink>;

/**
 * サイト内リンク。`next/link` の代わりに必ずこれを使う (ESLint `no-restricted-imports` が止める)。
 *
 * 既定では画面に入っただけでは先読み (prefetch) せず、マウスを乗せた・指で触れたときに 1 回だけ先読みする。
 * 理由: App Router の先読みは `_rsc` 付きリクエストで、Workers Cache を通らず毎回サーバー描画になる
 * (`lib/cache-policy.ts` が RSC をキャッシュから外している)。2026-10-16 に Workers Observability で
 * 1 時間の CPU 時間の約 72% が `_rsc` 付きで、本番トップを開くだけで 37 件出ていた (`CF-CPU-SURGE-01`)。
 *
 * - 触れたときの先読みは `router.prefetch()` で行う。`prefetch` を `false` から途中で有効に切り替える方法は、
 *   Next.js 15.5 の本番ビルドで先読みが発生しなかった (2026-10-16 に localhost の本番ビルドで実測)
 * - 呼び出し側が `prefetch` を明示したときはそれに従い、触れても先読みしない
 */
export default function SiteLink({ prefetch, href, onMouseEnter, onTouchStart, ...props }: SiteLinkProps) {
  const router = useRouter();
  const hasPrefetched = useRef(false);

  const prefetchOnIntent = () => {
    if (prefetch !== undefined || hasPrefetched.current || typeof href !== "string") return;
    hasPrefetched.current = true;
    router.prefetch(href);
  };

  return (
    <NextLink
      {...props}
      href={href}
      prefetch={prefetch === undefined ? false : prefetch}
      onMouseEnter={(e) => {
        prefetchOnIntent();
        onMouseEnter?.(e);
      }}
      onTouchStart={(e) => {
        prefetchOnIntent();
        onTouchStart?.(e);
      }}
    />
  );
}
