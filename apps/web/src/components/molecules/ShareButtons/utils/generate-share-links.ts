/**
 * シェアリンクの生成ユーティリティ
 */

export interface ShareLinkConfig {
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
      color: "hover:text-blue-400 hover:bg-blue-400/10",
      prominentClass: "bg-black text-white hover:bg-black/80",
    },
    {
      name: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
        shareUrl
      )}`,
      color: "hover:text-blue-600 hover:bg-blue-600/10",
      prominentClass: "bg-[#1877F2] text-white hover:bg-[#1877F2]/90",
    },
    {
      name: "LINE",
      href: `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
        shareUrl
      )}`,
      color: "hover:text-green-500 hover:bg-green-500/10",
      prominentClass: "bg-[#06C755] text-white hover:bg-[#06C755]/90",
    },
    {
      name: "はてなブックマーク",
      href: `https://b.hatena.ne.jp/entry/${shareUrl.replace(/^https?:\/\//, "")}`,
      color: "hover:text-blue-500 hover:bg-blue-500/10",
      prominentClass: "bg-[#00A4DE] text-white hover:bg-[#00A4DE]/90",
    },
  ];
}
