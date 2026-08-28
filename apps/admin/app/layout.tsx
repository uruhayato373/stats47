import { ConsoleSidebar } from "@/components/console-nav";

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
    <html lang="ja" suppressHydrationWarning>
      <head>
        {/* 素の <script> を JSX に置くと React が警告を出すため next/script で head へ入れる
            (beforeInteractive なので実行は hydration 前 = 同じタイミング)。 */}
        <Script id="console-theme-init" strategy="beforeInteractive">
          {THEME_INIT}
        </Script>
      </head>
      <body>
        <div className="flex min-h-screen">
          <ConsoleSidebar />
          <main className="min-w-0 flex-1 overflow-x-hidden break-words px-3 py-5 sm:px-6 sm:py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
