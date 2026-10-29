import {
  INFRA_SCOPE_REGIONS,
  infraNetworkPageUrl,
  infraNetworkTerms,
  type InfraHistorySummary,
  type InfraNetworkDefinition,
} from '@stats47/gis/infra-history';
import { BookOpen, FileText, MapPin } from 'lucide-react';

import { ExternalAnchor } from '@/components/atoms/ExternalAnchor';
import Link from '@/components/atoms/SiteLink';
import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { PanelGrid } from '@/components/layout/PageShell';
import { LinkRowNav } from '@/components/navigation/StatisticsScopeNav';
import { SectionCard, SurfaceCard } from '@/components/surface';

import {
  PREFECTURE_BOUNDARY_PATH,
  infraHistoryPath,
  infraScopeNavItems,
  municipalityBoundaryPath,
  prefName,
  type ResolvedInfraScope,
} from '../lib/infra-history-scope';

import { InfraHistoryExplorer, type InfraHistoryRow } from './InfraHistoryExplorer';

import type { InfraHistoryEvidence } from '../lib/load-infra-history';

function scopeRows(
  network: InfraNetworkDefinition,
  scope: ResolvedInfraScope,
  summary: InfraHistorySummary,
): { rows: InfraHistoryRow[]; label: string; columnLabel: string } {
  if (scope.kind === 'prefecture') return { rows: [], label: '', columnLabel: '' };
  return {
    label: scope.kind === 'national' ? '都道府県別' : `${scope.name}の県別`,
    columnLabel: scope.kind === 'national' ? '都道府県' : '県',
    rows: scope.prefCodes.map((code) => ({
      code,
      name: prefName(code),
      href: infraHistoryPath(network.key, code),
      total: summary.prefectures[code]?.total ?? [],
    })),
  };
}

/** 地方・1 道県の区分の行き先 (北海道・沖縄は県のページ) */
function regionHref(network: InfraNetworkDefinition, region: (typeof INFRA_SCOPE_REGIONS)[number]): string {
  return infraHistoryPath(network.key, region.prefCodes.length === 1 ? region.prefCodes[0] : region.code);
}

interface InfraHistoryPageProps {
  readonly network: InfraNetworkDefinition;
  readonly scope: ResolvedInfraScope;
  readonly summary: InfraHistorySummary | null;
  readonly evidence: InfraHistoryEvidence | null;
}

export function InfraHistoryPage({ network, scope, summary, evidence }: InfraHistoryPageProps) {
  const series =
    !summary
      ? null
      : scope.kind === 'national'
        ? summary.national
        : scope.kind === 'region'
          ? summary.regions[scope.slug ?? '']
          : summary.prefectures[scope.slug ?? ''];
  const { rows, label, columnLabel } = summary
    ? scopeRows(network, scope, summary)
    : { rows: [], label: '', columnLabel: '' };
  const terms = infraNetworkTerms(network);
  const region = scope.regionCode ? INFRA_SCOPE_REGIONS.find((item) => item.code === scope.regionCode) : null;
  const regionHasPages = region !== null && region !== undefined && region.prefCodes.length > 1;
  const title =
    scope.kind === 'national'
      ? `${network.label}網の変遷（${network.years.first}〜${network.years.last}年）`
      : `${scope.name}の${network.label}網の変遷（${network.years.first}〜${network.years.last}年）`;

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
            rowsColumnLabel={columnLabel}
            topologyUrl={scope.topologyPath}
            boundaryUrl={PREFECTURE_BOUNDARY_PATH}
            municipalityUrl={scope.kind === 'prefecture' && scope.slug ? municipalityBoundaryPath(scope.slug) : null}
            prefCodes={scope.prefCodes}
          />
        ) : (
          <SurfaceCard>
            <p role="alert">延長のデータを読み込めませんでした。時間をおいて再読み込みしてください。</p>
          </SurfaceCard>
        )}

        <SectionCard title="地図の読み方" icon={<BookOpen />} headingAs="h2">
          <ul className="list-disc space-y-1 pl-5">
            <li>年を動かすと、その年に存在した区間を種別の色で描きます。</li>
            <li>
              赤い線はその年に新しくできた区間 (開通・延伸)、点線はその年に無くなった区間 (廃止・短縮) です。
              会社名の変更や経営の移管など、同じ場所の区間の記録が付け替わっただけのものは強調しません
              (原典の関係 ID で同じ区間の記録をたどり、前後の年の線から 100m 以上離れた部分だけを新しくできた・無くなった部分とします)。
            </li>
            <li>延長は区間の線を都道府県の境で分けて計算しています。境界をまたぐ区間は、それぞれの県に入る長さだけを数えます。</li>
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
        </SectionCard>

        <SectionCard title="出典と利用条件" icon={<FileText />} headingAs="h2" bodyClassName="space-y-3">
          <p>
            出典：{network.source.provider}「
            <ExternalAnchor href={infraNetworkPageUrl(network)} className="text-primary underline">
              {network.source.name}
            </ExternalAnchor>
            」（{network.source.version.length === 2 ? `20${network.source.version}` : network.source.version}
            年版、取得 {network.source.retrievedAt.slice(0, 10)}）をもとに stats47 が年別の地図と延長を作成しました。
          </p>
          <p>
            このデータは時系列として使う場合に非商用の利用条件です（公式ページの記載：「{terms.evidence}」、
            {terms.verifiedAt} 確認）。このページには広告とアフィリエイトを掲載していません。
          </p>
          {evidence && (
            <p className="text-xs text-muted-foreground">
              検算：区間を {evidence.assignment.segments.toLocaleString('ja-JP')} 本の線分に分け、
              都道府県の境界内 {evidence.assignment.polygon.toLocaleString('ja-JP')} 本・海岸線から{' '}
              {evidence.assignment.coastlineToleranceKm}km 以内 {evidence.assignment.coastline.toLocaleString('ja-JP')} 本・
              どの県にも入らない {evidence.assignment.unassigned.toLocaleString('ja-JP')} 本に分類しました。
              47都道府県と未帰属の合計は全国の延長と一致します（最大差 {evidence.conservation.maxAbsDiffKm} km）。
              表示データ作成 {evidence.generatedAt.slice(0, 10)}。
            </p>
          )}
        </SectionCard>

        <SectionCard title="都道府県から選ぶ" icon={<MapPin />} headingAs="h2">
          <div className="grid gap-3 @md:grid-cols-2">
            {INFRA_SCOPE_REGIONS.map((item) => (
              <div key={item.code}>
                <Link href={regionHref(network, item)} className="font-medium hover:underline">
                  {item.name}
                </Link>
                {item.prefCodes.length > 1 && (
                  <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {item.prefCodes.map((code) => (
                      <Link
                        key={code}
                        href={infraHistoryPath(network.key, code)}
                        className="text-primary hover:underline"
                      >
                        {prefName(code)}
                      </Link>
                    ))}
                  </p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      </PanelGrid>
    </PageShell>
  );
}
