import { FaqSection } from "@/components/content";

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
 * - アコーディオン UI で Q&A を可視表示 (ユーザー向け)
 * - JSON-LD (FAQPage) を併せて出力 (検索エンジン向け、リッチスニペット対象)
 *
 * FAQPage の rich result 表示要件として「ページ上に同等の Q&A が見える形で存在すること」が
 * Google ガイドラインで明記されているため、JSON-LD と可視 UI は必ず一致させる。
 */
export function RankingFaqSection({ faqJson, rankingName }: RankingFaqSectionProps) {
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

  // SEO 要件: FAQPage rich result が表示されるためには、ページ上に Q&A が
  // 同等の形で見える必要がある。<details>/<summary> はネイティブ HTML 要素で、
  // SSR 時に content が常に DOM に含まれる (Radix Accordion は閉じている時に
  // content が空のため crawl 対象外になる)。
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
      />
      <FaqSection
        title={`${rankingName}についてよくある質問`}
        items={items}
      />
    </>
  );
}
