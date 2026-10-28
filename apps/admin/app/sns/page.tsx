import { PageHeading } from "@/components/ops/primitives";
import { SnsSummary } from "@/components/sns/sns-summary";
import { SnsView } from "@/components/sns/sns-view";
import { datasetPath } from "../../../../config/datasets.mjs";

export const dynamic = "force-dynamic";
export const metadata = { title: "SNS 投稿台帳 — stats47 admin" };

/** SNS 投稿台帳 (型 B: 一覧)。件数の要約 → 推移 → 投稿の一覧。下書きは画像を確認しながら本文を編集できる。 */
export default function SnsPage() {
  return (
    <>
      <PageHeading title="SNS 投稿台帳" source={datasetPath("sns.posts")} accessLabel="下書き本文の編集のみ" />
      <SnsSummary />
      <SnsView />
    </>
  );
}
