/**
 * フォント設定
 *
 * Next.jsのnext/font/googleを使用したフォント設定を提供します。
 */

import { Geist_Mono, Inter, Noto_Sans_JP } from "next/font/google";

/**
 * Interフォント設定
 * 英語テキスト用のメインフォント
 */
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

/**
 * Noto Sans JPフォント設定
 * 日本語テキスト用のフォント（400, 500, 600, 700のウェイト）
 */
export const notoSansJP = Noto_Sans_JP({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

/**
 * Geist Monoフォント設定
 * コード表示用の等幅フォント
 */
export const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
  adjustFontFallback: true,
});
