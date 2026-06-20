"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { lookupArea } from "@stats47/area";


// ============================================================================
// Context — テーマダッシュボードの選択エリア (全国 / 都道府県) の単一ソース。
// H1 (ThemeAreaHeader)・セレクタ (PrefectureSelect)・ダッシュボード (ThemeDashboardTabbed)
// が共有する。URL `?pref=NNNNN` と双方向同期し、canonical は pref 無しを維持する。
// cookies()/headers() は使わず window.* のみ参照 → SSG 維持 (nextjs-ssg-preservation.md)。
// ============================================================================

interface ThemePrefectureContextValue {
  /** 選択中の都道府県コード（5桁、null = 全国） */
  selectedPrefectureCode: string | null;
  /** 選択中の都道府県名（null = 全国） */
  selectedAreaName: string | null;
  /** 都道府県を選択 (null = 全国)。name 省略時は code から解決する。 */
  setSelected: (code: string | null, name?: string | null) => void;
}

const ThemePrefectureContext = createContext<ThemePrefectureContextValue>({
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
  /** `/areas/[code]` 経由時の初期エリア。無ければ URL `?pref=` を読む。 */
  initialAreaCode?: string | null;
  initialAreaName?: string | null;
  children: ReactNode;
}) {
  const [selectedPrefectureCode, setCode] = useState<string | null>(initialAreaCode);
  const [selectedAreaName, setName] = useState<string | null>(initialAreaName);

  const setSelected = useCallback((code: string | null, name?: string | null) => {
    setCode(code);
    setName(code ? (name ?? lookupArea(code)?.areaName ?? null) : null);
    const url = new URL(window.location.href);
    if (code) url.searchParams.set("pref", code);
    else url.searchParams.delete("pref");
    window.history.replaceState(null, "", url);
  }, []);

  // 起動時: initial が無ければ URL ?pref= を読む（areas からの遷移は initial を優先）
  useEffect(() => {
    if (initialAreaCode) return;
    const p = new URLSearchParams(window.location.search).get("pref");
    if (p && /^\d{5}$/.test(p)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCode(p);
      setName(lookupArea(p)?.areaName ?? null);
    }
  }, [initialAreaCode]);

  return (
    <ThemePrefectureContext.Provider
      value={{ selectedPrefectureCode, selectedAreaName, setSelected }}
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
