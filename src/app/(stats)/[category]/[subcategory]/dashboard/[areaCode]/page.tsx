import { MunicipalityDashboard } from "@/components/organisms/dashboard/MunicipalityDashboard";

import { determineAreaType } from "@/features/area/utils/code-converter";
import { loadDashboardData } from "@/features/dashboard/actions/loadDashboardData";
import { DashboardError } from "@/features/dashboard/components/shared/DashboardError";
import {
  determineAreaLevel,
  resolveDashboardComponent,
} from "@/features/dashboard/services/dashboard-component-resolver";
import { widgetComponents } from "@/features/dashboard/widgets/registry";

interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    areaCode: string;
  }>;
}

export default async function Page({ params }: PageProps) {
  const { category, subcategory, areaCode } = await params;

  // 地域タイプとレベルを判定
  const areaType = determineAreaType(areaCode);
  const areaLevel = determineAreaLevel(areaCode);

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
          areaLevel={areaLevel}
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

  // レイアウトとデータの取得
  const { layout, data } = await loadDashboardData({
    subcategoryId: subcategory,
    areaCode,
  });

  if (!layout) {
    return <div>このサブカテゴリのダッシュボードは未定義です。</div>;
  }

  const { cols, rowHeight } = layout.grid;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridAutoRows: `${rowHeight}px`,
        gap: "12px",
        width: "100%",
      }}
    >
      {layout.widgets.map((w) => {
        const Comp = (widgetComponents as any)[w.type] as any;
        if (!Comp) return null;

        const gridStyle: React.CSSProperties = {
          gridColumn: `${w.col + 1} / span ${w.w}`,
          gridRow: `${w.row + 1} / span ${w.h}`,
        };

        // ウィジェット種別ごとの最小propsマッピング
        let props: any = {};
        if (w.type === "metric") {
          const d = (data as any)[w.key] || {};
          props = { title: d.title ?? "—", value: d.value ?? "—" };
        } else if (w.type === "chart.line") {
          const d = (data as any)[w.key] || {};
          props = { title: d.title ?? "—" };
        } else if (w.type === "viz.pref-map") {
          props = { areaCode };
        }

        return (
          <div key={w.key} style={gridStyle}>
            <Comp {...props} />
          </div>
        );
      })}
    </div>
  );
}
