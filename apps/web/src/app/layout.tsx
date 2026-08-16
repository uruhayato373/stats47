/**
 * ルートレイアウト
 *
 * アプリケーション全体のルートレイアウトコンポーネントです。
 * すべてのページで共通のレイアウト要素（ヘッダー、サイドバー、プロバイダーなど）を提供します。
 *
 * 主な機能:
 * - フォント設定（本文は system スタック=游ゴシック/Hiragino、コードのみ Geist Mono）
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

import { Toaster } from "sonner";

import "./globals.css";

import { Footer } from "@/components/organisms/Footer/Footer";
import Header from "@/components/organisms/Header";
import { MobileNavDrawer } from "@/components/organisms/MobileNavDrawer";

import { A8LinkManager } from "@/lib/a8net/A8LinkManager";
import { CookieConsentBanner } from "@/lib/analytics/components/CookieConsentBanner";
import { PageViewTracker } from "@/lib/analytics/components/PageViewTracker";
import { GoogleAnalytics } from "@/lib/analytics/GoogleAnalytics";
import { getRequiredBaseUrl } from "@/lib/env";
import {
  ADSENSE_DISPLAY_ENABLED,
  AdSenseScript,
} from "@/lib/google-adsense";
import { generateRootMetadata } from "@/lib/metadata/root-metadata";
import { TopLoaderWrapper } from "@/lib/next-top-loader/TopLoaderWrapper";
import { generateWebSiteStructuredDataScripts } from "@/lib/structured-data/scripts";

import { ThemeProvider } from "@/providers/theme-provider";

/**
 * メタデータ設定
 * SEO、OGP、Twitter Cards、検索エンジン最適化のためのメタ情報
 */
export const metadata = generateRootMetadata();

/**
 * Viewport / themeColor (Next.js 15 の viewport export)
 * - themeColor: iOS Safari ステータスバー / PWA タイル色
 * - light/dark 両モード対応
 *
 * `import type { Viewport } from "next"` を使うと eslint import/order が
 * `next` (bare) と他の external の並び順 + group 分離で恒久的に衝突するため、
 * inline 型注釈 (`satisfies import("next").Viewport`) で代替する。
 */
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
} satisfies import("next").Viewport;

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
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/*
         * 地図タイル CDN (cartocdn) への preconnect / dns-prefetch は 2026-08-05 に削除した。
         * タイル URL は getInitialMapTileUrls が返す同一 origin の /tiles/* で、ブラウザは
         * cartocdn へ接続しない。2026-08-05 の trace でも接続実績が無く、hint は全ページで
         * 未使用のまま接続予約だけを消費していた。fallback 経路を復活させる場合は、
         * 実際に cartocdn を叩く実装とセットで戻すこと。
         */}
        {/* R2 storage への preconnect（ブログ記事内の SVG/PNG） */}
        <link
          rel="preconnect"
          href="https://storage.stats47.jp"
          crossOrigin="anonymous"
        />
        {ADSENSE_DISPLAY_ENABLED && (
          <>
            {/* Google AdSense への preconnect（広告スクリプトの TLS/DNS 事前確立） */}
            <link
              rel="preconnect"
              href="https://pagead2.googlesyndication.com"
              crossOrigin="anonymous"
            />
            <link rel="dns-prefetch" href="https://pagead2.googlesyndication.com" />
          </>
        )}
      </head>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        <TopLoaderWrapper />
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
        {/* Google AdSense スクリプト（全体停止時はclient component自体を生成しない） */}
        {ADSENSE_DISPLAY_ENABLED && <AdSenseScript />}
        {/* A8.net リンクマネージャー（通常リンクをアフィリエイトリンクに自動変換） */}
        <A8LinkManager />
        {/* ページビュートラッカー（ルート変更を検知して自動トラッキング） */}
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
        {/* テーマプロバイダー（ダークモード対応） */}
        <ThemeProvider>
          {/* メインレイアウトコンテナ */}
          <div className="relative flex min-h-screen flex-col" suppressHydrationWarning>
            <a
              href="#main-content"
              className="sr-only z-50 bg-background px-4 py-2 text-foreground focus:not-sr-only focus:absolute focus:left-2 focus:top-2"
            >
              本文へスキップ
            </a>
            {/* ヘッダー（全ページ共通・カテゴリメガメニュー内蔵） */}
            <Header />
            {/* メインコンテンツエリア（各ページが PageShell で幅を制御） */}
            <main id="main-content" className="min-w-0 flex-1" tabIndex={-1}>
              {children}
            </main>
            {/* フッター（全ページ共通） */}
            <Footer />
          </div>
          {/* モバイル専用ナビゲーションドロワー（PC では描画しない） */}
          <Suspense fallback={null}>
            <MobileNavDrawer />
          </Suspense>
          {/* トースト通知（成功、エラー、警告などの通知を表示） */}
          <Toaster position="top-right" richColors />
          {/* Cookie 同意バナー */}
          <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
