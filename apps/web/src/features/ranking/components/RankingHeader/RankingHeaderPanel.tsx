import { PageHeader } from "@/components/layout";

interface RankingHeaderPanelProps {
  /** ランキングタイトル（h1） */
  title: string;
  /** h1 補足（定義補足等） */
  titleDetail?: string | null;
  /** 出典名 */
  sourceName?: string | null;
  /** データ年度表示名（例: "2024年"） */
  yearName?: string | null;
  /** 最終更新日（YYYY-MM-DD） */
  updatedAt?: string | null;
}

/**
 * ランキング詳細ページの見出し。
 *
 * 旧 RankingHeroCard。暗色 KPI 面 (aside) と操作行 (controls) を外し、
 * h1 + 定義補足 + メタ行だけの最小ヘッダーにした。統計値は
 * RankingHeaderStats、操作は RankingHeaderControls が別要素として持つ
 * (モバイルで地図を先に見せるため、3 者を order で並べ替える必要がある)。
 *
 * eyebrow は置かない。直上のパンくずが同じ `breadcrumbCategory.name` を
 * リンクとして既に出しており、eyebrow はその語をリンクでない形で繰り返すだけで
 * 情報も機能も増えなかった (2026-07-29 是正。/ranking 索引の eyebrow 撤去と同じ理由)。
 */
export function RankingHeaderPanel({
  title,
  titleDetail,
  sourceName,
  yearName,
  updatedAt,
}: RankingHeaderPanelProps) {
  const metaLine =
    sourceName || yearName || updatedAt
      ? [
          sourceName,
          yearName ? `データ年度 ${yearName}` : null,
          updatedAt ? `最終更新 ${updatedAt}` : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : null;

  return (
    <PageHeader
      className="mb-0"
      title={title}
      description={titleDetail ?? undefined}
      meta={metaLine}
    />
  );
}
