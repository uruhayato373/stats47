"use client";

import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type Theme = "light" | "dark";

// テーマ状態をlocalStorageと同期するatom
export const themeAtom = atomWithStorage<Theme>("theme", "light", undefined, {
  getOnInit: true,
});

// マウント状態を管理するatom
export const mountedAtom = atom(false);

// システムのpreferred color schemeを取得するatom
export const systemThemeAtom = atom<Theme>((get) => {
  if (typeof window === "undefined") return "light";
  
  return window.matchMedia("(prefers-color-scheme: dark)").matches 
    ? "dark" 
    : "light";
});

// 実際に適用されるテーマを計算するatom（書き込み専用）
export const effectiveThemeAtom = atom(
  (get) => {
    const savedTheme = get(themeAtom);
    const systemTheme = get(systemThemeAtom);
    
    // localStorageに値がない場合はシステム設定を使用
    return savedTheme || systemTheme;
  },
  (get, set, newTheme: Theme) => {
    // テーマをlocalStorageに保存
    set(themeAtom, newTheme);
    
    // DOMに適用
    applyThemeToDOM(newTheme);
  }
);

// テーマ切り替えのためのwriteOnlyAtom
export const toggleThemeAtom = atom(null, (get, set) => {
  const currentTheme = get(effectiveThemeAtom);
  const newTheme: Theme = currentTheme === "light" ? "dark" : "light";
  
  set(effectiveThemeAtom, newTheme);
  
  if (process.env.NODE_ENV === "development") {
    console.log("Theme toggled from", currentTheme, "to", newTheme);
  }
});

// DOMにテーマを適用する関数
function applyThemeToDOM(theme: Theme) {
  if (typeof window === "undefined") return;

  try {
    const root = document.documentElement;
    const body = document.body;

    // 既存のクラスをクリア
    root.classList.remove("light", "dark");
    body.classList.remove("light", "dark");

    // 新しいテーマクラスを追加
    root.classList.add(theme);
    body.classList.add(theme);

    if (process.env.NODE_ENV === "development") {
      console.log("Theme applied to DOM:", theme);
      console.log("HTML classes:", root.classList.toString());
      
      // 実際のスタイルを確認
      const computedStyle = window.getComputedStyle(body);
      console.log("Body background color:", computedStyle.backgroundColor);
    }

    // テーマ適用の確認（念のため）
    setTimeout(() => {
      const currentClasses = root.classList.toString();
      if (!currentClasses.includes(theme)) {
        console.warn("Theme class not properly applied, retrying...");
        applyThemeToDOM(theme);
      }
    }, 100);
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to apply theme:", error);
    }
  }
}

// 初期化用のatom
export const initThemeAtom = atom(null, (get, set) => {
  if (typeof window === "undefined") return;
  
  try {
    // システム設定を取得
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const systemTheme: Theme = systemPrefersDark ? "dark" : "light";
    
    // localStorageから取得（atomWithStorageが自動で行う）
    const savedTheme = get(themeAtom);
    
    // 初期テーマを決定
    const initialTheme = savedTheme || systemTheme;
    
    // DOMに適用
    applyThemeToDOM(initialTheme);
    
    // マウント完了
    set(mountedAtom, true);
    
    if (process.env.NODE_ENV === "development") {
      console.log("Theme initialized:", {
        system: systemTheme,
        saved: savedTheme,
        effective: initialTheme
      });
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Failed to initialize theme:", error);
    }
    set(mountedAtom, true); // エラーでもマウント完了とする
  }
});