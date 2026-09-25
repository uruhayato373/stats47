/**
 * シェアリンクの生成ユーティリティ
 */

import { SHARE_BRAND_PALETTE } from "./share-brand.palette";

interface ShareLinkConfig {
  name: string;
  href: string;
  color: string;
  prominentClass: string;
}

/**
 * シェアリンクの設定を生成
 *
 * @param title - シェアするタイトル
 * @param shareUrl - シェアするURL
 * @param shareText - X用のカスタムシェア文（省略時はtitle + #stats47）
 * @returns シェアリンクの設定配列
 */
export function generateShareLinks(
  title: string,
  shareUrl: string,
  shareText?: string
): ShareLinkConfig[] {
  const xText = shareText ?? `${title} #stats47`;
  return [
    {
      name: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        xText
      )}&url=${encodeURIComponent(shareUrl)}`,
      color: SHARE_BRAND_PALETTE.x.hover,
      prominentClass: SHARE_BRAND_PALETTE.x.prominent,
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
      color: SHARE_BRAND_PALETTE.facebook.hover,
      prominentClass: SHARE_BRAND_PALETTE.facebook.prominent,
    },
    {
      name: "LINE",
      href: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
        shareUrl
      )}`,
      color: SHARE_BRAND_PALETTE.line.hover,
      prominentClass: SHARE_BRAND_PALETTE.line.prominent,
    },
    {
      name: "はてなブックマーク",
      href: `https://b.hatena.ne.jp/entry/${shareUrl.replace(/^https?:\/\//, "")}`,
      color: SHARE_BRAND_PALETTE.hatena.hover,
      prominentClass: SHARE_BRAND_PALETTE.hatena.prominent,
    },
  ];
}
