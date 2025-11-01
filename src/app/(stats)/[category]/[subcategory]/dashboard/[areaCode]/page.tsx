import { MunicipalityDashboard } from "@/components/organisms/dashboard/MunicipalityDashboard";
import { determineAreaType } from "@/features/area/utils/code-converter";
import { loadDashboardData } from "@/features/dashboard/actions/loadDashboardData";
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

  // landweather/land-area/dashboard/00000 でPrefectureMapを表示
  if (category === "landweather" && subcategory === "land-area" && areaCode === "00000") {
    const { PrefectureMap } = await import("@/features/visualization/map/common/PrefectureMap");
    return (
      <div className="w-full h-screen p-4">
        <PrefectureMap width={1200} height={800} />
      </div>
    );
  }

  const areaType = determineAreaType(areaCode);

  // 市区町村は従来のダッシュボードを維持（必要に応じて後日レイアウト化）
  if (areaType === "city") {
    return <div><MunicipalityDashboard areaCode={areaCode} /></div>;
  }

  // レイアウトとデータの取得
  const { layout, data } = await loadDashboardData({ subcategoryId: subcategory, areaCode });

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
