"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

import { readableFontSize } from "../../shared/layout";

/**
 * 縮小表示でも画面上で読める文字サイズ (viewBox 単位) を返す。
 *
 * D3 の図は固定幅の viewBox (既定 800) で描き、`w-full` で親の幅へ縮める。スマホでは表示倍率が
 * 約 0.4 になり、12 の文字が約 5px になる。図を囲む要素の表示幅を ResizeObserver で測り、
 * `readableFontSize` で文字サイズを逆算する (2026-09-25 CHART-AXIS-READABILITY-01)。
 *
 * - 測れるまで (SSR・最初の描画) と等倍以上の表示では `baseFontSize` のまま。
 * - 返す値は整数なので、幅が 1px 変わるたびに図を描き直すことはない (文字サイズが変わったときだけ)。
 *
 * @param containerRef - svg を幅いっぱいに入れている要素
 * @param viewBoxWidth - 図を描く viewBox の幅
 */
export function useReadableFontSize(
  containerRef: RefObject<Element | null>,
  viewBoxWidth: number,
  baseFontSize: number,
): number {
  // 表示倍率だけから決まる文字サイズの下限 (測れるまでは 0 = 下限なし)
  const [minFontSize, setMinFontSize] = useState(0);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      const renderedWidth = entry?.contentRect.width ?? 0;
      // 非表示 (幅 0) の間は直前の値を保つ
      if (renderedWidth > 0) setMinFontSize(readableFontSize(0, renderedWidth / viewBoxWidth));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [containerRef, viewBoxWidth]);

  return Math.max(baseFontSize, minFontSize);
}
