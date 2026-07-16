import { SvgCatalogView } from "@/components/svg/svg-catalog-view";

export default function SvgPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-console-fg">SVG カタログ</h1>
        <p className="mt-1 text-sm text-console-muted">
          ブログ記事の SVG チャートをカタログ別 (bar / scatter / map / findings / line / stacked
          / 未分類) に横断閲覧する。
        </p>
      </div>
      <SvgCatalogView />
    </div>
  );
}
