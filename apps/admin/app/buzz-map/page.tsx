import type { Metadata } from "next";

import { BuzzMapView } from "@/components/buzz-map/buzz-map-view";
import { PageHeading } from "@/components/ops/primitives";
import { datasetDir } from "../../../../config/datasets.mjs";

export const metadata: Metadata = {
  title: "バズ地図 — stats47 統合メディアコンソール",
};

/**
 * バズ地図 集客ゲート (型 E: 制作ツール)。企画・evidence・landing・素材を確認する読み取り専用ギャラリー。
 * 生成・R2・draft登録は agent/skill が実行する。
 */
export default function BuzzMapPage() {
  return (
    <>
      <PageHeading title="バズ地図 集客ゲート" source={`${datasetDir("sns.buzz-map-attribution")}/buzz-map-catalog.json + posts.json`} />
      <BuzzMapView />
    </>
  );
}
