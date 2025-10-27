import {
  ChevronDown,
  FileCode,
  LayoutDashboard,
  Maximize,
  MoreHorizontal,
  Users,
} from "lucide-react";

/**
 * サイドバーナビゲーションアイテムの型定義
 */
export interface NavigationItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

/**
 * サイドバーナビゲーション設定
 *
 * 各セクションのナビゲーションアイテムを定義します。
 * Lucide Reactのアイコンコンポーネントを使用して一貫性を保ちます。
 */
export const getSidebarNavigationItems = () => ({
  home: [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
  ],
  estat: [
    {
      href: "/admin/dev-tools/estat-api/meta-info",
      label: "メタ情報",
      icon: FileCode,
    },
    {
      href: "/admin/dev-tools/estat-api/stats-data",
      label: "統計データ",
      icon: Users,
    },
    {
      href: "/admin/dev-tools/estat-api/stats-list",
      label: "統計表リスト",
      icon: Maximize,
    },
  ],
});

/**
 * Quick Actionsボタンの設定
 */
export const quickActionsConfig = {
  icon: MoreHorizontal,
  label: "Quick actions",
  chevronIcon: ChevronDown,
};
