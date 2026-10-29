import { notFound } from 'next/navigation';

import Link from '@/components/atoms/SiteLink';
import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { PanelGrid } from '@/components/layout/PageShell';
import { SectionCard, SurfaceCard } from '@/components/surface';

import { loadGeoQuestionResult } from '../lib/load-question-result';
import { findGeoQuestion } from '../lib/questions';

import { QuestionMap } from './QuestionMap';
import { QuestionTrendChart } from './QuestionTrendChart';

/**
 * 問いのページ (試作)。問い → 比べた結果 (推移のグラフが主役) → どこの話か (地図) → 組の決め方 → 読み方 → 言わないこと。
 */
export async function QuestionPage({ slug }: { slug: string }) {
  const question = findGeoQuestion(slug);
  if (!question) notFound();
  const result = await loadGeoQuestionResult(slug);

  return (
    <PageShell
      header={
        <>
          <Breadcrumbs
            items={[
              { label: 'ホーム', href: '/' },
              { label: '地域分析', href: '/geo' },
              { label: question.question },
            ]}
          />
          <PageHeader title={question.question} description={question.lead} />
        </>
      }
    >
      <PanelGrid>
        {result ? (
          <>
            <QuestionTrendChart
              title={question.chartTitle}
              note={result.measure.note}
              unit={result.measure.unit}
              years={result.years}
              groups={result.groups}
              series={result.series}
            />
            <QuestionMap
              title={question.mapTitle}
              unitOfArea={result.unitOfArea}
              groups={result.groups}
              areas={result.areas}
              names={result.names}
              points={result.points}
            />
          </>
        ) : (
          <SurfaceCard>
            <p role="alert">計算結果を読み込めませんでした。</p>
          </SurfaceCard>
        )}

        <SectionCard title="組の決め方" headingAs="h2">
          <ul className="list-disc space-y-1 pl-5">
            {question.method.map((line) => (
              <li key={line}>{line}</li>
            ))}
            {result && (
              <li>
                集計に使った地域は {result.conservation.grouped.toLocaleString('ja-JP')} / {result.conservation.areasWithData.toLocaleString('ja-JP')}
                ({result.conservation.note})。
              </li>
            )}
          </ul>
        </SectionCard>

        <SectionCard title="読み方の注意" headingAs="h2">
          <ul className="list-disc space-y-1 pl-5">
            {question.cautions.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="mt-3 font-medium">{question.notClaimed}</p>
        </SectionCard>

        <SectionCard title="あわせて見る" headingAs="h2">
          <ul className="space-y-1">
            {question.related.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-primary underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </SectionCard>

        {result && (
          <p className="px-4 py-2 text-xs leading-relaxed text-muted-foreground">
            出典：{result.inputs.join('、')} を stats47 が加工 (計算 {result.generatedAt.slice(0, 10)})。
          </p>
        )}
      </PanelGrid>
    </PageShell>
  );
}
