"use client";

import { useEffect } from "react";

import { usePathname } from "next/navigation";

import { AD_INTENT_SKIP_CLASS, isAdIntentAllowedPath } from "../ad-intent-scope";

/**
 * 広告インテントを出してよいページでだけ、body の拒否の目印を外す (範囲と経緯は `ad-intent-scope.ts`)。
 *
 * `AdSenseScript` より前に置く。どちらも effect で動き、AdSense の script は次のフレーム以降の
 * アイドル時に読み込まれるので、script がページを読む時点では body の状態が決まっている。
 * ページを移るたびに付け直すので、対象外のページへ移れば拒否に戻る。
 */
export function AdIntentScope() {
  const pathname = usePathname();

  useEffect(() => {
    document.body.classList.toggle(AD_INTENT_SKIP_CLASS, !isAdIntentAllowedPath(pathname));
  }, [pathname]);

  return null;
}
