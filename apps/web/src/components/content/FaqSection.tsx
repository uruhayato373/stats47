import type { ReactNode } from "react";

import { SurfaceSection } from "@/components/surface";

import { DisclosureIcon } from "./ContentDisclosure";

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqSource {
  label: string;
  url?: string;
}

interface FaqSectionProps {
  title: string;
  items: FaqItem[];
  subtitle?: string;
  sources?: FaqSource[];
  renderAnswer?: (answer: string, item: FaqItem) => ReactNode;
}

/** 複数の質問を同じ密度・操作契約で表示するFAQ専用セクション。 */
export function FaqSection({
  title,
  items,
  subtitle,
  sources,
  renderAnswer,
}: FaqSectionProps) {
  if (items.length === 0) return null;

  return (
    <SurfaceSection aria-label={title} className="py-2">
      <header className="pb-2">
        <h2 className="text-sm font-semibold leading-5 text-foreground">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </header>

      <div className="border-t border-border">
        {items.map((item, index) => (
          <details
            key={`${item.question}-${index}`}
            className="border-b border-border last:border-b-0 [&[open]>summary_.disclosure-vertical]:scale-y-0"
          >
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 [&::-webkit-details-marker]:hidden">
              <span className="text-sm font-normal leading-5 text-foreground">
                Q. {item.question}
              </span>
              <DisclosureIcon />
            </summary>
            <div className="pb-3 pr-7 text-sm leading-relaxed text-muted-foreground">
              {renderAnswer ? (
                renderAnswer(item.answer, item)
              ) : (
                <p>A. {item.answer}</p>
              )}
            </div>
          </details>
        ))}
      </div>

      {sources && sources.length > 0 ? (
        <footer className="border-t border-border pt-3 text-sm text-muted-foreground">
          <h3 className="font-medium text-foreground">出典</h3>
          <ul className="mt-1 space-y-1">
            {sources.map((source, index) => (
              <li key={`${source.label}-${index}`}>
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-2 hover:underline"
                  >
                    {source.label}
                  </a>
                ) : (
                  source.label
                )}
              </li>
            ))}
          </ul>
        </footer>
      ) : null}
    </SurfaceSection>
  );
}
