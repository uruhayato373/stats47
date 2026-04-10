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
 * ランキングページのFAQセクション。
 * アコーディオン UI で Q&A を表示 + JSON-LD（FAQPage）を出力する。
 */
export function RankingFaqSection({ faqJson }: RankingFaqSectionProps) {
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
