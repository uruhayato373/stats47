import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import { Geist_Mono, Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

import Header from "@/components/organisms/layout/Header";
import { SidebarWrapper } from "@/components/organisms/layout/Sidebar";
import { ThemeProvider } from "@/lib/providers/theme-provider";

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
      className={`${inter.variable} ${notoSansJP.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
      <body
        className={`${inter.className} bg-gray-100 dark:bg-neutral-900 antialiased`}
      >
        <ThemeProvider>
          <SessionProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <div className="flex flex-1">
                <SidebarWrapper />
                <main className="flex-1 overflow-y-auto p-4">{children}</main>
              </div>
            </div>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
