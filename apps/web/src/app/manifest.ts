/**
 * PWAマニフェスト生成
 *
 * Progressive Web App（PWA）のマニフェストファイルを生成します。
 * アプリケーションの基本情報、アイコン、表示モードなどを定義します。
 *
 * 主な設定:
 * - アプリケーション名と説明
 * - スタートURL（/）
 * - 表示モード（standalone: アプリとして表示）
 * - テーマカラー（地域のデータアトラス #304BC6）
 * - アイコン（favicon.svg/ico, PWA standard/maskable）
 * - カテゴリ（statistics, data, visualization）
 *
 * アーキテクチャ:
 * - Next.js 15 App Router のメタデータルート
 * - MetadataRoute.Manifest を使用
 */

import { MetadataRoute } from "next";

import { BRAND } from "@/features/ogp/brand";

import { SITE_DESCRIPTION, SITE_NAME } from "@/config/site";

/**
 * PWAマニフェスト生成関数
 *
 * @returns PWAマニフェストオブジェクト
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "統計都道府県",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: BRAND.primary,
    icons: [
      {
        src: "/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["statistics", "data", "visualization"],
    lang: "ja",
    orientation: "portrait-primary",
    scope: "/",
    id: "/",
  };
}
