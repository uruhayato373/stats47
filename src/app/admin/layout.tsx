import { ReactNode } from "react";

/**
 * 管理画面は常に動的レンダリング
 *
 * ビルド時のプリレンダリングを回避し、ランタイム時にD1バインディングを使用します。
 * これにより、ビルド時にD1バインディングが利用できない環境でもエラーが発生しません。
 */
export const dynamic = 'force-dynamic';

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
