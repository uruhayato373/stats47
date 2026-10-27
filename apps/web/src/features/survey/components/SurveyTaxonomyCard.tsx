"use client";

import { hrefFor } from "@stats47/data-configs/content/href";
import { FileText } from "lucide-react";

import Link from "@/components/atoms/SiteLink";
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
        icon={<FileText />}
        className="mt-8"
      >
        {description && (
          <p className="mb-2 text-xs leading-5 text-muted-foreground">{description}</p>
        )}
        <nav aria-label={title} className="flex flex-col gap-0.5">
          {surveys.map((survey) => {
            const href = hrefFor("survey", { surveyKey: survey.id });
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
                  href={hrefFor("ranking", { rankingKey: item.rankingKey })}
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
      icon={<FileText />}
    >
      {description && (
        <p className="mb-2 text-xs leading-5 text-muted-foreground">{description}</p>
      )}
      {/* 行の px-2 を打ち消し、文字の左端を CardContent の px-4 (見出し・説明文) に揃える */}
      <RailLinkList aria-label={title} className="-mx-2">
        {surveys.map((survey) => {
          const href = hrefFor("survey", { surveyKey: survey.id });
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
                href={hrefFor("ranking", { rankingKey: item.rankingKey })}
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
