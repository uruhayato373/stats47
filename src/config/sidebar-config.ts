import {
  ChevronDown,
  FileCode,
  FolderTree,
  LayoutDashboard,
  Link as LinkIcon,
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
 * サイドバーナビゲーション設定を構築
 *
 * 各セクションのナビゲーションアイテムを定義します。
 * Lucide Reactのアイコンコンポーネントを使用して一貫性を保ちます。
 */
export const buildSidebarNavigationItems = () => ({
  home: [
    {
      href: "/",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
  ],
  categories: [
    {
      href: "/admin/categories",
      label: "カテゴリ管理",
      icon: FolderTree,
    },
  ],
  estat: [
    {
      href: "/admin/dev-tools/estat-api/stats-list",
      label: "統計表リスト",
      icon: Maximize,
    },
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
      href: "/admin/dev-tools/estat-api/ranking-mappings",
      label: "ランキング管理",
      icon: LinkIcon,
    },
  ],
});

/**
 * Quick Actionsボタンの設定データ
 */
export const quickActionsConfig = {
  icon: MoreHorizontal,
  label: "Quick actions",
  chevronIcon: ChevronDown,
};

