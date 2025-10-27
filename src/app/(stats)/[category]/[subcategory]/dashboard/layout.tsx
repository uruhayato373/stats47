/**
 * 地域別ダッシュボードページレイアウト
 *
 * 2カラムグリッドレイアウトを定義し、メインコンテンツとサイドバーの配置を管理します。
 * レスポンシブデザインに対応し、大画面では2カラム、小画面では1カラムで表示されます。
 */

export default function AreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="space-y-6">{children}</div>;
}
