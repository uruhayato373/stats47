import { determineAreaType } from "@/features/area/utils/code-converter";
import { DashboardError } from "@/features/dashboard/components/shared/DashboardError";
import { fetchDashboardComponent } from "@/features/dashboard/services/dashboard-component-resolver";

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
