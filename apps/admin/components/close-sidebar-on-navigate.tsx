"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useSidebar } from "@/components/ui/sidebar";

/**
 * 画面を移ったら、モバイルのサイドメニュー (Sheet) を閉じる。
 * ★メニュー本体の中には置かない: Sheet は開いたときに中身が mount されるので、mount 時に「閉じる」を実行すると
 *   開いた瞬間に閉じてしまう (2026-09-30 実測)。常に mount されているここで pathname の「変化」だけを見る。
 */
export function CloseSidebarOnNavigate() {
  const pathname = usePathname();
  const previous = useRef(pathname);
  const { setOpenMobile } = useSidebar();
  useEffect(() => {
    if (previous.current !== pathname) {
      previous.current = pathname;
      setOpenMobile(false);
    }
  }, [pathname, setOpenMobile]);
  return null;
}
