"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { AreaSelector } from "@/components/molecules/area/AreaSelector";
import { RankingItemsSidebar } from "@/components/molecules/ranking/RankingItemsSidebar";

import { Municipality, Prefecture } from "@/features/area/types";

import { AreaType, useAreaSelection } from "@/hooks/area/useAreaSelection";
import { usePathname } from "next/navigation";

/**
 * 地域別ダッシュボードページのクライアントコンポーネント
 *
 * 地域選択機能とダッシュボード表示機能を提供します。
 *
 * @returns 地域別ダッシュボードページのJSX要素
 */
export function AreaPageClient() {
  // URLパラメータからカテゴリとサブカテゴリを取得
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);
  const category = pathSegments[0] || "";
  const subcategory = pathSegments[1] || "";
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
    </div>
  );
}

/**
 * 全国ダッシュボードコンポーネント
 */
function NationalDashboard({ areaCode }: { areaCode: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>全国ダッシュボード</CardTitle>
        <CardDescription>全国の統計データを表示しています</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            全国データのダッシュボード表示機能は準備中です
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            地域コード: {areaCode}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 都道府県ダッシュボードコンポーネント
 */
function PrefectureDashboard({ areaCode }: { areaCode: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>都道府県ダッシュボード</CardTitle>
        <CardDescription>
          選択された都道府県の統計データを表示しています
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            都道府県データのダッシュボード表示機能は準備中です
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            地域コード: {areaCode}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 市区町村ダッシュボードコンポーネント
 */
function MunicipalityDashboard({ areaCode }: { areaCode: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>市区町村ダッシュボード</CardTitle>
        <CardDescription>
          選択された市区町村の統計データを表示しています
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            市区町村データのダッシュボード表示機能は準備中です
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            地域コード: {areaCode}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
