/**
 * OGP・Twitter Cardsメタデータ生成ユーティリティ
 *
 * Open Graph ProtocolとTwitter Cardsのメタデータを生成する共通関数を提供します。
 * 各ページのメタデータ生成で重複するOGP設定を一元化し、保守性を向上させます。
 *
 * OGP 画像の生成方式（正典: .claude/rules/ogp-image-standards.md）:
 * - 事前生成した静的 OGP を R2 に保存し、配信時は静的 URL を参照する。
 *   ランタイム next/og の ImageResponse は Cloudflare Worker で例外 (error 1101) になるため使わない。
 *   生成: apps/web/scripts/generate-ogp-images.ts (ranking/areas) /
 *         apps/web/scripts/generate-blog-thumbnails-cloud.ts (blog)。
 *   URL 解決は apps/web/src/lib/metadata/ogp-image.ts (ogpImageUrl / ogpImageKeys)。
 * - 正方形クロップ対策（note.com 等）:
 *   apps/remotion/src/shared/components/layouts/OgpSafeZone.tsx の JSDoc 参照
 */

import type { Metadata } from "next";

/**
 * OGPメタデータ生成パラメータ
 */
interface GenerateOGMetadataParams {
  /** ページタイトル */
  title: string;
  /** ページ説明 */
  description: string;
  /** OGP画像URL */
  imageUrl: string;
  /** ページURL（og:url） */
  url?: string;
  /** OGP type（デフォルト: "website"） */
  type?: "website" | "article";
  /** 画像のalt属性（デフォルト: title） */
  alt?: string;
  /** 画像の幅（デフォルト: 1200） */
  width?: number;
  /** 画像の高さ（デフォルト: 630） */
  height?: number;
}

/**
 * OGPとTwitter Cardsのメタデータを生成
 *
 * Open Graph ProtocolとTwitter Cardsの設定を統一フォーマットで生成します。
 * summary_large_image形式のTwitter Cardを使用します。
 *
 * @param params - OGPメタデータ生成パラメータ
 * @returns MetadataオブジェクトのopenGraphとtwitterプロパティ
 *
 * @example
 * ```typescript
 * const metadata = {
 *   title: "ページタイトル",
 *   description: "ページ説明",
 *   ...generateOGMetadata({
 *     title: "ページタイトル",
 *     description: "ページ説明",
 *     imageUrl: "/og-image.jpg",
 *     type: "article",
 *   }),
 * };
 * ```
 */
export function generateOGMetadata({
  title,
  description,
  imageUrl,
  url,
  type = "website",
  alt,
  width = 1200,
  height = 630,
}: GenerateOGMetadataParams): Pick<Metadata, "openGraph" | "twitter"> {
  const imageAlt = alt || title;

  return {
    openGraph: {
      title,
      description,
      type,
      ...(url ? { url } : {}),
      images: [
        {
          url: imageUrl,
          width,
          height,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}
