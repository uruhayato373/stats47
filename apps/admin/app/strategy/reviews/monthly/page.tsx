import { ReviewPage } from "../review-parts";

export const dynamic = "force-dynamic";
export const metadata = { title: "月次レビュー — stats47 admin" };

/** 戦略 ＞ レビュー ＞ 月次。回を選ぶと、その回の実施状況・手順・判断が出る (判定は review-cadence.mjs)。 */
export default function Page({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  return <ReviewPage cadence="monthly" searchParams={searchParams} />;
}
