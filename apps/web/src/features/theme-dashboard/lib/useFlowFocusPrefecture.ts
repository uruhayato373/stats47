"use client";

import { useCallback, useEffect, useState } from "react";

import { PREFECTURE_LIST_2DIGIT } from "@stats47/area";

import { useThemePrefecture } from "../components/ThemePrefectureContext";

/**
 * フロー図 (人口移動 / 通勤) の焦点県を決める共有フック。
 *
 * ★2026-08-04 まで、フロー 2 種はページの都道府県選択と**完全に非連動**だった。
 * 「全国」を選んでいるのに東京のフローが出たままで、しかも両者が同じ URL パラメータ
 * `?pref=` を **2 桁 / 5 桁の別形式で互いに上書きし合っていた**
 * (ThemePrefectureContext は `?pref=13000`、フローは `?pref=13`)。
 *
 * ここで次のように整理する:
 * - ページの都道府県 (5 桁・`ThemePrefectureContext`) が選ばれていれば **それに追従**する
 * - 「全国」はフローには存在しない概念 (県↔県のデータ) なので、代表県へフォールバックし
 *   `isNationalFallback` で呼び出し側にバッジを出させる (黙って東京を出さない)
 * - パネル内で焦点県だけを変えられる。この手動選択は URL `?flow=NN` に載せ、
 *   `?pref=` とは名前空間を分ける
 * - 手動選択はページの都道府県が変わった時点で破棄する (ページ選択が上位)
 *
 * ★配置: フローは migration-flow / commute-flow の 2 feature にまたがるが、この hook の関心は
 * 「テーマページの県選択 → フロー焦点県の橋渡し」なので theme-dashboard に置く。
 * 両 feature は `@/features/theme-dashboard` (client barrel) 経由で使う
 * (feature 跨ぎの deep import を作らない)。
 */

const VALID_CODES = new Set(PREFECTURE_LIST_2DIGIT.map((p) => p.code));

/** フローに「全国」が無いときの代表県 (SSR の initialData と揃える) */
export const DEFAULT_FLOW_FOCUS = "13";

export interface ManualFocus {
  /** この手動選択が結び付いているページ側の県 (2 桁 / 全国は null) */
  boundTo: string | null;
  code: string;
}

/** ページ側 5 桁コード → フロー用 2 桁コード (全国 / 不正値は null) */
export function toFlowCode(pageCode: string | null): string | null {
  return pageCode && /^\d{5}$/.test(pageCode) ? pageCode.slice(0, 2) : null;
}

/**
 * 焦点県の決定規則 (純関数・テスト対象)。
 *
 * 優先順位: 有効な手動選択 > ページの都道府県 > SSR の初期県 > 代表県。
 * 手動選択は「選んだ時点のページ県」に結び付いており、ページ県が変わると失効する
 * (ページ側の選択が上位という規則を、履歴を持たずに表現する)。
 */
export function resolveFlowFocus(
  contextCode: string | null,
  manual: ManualFocus | null,
  initialFocusCode: string | undefined,
  isValid: (code: string) => boolean = (c) => VALID_CODES.has(c),
): { prefCode: string; isNationalFallback: boolean } {
  const activeManual = manual && manual.boundTo === contextCode ? manual.code : null;
  const prefCode =
    activeManual ??
    contextCode ??
    (initialFocusCode && isValid(initialFocusCode)
      ? initialFocusCode
      : DEFAULT_FLOW_FOCUS);
  return { prefCode, isNationalFallback: !contextCode && !activeManual };
}

export interface FlowFocusPrefecture {
  /** Sankey / 地図に渡す焦点県 (2 桁) */
  prefCode: string;
  /** 「全国」選択中で代表県にフォールバックしている */
  isNationalFallback: boolean;
  options: typeof PREFECTURE_LIST_2DIGIT;
  setFocus: (code: string) => void;
}

export function useFlowFocusPrefecture(
  initialFocusCode?: string,
): FlowFocusPrefecture {
  const { selectedPrefectureCode } = useThemePrefecture();
  const [manual, setManual] = useState<ManualFocus | null>(null);

  // ページ側は 5 桁 ("13000")、フローのデータは 2 桁 ("13")
  const contextCode = toFlowCode(selectedPrefectureCode);

  // 起動時の `?flow=NN`。同じ URL の `?pref=` に結び付けることで、
  // ディープリンク (?pref=27000&flow=13) が context 解決後も生き残る。
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const flow = sp.get("flow");
    if (!flow || !VALID_CODES.has(flow)) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setManual({ boundTo: toFlowCode(sp.get("pref")), code: flow });
  }, []);

  // 失効判定は render 中の比較で行う (effect で消すと 1 フレーム古い値が出る)
  const { prefCode, isNationalFallback } = resolveFlowFocus(
    contextCode,
    manual,
    initialFocusCode,
  );

  const setFocus = useCallback(
    (code: string) => {
      if (!VALID_CODES.has(code)) return;
      setManual({ boundTo: contextCode, code });
      const url = new URL(window.location.href);
      url.searchParams.set("flow", code);
      window.history.replaceState(null, "", url);
    },
    [contextCode],
  );

  return {
    prefCode,
    isNationalFallback,
    options: PREFECTURE_LIST_2DIGIT,
    setFocus,
  };
}
