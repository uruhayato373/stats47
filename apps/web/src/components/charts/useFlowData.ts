"use client";

import { useEffect, useState } from "react";

/**
 * 焦点県フロー系チャート（commute / finance / migration）の共通データ取得フック。
 *
 * 3 つの Sankey ラッパが各々持っていた fetch + state + cancel + error/loading 判定の
 * 重複ボイラープレートを集約する。挙動は従来と同一:
 * - `initialData` が `focusCode === code` の場合は初回 fetch を省略（SSG 由来データ）
 * - `code` 変更で再取得。`/api/flow/<endpoint>/<code>` を叩く
 *
 * @param endpoint `"commute"` / `"finance"` / `"migration"`
 * @param code 焦点県の 2 桁コード
 * @param initialData サーバーが R2 から読んだ既定県データ（任意）
 * @returns `data`（未取得は null）と `errored`（当該 code で失敗したか）
 */
export function useFlowData<T extends { focusCode: string }>(
  endpoint: string,
  code: string,
  initialData?: T,
): { data: T | null; errored: boolean } {
  const [state, setState] = useState<{ code: string; data: T } | null>(() =>
    initialData && initialData.focusCode === code ? { code, data: initialData } : null,
  );
  const [errored, setErrored] = useState<string | null>(null);

  useEffect(() => {
    if (state?.code === code) return; // 既に保持（initialData or 取得済）
    let cancelled = false;
    fetch(`/api/flow/${endpoint}/${code}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json() as Promise<T>;
      })
      .then((d) => {
        if (!cancelled) {
          setState({ code, data: d });
          setErrored(null);
        }
      })
      .catch(() => {
        if (!cancelled) setErrored(code);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint, code, state]);

  const ready = state?.code === code;
  return { data: ready && state ? state.data : null, errored: errored === code };
}
