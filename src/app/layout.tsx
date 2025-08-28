import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "地域統計ダッシュボード | e-Stat API による地域統計データ",
  description: "e-Stat APIを使用して日本の地域統計データを可視化するWebアプリケーションです。地域別の人口、GDP、失業率などの統計情報をグラフやチャートで表示します。",
  keywords: "統計, 地域統計, e-Stat, ダッシュボード, 人口, GDP, 失業率, 日本",
  authors: [{ name: "地域統計ダッシュボードチーム" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
