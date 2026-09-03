import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { BUSINESS_PLAN_M1 } from '@stats47/data-configs/business-plan';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import { SurfaceCard, SurfaceSection } from '@/components/surface';

import {
  GeoAnalysisTracker,
  GeoPopulationExplorer,
  buildPopulationAnalysis,
} from '@/features/geo-analysis';
import { loadRankingPageModel } from '@/features/ranking/server';

import type { Metadata } from 'next';

const spec = BUSINESS_PLAN_M1.analysis;
const path = `/geo/${spec.slug}`;
const description =
  '2020年から2050年の将来人口増減率を47都道府県で比較。地図、上位・下位、最大3県比較と出典・注意点を確認できます。';

// ★ R2 を読むページは build 時に prerender させない (`ƒ`)。
//   build 環境から R2 は読めず (2026-09-03 のビルドログでも blog / categories snapshot が
//   「存在しません」と出ていた)、静的生成すると `!model` の「準備しています」プレースホルダが
//   焼き込まれる。revalidate 24h は次のデプロイで焼き直されるため自然回復しない。
//   home `/` と同じ force-dynamic でランタイム描画にする。
//   正典: .claude/rules/nextjs-ssg-preservation.md
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `${spec.title} | stats47地域分析`,
  description,
  alternates: { canonical: path },
};

function signed(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export default async function Population2050AnalysisPage() {
  const model = spec.rankingKey
    ? await loadRankingPageModel(spec.rankingKey)
    : null;

  if (!model) {
    return (
      <PageShell>
        <Breadcrumbs
          items={[
            { label: 'ホーム', href: '/' },
            { label: '地域分析', href: '/geo' },
            { label: '2050年人口' },
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

  const summary = buildPopulationAnalysis(model.rankingValues);
  const complete = summary.rows.length === spec.expectedObservationCount;

  return (
    <PageShell>
      <GeoAnalysisTracker
        analysisId={spec.id}
        analysisSlug={spec.slug}
        geography={spec.geography}
        dataVersion={spec.dataVersion}
      />
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '地域分析', href: '/geo' },
          { label: '2050年人口' },
        ]}
      />
      <PageHeader
        eyebrow="人口・未来"
        title={spec.title}
        description={spec.question}
        stats={`${summary.rows.length}都道府県 ・ ${model.selectedYear}年 ・ 単位 ${model.rankingItem.unit}`}
        meta={`出典: ${spec.sourceName} ・ evidence確認 ${spec.evidenceCheckedAt}`}
      />

      {!complete ? (
        <div
          role="alert"
          className="mb-6 border border-destructive/40 bg-destructive/5 p-4 text-sm"
        >
          期待する47都道府県に対して{summary.rows.length}
          件です。欠損を0として扱わず、公開判定を止めます。
        </div>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SurfaceCard>
          <p className="text-xs text-muted-foreground">人口増の県</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {summary.positiveCount}
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-xs text-muted-foreground">人口減の県</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {summary.negativeCount}
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-xs text-muted-foreground">全国中央値</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {signed(summary.median)}
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-xs text-muted-foreground">最大差</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {summary.range.toFixed(2)}pt
          </p>
        </SurfaceCard>
      </div>

      <GeoPopulationExplorer
        analysisId={spec.id}
        analysisSlug={spec.slug}
        dataVersion={spec.dataVersion}
        comparisonLimit={spec.comparisonLimit}
        rankingItem={model.rankingItem}
        rankingValues={model.rankingValues}
        rows={summary.rows}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[
          ['上位5都道府県', summary.top],
          ['下位5都道府県', summary.bottom],
        ].map(([title, rows]) => (
          <SurfaceSection key={title as string}>
            <SectionHeader title={title as string} hideRule />
            <Table className="mt-3">
              <TableHeader>
                <TableRow>
                  <TableHead>順位</TableHead>
                  <TableHead>都道府県</TableHead>
                  <TableHead className="text-right">増減率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(rows as typeof summary.rows).map((row) => (
                  <TableRow key={row.areaCode}>
                    <TableCell>{row.rank}位</TableCell>
                    <TableCell className="font-medium">
                      {row.areaName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {signed(row.value)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SurfaceSection>
        ))}
      </div>

      <SurfaceSection className="mt-6">
        <SectionHeader title="方法・出典・限界" hideRule />
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          2020年の国勢調査人口に対する2050年推計人口の増減率を使用し、同じ年度・単位の47都道府県を比較しています。
        </p>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          {spec.caveats.map((caveat) => (
            <li key={caveat}>・{caveat}</li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <a
            className="font-medium text-primary underline"
            href={spec.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            一次資料を確認
          </a>
          <Link
            className="font-medium text-primary underline"
            href={`/ranking/${spec.rankingKey ?? ''}`}
          >
            47都道府県の全ランキングを見る
          </Link>
        </div>
      </SurfaceSection>
    </PageShell>
  );
}
