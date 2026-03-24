"use client";

import { useEffect, useState } from "react";

/**
 * メディアクエリフック
 *
 * 指定されたメディアクエリに一致するかどうかを監視するカスタムフックです。
 * 画面サイズの変更に応じてリアルタイムで状態を更新します。
 *
 * @param query - メディアクエリ文字列（例: "(max-width: 768px)"）
 * @returns メディアクエリに一致する場合はtrue、そうでない場合はfalse
 *
 * @example
 * ```tsx
 * const isMobile = useMediaQuery("(max-width: 768px)");
 * ```
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    // サーバーサイドレンダリング時はwindowが存在しないため、初期値はfalse
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    // クライアントサイドでマウント後に即座に正しい値を取得
    // これにより、初回レンダリング後の再レンダリングで正しい値が設定される
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMatches(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // イベントリスナーを追加
    // 新しいAPI（addEventListener）と古いAPI（addListener）の両方に対応
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // 古いブラウザ対応（addListenerは非推奨だが、互換性のため残す）
      mediaQuery.addListener(handleChange);
    }

    return () => {
      // クリーンアップ
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
}

