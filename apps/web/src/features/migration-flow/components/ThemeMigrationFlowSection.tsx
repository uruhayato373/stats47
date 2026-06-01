import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import { MigrationFlowSectionClient } from "./MigrationFlowSectionClient";

import type { MigrationFlowData } from "@stats47/migration-flow";


/**
 * 人口移動フロー セクション（async server）。
 * 既定県（東京 13）の移動フロー Sankey データを SSG/ISR 時に R2 から読み、client に initialData として渡す。
 * 県セレクタ切替・?pref ディープリンクは client が /api/flow/migration/[code] で取得する。
 * 粒子アニメ地図は client 内で遅延ロード（自前で /api/flow/migration[-muni] を読む）。
 */
export async function ThemeMigrationFlowSection() {
  const initialData = await fetchFromR2AsJson<MigrationFlowData>(
    "app/migration-flow/13.json",
  );
  return <MigrationFlowSectionClient initialData={initialData ?? undefined} />;
}
