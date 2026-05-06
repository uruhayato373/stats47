import { GisCatalogTable } from "@/features/gis-catalog/components";
import { fetchGisDatasets } from "@/features/gis-catalog/repository/gis-datasets-reader";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GIS データカタログ | stats47",
  robots: "noindex, follow",
};

export default async function GisCatalogPage() {
  const datasets = await fetchGisDatasets();

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">
        GIS データカタログ
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        国土交通省 国土数値情報ダウンロードサービスから取得した GIS データセット一覧。
        ✓ は TopoJSON 変換済みで R2 に保存済みのデータセットを示します。
      </p>
      <GisCatalogTable datasets={datasets} />
    </main>
  );
}
