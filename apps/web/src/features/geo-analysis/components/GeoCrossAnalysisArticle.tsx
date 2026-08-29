import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { BUSINESS_PLAN_M1_GEO_ANALYSES } from '@stats47/data-configs/business-plan';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import { SurfaceCard, SurfaceSection } from '@/components/surface';

import {
  buildGeoMapModel,
  formatGeoValue,
  GEO_CROSS_ANALYSIS_CONFIGS,
  type GeoCrossAnalysisSlug,
} from '../lib/geo-cross-analysis';
import { loadGeoAnalysisSnapshot } from '../lib/load-geo-analysis-snapshot';

import { GeoAnalysisTracker } from './GeoAnalysisTracker';
import { GeoCrossAnalysisExplorer } from './GeoCrossAnalysisExplorer';

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
}

export async function GeoCrossAnalysisArticle({ slug }: Props) {
  const config = GEO_CROSS_ANALYSIS_CONFIGS[slug];
  const spec = BUSINESS_PLAN_M1_GEO_ANALYSES.find(
    (analysis) => analysis.slug === slug
  );
  const snapshot = await loadGeoAnalysisSnapshot(slug);

  if (!spec || !snapshot) {
    return (
      <PageShell>
        <Breadcrumbs
          items={[
            { label: 'ホーム', href: '/' },
            { label: '地域分析', href: '/geo' },
            { label: config.shortTitle },
          ]}
        />
        <div
          role="status"
          className="border bg-muted/20 p-5 text-sm text-muted-foreground"
        >
          分析データを準備しています。47都道府県の配信用snapshotを確認後に表示します。
        </div>
      </PageShell>
    );
  }

  const primaryMetric = snapshot.metrics.find(
    (metric) => metric.key === snapshot.primaryMetricKey
  );
  if (!primaryMetric) return null;

  const top = snapshot.rows[0];
  const bottom = snapshot.rows.at(-1);
  if (!top || !bottom) return null;
  const { rankingItem, rankingValues } = buildGeoMapModel(snapshot);
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

      {config.hazardMapUrl ? (
        <div
          role="note"
          className="mb-6 border border-destructive/40 bg-destructive/5 p-4 text-sm leading-relaxed"
        >
          <strong>この分析は避難判断や個別地点の安全確認には使えません。</strong>{' '}
          0%も安全を意味しません。住所ごとの確認は、自治体の最新情報と
          <a
            href={config.hazardMapUrl}
            target="_blank"
            rel="noreferrer"
            className="ml-1 font-medium text-primary underline"
          >
            国のハザードマップポータル
          </a>
          を利用してください。
        </div>
      ) : null}

      <SurfaceSection className="mb-6">
        <SectionHeader title="まず結論" hideRule />
        <p className="mt-2 text-base leading-relaxed">
          {primaryMetric.label}が最も高いのは
          <strong>{top.areaName}</strong>の
          <strong>
            {formatGeoValue(primaryMetric, top.values[snapshot.primaryMetricKey])}
          </strong>
          。47都道府県の中央値は
          <strong>
            {formatGeoValue(primaryMetric, snapshot.summary.medianValue)}
          </strong>
          、最も低いのは{bottom.areaName}の
          {formatGeoValue(primaryMetric, bottom.values[snapshot.primaryMetricKey])}
          です。
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {config.description}
        </p>
      </SurfaceSection>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SurfaceCard>
          <p className="text-xs text-muted-foreground">全国1位</p>
          <p className="mt-1 text-lg font-bold">{top.areaName}</p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {formatGeoValue(primaryMetric, top.values[snapshot.primaryMetricKey])}
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-xs text-muted-foreground">全国中央値</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatGeoValue(primaryMetric, snapshot.summary.medianValue)}
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-xs text-muted-foreground">全国47位</p>
          <p className="mt-1 text-lg font-bold">{bottom.areaName}</p>
          <p className="text-sm tabular-nums text-muted-foreground">
            {formatGeoValue(
              primaryMetric,
              bottom.values[snapshot.primaryMetricKey]
            )}
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-xs text-muted-foreground">データ充足</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {snapshot.dataQuality.actualAreas}/47
          </p>
          <p className="text-sm text-muted-foreground">都道府県</p>
        </SurfaceCard>
      </div>

      <GeoCrossAnalysisExplorer
        analysisId={spec.id}
        comparisonLimit={spec.comparisonLimit}
        mapTitle={config.mapTitle}
        mapSubtitle={config.mapSubtitle}
        snapshot={snapshot}
        rankingItem={rankingItem}
        rankingValues={rankingValues}
      />

      <SurfaceSection className="mt-6">
        <SectionHeader title="47都道府県の全データ" hideRule />
        <p className="mt-2 text-sm text-muted-foreground">
          地図の主指標による順位です。横にスクロールすると、人口変化や標本数などの補助指標も確認できます。
        </p>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>順位</TableHead>
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
                  <TableCell className="tabular-nums">{row.rank}位</TableCell>
                  <TableCell className="font-medium">{row.areaName}</TableCell>
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

      <SurfaceSection className="mt-6">
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
                rel="noreferrer"
              >
                {source.name}
              </a>{' '}
              <span className="text-muted-foreground">
                （{source.datasetId} / v{source.version} / {source.license}）
              </span>
            </li>
          ))}
        </ul>
      </SurfaceSection>

      <SurfaceSection className="mt-6">
        <SectionHeader title="関連する地域分析" hideRule />
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {BUSINESS_PLAN_M1_GEO_ANALYSES.filter(
            (analysis) => analysis.slug !== slug
          ).map((analysis) => (
            <Link
              key={analysis.slug}
              className="font-medium text-primary underline"
              href={`/geo/${analysis.slug}`}
            >
              {analysis.title}
            </Link>
          ))}
        </div>
      </SurfaceSection>
    </PageShell>
  );
}
