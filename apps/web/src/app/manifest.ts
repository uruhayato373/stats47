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
 * - テーマカラー（#4f46e5: Indigo-600）
 * - アイコン（favicon.ico, icon-192.png, icon-512.png）
 * - カテゴリ（statistics, data, visualization）
 *
 * アーキテクチャ:
 * - Next.js 15 App Router のメタデータルート
 * - MetadataRoute.Manifest を使用
 */

import { MetadataRoute } from "next";

/**
 * PWAマニフェスト生成関数
 *
 * @returns PWAマニフェストオブジェクト
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "統計で見る都道府県",
    short_name: "統計都道府県",
    description:
      "あなたの県は何位？年収・人口・消費量から教育・医療まで、1,800以上の統計で47都道府県をランキング。地図やグラフで地域の特徴をわかりやすく可視化します。",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4f46e5", // Indigo-600 (Tailwind)
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
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
