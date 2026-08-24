import { SurveyTaxonomyCard } from "@/features/survey";

interface Survey {
  id: string;
  name: string;
}

interface RelatedItem {
  rankingKey: string;
  title: string;
}

interface SurveyCardProps {
  /** この統計の出典調査 (item.json 焼き込みの originalSurveys、通常 1-2 件) */
  surveys: Survey[];
  /** 同じ調査の関連ランキング (自分自身を除く上位 5 件) */
  relatedItems?: RelatedItem[];
  /** 表示面ごとの見出しと GA4 nav_surface。 */
  title?: string;
  surface?: "ranking_survey" | "category_survey";
}

/**
 * 「この統計の出典調査」カード。
 *
 * 旧実装は全調査リスト (~41 件) を「調査から探す」として表示しており、無関係な調査名が
 * 並んでいた。現在は builder が config から決定的導出した出典調査 (1-2 件) と、
 * 同調査の関連ランキングだけを出す。未解決 (surveys 空) はカード自体を出さない。
 * 正典: .claude/rules/survey-linkage-standards.md
 */
export function SurveyCard({
  surveys,
  relatedItems = [],
  title = "この統計の出典調査",
  surface = "ranking_survey",
}: SurveyCardProps) {
  return (
    <SurveyTaxonomyCard
      surveys={surveys}
      title={title}
      surface={surface}
      relatedItems={relatedItems}
    />
  );
}
