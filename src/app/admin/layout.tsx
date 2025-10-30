import { ReactNode } from "react";

/**
 * AdminレイアウトのProps型定義
 */
interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Adminページのレイアウトコンポーネント
 *
 * Adminページ全体のレイアウトを提供し、メインコンテンツエリアを配置します。
 * ページタイトルは各ページで`AdminPageTitle`コンポーネントを使用して設定してください。
 *
 * @param children - レイアウト内に表示するコンテンツ
 * @returns AdminレイアウトのJSX要素
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="h-[calc(100dvh-62px)] lg:h-full overflow-auto flex flex-col bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4">{children}</div>
      </div>
    </div>
  );
}
