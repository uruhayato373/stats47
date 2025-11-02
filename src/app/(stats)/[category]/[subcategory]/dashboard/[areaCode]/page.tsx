import { MunicipalityDashboard } from "@/components/organisms/dashboard/MunicipalityDashboard";

import { determineAreaType } from "@/features/area/utils/code-converter";
import { DashboardError } from "@/features/dashboard/components/shared/DashboardError";
import { resolveDashboardComponent } from "@/features/dashboard/services/dashboard-component-resolver";

interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    areaCode: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { category, subcategory, areaCode } = await params;

  // 地域タイプを判定
  const areaType = determineAreaType(areaCode);

  // landweather/land-area/dashboard/00000/city-map でCityMapを表示（特別なケース）
  if (
    category === "landweather" &&
    subcategory === "land-area" &&
    areaCode === "city-map"
  ) {
    const { CityMap } = await import(
      "@/features/visualization/map/common/CityMap"
    );
    return (
      <div className="w-full h-screen p-4">
        <CityMap width={1200} height={800} />
      </div>
    );
  }

  // 市区町村は従来のダッシュボードを維持（必要に応じて後日レイアウト化）
  if (areaType === "city") {
    return (
      <div>
        <MunicipalityDashboard areaCode={areaCode} />
      </div>
    );
  }

  // コンポーネント解決を試行
  try {
    const DashboardComponent = await resolveDashboardComponent(
      category,
      subcategory,
      areaCode
    );

    // コンポーネントが見つかった場合
    if (DashboardComponent) {
      return (
        <DashboardComponent
          category={category}
          subcategory={subcategory}
          areaCode={areaCode}
          areaType={areaType}
        />
      );
    }
  } catch (error) {
    console.error(
      `[DashboardPage] Failed to resolve dashboard component for ${category}/${subcategory}/${areaCode}:`,
      error
    );
    return (
      <DashboardError
        message="ダッシュボードコンポーネントの解決に失敗しました"
        error={error instanceof Error ? error : new Error(String(error))}
      />
    );
  }

  // コンポーネントが見つからない場合
  return (
    <div className="p-4">
      <p className="text-muted-foreground">
        このサブカテゴリのダッシュボードは未定義です。
      </p>
    </div>
  );
}
