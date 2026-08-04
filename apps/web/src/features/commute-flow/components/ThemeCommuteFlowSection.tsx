import { CommuteFlowSectionClient } from "./CommuteFlowSectionClient";

import type { CommuteFlowData } from "../lib/types";


/**
 * 通勤フロー セクション（async server）。
 * 既定県（東京 13）の通勤フローデータを SSG/ISR 時に R2（公開 URL）から読み、client に initialData
 * として渡す。server-only モジュールを使わない plain fetch にすることで、barrel の client 取り込みを汚さない。
 *
 * 焦点県の決め方は client 側 `useFlowFocusPrefecture` が正典 (2026-08-04):
 * ページの都道府県選択に追従し、全国時は代表県 + バッジ、パネル内の手動選択のみ `?flow=NN`
 * (ページ側 `?pref=` とは別名前空間)。切替時のデータは /api/flow/commute/[code] で取得する。
 */
const R2_BASE = "https://storage.stats47.jp";

export async function ThemeCommuteFlowSection() {
  let initialData: CommuteFlowData | undefined;
  try {
    const res = await fetch(`${R2_BASE}/app/commute-flow/13.json`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) initialData = (await res.json()) as CommuteFlowData;
  } catch {
    // R2 未配置時は client 側の /api/flow フォールバックに任せる
  }
  return <CommuteFlowSectionClient initialData={initialData} />;
}
