"use client";

import { AreaSelector } from "@/components/molecules/area/AreaSelector";
import { RankingItemsSidebar } from "@/components/molecules/ranking/RankingItemsSidebar";
import {
  MunicipalityDashboard,
  NationalDashboard,
  PrefectureDashboard,
} from "@/components/organisms/area";

import { Municipality, Prefecture } from "@/features/area/types";

import { AreaType, useAreaSelection } from "@/hooks/area/useAreaSelection";
import { useCategoryParams } from "@/hooks/routing/useCategoryParams";

/**
 * 地域別ダッシュボードページのクライアントコンポーネント
 *
 * 地域選択機能とダッシュボード表示機能を提供します。
 *
 * @returns 地域別ダッシュボードページのJSX要素
 */
export function AreaPageClient() {
  // URLパラメータからカテゴリとサブカテゴリを取得
  const { category, subcategory } = useCategoryParams();
  const { selection, changeAreaType, selectPrefecture, selectMunicipality } =
    useAreaSelection();

  // 地域タイプ変更ハンドラー
  const handleAreaTypeChange = (areaType: AreaType) => {
    changeAreaType(areaType);
  };

  // 都道府県選択ハンドラー
  const handlePrefectureSelect = (prefecture: Prefecture) => {
    selectPrefecture(prefecture);
  };

  // 市区町村選択ハンドラー
  const handleMunicipalitySelect = (municipality: Municipality) => {
    selectMunicipality(municipality);
  };

  // ダッシュボードコンポーネントを動的に選択
  const renderDashboard = () => {
    if (selection.areaType === "country") {
      return <NationalDashboard areaCode={selection.selectedCode} />;
    } else if (selection.areaType === "prefecture") {
      return <PrefectureDashboard areaCode={selection.selectedCode} />;
    } else {
      return <MunicipalityDashboard areaCode={selection.selectedCode} />;
    }
  };

  return (
    <>
      {/* メインコンテンツ（左側） */}
      <div className="lg:col-span-2 space-y-6">
        {/* 地域選択コンポーネント */}
        <AreaSelector
          selectedAreaType={selection.areaType}
          selectedPrefectureCode={selection.prefectureCode}
          onAreaTypeChange={handleAreaTypeChange}
          onPrefectureSelect={handlePrefectureSelect}
          onMunicipalitySelect={handleMunicipalitySelect}
        />

        {/* 選択された地域のダッシュボード */}
        {selection.selectedCode && (
          <div className="mt-6">{renderDashboard()}</div>
        )}
      </div>

      {/* ランキング項目サイドバー（右側） */}
      <div className="lg:col-span-1">
        <RankingItemsSidebar category={category} subcategory={subcategory} />
      </div>
    </>
  );
}
