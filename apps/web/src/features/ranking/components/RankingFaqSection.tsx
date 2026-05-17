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
      <section
        aria-labelledby="ranking-faq-heading"
        className="rounded-lg border bg-card shadow-sm"
      >
        <details open className="group">
          <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-semibold text-slate-900">
            <h2 id="ranking-faq-heading" className="text-lg">
              {rankingName} についてよくある質問
            </h2>
            <span aria-hidden className="text-muted-foreground transition-transform group-open:rotate-180">
              ▼
            </span>
          </summary>
          <div className="border-t px-6 pb-6">
            {items.map((item, idx) => (
              <details
                key={idx}
                className="group/q border-b py-3 last:border-b-0"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-3 text-left">
                  <span className="font-medium text-slate-900">
                    Q. {item.question}
                  </span>
                  <span aria-hidden className="text-xs text-muted-foreground transition-transform group-open/q:rotate-180">
                    ▼
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  A. {item.answer}
                </p>
              </details>
            ))}
          </div>
        </details>
      </section>
    </>
  );
}
