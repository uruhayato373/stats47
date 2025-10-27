"use client";

import { usePathname } from "next/navigation";

import {
    Database,
    FileText,
    LayoutDashboard,
    List,
    Wrench,
} from "lucide-react";

/**
 * Adminページのタイトル表示コンポーネント
 *
 * URLパスから現在のページタイトルを抽出して表示します。
 * スティッキーヘッダーとして動作し、ブラー効果を持ちます。
 *
 * @returns ページタイトルのJSX要素
 */
export const AdminPageTitle = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);

  // パスセグメントの表示名マッピング
  const segmentNames: Record<string, string> = {
    admin: "管理画面",
    "dev-tools": "開発ツール",
    "estat-api": "e-STAT API",
    "meta-info": "メタ情報管理",
    "stats-data": "統計データ管理",
    "stats-list": "統計リスト検索",
  };

  // パスセグメントのアイコンマッピング
  const segmentIcons: Record<
    string,
    React.ComponentType<{ className?: string }>
  > = {
    admin: LayoutDashboard,
    "dev-tools": Wrench,
    "estat-api": Database,
    "meta-info": FileText,
    "stats-data": FileText,
    "stats-list": List,
  };

  // 最後のセグメントを取得（現在のページ）
  const lastSegment = pathSegments[pathSegments.length - 1];
  const pageTitle = segmentNames[lastSegment] || lastSegment;
  const Icon = segmentIcons[lastSegment];

  return (
    <div className="sticky top-0 z-10 py-2 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        <h1 className="text-base font-medium text-foreground">{pageTitle}</h1>
      </div>
    </div>
  );
};
