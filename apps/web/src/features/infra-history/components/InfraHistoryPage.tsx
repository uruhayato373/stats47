import {
  INFRA_SCOPE_REGIONS,
  infraNetworkPageUrl,
  infraNetworkTerms,
  isInfraNetworkAdFree,
  type InfraHistorySummary,
  type InfraNetworkDefinition,
} from '@stats47/gis/infra-history';
import { Layers } from 'lucide-react';

import { ExternalAnchor } from '@/components/atoms/ExternalAnchor';
import Link from '@/components/atoms/SiteLink';
import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { PanelGrid } from '@/components/layout/PageShell';
import { LinkRowNav } from '@/components/navigation/StatisticsScopeNav';
import { SectionCard, SurfaceCard } from '@/components/surface';

import {
  PREFECTURE_BOUNDARY_PATH,
  infraHistoryPath,
  infraNetworkNoun,
  infraScopeNavItems,
  municipalityBoundaryPath,
  prefName,
  type ResolvedInfraScope,
} from '../lib/infra-history-scope';
import { buildInfraHistoryStructuredData, seriesForScope } from '../lib/infra-history-structured-data';

import { InfraHistoryDetailsSheet } from './InfraHistoryDetailsSheet';
import { InfraHistoryExplorer, type InfraHistoryRow } from './InfraHistoryExplorer';


import type { InfraHistoryEvidence } from '../lib/load-infra-history';

function scopeRows(
  network: InfraNetworkDefinition,
  scope: ResolvedInfraScope,
  summary: InfraHistorySummary,
): { rows: InfraHistoryRow[]; label: string } {
  if (scope.kind === 'prefecture') return { rows: [], label: '' };
  return {
    label: scope.kind === 'national' ? '都道府県別' : `${scope.name}の県別`,
    rows: scope.prefCodes.map((code) => ({
      code,
      name: prefName(code),
      href: infraHistoryPath(network.key, code),
      total: summary.prefectures[code]?.total ?? [],
      byCategory: summary.prefectures[code]?.byCategory ?? {},
    })),
  };
}

interface InfraHistoryPageProps {
  readonly network: InfraNetworkDefinition;
  readonly scope: ResolvedInfraScope;
  readonly summary: InfraHistorySummary | null;
  readonly evidence: InfraHistoryEvidence | null;
}

export function InfraHistoryPage({ network, scope, summary, evidence }: InfraHistoryPageProps) {
  const series = summary ? seriesForScope(summary, scope) : null;
  const structuredData = buildInfraHistoryStructuredData({
    network,
    scope,
    series,
    generatedAt: evidence?.generatedAt ?? null,
  });
  const { rows, label } = summary
    ? scopeRows(network, scope, summary)
    : { rows: [], label: '' };
  const terms = infraNetworkTerms(network);
  const isAdFree = isInfraNetworkAdFree(network);
  const region = scope.regionCode ? INFRA_SCOPE_REGIONS.find((item) => item.code === scope.regionCode) : null;
  const regionHasPages = region !== null && region !== undefined && region.prefCodes.length > 1;
  const sourceYear = network.source.version.length === 2 ? `20${network.source.version}` : network.source.version;
  const title =
    scope.kind === 'national'
      ? `${infraNetworkNoun(network)}の変遷（${network.years.first}〜${network.years.last}年）`
      : `${scope.name}の${infraNetworkNoun(network)}の変遷（${network.years.first}〜${network.years.last}年）`;

  return (
    <PageShell
      header={
        <>
          <Breadcrumbs
            items={[
              { label: 'ホーム', href: '/' },
              { label: '地域分析', href: '/geo' },
              { label: '交通網の変遷', href: '/geo/history' },
              ...(scope.kind === 'national'
                ? [{ label: network.label }]
                : [
                    { label: network.label, href: infraHistoryPath(network.key) },
                    ...(scope.kind === 'prefecture' && region && regionHasPages
                      ? [{ label: region.name, href: infraHistoryPath(network.key, region.code) }]
                      : []),
                    { label: scope.name },
                  ]),
            ]}
          />
          <PageHeader title={title} description={network.description} />
        </>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      <PanelGrid>
        <div className="space-y-1">
          <LinkRowNav label="表示する範囲" items={infraScopeNavItems(network.key, scope)} />
          {region && regionHasPages && scope.kind !== 'national' && (
            <LinkRowNav
              label={`${region.name}の県`}
              items={region.prefCodes.map((code) => ({
                key: code,
                label: prefName(code),
                href: infraHistoryPath(network.key, code),
                current: scope.kind === 'prefecture' && scope.slug === code,
              }))}
            />
          )}
        </div>

        {summary && series ? (
          <InfraHistoryExplorer
            networkLabel={network.label}
            scopeName={scope.name}
            years={summary.years}
            categories={network.categories}
            series={series}
            rows={rows}
            rowsLabel={label}
            topologyUrl={scope.topologyPath}
            boundaryUrl={PREFECTURE_BOUNDARY_PATH}
            municipalityUrl={scope.kind === 'prefecture' && scope.slug ? municipalityBoundaryPath(scope.slug) : null}
            prefCodes={scope.prefCodes}
            geometry={network.geometry}
            measure={network.measure}
            footer={
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <p>
                  出典：{network.source.provider}「
                  <ExternalAnchor href={infraNetworkPageUrl(network)} className="underline">
                    {network.source.name}
                  </ExternalAnchor>
                  」（{sourceYear}年版、{network.source.retrievedAt.slice(0, 10)} 取得）を stats47 が加工
                </p>
                <InfraHistoryDetailsSheet title={title} description={`${network.source.name}の読み方と出典`}>
              <section>
                <h3 className="mb-2 font-medium">地図の読み方</h3>
                <ul className="list-disc space-y-1 pl-5">
                  {network.geometry === 'line' ? (
                    <>
                      <li>年を動かすと、その年に存在した区間を種別の色で描きます。</li>
                      <li>
                        赤い線はその年に新しくできた区間 (開通・延伸)、点線はその年に無くなった区間 (廃止・短縮) です。
                        会社名の変更や経営の移管など、同じ場所の区間の記録が付け替わっただけのものは強調しません
                        (原典の関係 ID で同じ区間の記録をたどり、前後の年の線から 100m 以上離れた部分だけを新しくできた・無くなった部分とします)。
                      </li>
                      <li>延長は区間の線を都道府県の境で分けて計算しています。境界をまたぐ区間は、それぞれの県に入る長さだけを数えます。</li>
                    </>
                  ) : (
                    <>
                      <li>年を動かすと、その年に供用されていた{network.label}を種別の色の点で描きます。</li>
                      <li>
                        赤い点はその年に供用が始まった{network.label}、点線の丸はその年に供用が終わった{network.label}です。
                        種別や管理者の変更など、同じ{network.label}の記録が付け替わっただけのものは強調しません (原典の関係 ID でたどります)。
                      </li>
                      <li>都道府県は原典の所在地の市区町村コードで決めています。</li>
                    </>
                  )}
                  {scope.kind === 'prefecture' && (
                    <li>細い線は市区町村の境界です (政令指定都市は市全体で 1 つ。国土数値情報の行政区域、2024年1月1日時点)。</li>
                  )}
                  {network.cautions.map((caution) => (
                    <li key={caution}>{caution}</li>
                  ))}
                  {evidence && evidence.excludedUnknownYear.length > 0 && (
                    <li>
                      原典で年が「不明」とされている {evidence.excludedUnknownYear.length} 件（
                      {[...new Set(evidence.excludedUnknownYear.map((item) => item.name))].join('・')}
                      ）は、年を推測せずに地図と延長から外しています。
                    </li>
                  )}
                </ul>
              </section>

              <section className="space-y-3">
                <h3 className="font-medium">出典と利用条件</h3>
                <p>
                  出典：{network.source.provider}「
                  <ExternalAnchor href={infraNetworkPageUrl(network)} className="text-primary underline">
                    {network.source.name}
                  </ExternalAnchor>
                  」（{sourceYear}
                  年版、取得 {network.source.retrievedAt.slice(0, 10)}）をもとに stats47 が年別の地図と{network.measure.label}を作成しました。
                </p>
                {isAdFree ? (
                  <p>
                    このデータは時系列として使う場合に非商用の利用条件です（公式ページの記載：「{terms.evidence}」、
                    {terms.verifiedAt} 確認）。このページには広告とアフィリエイトを掲載していません。
                  </p>
                ) : (
                  <p>
                    利用条件：公式ページの記載「{terms.evidence}」（{terms.verifiedAt} 確認）。
                  </p>
                )}
                {evidence && network.geometry === 'line' && (
                  <p className="text-xs text-muted-foreground">
                    検算：区間を {evidence.assignment.segments.toLocaleString('ja-JP')} 本の線分に分け、
                    都道府県の境界内 {evidence.assignment.polygon.toLocaleString('ja-JP')} 本・海岸線から{' '}
                    {evidence.assignment.coastlineToleranceKm}km 以内 {evidence.assignment.coastline.toLocaleString('ja-JP')} 本・
                    どの県にも入らない {evidence.assignment.unassigned.toLocaleString('ja-JP')} 本に分類しました。
                    47都道府県と未帰属の合計は全国の延長と一致します（最大差 {evidence.conservation.maxAbsDiffKm} km）。
                    表示データ作成 {evidence.generatedAt.slice(0, 10)}。
                  </p>
                )}
                {evidence && network.geometry === 'point' && (
                  <p className="text-xs text-muted-foreground">
                    検算：{evidence.assignment.segments.toLocaleString('ja-JP')} 件の記録のうち、所在地の市区町村コードで{' '}
                    {evidence.assignment.attribute.toLocaleString('ja-JP')} 件、位置で{' '}
                    {(evidence.assignment.polygon + evidence.assignment.coastline).toLocaleString('ja-JP')} 件の都道府県を決め、
                    決まらなかったものは {evidence.assignment.unassigned.toLocaleString('ja-JP')} 件です。
                    47都道府県と未帰属の合計は全国の{network.measure.label}と一致します（最大差 {evidence.conservation.maxAbsDiffKm}{' '}
                    {network.measure.unit}）。表示データ作成 {evidence.generatedAt.slice(0, 10)}。
                  </p>
                )}
              </section>
                </InfraHistoryDetailsSheet>
              </div>
            }
          />
        ) : (
          <SurfaceCard>
            <p role="alert">{network.measure.label}のデータを読み込めませんでした。時間をおいて再読み込みしてください。</p>
          </SurfaceCard>
        )}

        {network.currentDataId && (
          <SectionCard title="あわせて見る" icon={<Layers />} headingAs="h2">
            <p>
              <Link href={`/geo/datasets/${network.currentDataId}`} className="text-primary underline">
                {network.label}の現況の地図（GIS）
              </Link>
              ：最新版の{network.label}を拡大して、区域や属性を確かめられます。
            </p>
          </SectionCard>
        )}
      </PanelGrid>
    </PageShell>
  );
}
