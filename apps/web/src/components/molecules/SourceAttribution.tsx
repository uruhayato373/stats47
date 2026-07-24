import Link from "next/link";

import type { SourceAttribution as SourceAttributionData } from "@stats47/data-configs";

interface SourceAttributionProps {
  attribution?: SourceAttributionData | null;
  className?: string;
}

/**
 * 調査 id が `/survey/<id>` として配信可能か (= リンクにしてよいか)。
 *
 * 合成 id (`ssds-src:世界農林業センサス` / `src:*`) はマスタ (surveys.json) に実在せず
 * /survey/<id> が 404 になる。`.claude/rules/survey-linkage-standards.md` §5 は
 * 「合成 id とマスタ非実在 id は配信に出さない」と定めるが、attribution.originalSurveys は
 * その照合を経ずに item.json へ焼き込まれるため、ここで最終防波堤を張る。
 * 実在する調査 id は必ず kebab-case ASCII (surveys.json の id 規約)。
 *
 * 2026-07-24 実測: /ranking/abandoned-cultivated-land-area が
 * /survey/ssds-src:世界農林業センサス へリンクし 404 を返していた。
 * リンクを外しても調査名は表示するので、出典表記の誠実さは保たれる。
 */
export function isLinkableSurveyId(id: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id);
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
      {isLinkableSurveyId(s.id) ? (
        <Link
          href={`/survey/${s.id}`}
          className="hover:text-primary hover:underline"
        >
          {s.name}
        </Link>
      ) : (
        s.name
      )}
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
