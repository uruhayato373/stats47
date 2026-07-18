import "server-only";

import {
  readAreaDatabookFromR2,
  buildAreaDatabookSnapshots,
  type AreaDatabookSnapshot,
} from "@stats47/area-profile/server";
import {
  AREA_DATABOOK_TEMPLATE,
  AREA_EDITORIALS,
  type AreaDatabookTemplate,
  type AreaEditorial,
} from "@stats47/data-configs";

import { logger } from "@/lib/logger";


export interface AreaDatabookViewData {
  template: AreaDatabookTemplate;
  databook: AreaDatabookSnapshot | null;
  editorial: AreaEditorial | null;
}

/**
 * 県データブックの描画データを解決する。
 *
 * - databook (値+全国順位) は R2 `app/areas/<code>/databook.json` を 1 read。
 * - editorial (特産品・県シンボル) は git TS を直接参照 (R2 経由しない)。
 * - development のみ: R2 に databook.json が無ければ在庫から in-memory 補完し、
 *   R2 push 前でも localhost で UI を QA できる (home-featured と同じ dev 補完方針)。
 * - 本番で databook 欠損時は null を返し、呼び出し側 (AreaDatabookSection) が
 *   従来チャート表示にフォールバックする。
 */
export async function getAreaDatabook(
  areaCode: string,
): Promise<AreaDatabookViewData> {
  let databook = await readAreaDatabookFromR2(areaCode);

  if (!databook && process.env.NODE_ENV === "development") {
    try {
      const { snapshots } = await buildAreaDatabookSnapshots({ areaCodes: [areaCode] });
      databook = snapshots[0] ?? null;
    } catch (error) {
      logger.warn(
        { areaCode, error: error instanceof Error ? error.message : String(error) },
        "getAreaDatabook: dev in-memory 補完に失敗",
      );
    }
  }

  return {
    template: AREA_DATABOOK_TEMPLATE,
    databook,
    editorial: AREA_EDITORIALS[areaCode] ?? null,
  };
}
