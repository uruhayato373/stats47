import { BuzzMapView } from "@/components/buzz-map/buzz-map-view";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "バズ地図 — stats47 統合メディアコンソール",
};

export default function BuzzMapPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-console-fg">🗾 バズ地図 集客ゲート</h1>
        <p className="mt-1 text-sm text-console-muted">
          企画・evidence・landing・素材を確認する読み取り専用ギャラリー。生成・R2・draft登録はagent/skillが実行します。
        </p>
      </div>
      <BuzzMapView />
    </div>
  );
}
