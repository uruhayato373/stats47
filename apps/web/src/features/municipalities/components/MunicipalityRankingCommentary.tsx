import { Sparkles } from 'lucide-react';

import { ContentDisclosure, FaqSection } from '@/components/content';

import type { MunicipalityAiContentSnapshot } from '@stats47/ranking';

interface MunicipalityRankingCommentaryProps {
  content: MunicipalityAiContentSnapshot;
}

/**
 * 市区町村ランキングの解説 (MUNI-AI-CONTENT-01)。都道府県ランキングの「データの考察」と同じ開閉カードとFAQで見せる。
 * 中身はデプロイ時に配信値と照合して通った ai-content.json だけ。FAQPage は見える Q&A と同じ内容を出す。
 */
export function MunicipalityRankingCommentary({ content }: MunicipalityRankingCommentaryProps) {
  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faq.map((entry) => ({
      '@type': 'Question',
      name: entry.question,
      acceptedAnswer: { '@type': 'Answer', text: entry.answer },
    })),
  };
  return (
    <div className="mt-8 space-y-4">
      <ContentDisclosure
        title="データの考察"
        leading={<Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />}
        meta={<span className="text-xs font-normal text-muted-foreground">AI生成</span>}
        contentClassName="space-y-2 leading-relaxed text-muted-foreground"
      >
        <p>{content.summary}</p>
        <h3 className="pt-2 font-semibold text-foreground">都道府県ごとの分布</h3>
        <p>{content.prefectureDistribution}</p>
        <h3 className="pt-2 font-semibold text-foreground">比べている自治体</h3>
        <p>{content.population}</p>
      </ContentDisclosure>
      <FaqSection title="よくある質問" items={content.faq} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData).replace(/</g, '\\u003c'),
        }}
      />
    </div>
  );
}
