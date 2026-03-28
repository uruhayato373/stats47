/**
 * ルートレイアウト用メタデータ生成
 *
 * アプリケーション全体のデフォルトメタデータを生成します。
 * SEO、OGP、Twitter Cardsの設定を含みます。
 */


import { getRequiredBaseUrl } from "@/lib/env";

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
      template: "%s | 統計で見る都道府県",
      default:
        "統計で見る都道府県 - 日本の都道府県統計データ可視化プラットフォーム",
    },
    description:
      "あなたの県は何位？年収・人口・消費量から教育・医療まで、1,800以上の統計で47都道府県をランキング。地図やグラフで地域の特徴をわかりやすく可視化します。",
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
    authors: [{ name: "統計で見る都道府県" }],
    creator: "統計で見る都道府県",
    publisher: "統計で見る都道府県",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    ...generateOGMetadata({
      title: "統計で見る都道府県",
      description: "あなたの県は何位？1,800以上の統計で47都道府県をランキング・比較・分析",
      imageUrl: "/og-image.jpg",
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
