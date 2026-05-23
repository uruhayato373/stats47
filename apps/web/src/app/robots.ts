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
        // ranking の派生指標 toggle URL (?norm=per_population / per_area / per_household) を明示的に許可
        allow: ["/", "/ranking/*?norm=*"],
        disallow: [
          "/admin/*", // 管理画面
          "/api/*", // 内部 route handler（blog-data, ranking-data 等）。フロントから fetch するだけで Googlebot に露出させない
          "/profile/edit", // プロフィール編集
          "/*/opengraph-image", // Next.js OGP 画像エンドポイント
          // 市区町村ページ (/areas/*/cities/*) の Disallow は 2026-05-23 解除:
          // - Phase 1 で city profile (強み 5 件) が表示されるようになり、
          //   薄いプレースホルダーではなく価値ある content を持つようになった
          // - cities-revival-plan.md Phase 1 S1-S3 で段階的に full content 化していく
          // - 関連 PR: #335 (UI 統合) / #336 (S1 SSG 化)
        ],
      },
      {
        userAgent: "Google-Extended", // Google Gemini
        allow: ["/", "/ranking/*?norm=*"], // 明示的に全ページ + 派生指標 URL を許可
        disallow: [
          "/admin/*", // 管理画面は除外
          "/api/*", // 内部 route handler
          "/profile/edit", // プロフィール編集は除外
          "/*/opengraph-image", // Next.js OGP 画像エンドポイント
          // /areas/*/cities/* も Disallow 解除 (2026-05-23、city profile 表示開始)
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
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      // sitemap-index に cities (sitemap/8) が含まれない Next.js / OpenNext quirk の
      // workaround として、cities sitemap を robots.txt から直接配信。
      // Phase 1 cities revival (PR #335-#337) で 25,785 city URLs を Google に
      // 確実に discover させる目的。
      `${baseUrl}/sitemap/8.xml`,
    ],
  };
}

