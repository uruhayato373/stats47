/**
 * 地域コード状態管理ストア
 *
 * 地域コードを管理するZustandストア。
 * URLパスとの同期、ローカルストレージへの永続化に対応。
 *
 * @module store/area-code-store
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * 地域コードストアの状態とアクション
 */
interface AreaCodeStore {
  /** 現在の地域コード */
  areaCode: string | null;
  /** 地域コードを設定 */
  setAreaCode: (code: string | null) => void;
  /** URLパスから地域コードを抽出して同期 */
  syncWithUrl: (pathname: string) => void;
  /** 地域コードをリセット */
  reset: () => void;
}

/**
 * URLパスから地域コードを抽出
 *
 * @param pathname - URLパス（例: "/population/basic-population/dashboard/00000"）
 * @returns 抽出された地域コード、またはnull
 */
function extractAreaCodeFromPath(pathname: string): string | null {
  const pathSegments = pathname.split("/").filter(Boolean);
  const areaCodeSegment = pathSegments[3]; // [category]/[subcategory]/[pageType]/[areaCode]

  // 地域コードが存在し、5桁の数字文字列の場合
  if (areaCodeSegment && /^\d{5}$/.test(areaCodeSegment)) {
    return areaCodeSegment;
  }

  return null;
}

/**
 * 地域コード状態管理ストア
 *
 * ローカルストレージに永続化され、ブラウザリロード後も状態を保持します。
 */
export const useAreaCodeStore = create<AreaCodeStore>()(
  persist(
    (set) => ({
      areaCode: null,
      setAreaCode: (code) => set({ areaCode: code }),
      syncWithUrl: (pathname) => {
        const extractedAreaCode = extractAreaCodeFromPath(pathname);
        set({ areaCode: extractedAreaCode });
      },
      reset: () => set({ areaCode: null }),
    }),
    {
      name: "area-code-storage", // ローカルストレージのキー名
    }
  )
);

