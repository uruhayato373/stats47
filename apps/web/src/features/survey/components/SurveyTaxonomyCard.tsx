"use client";

import { hrefFor } from "@stats47/data-configs/content/href";
import { FileText } from "lucide-react";

import {
  RailCard,
  RailLinkList,
  RailNavRow,
  railNavRowClassName,
  SectionCard,
} from "@/components/surface";

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
  /** 最初に見せる件数。超えた分は「すべて見る」で開く (client JS なしの details)。省略時は全件 */
  visibleLimit?: number;
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
  visibleLimit,
}: SurveyTaxonomyCardProps) {
  if (surveys.length === 0) return null;

  const visible = visibleLimit ? surveys.slice(0, visibleLimit) : surveys;
  const hidden = visibleLimit ? surveys.slice(visibleLimit) : [];
  // 調査の行はレールのリンク行 (RailNavRow: 同じ行高と行末の ChevronRight) で描く
  const surveyRow = (survey: SurveyTaxonomyItem) => {
    const href = hrefFor("survey", { surveyKey: survey.id });
    return (
      <RailNavRow
        key={survey.id}
        href={href}
        onClick={() => trackNavClick({ label: survey.id, href, surface })}
      >
        {survey.name}
      </RailNavRow>
    );
  };

  const body = (
    <>
      {description && (
        <p className="mb-2 text-xs leading-5 text-muted-foreground">{description}</p>
      )}
      {/* 行の寸法と文字の左端 (CardContent の端にそろう) は RailNavRow が持つ */}
      <RailLinkList aria-label={title} divided>
        {visible.map(surveyRow)}
      </RailLinkList>
      {hidden.length > 0 && (
        <details className="group/more border-t border-border">
          <summary
            className={railNavRowClassName({
              className:
                "cursor-pointer list-none font-medium text-primary [&::-webkit-details-marker]:hidden",
            })}
          >
            すべて見る（残り {hidden.length} 件）
          </summary>
          <RailLinkList aria-label={`${title}（残り）`} divided className="border-t border-border">
            {hidden.map(surveyRow)}
          </RailLinkList>
        </details>
      )}
      {relatedItems.length > 0 && (
        <>
          <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            同じ調査のランキング
          </p>
          <RailLinkList aria-label="同じ調査のランキング" className="mt-1">
            {relatedItems.map((item) => (
              <RailNavRow
                key={item.rankingKey}
                href={hrefFor("ranking", { rankingKey: item.rankingKey })}
              >
                {item.title}
              </RailNavRow>
            ))}
          </RailLinkList>
        </>
      )}
    </>
  );

  if (variant === "section") {
    return (
      <SectionCard title={title} icon={<FileText />} className="mt-8">
        {body}
      </SectionCard>
    );
  }

  return (
    <RailCard title={title} icon={<FileText />}>
      {body}
    </RailCard>
  );
}
