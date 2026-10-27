import { Section } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { M1NoteContracts, M1NoteProducts, NoteCandidates } from "@/components/strategy/business-plan-sections";
import { businessPlanAdminData } from "@/lib/server/business-plan";

export const dynamic = "force-dynamic";
export const metadata = { title: "note 商品企画 — stats47 admin" };

/** /product/note-plan — 事業計画の note 有料商品の品揃えと実装契約 (旧 /strategy の note 部分)。販売の状態は /product/status。 */
export default function ProductNotePlanPage() {
  const data = businessPlanAdminData();

  return (
    <div className="space-y-8">
      <PageHeading title="note 商品企画" source="packages/data-configs/src/business-plan/ + note の記事台帳" />
      <Section title="note 有料商品15件">
        <M1NoteProducts data={data} />
      </Section>
      <NoteCandidates data={data} />
      <M1NoteContracts data={data} />
    </div>
  );
}
