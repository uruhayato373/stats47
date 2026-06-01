import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import { FinanceFlowSectionClient } from "./FinanceFlowSectionClient";

import type { FinanceFlowData } from "../lib/types";


/**
 * 財政フロー セクション（async server）。
 * 既定県（東京 13）の財政フローデータを SSG/ISR 時に R2 から読み、client に initialData として渡す。
 * 県セレクタ切替・?pref ディープリンクは client が /api/flow/finance/[code] で取得する。
 */
export async function ThemeFinanceFlowSection() {
  const initialData = await fetchFromR2AsJson<FinanceFlowData>(
    "app/finance-flow/13.json",
  );
  return <FinanceFlowSectionClient initialData={initialData ?? undefined} />;
}
