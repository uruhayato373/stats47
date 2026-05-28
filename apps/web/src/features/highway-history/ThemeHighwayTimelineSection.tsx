import { HighwayTimelineMap, loadHighwayStats } from "./HighwayTimelineMap";

/**
 * 道路テーマ (/themes/roads) に埋め込む高速道路ネットワーク時系列セクション。
 *
 * 旧 /maps/highway-timeline 独立ページを 2026-05-28 にテーマへ統合した際、
 * GIS アニメ機能を失わないよう本セクションとして移設。R2 (storage.stats47.jp/app/highway-history)
 * から直接データを取得する server component。
 */
export async function ThemeHighwayTimelineSection() {
  const stats = await loadHighwayStats();

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-xl font-bold text-slate-900">
        高速道路ネットワークの広がり（{stats.yearStart}→{stats.yearEnd}）
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        1962年の名神部分開通から{stats.yearEnd}年まで、日本の高速道路網は
        <strong className="mx-1 text-amber-700">
          {stats.totalYears}年で{stats.totalKm.toLocaleString("ja-JP")} km
        </strong>
        （{stats.totalSections.toLocaleString("ja-JP")}区間）に広がりました。最新年時点のネットワークを地図で表示します。
      </p>
      <HighwayTimelineMap year={stats.yearEnd} />
    </section>
  );
}
