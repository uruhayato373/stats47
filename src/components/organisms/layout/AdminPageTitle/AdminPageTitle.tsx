"use client";

import { usePathname } from "next/navigation";

import {
  Database,
  FileText,
  LayoutDashboard,
  List,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/**
 * AdminPageTitleコンポーネントのProps型定義
 */
export interface AdminPageTitleProps {
  /**
   * ページタイトル
   * 指定されない場合は、URLパスから自動的に推測されます
   */
  title?: string;
  /**
   * アイコン名（Lucide Reactのアイコン名）
   * 指定されない場合は、URLパスから自動的に推測されます
   * 例: "Database", "FileText", "LayoutDashboard"など
   */
  iconName?: string;
}

/**
 * アイコンマッピング
 * Lucide Reactのアイコン名からコンポーネントへのマッピング
 */
const iconMap: Record<string, LucideIcon> = {
  Database,
  FileText,
  LayoutDashboard,
  List,
  Wrench,
};

/**
 * アイコン名からアイコンコンポーネントを取得
 */
function getIconComponent(iconName?: string): LucideIcon | null {
  if (!iconName) return null;
  return iconMap[iconName] || null;
}

/**
 * Adminページのタイトル表示コンポーネント
 *
 * propsでタイトルとアイコンを指定できます。
 * propsが指定されない場合は、URLパスから自動的に推測されます。
 * スティッキーヘッダーとして動作し、ブラー効果を持ちます。
 *
 * @param props - AdminPageTitleProps
 * @returns ページタイトルのJSX要素
 */
export const AdminPageTitle = ({
  title,
  iconName,
}: AdminPageTitleProps = {}) => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);

  // propsが指定されている場合はそれを使用
  if (title || iconName) {
    const Icon = getIconComponent(iconName);
    return (
      <div className="sticky top-0 z-10 py-2 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          {title && (
            <h1 className="text-base font-medium text-foreground">{title}</h1>
          )}
        </div>
      </div>
    );
  }

  // フォールバック: URLパスから自動推測
  const segmentNames: Record<string, string> = {
    admin: "管理画面",
    "dev-tools": "開発ツール",
    "estat-api": "e-STAT API",
    "meta-info": "メタ情報管理",
    "stats-data": "統計データ管理",
    "stats-list": "統計リスト検索",
  };

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
