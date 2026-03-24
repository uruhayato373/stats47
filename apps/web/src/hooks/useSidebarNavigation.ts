"use client";

import { useEffect, useRef } from "react";

import { usePathname } from "next/navigation";

import { useSidebarStore } from "@/store/sidebar-store";

/**
 * useSidebarNavigationフックのオプション
 */
interface UseSidebarNavigationOptions {
  /** モバイル表示かどうか */
  isMobile: boolean;
}

/**
 * ページ遷移時にモバイルでサイドメニューを閉じるフック
 *
 * `useRef`で前回の`pathname`を保持し、実際にパスが変更されたときのみ実行します。
 * これにより、`isMobile`が`false→true`に変わったときの不要な実行を防止します。
 *
 * @param options - フックのオプション
 * @param options.isMobile - モバイル表示かどうか
 */
export function useSidebarNavigation({
  isMobile,
}: UseSidebarNavigationOptions) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // パスが実際に変わったときのみ実行
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;

      // モバイルの場合のみサイドメニューを閉じる
      if (isMobile) {
        useSidebarStore.getState().close();
      }
    }
  }, [pathname, isMobile]);
}
