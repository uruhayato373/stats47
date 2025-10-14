import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { JotaiProvider } from "@/providers/JotaiProvider";
import { SessionProvider } from "next-auth/react";
import ThemeInitializer from "@/components/ThemeInitializer";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
// import { ThemeProvider } from "@/contexts/ThemeContext"; // 無効化: Jotai版テーマシステムに統一

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
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
    <html lang="en" className="relative min-h-full">
      <body
        className={`${inter.variable} font-sans bg-gray-100 dark:bg-neutral-900 antialiased`}
      >
        <JotaiProvider>
          <SessionProvider>
            <ThemeInitializer />
            <Header />
            <Sidebar />
            <main className="lg:ps-60 pt-16">{children}</main>
          </SessionProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
