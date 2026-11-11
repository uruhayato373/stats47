"use client";

import { useEffect, useState } from "react";

import { usePathname } from "next/navigation";

import { isAdIntentAllowedPath } from "./ad-intent-scope";

/** AdSense が画面の下に固定する広告インテントのアンカー (2026-11-11 の本番で確認した class) */
const AD_INTENT_ANCHOR_SELECTOR = ".google-anno-sa";
/** アンカーと、その上へ避ける部品の間のすき間 (px) */
const ANCHOR_GAP_PX = 4;

/** アンカーが画面の下側に固定されているとき、下端からアンカーの上端までの高さ (px)。無ければ 0 */
export function measureAdIntentAnchorInset(doc: Document, viewportHeight: number): number {
  const anchor = doc.querySelector(AD_INTENT_ANCHOR_SELECTOR);
  if (!anchor) return 0;
  const rect = anchor.getBoundingClientRect();
  if (rect.height === 0) return 0;
  // 画面の上側に出る形 (上半分にある) は、下端の部品と重ならない
  if (rect.top < viewportHeight / 2) return 0;
  return Math.max(0, Math.round(viewportHeight - rect.top) + ANCHOR_GAP_PX);
}

/**
 * 画面の下端に貼り付く自分たちの部品 (Cookie 同意の帯) が、広告インテントのアンカーと重ならないための高さ。
 *
 * 2026-11-11 の本番で、アンカー (画面下に固定・高さ 50px) の下半分が Cookie 同意の帯に隠れていた。
 * Google の広告の位置を CSS で動かすのは広告の改変にあたりうるので、自分たちの部品の側が避ける。
 * アンカーは `<html>` の直下に後から差し込まれ、たたむと高さが変わるので、DOM の変化と大きさの変化を見て測り直す。
 * 広告インテントを出さないページ (`isAdIntentAllowedPath` が false) では何も見ない。
 */
export function useAdIntentAnchorInset(): number {
  const pathname = usePathname();
  const allowed = isAdIntentAllowedPath(pathname);
  const [inset, setInset] = useState(0);

  useEffect(() => {
    if (!allowed) return;

    let resizeObserver: ResizeObserver | undefined;
    let observed: Element | null = null;

    const update = () => {
      const anchor = document.querySelector(AD_INTENT_ANCHOR_SELECTOR);
      if (anchor !== observed && typeof ResizeObserver !== "undefined") {
        resizeObserver?.disconnect();
        resizeObserver = anchor ? new ResizeObserver(update) : undefined;
        if (anchor) resizeObserver?.observe(anchor);
        observed = anchor;
      }
      setInset(measureAdIntentAnchorInset(document, window.innerHeight));
    };

    // 最初の測定は effect の外へ出す (effect の中で同期に setState しない)
    const timerId = window.setTimeout(update, 0);
    // アンカーは <html> の直下に入る。body の中の変化は見ない (本文の描画のたびに測り直さないため)
    const mutationObserver = new MutationObserver(update);
    mutationObserver.observe(document.documentElement, { childList: true });
    window.addEventListener("resize", update);

    return () => {
      window.clearTimeout(timerId);
      mutationObserver.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [allowed]);

  // 対象外のページへ移ったあとに前の値が残っていても、返すのは 0
  return allowed ? inset : 0;
}
