/**
 * 地域コード状態管理ストア
 *
 * 地域コードを管理するZustandストア。
 * ローカルストレージへの永続化に対応。
 *
 * @module store/area-code-store
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { setAreaCodeCookie } from "@/lib/cookies/area-code-cookie";

/**
 * 地域コードストアの状態とアクション
 */
interface AreaCodeStore {
  /** 現在の地域コード */
  areaCode: string;
  /** 地域コードを設定 */
  setAreaCode: (code: string) => void;
}

/**
 * 地域コード状態管理ストア
 *
 * ローカルストレージに永続化され、ブラウザリロード後も状態を保持。
 * Cookie にも同期し、サーバーサイドリダイレクトで利用可能にする。
 * URL同期ロジックは`@/features/area`の`useAreaCode`で処理されます。
 */
export const useAreaCodeStore = create<AreaCodeStore>()(
  persist(
    (set) => ({
      areaCode: "00000",
      setAreaCode: (code) => {
        set({ areaCode: code });
        if (typeof document !== "undefined") {
          setAreaCodeCookie(code);
        }
      },
    }),
    {
      name: "area-code-storage", // ローカルストレージのキー名
    }
  )
);


