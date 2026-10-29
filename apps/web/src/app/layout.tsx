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
 *
 * アーキテクチャ:
 * - Next.js 15 App Router のレイアウト機能を使用
 * - サーバーコンポーネントとして実装
 * - フォント最適化（next/font/google）
 * - メタデータはNext.jsのMetadata APIを使用
 *
 * レイアウト構造 (テンプレート shadcndashboard の dashboard-layout に寄せた・2026-10-27):
 * - SidebarProvider の中に AppSidebar と SidebarInset を兄弟で置く (sidebar.tsx の DOM 前提)
 * - SidebarInset の中に SiteHeader・ページで唯一の main#main-content (p-4)・Footer を並べる
 * - ヘッダーとフッターをルートに置くので、画面遷移で再マウントされない
 * - SidebarProvider の defaultOpen は true 固定。開閉状態を cookies() で読まない (SSG 維持)
 * - SidebarInset は overflow-hidden ではなく overflow-clip にする (sticky ヘッダーと右レールの追従を壊さない)
 * - AppSidebar は variant="inset"。SidebarInset はテンプレートの layout.tsx と同じ outline + m-2 + 角丸なしにする
 * - Cookie 同意は SidebarInset の最後の子に置く画面下端の帯 (sticky bottom-0)。流れの中に高さを持つので、
 *   ページの末尾が帯に隠れない
 * - サイドバー部品と AdSenseScript は sidebar-shell.tsx (1 つの client モジュール) から import する
 * - トースト通知 (Toaster) は置かない。toast() の呼び出しが 0 件で、全ページの JS を増やすだけだった
 */

import { Suspense } from "react";

import "./globals.css";

import { AppSidebar } from "@/components/organisms/AppSidebar";
import {
  AdSenseScript,
  SidebarInset,
  SidebarProvider,
} from "@/components/organisms/AppSidebar/sidebar-shell";
import { Footer } from "@/components/organisms/Footer/Footer";
import { SiteHeader } from "@/components/organisms/SiteHeader/SiteHeader";

import { A8LinkManager } from "@/lib/a8net/A8LinkManager";
import { CookieConsentBanner } from "@/lib/analytics/components/CookieConsentBanner";
import { NavClickTracker } from "@/lib/analytics/components/NavClickTracker";
import { PageViewTracker } from "@/lib/analytics/components/PageViewTracker";
import { ReadProgressTracker } from "@/lib/analytics/components/ReadProgressTracker";
import { GoogleAnalytics } from "@/lib/analytics/GoogleAnalytics";
import { getRequiredBaseUrl } from "@/lib/env";
import { AD_FREE_PATH_PREFIXES } from "@/lib/google-adsense/ad-free-paths";
import { ADSENSE_DISPLAY_ENABLED } from "@/lib/google-adsense/constants";
import { generateRootMetadata } from "@/lib/metadata/root-metadata";
import { TopLoaderWrapper } from "@/lib/next-top-loader/TopLoaderWrapper";
import { generateWebSiteStructuredDataScripts } from "@/lib/structured-data/scripts";

import { R2_PUBLIC_BASE_URL } from "@/config/site";

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
    // style-lyra: テンプレートと同じルートのクラス。lyra の見た目は部品の className に書き込んであり、このクラスには依存しない (2026-10-28 CSS-3)
    <html lang="ja" className="style-lyra" suppressHydrationWarning>
      <head>
        {/*
         * 地図タイルへの preconnect は全ページには置かない。地図のあるランキングページは
         * getInitialMapTileUrls の preload が地理院タイル (cyberjapandata.gsi.go.jp) への
         * 接続を document 解析時に始める。旧 cartocdn の hint は 2026-08-05 に削除済み。
         */}
        {/* R2 storage への preconnect（ブログ記事内の SVG/PNG） */}
        <link
          rel="preconnect"
          href={R2_PUBLIC_BASE_URL}
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
        className="google-anno-skip antialiased"
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
        {ADSENSE_DISPLAY_ENABLED && <AdSenseScript adFreePathPrefixes={AD_FREE_PATH_PREFIXES} />}
        {/* A8.net リンクマネージャー（通常リンクをアフィリエイトリンクに自動変換） */}
        <A8LinkManager />
        {/* ページビュートラッカー（ルート変更を検知して自動トラッキング） */}
        <Suspense fallback={null}>
          <PageViewTracker />
          <NavClickTracker />
          <ReadProgressTracker />
        </Suspense>
        {/* テーマプロバイダー（ダークモード対応） */}
        <ThemeProvider>
          <a
            href="#main-content"
            className="sr-only z-300 bg-background px-4 py-2 text-foreground focus:not-sr-only focus:fixed focus:left-2 focus:top-2"
          >
            本文へスキップ
          </a>
          {/* サイドバー型の骨組み (lg 未満では AppSidebar が Sheet に替わる) */}
          <SidebarProvider defaultOpen>
            <AppSidebar />
            <SidebarInset className="m-2 min-w-0 overflow-clip rounded-none! outline outline-border">
              {/* ヘッダー（全ページ共通） */}
              <SiteHeader />
              {/* メインコンテンツエリア（ページで唯一の main。各ページが PageShell で幅を制御） */}
              <main id="main-content" className="min-w-0 flex-1 p-4" tabIndex={-1}>
                {children}
              </main>
              {/* フッター（全ページ共通） */}
              <Footer />
              {/* Cookie 同意の帯 (画面下端に留まり、SidebarInset の幅だけを覆う) */}
              <CookieConsentBanner />
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
