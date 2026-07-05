import Link from "next/link";

import { FileText } from "lucide-react";

import { SurfaceCard } from "@/components/surface";

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
}

/**
 * 「この統計の出典調査」カード。
 *
 * 旧実装は全調査リスト (~41 件) を「調査から探す」として表示しており、無関係な調査名が
 * 並んでいた。現在は builder が config から決定的導出した出典調査 (1-2 件) と、
 * 同調査の関連ランキングだけを出す。未解決 (surveys 空) はカード自体を出さない。
 * 正典: .claude/rules/survey-linkage-standards.md
 */
export function SurveyCard({ surveys, relatedItems = [] }: SurveyCardProps) {
  if (surveys.length === 0) return null;

  return (
    <SurfaceCard className="p-0">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <FileText className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium text-muted-foreground">
          この統計の出典調査
        </h3>
      </div>
      <div className="px-4 pb-4 pt-3">
        <nav className="flex flex-col gap-0.5">
          {surveys.map((survey) => (
            <Link
              key={survey.id}
              href={`/survey/${survey.id}`}
              className="py-1 text-sm font-medium text-foreground transition-colors hover:text-primary"
            >
              {survey.name}
            </Link>
          ))}
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
      </div>
    </SurfaceCard>
  );
}
