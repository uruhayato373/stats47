import { REGIONS } from '@stats47/area';
import { BookOpen, FileText, MapPin } from 'lucide-react';

import { ExternalAnchor } from '@/components/atoms/ExternalAnchor';
import Link from '@/components/atoms/SiteLink';
import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { PanelGrid } from '@/components/layout/PageShell';
import { LinkRowNav } from '@/components/navigation/StatisticsScopeNav';
import { SectionCard, SurfaceCard } from '@/components/surface';

import { R2_PUBLIC_BASE_URL } from '@/config/site';

import {
  infraHistoryPath,
  prefName,
  type ResolvedInfraScope,
} from '../lib/infra-history-scope';

import { InfraHistoryExplorer, type InfraHistoryRow } from './InfraHistoryExplorer';

import type { InfraHistoryEvidence } from '../lib/load-infra-history';
import type { InfraHistorySummary, InfraNetworkDefinition } from '@stats47/gis/infra-history';

/** 県境 (表示用。計算は git の県ポリゴンで行う) */
const BOUNDARY_KEY = 'gis/mlit/20240101/prefecture.topojson';

function publicUrl(key: string): string {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? R2_PUBLIC_BASE_URL;
  return `${base.replace(/\/+$/, '')}/${key}`;
}

function scopeRows(
  network: InfraNetworkDefinition,
  scope: ResolvedInfraScope,
  summary: InfraHistorySummary,
): { rows: InfraHistoryRow[]; label: string; columnLabel: string } {
  if (scope.kind === 'prefecture') return { rows: [], label: '', columnLabel: '' };
  return {
    label: scope.kind === 'national' ? '都道府県別' : `${scope.name}の府県別`,
    columnLabel: scope.kind === 'national' ? '都道府県' : '府県',
    rows: scope.prefCodes.map((code) => ({
      code,
      name: prefName(code),
      href: infraHistoryPath(network.key, code),
      total: summary.prefectures[code]?.total ?? [],
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
  const region = scope.regionCode ? REGIONS.find((item) => item.regionCode === scope.regionCode) : null;
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
                    ...(scope.kind === 'prefecture' && region
                      ? [{ label: region.regionName, href: infraHistoryPath(network.key, region.regionCode) }]
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
          <LinkRowNav
            label="表示する範囲"
            items={[
              {
                key: 'national',
                label: '全国',
                href: infraHistoryPath(network.key),
                current: scope.kind === 'national',
              },
              ...REGIONS.map((item) => ({
                key: item.regionCode,
                label: item.regionName,
                href: infraHistoryPath(network.key, item.regionCode),
                current: scope.kind === 'region' && scope.regionCode === item.regionCode,
              })),
            ]}
          />
          {region && scope.kind !== 'national' && (
            <LinkRowNav
              label={`${region.regionName}の府県`}
              items={region.prefectures.map((code5) => {
                const code = code5.slice(0, 2);
                return {
                  key: code,
                  label: prefName(code),
                  href: infraHistoryPath(network.key, code),
                  current: scope.kind === 'prefecture' && scope.slug === code,
                };
              })}
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
            topologyUrl={publicUrl(scope.topologyKey)}
            boundaryUrl={publicUrl(BOUNDARY_KEY)}
            prefCodes={scope.prefCodes}
          />
        ) : (
          <SurfaceCard>
            <p role="alert">延長のデータを読み込めませんでした。時間をおいて再読み込みしてください。</p>
          </SurfaceCard>
        )}

        <SectionCard title="地図の読み方" icon={<BookOpen />} headingAs="h2">
          <ul className="list-disc space-y-1 pl-5">
            <li>年を動かすと、その年に存在した区間を種別の色で描きます。赤い線はその年に開通した区間、点線はその年に廃止・変更された区間です。</li>
            <li>延長は区間の線を都道府県の境で分けて計算しています。境界をまたぐ区間は、それぞれの県に入る長さだけを数えます。</li>
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
            <ExternalAnchor href={network.source.pageUrl} className="text-primary underline">
              {network.source.name}
            </ExternalAnchor>
            」（{network.source.version.length === 2 ? `20${network.source.version}` : network.source.version}
            年版、取得 {network.source.retrievedAt.slice(0, 10)}）をもとに stats47 が年別の地図と延長を作成しました。
          </p>
          <p>
            このデータは時系列として使う場合に非商用の利用条件です（公式ページの記載：「{network.terms.evidence}」、
            {network.terms.verifiedAt} 確認）。このページには広告とアフィリエイトを掲載していません。
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
            {REGIONS.map((item) => (
              <div key={item.regionCode}>
                <Link
                  href={infraHistoryPath(network.key, item.regionCode)}
                  className="font-medium hover:underline"
                >
                  {item.regionName}
                </Link>
                <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  {item.prefectures.map((code5) => (
                    <Link
                      key={code5}
                      href={infraHistoryPath(network.key, code5.slice(0, 2))}
                      className="text-primary hover:underline"
                    >
                      {prefName(code5.slice(0, 2))}
                    </Link>
                  ))}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </PanelGrid>
    </PageShell>
  );
}
