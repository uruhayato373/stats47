import { PageHeading } from "@/components/ops/primitives";
import { SnsSummary } from "@/components/sns/sns-summary";
import { SnsView } from "@/components/sns/sns-view";
import { datasetPath } from "../../../../../config/datasets.mjs";

export const dynamic = "force-dynamic";
export const metadata = { title: "Instagram運用 — stats47 admin" };

/** Instagram運用 (型 B: 一覧)。投稿原稿・予定・公開実績・メトリクス。下書き本文は画像を確認しながら編集できる。 */
export default function InstagramContentPage() {
  return (
    <>
      <PageHeading title="Instagram運用" source={`${datasetPath("sns.posts")} (platform=instagram)`} accessLabel="下書き本文の編集のみ" />
      <SnsSummary platform="instagram" />
      <SnsView initialPlatform="instagram" />
    </>
  );
}
