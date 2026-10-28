import { LayersIcon } from "lucide-react";

import { PanelCard } from "@/components/admin-ui";
import { PageHeading } from "@/components/ops/primitives";
import { SnsSummary } from "@/components/sns/sns-summary";
import { SnsView } from "@/components/sns/sns-view";
import { datasetPath } from "../../../../../config/datasets.mjs";

export const dynamic = "force-dynamic";
export const metadata = { title: "X運用 — stats47 admin" };

const LANDINGS = [
  { title: "ランキング", note: "単一指標を47都道府県比較" },
  { title: "テーマ", note: "複数指標を同じ主題で横断" },
  { title: "エリア", note: "1県のデータブックへ誘導" },
  { title: "GeoAI", note: "複数GIS層と空間演算で判断" },
];

/** X運用 (型 B: 一覧)。投稿原稿・着地ページ・予定・公開実績・メトリクス。下書き本文は画像を確認しながら編集できる。 */
export default function XContentPage() {
  return (
    <>
      <PageHeading title="X運用" source={`${datasetPath("sns.posts")} (platform=x)`} accessLabel="下書き本文の編集のみ" />
      <SnsSummary platform="x" />
      <PanelCard title="着地ページの型" icon={<LayersIcon />}>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          {LANDINGS.map((l) => (
            <div key={l.title}>
              <dt className="font-medium">{l.title}</dt>
              <dd className="text-muted-foreground">{l.note}</dd>
            </div>
          ))}
        </dl>
      </PanelCard>
      <SnsView initialPlatform="x" />
    </>
  );
}
