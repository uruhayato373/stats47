import { INFRA_NETWORKS, isInfraNetworkAdFree, isInfraNetworkPublishable } from '@stats47/gis/infra-history';
import { ArrowRight } from 'lucide-react';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { PanelGrid } from '@/components/layout/PageShell';
import { SurfaceLinkCard } from '@/components/surface';

import { infraHistoryPath } from '@/features/infra-history';

import type { Metadata } from 'next';

const IS_PUBLIC = INFRA_NETWORKS.every(isInfraNetworkPublishable);
/** 広告を出さない (非商用の利用条件の) 路線網。台帳の利用条件から決める */
const AD_FREE_LABELS = INFRA_NETWORKS.filter(isInfraNetworkAdFree)
  .map((network) => network.label)
  .join('・');

export const metadata: Metadata = {
  title: '交通網の変遷',
  description:
    '高速道路・鉄道・空港が、年ごとにどこで増え、どこで消えたかを地図で示します。全国・地方・都道府県の範囲で延長や施設数の推移を比べられます。',
  alternates: { canonical: '/geo/history' },
  // 非商用原典の公開承認が出るまで検索に出さない (台帳 publication と了承の範囲。isInfraNetworkPublishable)
  ...(IS_PUBLIC ? {} : { robots: 'noindex, follow' }),
};

export default function InfraHistoryIndexPage() {
  return (
    <PageShell
      header={
        <>
          <Breadcrumbs
            items={[
              { label: 'ホーム', href: '/' },
              { label: '地域分析', href: '/geo' },
              { label: '交通網の変遷' },
            ]}
          />
          <PageHeader
            title="交通網の変遷"
            description="高速道路・鉄道・空港が、年ごとにどこで増え、どこで消えたかを地図で示します。全国・地方・都道府県の範囲で延長や施設数の推移を比べられます。"
          />
        </>
      }
    >
      <PanelGrid className="@md:grid-cols-2 @lg:grid-cols-3">
        {INFRA_NETWORKS.map((network) => (
          <SurfaceLinkCard key={network.key} href={infraHistoryPath(network.key)} className="space-y-2 p-4">
            <p className="text-xs text-muted-foreground">
              {network.years.first}〜{network.years.last}年 · {network.source.name}
            </p>
            <h3 className="text-base font-semibold">{network.question}</h3>
            <p className="text-sm leading-relaxed text-muted-foreground">{network.description}</p>
            <span className="inline-flex items-center gap-1 text-sm text-primary">
              {network.label}の地図を見る
              <ArrowRight className="size-4" aria-hidden />
            </span>
          </SurfaceLinkCard>
        ))}
      </PanelGrid>
      <p className="p-3 text-xs leading-relaxed text-muted-foreground">
        原典の国土数値情報のうち、{AD_FREE_LABELS}は時系列として使う場合に非商用の利用条件です。
        これらの地図のページには広告とアフィリエイトを掲載していません。
      </p>
    </PageShell>
  );
}
