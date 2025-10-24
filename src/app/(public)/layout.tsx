import { Metadata } from "next";

/**
 * 公開ページ共通レイアウト
 * トップページ、about、blogなどの公開ページで使用
 */
export const metadata: Metadata = {
  title: {
    template: "%s | 統計で見る都道府県",
    default: "統計で見る都道府県",
  },
  description:
    "日本の都道府県統計データを可視化するWebアプリケーション。e-Stat APIを中心に、政府統計、自治体データ、民間統計など多様なデータソースから47都道府県の統計データを取得し、直感的なグラフとチャートで表示します。",
  keywords: [
    "統計",
    "都道府県",
    "データ可視化",
    "e-Stat",
    "政府統計",
    "ランキング",
    "ダッシュボード",
  ],
  authors: [{ name: "統計で見る都道府県" }],
  creator: "統計で見る都道府県",
  publisher: "統計で見る都道府県",
  openGraph: {
    type: "website",
    siteName: "統計で見る都道府県",
    title: "統計で見る都道府県",
    description: "日本の都道府県統計データを可視化するWebアプリケーション",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "統計で見る都道府県",
    description: "日本の都道府県統計データを可視化するWebアプリケーション",
  },
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
  verification: {
    google: "your-google-verification-code",
  },
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="public-layout">
      {/* 公開ページ用のヘッダー・フッターは必要に応じて追加 */}
      <main>{children}</main>
    </div>
  );
}
