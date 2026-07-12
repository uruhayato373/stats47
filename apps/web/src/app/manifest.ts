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
 * - テーマカラー（ブランドブルー #2563EB）
 * - アイコン（favicon.svg/ico, PWA standard/maskable）
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
    theme_color: "#2563EB",
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
