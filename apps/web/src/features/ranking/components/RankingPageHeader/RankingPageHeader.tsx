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
}: RankingPageHeaderProps) {
    // メタ情報のパーツを構築（値があるものだけ表示）
    const metaParts: string[] = [];
    if (subtitle) metaParts.push(subtitle);
    if (demographicAttr) metaParts.push(demographicAttr);
    if (normalizationBasis) metaParts.push(normalizationBasis);

    return (
        <div>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-lg font-bold">{rankingName}</h1>
                    {metaParts.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {metaParts.join(" / ")}
                        </span>
                    )}
                    {surveyBadge}
                </div>
                {actions && <div className="flex-shrink-0">{actions}</div>}
            </div>
            {annotation && (
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">
                    {annotation}
                </p>
            )}
        </div>
    );
}
