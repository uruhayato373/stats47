"use client";

import { AreaSelector } from "@/components/molecules/area/AreaSelector";
import {
  MunicipalityDashboard,
  NationalDashboard,
  PrefectureDashboard,
} from "@/components/organisms/area";

import { Municipality, Prefecture } from "@/features/area/types/index";

import { AreaType, useAreaSelection } from "@/hooks/area/useAreaSelection";

/**
 * 地域別ダッシュボードページのメインコンポーネント
 *
 * 地域選択機能とダッシュボード表示機能を提供します。
 *
 * @returns 地域別ダッシュボードページのJSX要素
 */
export default function AreaPage() {
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
      {/* メインコンテンツ */}
      <div className="space-y-6">
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
    </>
  );
}
