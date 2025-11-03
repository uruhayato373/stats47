/**
 * ページタイプ状態管理ストア
 *
 * ranking、dashboard、blog の3つのページタイプを管理するZustandストア。
 * URLパスとの同期、ローカルストレージへの永続化に対応。
 *
 * @module store/page-type-store
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * ページタイプの種類
 */
export type PageType = "ranking" | "dashboard" | "blog";

/**
 * ページタイプストアの状態とアクション
 */
interface PageTypeStore {
  /** 現在のページタイプ */
  pageType: PageType | null;
  /** ページタイプを設定 */
  setPageType: (type: PageType | null) => void;
  /** URLパスからページタイプを抽出して同期 */
  syncWithUrl: (pathname: string) => void;
  /** ページタイプをリセット */
  reset: () => void;
}

/**
 * URLパスからページタイプを抽出
 *
 * @param pathname - URLパス（例: "/population/basic-population/dashboard/00000"）
 * @returns 抽出されたページタイプ、またはnull
 */
function extractPageTypeFromPath(pathname: string): PageType | null {
  const pathSegments = pathname.split("/").filter(Boolean);
  const pageTypeSegment = pathSegments[2]; // [category]/[subcategory]/[pageType]/...

  if (
    pageTypeSegment === "ranking" ||
    pageTypeSegment === "dashboard" ||
    pageTypeSegment === "blog"
  ) {
    return pageTypeSegment as PageType;
  }

  return null;
}

/**
 * ページタイプ状態管理ストア
 *
 * ローカルストレージに永続化され、ブラウザリロード後も状態を保持します。
 */
export const usePageTypeStore = create<PageTypeStore>()(
  persist(
    (set) => ({
      pageType: null,
      setPageType: (type) => set({ pageType: type }),
      syncWithUrl: (pathname) => {
        const extractedPageType = extractPageTypeFromPath(pathname);
        set({ pageType: extractedPageType });
      },
      reset: () => set({ pageType: null }),
    }),
    {
      name: "page-type-storage", // ローカルストレージのキー名
    }
  )
);

