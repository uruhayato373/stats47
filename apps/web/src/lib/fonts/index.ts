/**
 * フォント設定
 *
 * 本文・見出しは OS 標準の system フォントスタック (游ゴシック / Hiragino 軸) を
 * globals.css の body font-family で指定する (Web フォント非依存・高速・Zenn 準拠)。
 * ここではコード表示用の等幅フォントのみ next/font で読み込む。
 */

import { Geist_Mono } from "next/font/google";

/**
 * Geist Monoフォント設定
 * コード表示用の等幅フォント (--font-geist-mono)
 */
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  adjustFontFallback: true,
});
