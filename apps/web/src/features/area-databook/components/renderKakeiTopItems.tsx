import { hrefFor } from "@stats47/data-configs/content/href";

import { rankToneByPosition } from "@/components/atoms/RankBadge";

import { RankedValueGrid } from "./RankedValueGrid";

import type { AreaDatabookSnapshot } from "@stats47/area-profile/server";

/** 上位品目の欄を置く節。県データブックのテンプレの「食の消費(品目別)」。 */
export const KAKEI_TOP_ITEMS_SECTION_KEY = "consumption-items";

/** 値が県全体ではなく県庁所在市のものだと、欄の見出しで 1 回示す。 */
export const KAKEI_TOP_ITEMS_HEADING = "県庁所在市の家計調査で全国3位以内の品目";

/**
 * 県庁所在市の家計調査で全国 3 位以内の品目の欄。既存の数値タイル (RankedValueGrid) をそのまま使う。
 * 該当が無い県・この欄を焼き込む前の databook.json (kakeiTopItems が無い版) では何も出さない。
 */
export function renderKakeiTopItems(databook: AreaDatabookSnapshot | null) {
  const items = databook?.kakeiTopItems ?? [];
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">{KAKEI_TOP_ITEMS_HEADING}</h4>
      <RankedValueGrid
        navSurface="area_databook"
        items={items.map((item) => ({
          key: item.rankingKey,
          href: hrefFor("ranking", { rankingKey: item.rankingKey }),
          label: item.label,
          value: {
            value: item.value,
            unit: item.unit,
            year: item.year,
            badge: { rank: item.rank, tone: rankToneByPosition(item.rank) },
          },
        }))}
      />
    </div>
  );
}
