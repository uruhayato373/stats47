/**
 * ページタイプ状態管理ストア
 *
 * ranking、blog のページタイプを管理するZustandストア。
 * ローカルストレージへの永続化に対応。
 *
 * @module store/page-type-store
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { PageType } from "@/types/page-type";

/**
 * ページタイプストアの状態とアクション
 */
interface PageTypeStore {
  /** 現在のページタイプ */
  pageType: PageType | null;
  /** ページタイプを設定 */
  setPageType: (type: PageType | null) => void;
  /** ページタイプをリセット */
  reset: () => void;
}

/**
 * ページタイプ状態管理ストア
 *
 * ローカルストレージに永続化され、ブラウザリロード後も状態を保持します。
 * URL同期ロジックは`@/hooks/usePageType`で処理されます。
 */
export const usePageTypeStore = create<PageTypeStore>()(
  persist(
    (set) => ({
      pageType: null,
      setPageType: (type) => set({ pageType: type }),
      reset: () => set({ pageType: null }),
    }),
    {
      name: "page-type-storage", // ローカルストレージのキー名
    }
  )
);

