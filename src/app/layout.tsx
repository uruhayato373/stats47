import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { JotaiProvider } from "@/providers/JotaiProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import ThemeInitializer from "@/components/ThemeInitializer";
import Header from "@/components/layout/Header";
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
          <AuthProvider>
            <ThemeInitializer />
            <Header />
            {children}
          </AuthProvider>
        </JotaiProvider>
      </body>
    </html>
  );
}
