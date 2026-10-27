import { hrefFor } from "@stats47/data-configs/content/href";
import { ChevronDown, FileText } from "lucide-react";

import { RailCard, RailNavRow, railNavRowClassName } from "@/components/surface";

import { navSurfaceProps } from "@/lib/analytics/events";

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

/** カテゴリの出典調査は 20 件近くになるので、上位だけを見せて残りは「すべて見る」で開く */
const CATEGORY_SURVEY_VISIBLE_LIMIT = 5;

/** 行の並び。カードの本文余白 (16px) の中に区切り線で並べる (行の横余白は外し、-mx-* で打ち消さない) */
const ROW_LIST_CLASS = "flex flex-col divide-y divide-border";

/**
 * 「この統計の出典調査」カード (ランキング詳細・カテゴリの右レール)。
 *
 * 旧実装は全調査リスト (~41 件) を「調査から探す」として表示しており、無関係な調査名が
 * 並んでいた。現在は builder が config から決定的導出した出典調査 (1-2 件) と、
 * 同調査の関連ランキングだけを出す。未解決 (surveys 空) はカード自体を出さない。
 * 正典: .claude/rules/survey-linkage-standards.md
 *
 * 行は RailLinksCard の list 行と同じ RailNavRow (区切り線 + 右端の矢印)。「すべて見る」の行にも
 * 同じ大きさの矢印 (開くと下向き) を付ける。クリックは共通のクリック監視 (NavClickTracker) が
 * data-nav-surface / data-nav-label で数える (ラベルは調査 ID。部品の onClick を持たないので
 * Server Component のまま描ける。2026-10-28 3 巡目)。
 */
export function SurveyCard({
  surveys,
  relatedItems = [],
  title = "この統計の出典調査",
  surface = "ranking_survey",
}: SurveyCardProps) {
  if (surveys.length === 0) return null;

  const visibleLimit =
    surface === "category_survey" ? CATEGORY_SURVEY_VISIBLE_LIMIT : surveys.length;
  const visible = surveys.slice(0, visibleLimit);
  const hidden = surveys.slice(visibleLimit);
  const surveyRow = (survey: Survey) => (
    <RailNavRow
      key={survey.id}
      href={hrefFor("survey", { surveyKey: survey.id })}
      data-nav-label={survey.id}
      className="px-0"
    >
      {survey.name}
    </RailNavRow>
  );

  return (
    <RailCard title={title} icon={<FileText />}>
      <nav aria-label={title} className={ROW_LIST_CLASS} {...navSurfaceProps(surface)}>
        {visible.map(surveyRow)}
      </nav>
      {hidden.length > 0 && (
        <details className="group/more border-t border-border">
          <summary
            className={railNavRowClassName({
              className:
                "cursor-pointer list-none px-0 font-medium text-primary [&::-webkit-details-marker]:hidden",
            })}
          >
            <span className="min-w-0 flex-1 truncate">
              すべて見る（残り {hidden.length} 件）
            </span>
            <ChevronDown
              aria-hidden="true"
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-open/more:rotate-180"
            />
          </summary>
          <nav
            aria-label={`${title}（残り）`}
            className={`${ROW_LIST_CLASS} border-t border-border`}
            {...navSurfaceProps(surface)}
          >
            {hidden.map(surveyRow)}
          </nav>
        </details>
      )}
      {relatedItems.length > 0 && (
        <>
          <p className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
            同じ調査のランキング
          </p>
          <nav aria-label="同じ調査のランキング" className={`mt-1 ${ROW_LIST_CLASS}`}>
            {relatedItems.map((item) => (
              <RailNavRow
                key={item.rankingKey}
                href={hrefFor("ranking", { rankingKey: item.rankingKey })}
                className="px-0"
              >
                {item.title}
              </RailNavRow>
            ))}
          </nav>
        </>
      )}
    </RailCard>
  );
}
