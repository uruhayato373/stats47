import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Noto_Sans_JP } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";

import { SidebarWrapper } from "@/components/organisms/layout/Sidebar";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { SidebarProvider } from "@/components/atoms/ui/sidebar";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/atoms/ui/resizable";
import Header from "@/components/organisms/layout/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const notoSansJP = Noto_Sans_JP({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: true,
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CMS Dashboard",
  description:
    "A modern CMS dashboard for managing posts, members, and site content with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${inter.variable} ${notoSansJP.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className={`${inter.className} bg-gray-100 dark:bg-neutral-900 antialiased h-full`}
      >
        <ThemeProvider>
          <SessionProvider>
            <SidebarProvider>
              <div className="flex flex-col h-full w-full">
                {/* Header - 固定配置 */}
                <Header />
                
                {/* Resizable Area - ヘッダーの下 */}
                <ResizablePanelGroup 
                  direction="horizontal" 
                  className="flex-1 w-full"
                  style={{ height: 'calc(100vh - var(--header-height))' }}
                >
                  {/* Sidebar Panel */}
                  <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                    <div className="h-full overflow-y-auto">
                      <SidebarWrapper />
                    </div>
                  </ResizablePanel>
                  
                  {/* Resizable Handle - ハンドルアイコン非表示 */}
                  <ResizableHandle />
                  
                  {/* Main Content Panel */}
                  <ResizablePanel defaultSize={80}>
                    <main className="h-full overflow-y-auto">
                      {children}
                    </main>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </div>
            </SidebarProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
