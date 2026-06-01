import { MigrationFlowSectionClient } from "./MigrationFlowSectionClient";

import type { MigrationFlowData } from "@stats47/migration-flow";


/**
 * 人口移動フロー セクション（async server）。
 * 既定県（東京 13）の移動フロー Sankey データを SSG/ISR 時に R2（公開 URL）から読み、client に
 * initialData として渡す。server-only モジュールを使わない plain fetch にすることで、barrel の client
 * 取り込みを汚さない。県セレクタ切替・?pref は client が /api/flow/migration/[code] で取得する。
 * 粒子アニメ地図は client 内で遅延ロード（自前で /api/flow/migration[-muni] を読む）。
 */
const R2_BASE = "https://storage.stats47.jp";

export async function ThemeMigrationFlowSection() {
  let initialData: MigrationFlowData | undefined;
  try {
    const res = await fetch(`${R2_BASE}/app/migration-flow/13.json`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) initialData = (await res.json()) as MigrationFlowData;
  } catch {
    // R2 未配置時は client 側の /api/flow フォールバックに任せる
  }
  return <MigrationFlowSectionClient initialData={initialData} />;
}
