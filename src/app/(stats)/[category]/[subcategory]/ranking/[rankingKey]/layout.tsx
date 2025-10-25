/**
 * ランキング詳細ページレイアウト
 * ページ全体のレイアウトと子コンポーネント間の余白を管理
 */

export default function RankingKeyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="space-y-6">{children}</div>;
}
