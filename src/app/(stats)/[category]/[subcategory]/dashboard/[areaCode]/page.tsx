import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/atoms/ui/resizable";

import { determineAreaType } from "@/features/area/utils/code-converter";
import {
  findSubcategoriesByCategory,
  findSubcategoryByName,
} from "@/features/category/repositories/category-repository";

import { DashboardError } from "@/features/dashboard/components/shared/DashboardError";
import { SubcategorySidebar } from "@/features/dashboard/components/shared/SubcategorySidebar";
import { fetchDashboardComponent } from "@/features/dashboard/services/dashboard-component-resolver";
import { fetchFormattedStatsData } from "@/features/estat-api/stats-data/services/fetcher";

export const runtime = "edge";

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

  // サブタイトル用の情報を取得
  let subtitle: string | undefined;
  try {
    // サブカテゴリ名を取得
    const subcategoryData = await findSubcategoryByName(subcategory);
    const subcategoryName = subcategoryData?.subcategoryName || subcategory;

    // areaName を取得（軽量なAPI呼び出しで1件のデータを取得）
    // 任意の統計データIDを使用（人口推計を使用）
    const statsSchemas = await fetchFormattedStatsData("0000010101", {
      areaFilter: areaCode,
    });

    if (statsSchemas.length > 0) {
      const areaName = statsSchemas[0].areaName;
      subtitle = `${areaName}の${subcategoryName}`;
    }
  } catch (error) {
    // サブタイトルの取得に失敗してもページは表示する
    console.warn(
      `[DashboardPage] Failed to get subtitle for ${category}/${subcategory}/${areaCode}:`,
      error
    );
  }

  // 同じカテゴリのサブカテゴリを取得
  let subcategories: Array<{
    subcategoryKey: string;
    subcategoryName: string;
  }> = [];
  try {
    const subcategoriesData = await findSubcategoriesByCategory(category);
    subcategories = subcategoriesData.map((sub) => ({
      subcategoryKey: sub.subcategoryKey,
      subcategoryName: sub.subcategoryName,
    }));
  } catch (error) {
    // サブカテゴリの取得に失敗してもページは表示する
    console.warn(
      `[DashboardPage] Failed to get subcategories for category ${category}:`,
      error
    );
  }

  // コンポーネント取得を試行
  try {
    const DashboardComponent = await fetchDashboardComponent(
      category,
      subcategory,
      areaCode
    );

    // コンポーネントが見つかった場合
    if (DashboardComponent) {
      return (
        <div className="flex h-full w-full flex-col">
          {subtitle && (
            <div className="border-b border-border pb-4">
              <h2 className="text-xl font-semibold text-muted-foreground pl-4">
                {subtitle}
              </h2>
            </div>
          )}
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel defaultSize={75} minSize={50}>
              <div className="h-full w-full overflow-y-auto p-4">
                <DashboardComponent
                  category={category}
                  subcategory={subcategory}
                  areaCode={areaCode}
                  areaType={areaType}
                />
              </div>
            </ResizablePanel>
            {subcategories.length > 0 && (
              <>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
                  <SubcategorySidebar
                    subcategories={subcategories}
                    currentSubcategory={subcategory}
                    areaCode={areaCode}
                  />
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </div>
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
