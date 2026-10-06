/**
 * ルートレイアウト用メタデータ生成
 *
 * アプリケーション全体のデフォルトメタデータを生成します。
 * SEO、OGP、Twitter Cardsの設定を含みます。
 *
 * デフォルト OGP 画像 (`/og-image.jpg`) はブランド素材
 * `public/brand/atlas-v1/ogp-default-1200x630.jpg` から書き出す。
 * 本ファイルと各ページの静的 OGP 設定が同じ URL を参照する。
 */


import { getRequiredBaseUrl } from "@/lib/env";

import { DEFAULT_OGP_IMAGE_PATH, SITE_DESCRIPTION, SITE_NAME, SITE_TAGLINE } from "@/config/site";

import { generateOGMetadata } from "./og-generator";

import type { Metadata } from "next";

/**
 * ルートレイアウト用のメタデータを生成
 *
 * @returns Metadataオブジェクト
 */
export function generateRootMetadata(): Metadata {
  const baseUrl = getRequiredBaseUrl();

  return {
    metadataBase: new URL(baseUrl),
    title: {
      template: `%s | ${SITE_NAME}`,
      default: `${SITE_NAME} - 日本の都道府県統計データ可視化プラットフォーム`,
    },
    description: SITE_DESCRIPTION,
    keywords: [
      "統計",
      "都道府県",
      "データ可視化",
      "e-Stat",
      "政府統計",
      "ランキング",
      "ダッシュボード",
      "日本",
    ],
    authors: [{ name: SITE_NAME }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
    icons: {
      icon: [
        { url: "/favicon.svg", type: "image/svg+xml" },
        { url: "/favicon.ico", sizes: "16x16 32x32 48x48" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    ...generateOGMetadata({
      title: SITE_NAME,
      description: SITE_TAGLINE,
      imageUrl: DEFAULT_OGP_IMAGE_PATH,
    }),
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}
