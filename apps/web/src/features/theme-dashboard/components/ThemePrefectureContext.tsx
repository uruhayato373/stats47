"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import {
  resolveThemePrefectureCode,
  writeThemePrefecturePreference,
} from "../lib/theme-prefecture-preference";

// ============================================================================
// Context — テーマダッシュボードの選択エリア (47都道府県 / 都道府県) の単一ソース。
// H1 (ThemeAreaHeader)・セレクタ (PrefectureSelect)・ダッシュボード (ThemeDashboardTabbed)
// が共有する。URL `?pref=NNNNN` と双方向同期し、canonical は pref 無しを維持する。
// サーバーが URL / Cookie / 初回既定値を解決して initial を渡すため、hydration 後の
// 表示ジャンプを起こさない。クライアント操作は Cookie と URL に同期する。
// ============================================================================

interface ThemePrefectureContextValue {
  /** Provider 配下か。bespoke 画面で Cookie 引き継ぎリンクを生成しないために使う。 */
  hasProvider: boolean;
  /** 選択中の都道府県コード（5桁、null = 47都道府県） */
  selectedPrefectureCode: string | null;
  /** 選択中の都道府県名（null = 47都道府県） */
  selectedAreaName: string | null;
  /** 都道府県を選択 (null = 47都道府県)。name 省略時は code から解決する。 */
  setSelected: (code: string | null, name?: string | null) => void;
}

const ThemePrefectureContext = createContext<ThemePrefectureContextValue>({
  hasProvider: false,
  selectedPrefectureCode: null,
  selectedAreaName: null,
  setSelected: () => {},
});

// ============================================================================
// Provider
// ============================================================================

export function ThemePrefectureProvider({
  initialAreaCode = null,
  initialAreaName = null,
  children,
}: {
  /** サーバーで解決済みの初期エリア。null は明示的な 47都道府県表示。 */
  initialAreaCode?: string | null;
  initialAreaName?: string | null;
  children: ReactNode;
}) {
  const [selectedPrefectureCode, setCode] = useState<string | null>(initialAreaCode);
  const [selectedAreaName, setName] = useState<string | null>(initialAreaName);

  const setSelected = useCallback((code: string | null, name?: string | null) => {
    const selection = code ? resolveThemePrefectureCode(code) : null;
    const resolvedCode = selection?.areaCode ?? null;
    setCode(resolvedCode);
    setName(resolvedCode ? (name ?? selection?.areaName ?? null) : null);
    writeThemePrefecturePreference(resolvedCode);
    const url = new URL(window.location.href);
    if (resolvedCode) url.searchParams.set("pref", resolvedCode);
    else url.searchParams.delete("pref");
    window.history.replaceState(null, "", url);
  }, []);

  // URL / Cookie / 初回既定値からサーバーが解決した選択を、次回アクセス用に保存する。
  useEffect(() => {
    writeThemePrefecturePreference(initialAreaCode);
  }, [initialAreaCode]);

  // Provider をサーバー初期値なしで使う既存画面向けの後方互換。
  useEffect(() => {
    if (initialAreaCode) return;
    const p = new URLSearchParams(window.location.search).get("pref");
    const selection = resolveThemePrefectureCode(p ?? undefined);
    if (selection) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode(selection.areaCode);
      setName(selection.areaName);
      writeThemePrefecturePreference(selection.areaCode);
    }
  }, [initialAreaCode]);

  return (
    <ThemePrefectureContext.Provider
      value={{
        hasProvider: true,
        selectedPrefectureCode,
        selectedAreaName,
        setSelected,
      }}
    >
      {children}
    </ThemePrefectureContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useThemePrefecture() {
  return useContext(ThemePrefectureContext);
}
