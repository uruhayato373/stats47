"use client";

import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { QuickActionsButton } from "./QuickActionsButton";
import { SidebarSection } from "./SidebarSection";

/**
 * サイドバーコンポーネント
 * 
 * ナビゲーションメニューを表示するサイドバーです。
 * 単一責務の原則に従い、各セクションを独立したコンポーネントに分割しています。
 */
export default function Sidebar() {
  const { navigationItems, categories, isActiveLink } = useSidebarNavigation();

  return (
    <div
      id="sidebar"
      className="w-60 fixed inset-y-0 z-50 start-0 bg-background border-e border-border lg:block lg:translate-x-0 -translate-x-full transition-all duration-300"
      style={{ top: "52px" }} // ヘッダーの高さ分下げる
    >
      <nav className="p-3 size-full flex flex-col overflow-y-auto">
        <QuickActionsButton />

        <SidebarSection
          title="Home"
          items={navigationItems.home}
          isActiveLink={isActiveLink}
        />

        <SidebarSection
          title="e-STAT API"
          items={navigationItems.estat}
          isActiveLink={isActiveLink}
        />

        <SidebarSection
          title="統計カテゴリー"
          items={categories.map((category) => ({
            href: category.href,
            label: category.name,
            icon: () => null, // CategoryIconで処理
          }))}
          isActiveLink={isActiveLink}
        />
      </nav>
    </div>
  );
}
