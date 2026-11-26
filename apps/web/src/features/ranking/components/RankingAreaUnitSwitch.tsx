import { StatisticsScopeNav, type StatisticsScope } from "@/components/navigation";

import { AREA_UNIT_SWITCH_LINK_TONE } from "./ranking-area-unit-switch.palette";

/** ランキングのページで切り替える地域の単位。同じ指標のページがあるのは都道府県と市区町村だけ */
const RANKING_SCOPES: readonly StatisticsScope[] = ["prefectures", "municipalities"];

interface RankingAreaUnitSwitchProps {
  /** いま見ているページの単位 */
  current: "prefectures" | "municipalities";
  /** 同じ指標の都道府県のランキング */
  prefectureHref: string;
  /** 同じ指標の市区町村のランキング */
  municipalityHref: string;
  /** 市区町村へのリンクの計測ラベル (都道府県のページから渡す。関連付けの ID) */
  municipalityNavLabel?: string;
}

/**
 * ランキングの地域の単位の切り替え (都道府県 ⇄ 市区町村)。都道府県と市区町村のランキングのページが、
 * 地図と表の枠の見出しの右に同じ形で置く (2026-11-26 オーナー決定)。
 *
 * それまでは、都道府県のページは青い「市区町村別を見る」ボタン、市区町村のページは題の右の 3 択 (日本を含む) で、
 * 同じ行き来なのに形も場所も違った。相手のページが無い指標では、呼び出し側がこの部品を出さない。
 * 計測の面は、都道府県 → 市区町村の導線を測ってきた `ranking_municipality` を両方のページで使う。
 */
export function RankingAreaUnitSwitch({
  current,
  prefectureHref,
  municipalityHref,
  municipalityNavLabel,
}: RankingAreaUnitSwitchProps) {
  return (
    <StatisticsScopeNav
      current={current}
      scopes={RANKING_SCOPES}
      hrefs={{ prefectures: prefectureHref, municipalities: municipalityHref }}
      surface="ranking_municipality"
      navLabels={{ municipalities: municipalityNavLabel }}
      // 押せる側 (相手のページ) は青い塗りで目立たせる
      linkClassName={AREA_UNIT_SWITCH_LINK_TONE}
      // 枠の見出しの右に置くので、下の余白と全幅を外す
      className="mb-0 w-auto"
    />
  );
}
