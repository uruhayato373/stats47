import { findInfraNetwork, infraNetworkPageUrl } from '@stats47/gis/infra-history';

import { ExternalAnchor } from '@/components/atoms/ExternalAnchor';
import Link from '@/components/atoms/SiteLink';
import { SurfaceCard } from '@/components/surface';

import {
  InfraHistoryExplorer,
  buildInfraHistoryExplorerProps,
  infraHistoryPath,
  loadInfraHistorySummary,
  resolveInfraScope,
} from '@/features/infra-history';

const EXPRESSWAY_NETWORK_KEY = 'expressway';

/**
 * 道路テーマ (/themes/roads) に埋め込む高速道路網の変遷の節。
 *
 * 交通網の変遷のページ (/geo/history/expressway) と同じ地図 (InfraHistoryExplorer・年のスライダー付き) を
 * 全国の範囲で描く (2026-11-03 オーナー決定。旧: 最新年の 1 枚だけを描く独自の地図)。
 * 高速道路時系列データ (N06) は時系列として使うと非商用なので、この節を出すテーマのページは
 * 広告を出さない (`lib/google-adsense/ad-free-paths.ts`)。
 */
export async function ThemeHighwayTimelineSection() {
  const network = findInfraNetwork(EXPRESSWAY_NETWORK_KEY);
  const scope = network ? resolveInfraScope(network.key, null) : null;
  if (!network || !scope) return null;
  const summary = await loadInfraHistorySummary(network.key);
  const explorerProps = summary ? buildInfraHistoryExplorerProps(network, scope, summary) : null;
  const yearEnd = explorerProps?.years.at(-1) ?? network.years.last;
  const totalKm = explorerProps?.series.total.at(-1) ?? null;
  const sourceYear = network.source.version.length === 2 ? `20${network.source.version}` : network.source.version;

  return (
    <section className="mt-10">
      <h2 className="mb-2 text-xl font-bold text-foreground">
        高速道路ネットワークの広がり（{network.years.first}→{yearEnd}）
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        {network.years.first}年の最初の区間から{yearEnd}年まで、日本の高速道路網は
        {totalKm !== null && (
          <strong className="mx-1 text-primary">
            {yearEnd - network.years.first}年で{Math.round(totalKm).toLocaleString('ja-JP')} km
          </strong>
        )}
        に広がりました。年を動かすと、その年までに開通した区間を地図で表示します。
      </p>
      {explorerProps ? (
        <InfraHistoryExplorer
          {...explorerProps}
          footer={
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <p>
                出典：{network.source.provider}「
                <ExternalAnchor href={infraNetworkPageUrl(network)} className="underline">
                  {network.source.name}
                </ExternalAnchor>
                」（{sourceYear}年版、{network.source.retrievedAt.slice(0, 10)} 取得）を stats47 が加工
              </p>
              <Link href={infraHistoryPath(network.key)} className="text-primary underline">
                全国・地方・県の変遷を見る
              </Link>
            </div>
          }
        />
      ) : (
        <SurfaceCard>
          <p role="alert">
            {network.measure.label}のデータを読み込めませんでした。
            <Link href={infraHistoryPath(network.key)} className="text-primary underline">
              全国・地方・県の変遷を見る
            </Link>
          </p>
        </SurfaceCard>
      )}
    </section>
  );
}
