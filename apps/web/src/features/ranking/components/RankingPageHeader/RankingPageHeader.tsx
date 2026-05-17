import { ReactNode } from "react";

export interface RankingPageHeaderProps {
    /** ランキング名（表示タイトル） */
    rankingName: string;
    /** サブタイトル（オプショナル） */
    subtitle?: string | null;
    /** 対象属性（例: "15歳以上"） */
    demographicAttr?: string | null;
    /** 正規化基準（例: "人口10万人あたり"） */
    normalizationBasis?: string | null;
    /** 右側に表示するアクション（年度セレクターなど） */
    actions?: ReactNode;
    /** 注釈（ある場合のみヘッダー内に表示） */
    annotation?: string | null;
    /** 調査名バッジ（Server Component から注入） */
    surveyBadge?: ReactNode;
    /** ページ最終更新日 (ISO8601、SEO freshness 表示用) */
    updatedAt?: string | null;
    /** データの最新年度（例: "2024年度"） */
    latestYearName?: string | null;
}

/**
 * ランキングページヘッダーコンポーネント
 *
 * ランキング詳細ページのタイトル・メタ情報・アクションを表示します。
 */
export function RankingPageHeader({
    rankingName,
    subtitle,
    demographicAttr,
    normalizationBasis,
    actions,
    annotation,
    surveyBadge,
    updatedAt,
    latestYearName,
}: RankingPageHeaderProps) {
    // メタ情報のパーツを構築（値があるものだけ表示）
    const metaParts: string[] = [];
    if (subtitle) metaParts.push(subtitle);
    if (demographicAttr) metaParts.push(demographicAttr);
    if (normalizationBasis) metaParts.push(normalizationBasis);

    // updatedAt を YYYY-MM-DD に整形 (JST)
    const formattedUpdated = updatedAt
        ? (() => {
              try {
                  const d = new Date(updatedAt);
                  if (Number.isNaN(d.getTime())) return null;
                  return d.toISOString().slice(0, 10);
              } catch {
                  return null;
              }
          })()
        : null;

    return (
        <div>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl font-bold">{rankingName}</h1>
                    {metaParts.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {metaParts.join(" / ")}
                        </span>
                    )}
                    {surveyBadge}
                </div>
                {actions && <div className="flex-shrink-0">{actions}</div>}
            </div>
            {(formattedUpdated || latestYearName) && (
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {latestYearName && (
                        <span>データ年度: {latestYearName}</span>
                    )}
                    {formattedUpdated && (
                        <span>
                            最終更新:{" "}
                            <time dateTime={updatedAt ?? formattedUpdated}>
                                {formattedUpdated}
                            </time>
                        </span>
                    )}
                </p>
            )}
            {annotation && (
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                    {annotation}
                </p>
            )}
        </div>
    );
}
