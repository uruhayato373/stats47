import { Section } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { M1XAudit, M1XPosts, XIdeas } from "@/components/strategy/business-plan-sections";
import { businessPlanAdminData } from "@/lib/server/business-plan";

export const dynamic = "force-dynamic";
export const metadata = { title: "Geo 投稿企画 — stats47 admin" };

/** /sns/geo-plan — 事業計画の X 派生企画と M1 初回15投稿 (旧 /strategy の X 部分)。投稿の状態は /sns。 */
export default function SnsGeoPlanPage() {
  const data = businessPlanAdminData();

  return (
    <div className="space-y-8">
      <PageHeading title="Geo 投稿企画" source="packages/data-configs/src/business-plan/ + SNS の投稿台帳" />
      <Section title="X 初回15投稿の Geo 契約監査">
        <M1XAudit data={data} />
      </Section>
      <M1XPosts data={data} />
      <XIdeas data={data} />
    </div>
  );
}
