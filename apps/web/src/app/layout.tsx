/**
 * ルートレイアウト
 *
 * アプリケーション全体のルートレイアウトコンポーネントです。
 * すべてのページで共通のレイアウト要素（ヘッダー、サイドバー、プロバイダーなど）を提供します。
 *
 * 主な機能:
 * - フォント設定（Inter、Noto Sans JP、Geist Mono）
 * - メタデータ設定（SEO、OGP、Twitter Cards）
 * - テーマプロバイダー（ダークモード対応）
 * - セッションプロバイダー（NextAuth）
 * - トースト通知（Sonner）
 *
 * アーキテクチャ:
 * - Next.js 15 App Router のレイアウト機能を使用
 * - サーバーコンポーネントとして実装
 * - フォント最適化（next/font/google）
 * - メタデータはNext.jsのMetadata APIを使用
 *
 * レイアウト構造:
 * - Header: 全ページ共通のヘッダー
 * - SidebarVisibility: サイドバーナビゲーション
 * - main: 各ページのコンテンツエリア
 * - Footer: 全ページ共通のフッター
 */

import { Suspense } from "react";

import NextTopLoader from "nextjs-toploader";
import { Toaster } from "sonner";

import "./globals.css";

import { Footer } from "@/components/organisms/Footer/Footer";
import Header from "@/components/organisms/Header";

import { Sidebar, SidebarSkeleton } from "@/components/organisms/Sidebar";

import { PageViewTracker } from "@/lib/analytics/components/PageViewTracker";
import { GoogleAnalytics } from "@/lib/analytics/GoogleAnalytics";
import { CookieConsentBanner } from "@/lib/analytics/components/CookieConsentBanner";
import { getRequiredBaseUrl } from "@/lib/env";
import { geistMono, inter, notoSansJP } from "@/lib/fonts";
import { A8LinkManager } from "@/lib/a8net/A8LinkManager";
import { AdSenseScript } from "@/lib/google-adsense";
import { generateRootMetadata } from "@/lib/metadata/root-metadata";
import { nextTopLoaderConfig } from "@/lib/next-top-loader/config";
import { generateWebSiteStructuredDataScripts } from "@/lib/structured-data/scripts";

import { ThemeProvider } from "@/providers/theme-provider";

/**
 * メタデータ設定
 * SEO、OGP、Twitter Cards、検索エンジン最適化のためのメタ情報
 */
export const metadata = generateRootMetadata();

/**
 * ルートレイアウトコンポーネント
 *
 * @param children - レイアウト内に表示するコンテンツ（各ページのコンポーネント）
 * @returns ルートレイアウトのJSX要素
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = getRequiredBaseUrl();

  return (
    <html
      lang="ja"
      className={`${inter.variable} ${notoSansJP.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        <NextTopLoader {...nextTopLoaderConfig} />
        {/* esbuild __name shim (ReferenceError: __name is not defined 回避用) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__name = window.__name || ((target, value) => Object.defineProperty(target, "name", { value, configurable: true }));`,
          }}
        />
        {/* WebSite・Organization 構造化データ */}
        <div
          dangerouslySetInnerHTML={{
            __html: generateWebSiteStructuredDataScripts(baseUrl),
          }}
        />
        {/* Google Analytics 4 スクリプト */}
        <GoogleAnalytics />
        {/* Google AdSense スクリプト */}
        <AdSenseScript />
        {/* A8.net リンクマネージャー（通常リンクをアフィリエイトリンクに自動変換） */}
        <A8LinkManager />
        {/* ページビュートラッカー（ルート変更を検知して自動トラッキング） */}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        {/* テーマプロバイダー（ダークモード対応） */}
        <ThemeProvider>
          {/* メインレイアウトコンテナ */}
          <div className="relative flex flex-col h-screen overflow-hidden" suppressHydrationWarning>
            {/* ヘッダー（全ページ共通） */}
            <Header />
            {/* コンテンツエリア（サイドバー + メインコンテンツ） */}
            <div className="flex flex-1 min-h-0">
              {/* サイドバーナビゲーション */}
              <Suspense fallback={<SidebarSkeleton />}>
                <Sidebar />
              </Suspense>
              {/* メインコンテンツエリア（各ページのコンテンツがここに表示される） */}
              <main className="flex-1 min-h-0 overflow-y-auto">
                {children}
              </main>
            </div>
            {/* フッター（全ページ共通） */}
            <div className="flex-shrink-0">
              <Footer />
            </div>
          </div>
          {/* トースト通知（成功、エラー、警告などの通知を表示） */}
          <Toaster position="top-right" richColors />
          {/* Cookie 同意バナー */}
          <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
