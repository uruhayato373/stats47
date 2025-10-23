import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Noto_Sans_JP } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/organisms/layout/Header";
import { SidebarWrapper } from "@/components/organisms/layout/Sidebar";
import { ThemeProvider } from "@/lib/providers/theme-provider";
import { SidebarProvider } from "@/components/atoms/ui/sidebar";

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
      className={`${inter.variable} ${notoSansJP.variable} ${geistMono.variable} relative min-h-full`}
      suppressHydrationWarning
    >
      <body
        className={`${inter.className} bg-gray-100 dark:bg-neutral-900 antialiased`}
      >
        <ThemeProvider>
          <SessionProvider>
            <SidebarProvider>
              <SidebarWrapper />
              <main className="lg:ps-60">
                <Header />
                <div className="pt-16">{children}</div>
              </main>
            </SidebarProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
