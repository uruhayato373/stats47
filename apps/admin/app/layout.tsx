import { CloseSidebarOnNavigate } from "@/components/close-sidebar-on-navigate";
import { ConsoleSidebar } from "@/components/console-nav";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import { Suspense } from "react";

import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import Script from "next/script";

import "./globals.css";

export const metadata: Metadata = {
  title: "stats47 管理コンソール",
  description:
    "コンテンツ・SNS・画像資産・調査・収益・品質・CI/台帳・TODO の横断管理 (ローカル専用)",
};

/**
 * 描画前に .dark を確定させる (これが無いと初回描画でライトが一瞬出る = FOUC)。
 *
 * 既定はライト。OS 設定には追従しない — 「基本はライトモード」という運用方針を
 * 明示選択が無いときの既定として素直に表現する (追従させると OS がダークの人には
 * 既定がダークになり方針と食い違う)。
 */
const THEME_INIT = `(function(){try{var t=localStorage.getItem('stats47-console-theme');document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* 素の <script> を JSX に置くと React が警告を出すため next/script で head へ入れる
            (beforeInteractive なので実行は hydration 前 = 同じタイミング)。 */}
        <Script id="console-theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
      </head>
      <body>
        {/* 見本 (shadcndashboard.dev) と同じ外枠: inset のサイドバー + 角の無い 1px 枠の本文 + sticky の上部バー + p-4 の本文 */}
        <SidebarProvider className="[--header-height:calc(var(--spacing)*12)]">
          <CloseSidebarOnNavigate />
          <ConsoleSidebar />
          <SidebarInset className="min-w-0 outline outline-border md:peer-data-[variant=inset]:rounded-none md:peer-data-[variant=inset]:shadow-none">
            <Suspense fallback={<div className="h-(--header-height) border-b" aria-hidden="true" />}>
              <SiteHeader />
            </Suspense>
            <div className="@container/main flex min-w-0 flex-1 flex-col overflow-x-hidden wrap-break-word">
              <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-4 p-4">{children}</div>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </body>
    </html>
  );
}
