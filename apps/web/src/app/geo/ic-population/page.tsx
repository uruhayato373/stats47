import { QuestionPage, findGeoQuestion } from '@/features/geo-questions';

import type { Metadata } from 'next';

const SLUG = 'ic-population';

// 計算結果は R2 を実行時に読むので静的化しない (nextjs-ssg-preservation.md)
export const dynamic = 'force-dynamic';

export function generateMetadata(): Metadata {
  const question = findGeoQuestion(SLUG);
  return {
    title: question?.question ?? '地域分析',
    description: question?.lead,
    alternates: { canonical: '/geo/' + SLUG },
    // 試作のあいだは検索に出さない (GEO-OVERLAY-URL-01)
    robots: 'noindex, follow',
  };
}

export default function Page() {
  return <QuestionPage slug={SLUG} />;
}
