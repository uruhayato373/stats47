"use client";

import Link from "next/link";

import { FileText } from "lucide-react";

import { RailCard, RailLinkList, RailNavRow, SectionCard } from "@/components/surface";

import { trackNavClick, type NavSurface } from "@/lib/analytics/events";

interface SurveyTaxonomyItem {
  id: string;
  name: string;
}

interface RelatedRankingItem {
  rankingKey: string;
  title: string;
}

interface SurveyTaxonomyCardProps {
  surveys: SurveyTaxonomyItem[];
  title: string;
  surface: Extract<
    NavSurface,
    "ranking_survey" | "category_survey" | "theme_survey" | "blog_survey"
  >;
  variant?: "rail" | "section";
  description?: string;
  relatedItems?: RelatedRankingItem[];
}

/**
 * metric / chart provenance から派生した調査リンクの共通表示。
 * surveyId は呼び出し側で定義せず、survey taxonomy core の解決結果だけを受け取る。
 */
export function SurveyTaxonomyCard({
  surveys,
  title,
  surface,
  variant = "rail",
  description,
  relatedItems = [],
}: SurveyTaxonomyCardProps) {
  if (surveys.length === 0) return null;

  if (variant === "section") {
    return (
      <SectionCard
        title={title}
        icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        className="mt-8"
      >
        {description && (
          <p className="mb-2 text-xs leading-5 text-muted-foreground">{description}</p>
        )}
        <nav aria-label={title} className="flex flex-col gap-0.5">
          {surveys.map((survey) => {
            const href = `/survey/${survey.id}`;
            return (
              <Link
                key={survey.id}
                href={href}
                className="py-1 text-sm font-medium text-foreground transition-colors hover:text-primary"
                onClick={() => trackNavClick({ label: survey.id, href, surface })}
              >
                {survey.name}
              </Link>
            );
          })}
        </nav>
        {relatedItems.length > 0 && (
          <>
            <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
              同じ調査のランキング
            </p>
            <nav className="mt-1 flex flex-col gap-0.5">
              {relatedItems.map((item) => (
                <Link
                  key={item.rankingKey}
                  href={`/ranking/${item.rankingKey}`}
                  className="py-1 text-xs transition-colors hover:text-primary"
                >
                  {item.title}
                </Link>
              ))}
            </nav>
          </>
        )}
      </SectionCard>
    );
  }

  return (
    <RailCard
      title={title}
      icon={<FileText className="h-4 w-4 text-muted-foreground" />}
    >
      {description && (
        <p className="mb-2 text-xs leading-5 text-muted-foreground">{description}</p>
      )}
      <RailLinkList aria-label={title}>
        {surveys.map((survey) => {
          const href = `/survey/${survey.id}`;
          return (
            <RailNavRow
              key={survey.id}
              href={href}
              chevron={false}
              className="font-medium text-foreground"
              onClick={() => trackNavClick({ label: survey.id, href, surface })}
            >
              {survey.name}
            </RailNavRow>
          );
        })}
      </RailLinkList>
      {relatedItems.length > 0 && (
        <>
          <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            同じ調査のランキング
          </p>
          <nav className="mt-1 flex flex-col gap-0.5">
            {relatedItems.map((item) => (
              <Link
                key={item.rankingKey}
                href={`/ranking/${item.rankingKey}`}
                className="py-1 text-xs transition-colors hover:text-primary"
              >
                {item.title}
              </Link>
            ))}
          </nav>
        </>
      )}
    </RailCard>
  );
}
