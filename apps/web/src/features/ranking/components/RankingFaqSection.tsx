import { z } from "zod/v4";

const faqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  type: z.string(),
});

const faqContentSchema = z.object({
  items: z.array(faqItemSchema).min(1),
});

interface RankingFaqSectionProps {
  faqJson: string | null;
  rankingName: string;
}

/**
 * ランキングページのFAQ構造化データ。
 * JSON-LD（FAQPage）のみ出力する（視覚UIは非表示）。
 * faqJson が null の場合は何も出力しない。
 */
export function RankingFaqSection({ faqJson, rankingName }: RankingFaqSectionProps) {
  if (!faqJson) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(faqJson);
  } catch {
    return null;
  }

  const result = faqContentSchema.safeParse(parsed);
  if (!result.success) return null;

  const { items } = result.data;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
    />
  );
}
