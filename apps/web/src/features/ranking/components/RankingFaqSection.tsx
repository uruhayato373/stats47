interface FaqItem {
  question: string;
  answer: string;
  type: string;
}

interface RankingFaqSectionProps {
  faqJson: string | null;
  rankingName: string;
}

function isValidFaqItem(v: unknown): v is FaqItem {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.question === "string" && o.question.length > 0 &&
    typeof o.answer === "string" && o.answer.length > 0 &&
    typeof o.type === "string"
  );
}

function parseFaqContent(raw: unknown): FaqItem[] | null {
  if (!raw || typeof raw !== "object") return null;
  const items = (raw as { items?: unknown }).items;
  if (!Array.isArray(items) || items.length === 0) return null;
  const valid = items.filter(isValidFaqItem);
  return valid.length > 0 ? valid : null;
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

  const items = parseFaqContent(parsed);
  if (!items) return null;

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
