
import { buildAreaDirectoryData } from "../utils";

import { AreaSearch } from "./AreaSearch";
import { AreaSelectionPanels } from "./AreaSelectionPanels";

import type { Prefecture } from "@stats47/area";

interface AreaDirectoryProps {
  prefectures: Prefecture[];
}

/**
 * `/areas` の県選択ハブ（Server Component）。
 *
 * 単一 SSOT（`fetchPrefectures()` / `REGIONS` / `TILE_GRID_LAYOUT`）から派生データを組み立て、
 * 検索コンボボックス（Client）と選択パネル（Client: 検索 / 一覧 / 地図の 3 導線）を構成する。
 * データはすべて serializable な props として Client 境界に渡す。
 */
export function AreaDirectory({ prefectures }: AreaDirectoryProps) {
  const data = buildAreaDirectoryData(prefectures);

  return (
    <section aria-labelledby="area-directory-heading" className="mt-2">
      <h2
        id="area-directory-heading"
        className="text-lg font-semibold text-foreground"
      >
        都道府県を選ぶ
      </h2>
      <AreaSearch prefectures={prefectures} className="mt-3" />
      <AreaSelectionPanels {...data} className="mt-6" />
    </section>
  );
}
