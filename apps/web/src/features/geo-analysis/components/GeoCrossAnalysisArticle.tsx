import type { ReactNode } from 'react';

import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { GEO_ANALYSES, GEO_LAYERS } from '@stats47/data-configs/business-plan';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import { SurfaceSection } from '@/components/surface';

import {
  formatGeoValue,
  GEO_CROSS_ANALYSIS_CONFIGS,
  type GeoCrossAnalysisSlug,
} from '../lib/geo-cross-analysis';
import { loadGeoAnalysisBundle } from '../lib/load-geo-analysis-snapshot';

import { GeoAnalysisTracker } from './GeoAnalysisTracker';
import { GeoContentPublicationSection } from './GeoContentPublicationSection';
import { GeoCrossAnalysisExplorer } from './GeoCrossAnalysisExplorer';
import { GeoLandslideSummary } from './GeoLandslideSummary';
import { GeoPublicFacilitySummary } from './GeoPublicFacilitySummary';
import { GeoSnowDesignationSummary } from './GeoSnowDesignationSummary';
import { GeoSpatialEvidenceExplorer } from './GeoSpatialEvidenceExplorer';

import type { PublicFacilityGroup } from '../lib/geo-public-facility-evidence';
import type { SpatialView } from '../lib/geo-spatial-evidence';

const inputCountLabels: Record<string, string> = {
  residentialLandPricePoints: '住宅地標準地点',
  stationGroups: '駅グループ',
  populatedMeshes: '人口のある1kmメッシュ',
  floodZipFiles: '洪水データファイル',
  floodFeatures: '洪水ポリゴン',
  matchedFloodFeatures: '人口メッシュに一致した洪水ポリゴン',
};

interface Props {
  slug: GeoCrossAnalysisSlug;
  initialPrefCode?: string;
  initialStage?: SpatialView;
  initialFacilityGroup?: PublicFacilityGroup;
  contextLayer?: ReactNode;
}

export async function GeoCrossAnalysisArticle({
  slug,
  initialPrefCode = '13',
  initialStage = 'population',
  initialFacilityGroup = 'administrative',
  contextLayer,
}: Props) {
  const config = GEO_CROSS_ANALYSIS_CONFIGS[slug];
  const spec = GEO_ANALYSES.find((analysis) => analysis.slug === slug);
  const bundle = await loadGeoAnalysisBundle(slug);
  if (!spec || !bundle) {
    notFound();
  }
  const { snapshot, manifest: evidenceManifest } = bundle;

  const primaryMetric = snapshot.metrics.find(
    (metric) => metric.key === snapshot.primaryMetricKey
  );
  if (!primaryMetric) notFound();

  const generatedDate = new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'Asia/Tokyo',
  }).format(new Date(snapshot.generatedAt));

  return (
    <PageShell>
      <GeoAnalysisTracker
        analysisId={spec.id}
        analysisSlug={spec.slug}
        geography={spec.geography}
        dataVersion={snapshot.dataVersion}
      />
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '地域分析', href: '/geo' },
          { label: config.shortTitle },
        ]}
      />
      <PageHeader
        eyebrow={config.eyebrow}
        title={snapshot.title}
        description={snapshot.question}
        stats={`${snapshot.rows.length}都道府県 ・ ${snapshot.dataVersion} ・ ${primaryMetric.unit}`}
        meta={`データ生成 ${generatedDate} ・ coverage ${snapshot.dataQuality.actualAreas}/${snapshot.dataQuality.expectedAreas}`}
      />

      <nav
        aria-label="入力データを単体で見る"
        className="mb-5 flex flex-wrap items-center gap-x-4 text-sm"
      >
        <span className="font-semibold">まず単体で見る：</span>
        {GEO_LAYERS.filter((layer) =>
          layer.related.some((related) => related === slug)
        ).map((layer) => (
          <Link
            key={layer.slug}
            href={`/geo/layers/${layer.slug}?pref=${initialPrefCode}`}
            className="inline-flex min-h-11 items-center text-primary underline"
          >
            {layer.name}
          </Link>
        ))}
      </nav>
      {config.hazardMapUrl ? (
        <div
          role="note"
          className="mb-6 border border-destructive/40 bg-destructive/5 p-4 text-sm leading-relaxed"
        >
          <strong>
            この分析は避難判断や個別地点の安全確認には使えません。
          </strong>{' '}
          0%も安全を意味しません。住所ごとの確認は、自治体の最新情報と
          <a
            href={config.hazardMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 font-medium text-primary underline"
          >
            国のハザードマップポータル
          </a>
          を利用してください。
        </div>
      ) : null}

      <nav
        aria-label="分析の読み順"
        className="mb-5 flex flex-wrap gap-4 text-sm text-primary underline"
      >
        <a href="#spatial-evidence">県内の地図</a>
        <a href="#prefecture-comparison">県別の集計</a>
        <a href="#methods">方法・出典・限界</a>
      </nav>
      <GeoSpatialEvidenceExplorer
        slug={slug}
        analysisId={spec.id}
        dataVersion={snapshot.dataVersion}
        initialPrefCode={initialPrefCode}
        initialView={initialStage}
        initialFacilityGroup={initialFacilityGroup}
        manifest={evidenceManifest}
      />
      <div id="prefecture-comparison" className="scroll-mt-24">
        <SectionHeader
          title="空間判定の結果を都道府県で比較"
          description="県内の地点・メッシュの判定を集計した結果です。値の大小は地域の優劣を表しません。"
        />
      </div>
      {slug === 'population-landslide-exposure' ? (
        <GeoLandslideSummary snapshot={snapshot} />
      ) : slug === 'population-snow-designation' ? (
        <GeoSnowDesignationSummary snapshot={snapshot} />
      ) : slug === 'population-public-facility-access' ? (
        <GeoPublicFacilitySummary snapshot={snapshot} />
      ) : (
        <>
          <GeoCrossAnalysisExplorer
            analysisId={spec.id}
            comparisonLimit={spec.comparisonLimit}
            mapTitle={config.mapTitle}
            mapSubtitle={config.mapSubtitle}
            snapshot={snapshot}
          />

          <SurfaceSection className="mt-6">
            <SectionHeader title="47都道府県の全データ" hideRule />
            <p className="mt-2 text-sm text-muted-foreground">
              空間判定の主指標が高い順です。横にスクロールすると、人口変化や標本数などの補助指標も確認できます。
            </p>
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>表示順</TableHead>
                    <TableHead>都道府県</TableHead>
                    {snapshot.metrics.map((metric) => (
                      <TableHead key={metric.key} className="text-right">
                        {metric.label}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.rows.map((row) => (
                    <TableRow key={row.areaCode}>
                      <TableCell className="tabular-nums">{row.rank}</TableCell>
                      <TableCell className="font-medium">
                        <Link
                          className="text-primary underline"
                          href={`/geo/${slug}/${row.areaCode.slice(0, 2)}/overlap`}
                        >
                          {row.areaName}の地図
                        </Link>
                      </TableCell>
                      {snapshot.metrics.map((metric) => (
                        <TableCell
                          key={metric.key}
                          className="text-right tabular-nums"
                        >
                          {formatGeoValue(metric, row.values[metric.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </SurfaceSection>
        </>
      )}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <SurfaceSection>
          <SectionHeader title="この記事で読み取れること" hideRule />
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {config.takeaways.map((takeaway) => (
              <li key={takeaway}>・{takeaway}</li>
            ))}
          </ul>
        </SurfaceSection>
        <SurfaceSection>
          <SectionHeader title="入力データの品質" hideRule />
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {snapshot.dataQuality.coverageNote}
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            {Object.entries(snapshot.dataQuality.inputCounts).map(
              ([key, value]) => (
                <div key={key}>
                  <dt className="text-xs text-muted-foreground">
                    {inputCountLabels[key] ?? key}
                  </dt>
                  <dd className="font-semibold tabular-nums">
                    {value.toLocaleString('ja-JP')}
                  </dd>
                </div>
              )
            )}
          </dl>
        </SurfaceSection>
      </div>

      <SurfaceSection id="methods" className="mt-6 scroll-mt-24">
        <SectionHeader title="方法・出典・限界" hideRule />
        <ol className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
          {snapshot.method.map((step, index) => (
            <li key={step}>
              {index + 1}. {step}
            </li>
          ))}
        </ol>

        <h3 className="mt-5 text-sm font-bold">指標の定義</h3>
        <dl className="mt-2 space-y-3 text-sm">
          {snapshot.metrics.map((metric) => (
            <div key={metric.key}>
              <dt className="font-medium">
                {metric.label}（{metric.unit}）
              </dt>
              <dd className="mt-0.5 text-muted-foreground">
                {metric.description}
              </dd>
            </div>
          ))}
        </dl>

        <h3 className="mt-5 text-sm font-bold">注意点</h3>
        <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
          {snapshot.caveats.map((caveat) => (
            <li key={caveat}>・{caveat}</li>
          ))}
        </ul>

        <h3 className="mt-5 text-sm font-bold">一次資料</h3>
        <ul className="mt-2 space-y-2 text-sm">
          {snapshot.sources.map((source) => (
            <li key={`${source.datasetId}-${source.version}`}>
              <a
                className="font-medium text-primary underline"
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.name}
              </a>{' '}
              <span className="text-muted-foreground">
                （{source.datasetId} / v{source.version} / {source.license}）
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          上記の国土数値情報をもとにstats47が空間演算・集計・表示用加工を行いました（生成日:{' '}
          {generatedDate}）。
          国土交通省または原典提供者が本分析の内容を保証・推奨するものではありません。
        </p>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {slug === 'population-snow-designation' ||
          slug === 'population-landslide-exposure'
            ? '指定区域と人口の原典・検証記録は各県の検算データで確認できます。上記の生成日は取得日ではありません。'
            : slug === 'population-public-facility-access'
              ? '施設原典の取得日・人口原典の検証記録は各県の検算データで確認できます。上記の生成日は取得日ではありません。'
              : '原典の初回取得日時は旧パイプラインで未記録です。上記の生成日は取得日ではありません。'}
          対象版・入力ファイルのSHA-256・途中データは「検算」とデータ導線で確認できます。
        </p>
      </SurfaceSection>

      {contextLayer ? (
        <SurfaceSection className="mt-6">
          <SectionHeader
            title="補助レイヤー：駅別乗降客数"
            description="駅の利用規模を理解するための別データです。駅800m圏や人口比率の計算入力には使用していません。"
            hideRule
          />
          {contextLayer}
        </SurfaceSection>
      ) : null}

      <GeoContentPublicationSection
        slug={slug}
        prefCode2={initialPrefCode}
        manifest={evidenceManifest}
      />

      <SurfaceSection className="mt-6">
        <SectionHeader title="関連する地域分析" hideRule />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {GEO_ANALYSES.filter((analysis) => analysis.slug !== slug).map(
            (analysis) => (
              <Link
                key={analysis.slug}
                className="font-medium text-primary underline"
                href={`/geo/${analysis.slug}`}
              >
                {analysis.title}
              </Link>
            )
          )}
        </div>
      </SurfaceSection>
    </PageShell>
  );
}
