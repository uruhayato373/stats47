import { PageHeading } from "@/components/ops/primitives";
import { QueuesView } from "@/components/site/queues-view";

export const metadata = { title: "是正キュー — stats47 admin" };

/** /site/queues — サイトの是正・企画キューの進み具合 (人が手を打つもの)。 */
export default function SiteQueuesPage() {
  return (
    <div className="space-y-6">
      <PageHeading title="是正キュー" source="ブログ・AI 解説・SNS の是正キューの記録 (/api/dashboard/summary)" />
      <QueuesView />
    </div>
  );
}
