import Link from "next/link";

import type { SourceAttribution as SourceAttributionData } from "@stats47/data-configs";

interface SourceAttributionProps {
  attribution?: SourceAttributionData | null;
  className?: string;
}

/**
 * 出典表記の統一表示部品 (2 階層プロビナンス)。ranking / テーマの全コンポーネントで共有する。
 *
 *   - SSDS (二次統計): 「出典: 社会・人口統計体系（原典: 国勢調査・人口推計）」
 *     → 実際に引いた値は SSDS、その集計元が各調査、という両方を誠実に表示
 *   - 一次統計: 「出典: 賃金構造基本統計調査」
 *
 * 純粋な表示 (Server Component 可、cookies/headers 不使用 → SSG 非破壊)。
 */
export function SourceAttribution({ attribution, className }: SourceAttributionProps) {
  if (!attribution) return null;
  const { compilation, originalSurveys } = attribution;
  if (!compilation && originalSurveys.length === 0) return null;

  const surveyLinks = originalSurveys.map((s, i) => (
    <span key={s.id}>
      {i > 0 && "・"}
      <Link
        href={`/survey/${s.id}`}
        className="hover:text-primary hover:underline"
      >
        {s.name}
      </Link>
    </span>
  ));

  return (
    <span className={className}>
      出典:{" "}
      {compilation ? (
        <>
          {compilation.url ? (
            <a
              href={compilation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary hover:underline"
            >
              {compilation.name}
            </a>
          ) : (
            compilation.name
          )}
          {originalSurveys.length > 0 && <>（原典: {surveyLinks}）</>}
        </>
      ) : (
        surveyLinks
      )}
    </span>
  );
}
