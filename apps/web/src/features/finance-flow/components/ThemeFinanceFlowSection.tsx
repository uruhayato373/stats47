import { FinanceFlowSectionClient } from "./FinanceFlowSectionClient";

import type { FinanceFlowData } from "../lib/types";


/**
 * 財政フロー セクション（async server）。
 * 既定県（東京 13）の財政フローデータを SSG/ISR 時に R2（公開 URL）から読み、client に initialData として渡す。
 * server-only モジュールを使わない plain fetch にすることで、barrel の client 取り込みを汚さない。
 * 県セレクタ切替・?pref ディープリンクは client が /api/flow/finance/[code] で取得する。
 */
const R2_BASE = "https://storage.stats47.jp";

export async function ThemeFinanceFlowSection() {
  let initialData: FinanceFlowData | undefined;
  try {
    const res = await fetch(`${R2_BASE}/app/finance-flow/13.json`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) initialData = (await res.json()) as FinanceFlowData;
  } catch {
    // R2 未配置時は client 側の /api/flow フォールバックに任せる
  }
  return <FinanceFlowSectionClient initialData={initialData} />;
}
