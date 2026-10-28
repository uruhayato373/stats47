import { PageHeading } from "@/components/ops/primitives";
import {
  GeoAnalyses,
  GeoEvents,
  GeoLifecycle,
  GeoPilots,
  GisCatalog,
  M1ReleaseGates,
  M1RoutesTasks,
  M1Summary,
} from "@/components/strategy/business-plan-sections";
import { businessPlanAdminData } from "@/lib/server/business-plan";

export const dynamic = "force-dynamic";
export const metadata = { title: "Geo 分析 — stats47 admin" };

/** /data/geo — Geo 分析の品揃えと公開状態 (旧 /strategy の M1 実行ボードの Geo 部分)。 */
export default function DataGeoPage() {
  const data = businessPlanAdminData();

  return (
    <>
      <PageHeading title="Geo 分析" source="packages/data-configs/src/business-plan/ (M1 カタログ) + GIS カタログ" />
      <GeoAnalyses data={data} />
      <GeoPilots data={data} />
      <GeoLifecycle data={data} />
      <GisCatalog data={data} />
      <GeoEvents data={data} />
      <M1Summary data={data} />
      <M1RoutesTasks data={data} />
      <M1ReleaseGates data={data} />
    </>
  );
}
