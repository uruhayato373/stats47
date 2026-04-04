/**
 * robots.txt生成
 *
 * 検索エンジンのクローラー向けのrobots.txtファイルを生成します。
 * クロール可能なページと禁止するページを定義します。
 *
 * 主な設定:
 * - 全ボット: 管理画面、認証API、プロフィール編集、プレビューページを禁止
 * - Google-Extended (Google Gemini): 全ページを明示的に許可
 * - GPTBot (ChatGPT): 全ページを禁止（AI学習用のクロール禁止）
 * - CCBot (Common Crawl): 全ページを禁止
 * - サイトマップのURLを指定
 *
 * アーキテクチャ:
 * - Next.js 15 App Router のメタデータルート
 * - MetadataRoute.Robots を使用
 *
 * セキュリティ:
 * - 管理画面や認証APIへのアクセスを制限
 * - AI学習用のクロールを禁止（GPTBot、CCBot）
 * - Google Geminiは明示的に許可
 */

import { MetadataRoute } from "next";

/**
 * robots.txt生成関数
 *
 * @returns robots.txtオブジェクト
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://stats47.jp";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/*", // 管理画面
          "/api/auth/*", // 認証API
          "/profile/edit", // プロフィール編集
          "/*/opengraph-image", // Next.js OGP 画像エンドポイント
          "/areas/*/cities/*", // 市区町村ページ（noindex だがクロールバジェット浪費防止）
        ],
      },
      {
        userAgent: "Google-Extended", // Google Gemini
        allow: "/", // 明示的に全ページを許可
        disallow: [
          "/admin/*", // 管理画面は除外
          "/api/auth/*", // 認証APIは除外
          "/profile/edit", // プロフィール編集は除外
          "/*/opengraph-image", // Next.js OGP 画像エンドポイント
          "/areas/*/cities/*", // 市区町村ページ
        ],
      },
      {
        userAgent: "GPTBot", // ChatGPT
        disallow: ["/"], // AI学習用のクロール禁止
      },
      {
        userAgent: "CCBot", // Common Crawl
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

