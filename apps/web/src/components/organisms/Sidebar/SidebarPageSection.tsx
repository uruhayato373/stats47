"use client";

import { useSidebarSectionStore } from "@/store/sidebar-section-store";

/**
 * 左サイドバー内でページ固有セクションを表示するコンポーネント。
 * useSidebarSectionStore から読み取り、存在すればレンダリングする。
 */
export function SidebarPageSection() {
  const section = useSidebarSectionStore((s) => s.section);
  if (!section) return null;

  return (
    <div className="px-2 mb-2">
      {section}
    </div>
  );
}
