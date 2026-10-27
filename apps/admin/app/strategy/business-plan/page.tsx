import { PageHeading } from "@/components/ops/primitives";
import {
  ContentCatalog,
  Decisions,
  EventContracts,
  Feasibility,
  Initiatives,
  KpiContracts,
} from "@/components/strategy/business-plan-sections";
import { businessPlanAdminData } from "@/lib/server/business-plan";

export const dynamic = "force-dynamic";
export const metadata = { title: "事業計画の詳細 — stats47 admin" };

/**
 * /strategy/business-plan — 事業計画の資料 (調べるときに引く)。サイドメニューには出さず、方針 (/strategy) から開く。
 * Geo・X・note 商品の明細は担当の領域のページ (/data/geo・/sns/geo-plan・/product/note-plan) にある。
 */
export default function BusinessPlanDetailPage() {
  const data = businessPlanAdminData();

  return (
    <div className="space-y-8">
      <PageHeading title="事業計画の詳細" source="packages/data-configs/src/business-plan/">
        <p className="max-w-4xl text-sm text-console-muted">
          原案を実行可能な正典へ変換した資料。売上・アクセス目標は予測ではなく仮説、未計測は 0 ではない。
        </p>
      </PageHeading>
      <Feasibility data={data} />
      <Initiatives data={data} />
      <Decisions data={data} />
      <KpiContracts data={data} />
      <EventContracts data={data} />
      <ContentCatalog data={data} />
    </div>
  );
}
