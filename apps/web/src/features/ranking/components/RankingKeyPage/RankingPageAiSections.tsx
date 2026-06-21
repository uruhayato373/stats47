import { AiContentAccordion } from "../AiContentAccordion";
import { AiInsightCard } from "../AiInsightCard";
import { AiMarkdownContent } from "../AiMarkdownContent";
import { RankingFaqSection } from "../RankingFaqSection";

interface RankingPageAiContent {
  insights?: string | null;
  regionalAnalysis?: string | null;
  faq?: string | null;
}

interface RankingPageAiSectionsProps {
  aiContent: RankingPageAiContent | null;
  rankingName: string;
}

export function RankingPageInsightsSection({
  aiContent,
}: RankingPageAiSectionsProps) {
  if (aiContent?.insights) {
    return (
      <AiInsightCard
        title="データの考察"
        footer={
          aiContent.regionalAnalysis ? (
            <AiContentAccordion title="地域別の傾向" bordered={false}>
              <AiMarkdownContent content={aiContent.regionalAnalysis} />
            </AiContentAccordion>
          ) : undefined
        }
      >
        <AiMarkdownContent content={aiContent.insights} />
      </AiInsightCard>
    );
  }

  if (aiContent?.regionalAnalysis) {
    return (
      <AiContentAccordion title="地域別の傾向">
        <AiMarkdownContent content={aiContent.regionalAnalysis} />
      </AiContentAccordion>
    );
  }

  return null;
}

export function RankingPageFaqSection({
  aiContent,
  rankingName,
}: RankingPageAiSectionsProps) {
  return aiContent?.faq ? (
    <RankingFaqSection faqJson={aiContent.faq} rankingName={rankingName} />
  ) : null;
}
