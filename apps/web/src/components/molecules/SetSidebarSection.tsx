"use client";

import { type ReactNode, useEffect } from "react";
import { useSidebarSectionStore } from "@/store/sidebar-section-store";

interface SetSidebarSectionProps {
  children: ReactNode;
}

/**
 * ページ固有のコンテンツを左サイドバーに注入するコンポーネント。
 * マウント時に store へ children を設定し、アンマウント時にクリアする。
 */
export function SetSidebarSection({ children }: SetSidebarSectionProps) {
  const setSection = useSidebarSectionStore((s) => s.setSection);

  useEffect(() => {
    setSection(children);
    return () => setSection(null);
  });

  return null;
}
