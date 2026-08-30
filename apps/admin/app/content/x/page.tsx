import { SnsView } from "@/components/sns/sns-view";

export const metadata = { title: "X運用 — stats47 admin" };

export default function XContentPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-console-fg">X運用</h1>
        <p className="mt-1 text-sm text-console-muted">投稿原稿・着地ページ・予定・公開実績・メトリクス（読み取り専用）</p>
      </div>
      <div className="grid gap-2 border-y border-console-border py-3 text-xs text-console-muted sm:grid-cols-2 lg:grid-cols-4">
        <p><b className="text-console-fg">ランキング</b><br />単一指標を47都道府県比較</p>
        <p><b className="text-console-fg">テーマ</b><br />複数指標を同じ主題で横断</p>
        <p><b className="text-console-fg">エリア</b><br />1県のデータブックへ誘導</p>
        <p><b className="text-console-fg">GeoAI</b><br />複数GIS層と空間演算で判断</p>
      </div>
      <SnsView initialPlatform="x" />
    </div>
  );
}
