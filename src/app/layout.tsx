import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { JotaiProvider } from "@/lib/providers";
// import { SessionProvider } from "next-auth/react"; // 無効化: Auth.js機能を一時的に無効化
import { Header } from "@/components/organisms/layout/Header";
import { Sidebar } from "@/components/organisms/layout/Sidebar";

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
          <Header />
          <Sidebar />
          <main className="lg:ps-60 pt-16">{children}</main>
        </JotaiProvider>
      </body>
    </html>
  );
}
