import { PageHeader } from "@/components/layout";

interface RankingHeaderPanelProps {
  /** ランキングタイトル（h1） */
  title: string;
}

/**
 * ランキング詳細ページの見出し。
 *
 * ページ上部は h1 だけに絞る。集計条件・最終更新は可視化直下、
 * 年度は地図・テーブルのカードヘッダー、調査名・出典はカードフッターに置く。
 *
 * eyebrow は置かない。直上のパンくずが同じ `breadcrumbCategory.name` を
 * リンクとして既に出しており、eyebrow はその語をリンクでない形で繰り返すだけで
 * 情報も機能も増えなかった (2026-07-29 是正。/ranking 索引の eyebrow 撤去と同じ理由)。
 */
export function RankingHeaderPanel({ title }: RankingHeaderPanelProps) {
  return <PageHeader className="mb-0" title={title} />;
}
