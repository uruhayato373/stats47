"use client";

import { useMediaQuery } from './useMediaQuery';

import { MEDIA_QUERIES, type MediaQueryKey } from '@/constants/breakpoints';

/**
 * ブレイクポイント判定フック
 *
 * 事前に定義されたブレイクポイント名を使用してメディアクエリを判定します。
 *
 * @param breakpoint - ブレイクポイント名（MEDIA_QUERIESのキー）
 * @returns メディアクエリに一致する場合はtrue、そうでない場合はfalse
 *
 * @example
 * ```tsx
 * const isMobile = useBreakpoint('mobile');
 * const isDesktop = useBreakpoint('desktop');
 *
 * if (isMobile) {
 *   return <MobileView />;
 * }
 * return <DesktopView />;
 * ```
 */
export function useBreakpoint(breakpoint: MediaQueryKey): boolean {
  return useMediaQuery(MEDIA_QUERIES[breakpoint]);
}

