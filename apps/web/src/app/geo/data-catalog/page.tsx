import Link from 'next/link';

import { BUSINESS_PLAN_M1_GEO_ANALYSES } from '@stats47/data-configs/business-plan';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import { SurfaceSection } from '@/components/surface';

import { isGeoCrossAnalysisSlug, loadGeoAnalysisSnapshot } from '@/features/geo-analysis';

import type { Metadata } from 'next';

export const revalidate = 86400;
export const metadata: Metadata = {
  title: '空間分析で使うデータ・出典 | stats47',
  description: '住宅地点、洪水、駅と将来人口の分析に使う一次資料、対象年度、空間粒度、利用条件を確認できます。',
  alternates: { canonical: '/geo/data-catalog' },
};

export default async function GeoDataCatalogPage() {
  const analyses = await Promise.all(BUSINESS_PLAN_M1_GEO_ANALYSES.map(async spec => ({
    spec, snapshot: isGeoCrossAnalysisSlug(spec.slug) ? await loadGeoAnalysisSnapshot(spec.slug) : null,
  })));
  return <PageShell>
    <Breadcrumbs items={[{ label: 'ホーム', href: '/' }, { label: '地域分析', href: '/geo' }, { label: 'データ・出典' }]} />
    <PageHeader eyebrow="一次資料と利用条件" title="この空間分析は、何を重ねているか" description="各分析で実際に使うデータと対象年度を掲載しています。原典の地図と、stats47が判定・集計した結果は区別して確認してください。" />
    <div className="space-y-6">{analyses.map(({ spec, snapshot }) => <SurfaceSection key={spec.slug}>
      <SectionHeader title={spec.title} description={spec.question} hideRule />
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">{spec.sourceLayers.map(layer => <div key={layer.id}>
        <dt className="font-semibold">{layer.label}</dt>
        <dd className="mt-1 text-sm text-muted-foreground">{layer.role === 'context-only' ? '背景説明用。空間判定の計算には使いません。' : '計算に使う入力データ。'} {({ mesh: '1kmメッシュ', point: '地点', line: '線', polygon: '区域' } as Record<string, string>)[layer.geometry]}</dd>
      </div>)}</dl>
      {snapshot ? <>
        <h3 className="mt-5 text-sm font-bold">対象年度・一次資料</h3>
        <ul className="mt-2 space-y-2 text-sm">{snapshot.sources.map(source => <li key={source.datasetId + '-' + source.version}>
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline">{source.name}</a>
          <span className="ml-2 text-muted-foreground">{source.datasetId} / 版 {source.version} / {source.license}</span>
        </li>)}</ul>
        <p className="mt-3 text-xs text-muted-foreground">上記資料をもとにstats47が空間判定・集計・表示加工。結果生成日 {snapshot.generatedAt.slice(0, 10)}。</p>
      </> : <p role="status" className="mt-4 text-sm text-muted-foreground">配信データの版を確認できません。原典と計算手法は分析の方法ページを参照してください。</p>}
      <div className="mt-4 flex flex-wrap gap-4 text-sm"><Link href={'/geo/' + spec.slug} className="text-primary underline">地図と判定結果</Link><Link href="/geo/method" className="text-primary underline">計算方法と限界</Link></div>
    </SurfaceSection>)}</div>
    <SurfaceSection className="mt-6"><SectionHeader title="背景地図は計算とは別" hideRule />
      <p className="text-sm leading-relaxed text-muted-foreground">地図の背景は国土地理院の淡色タイルをリアルタイムで読み込み、stats47が地点・人口メッシュ・判定結果を重ねています。背景の道路や地形は分析計算には使わず、配布データにも含めません。</p>
      <a href="https://maps.gsi.go.jp/development/ichiran.html" className="mt-3 inline-block text-sm text-primary underline">地理院タイルの出典・利用条件</a>
    </SurfaceSection>
    <SurfaceSection className="mt-6"><SectionHeader title="再利用するときに" hideRule />
      <p className="text-sm leading-relaxed text-muted-foreground">出典、対象年度、stats47による加工を明記し、各データの個別利用条件を確認してください。人口推計、地価観測、洪水想定、駅位置は基準時点が異なります。組み合わせた結果は将来の価格・安全・交通サービスを保証するものではありません。</p>
      <a href="https://nlftp.mlit.go.jp/ksj/other/agreement.html" target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm text-primary underline">国土数値情報の利用条件</a>
    </SurfaceSection>
  </PageShell>;
}
