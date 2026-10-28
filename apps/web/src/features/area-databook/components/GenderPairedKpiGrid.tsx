import { hrefFor } from "@stats47/data-configs/content/href";

import { rankToneByPosition } from "@/components/atoms/RankBadge";

import { GENDER_TONE_TEXT, type GenderTone } from "./gender-tone.palette";
import { RankedValueGrid, type RankedValueGridItem } from "./RankedValueGrid";

import type { AreaDatabookSnapshot } from "@stats47/area-profile/server";
import type { DatabookGenderPair } from "@stats47/data-configs";

interface Props {
  pairs: DatabookGenderPair[];
  databook: AreaDatabookSnapshot | null;
}

/** 都道府県の数。全国順位のチップはこの範囲の順位にだけ付ける。 */
const PREFECTURE_COUNT = 47;

const GENDER_LABEL: Record<GenderTone, string> = { male: "男性", female: "女性" };

/**
 * 男女で対比する KPI (初婚年齢・寿命・給与・身長・体重)。男女それぞれを数値タイル 1 枚にし、
 * 県データブックの他の数値 (RankedKpiGrid) と同じ RankedValueGrid で 2 列に並べる (左 = 男性・右 = 女性)。
 * 各値は databook.json、47 県比較は `/ranking/<key>` リンクで回遊。
 *
 * 男女は色だけでなく「男性 / 女性」の文字でも区別する (WCAG 1.4.1)。色は GENDER_TONE_TEXT で、
 * light は 700 系・dark は 400 系 (白地 contrast blue-700 6.70 / pink-700 6.04、dark --card で blue-400 5.83 / pink-400 5.60。
 * 旧 `text-[#3b82f6]` / `text-[#ec4899]` は 3.68 / 3.53 で 4.5:1 を満たさなかった。2026-08-05 是正)。
 */
export function GenderPairedKpiGrid({ pairs, databook }: Props) {
  const items: RankedValueGridItem[] = pairs.flatMap((p) =>
    (["male", "female"] as const).map((tone) => {
      const key = tone === "male" ? p.maleKey : p.femaleKey;
      const v = databook?.metrics[key];
      return {
        key,
        href: hrefFor("ranking", { rankingKey: key }),
        label: (
          <>
            <span className={GENDER_TONE_TEXT[tone]}>{GENDER_LABEL[tone]}</span> {p.label}
          </>
        ),
        value: v
          ? {
              value: v.value,
              unit: v.unit,
              year: v.year,
              badge:
                v.rank >= 1 && v.rank <= PREFECTURE_COUNT
                  ? { rank: v.rank, tone: rankToneByPosition(v.rank) }
                  : undefined,
            }
          : undefined,
      };
    }),
  );

  return <RankedValueGrid items={items} columns={2} navSurface="area_databook" />;
}
