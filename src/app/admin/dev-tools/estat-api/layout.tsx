/**
 * EstatApi共通レイアウトコンポーネント
 *
 * シンプルなレイアウトを提供します。
 * 各ページはタブ形式などで独自にレイアウトを管理します。
 *
 * @param children - 子コンポーネント
 */
export default function EstatApiLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen">{children}</div>;
}

