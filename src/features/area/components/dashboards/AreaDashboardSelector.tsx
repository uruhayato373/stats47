import { Cityashboard } from "./Cityashboard";
import { NationalDashboard } from "./NationalDashboard";
import { PrefectureDashboard } from "./PrefectureDashboard";

import type { AreaType } from "@/hooks/area/useAreaSelection";

/**
 * AreaDashboardSelector の Props
 */
interface AreaDashboardSelectorProps {
  /** 地域タイプ */
  areaType: AreaType;
  /** 地域コード */
  areaCode: string;
}

/**
 * 地域タイプに基づいて適切なダッシュボードコンポーネントを選択するコンポーネント
 *
 * 地域タイプ（全国・都道府県・市区町村）に応じて、対応するダッシュボードを
 * レンダリングします。条件分岐ロジックをカプセル化し、単一責任原則を
 * 遵守します。
 *
 * @param props - AreaDashboardSelector の Props
 * @returns 選択されたダッシュボードコンポーネント
 */
export function AreaDashboardSelector({
  areaType,
  areaCode,
}: AreaDashboardSelectorProps) {
  if (areaType === "national") {
    return <NationalDashboard areaCode={areaCode} />;
  }

  if (areaType === "prefecture") {
    return <PrefectureDashboard areaCode={areaCode} />;
  }

  return <Cityashboard areaCode={areaCode} />;
}
