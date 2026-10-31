'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';

import {
  resolveThemePrefectureCode,
  writeThemePrefecturePreference,
} from '../lib/theme-prefecture-preference';

// ============================================================================
// Context — テーマダッシュボードの選択エリア (47都道府県 / 都道府県) の単一ソース。
// H1 (ThemeAreaHeader)・セレクタ (PrefectureSelect)・ダッシュボード (ThemeDashboardClient)
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
  /**
   * 前に選んで覚えている県 (cookie)。47 都道府県のページでも、推移のカードにこの県を全国と並べて出す
   * (題名とタイルは 47 都道府県のまま。2026-10-31 オーナー決定)。null = 覚えていない (全国だけを出す)
   */
  rememberedPrefecture?: { areaCode: string; areaName: string } | null;
  /** 覚えている県を外す (推移のカードは全国だけに戻る) */
  clearRemembered?: () => void;
}

type ThemeServerSelection = Pick<
  ThemePrefectureContextValue,
  'selectedPrefectureCode' | 'selectedAreaName'
>;

const ThemePrefectureContext = createContext<
  ThemePrefectureContextValue & { serverSelection: ThemeServerSelection }
>({
  serverSelection: { selectedPrefectureCode: null, selectedAreaName: null },
  hasProvider: false,
  selectedPrefectureCode: null,
  selectedAreaName: null,
  setSelected: () => {},
  rememberedPrefecture: null,
  clearRemembered: () => {},
});

// ============================================================================
// Provider
// ============================================================================

export function ThemePrefectureProvider({
  initialAreaCode = null,
  initialAreaName = null,
  rememberedAreaCode = null,
  children,
}: {
  /** サーバーで解決済みの初期エリア。null は明示的な 47都道府県表示。 */
  initialAreaCode?: string | null;
  initialAreaName?: string | null;
  /** 前に選んで覚えている県 (サーバーが cookie から引く)。47 都道府県のページの推移のカードに重ねる */
  rememberedAreaCode?: string | null;
  children: ReactNode;
}) {
  const [rememberedCode, setRememberedCode] = useState<string | null>(rememberedAreaCode);
  const rememberedPrefecture = useMemo(
    () => (rememberedCode ? resolveThemePrefectureCode(rememberedCode) : null),
    [rememberedCode]
  );
  const clearRemembered = useCallback(() => {
    setRememberedCode(null);
    writeThemePrefecturePreference(null);
  }, []);
  const [selectedPrefectureCode, setCode] = useState<string | null>(
    initialAreaCode
  );
  const [selectedAreaName, setName] = useState<string | null>(initialAreaName);

  const setSelected = useCallback(
    (code: string | null, name?: string | null) => {
      const selection = code ? resolveThemePrefectureCode(code) : null;
      const resolvedCode = selection?.areaCode ?? null;
      setCode(resolvedCode);
      setName(resolvedCode ? (name ?? selection?.areaName ?? null) : null);
      writeThemePrefecturePreference(resolvedCode);
      const url = new URL(window.location.href);
      if (resolvedCode) url.searchParams.set('pref', resolvedCode);
      else url.searchParams.delete('pref');
      window.history.replaceState(null, '', url);
    },
    []
  );

  // URL / Cookie / 初回既定値からサーバーが解決した県を、次回アクセス用に保存する。
  // 47 都道府県のページ (initialAreaCode = null) を開いただけでは消さない (2026-10-31。旧: 「47都道府県」で上書きし、
  // 県を選んでから戻ると覚えた県が消えて、推移のカードが空になっていた)
  useEffect(() => {
    if (initialAreaCode) writeThemePrefecturePreference(initialAreaCode);
  }, [initialAreaCode]);

  // Provider をサーバー初期値なしで使う既存画面向けの後方互換。
  useEffect(() => {
    if (initialAreaCode) return;
    const p = new URLSearchParams(window.location.search).get('pref');
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
        serverSelection: {
          selectedPrefectureCode: initialAreaCode,
          selectedAreaName: initialAreaName,
        },
        hasProvider: true,
        selectedPrefectureCode,
        selectedAreaName,
        setSelected,
        rememberedPrefecture,
        clearRemembered,
      }}
    >
      {children}
    </ThemePrefectureContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

const subscribeToSelection = () => () => {};

export function useThemePrefecture(): ThemePrefectureContextValue {
  const context = useContext(ThemePrefectureContext);
  const serverSnapshot = useMemo(
    () => ({ ...context, ...context.serverSelection }),
    [context]
  );
  // Context continues to notify consumers. The server snapshot only preserves
  // the initial HTML selection while a streamed section is being hydrated.
  return useSyncExternalStore(
    subscribeToSelection,
    () => context,
    () => serverSnapshot
  );
}
