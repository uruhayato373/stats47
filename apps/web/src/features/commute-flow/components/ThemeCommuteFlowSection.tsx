import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import { CommuteFlowSectionClient } from "./CommuteFlowSectionClient";

import type { CommuteFlowData } from "../lib/types";


/**
 * 通勤フロー セクション（async server）。
 * 既定県（東京 13）の通勤フローデータを SSG/ISR 時に R2 から読み、client に initialData として渡す。
 * 県セレクタ切替・?pref ディープリンクは client が /api/flow/commute/[code] で取得する。
 */
export async function ThemeCommuteFlowSection() {
  const initialData = await fetchFromR2AsJson<CommuteFlowData>(
    "app/commute-flow/13.json",
  );
  return <CommuteFlowSectionClient initialData={initialData ?? undefined} />;
}
