import { ConsoleNav } from "@/components/console-nav";

import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "stats47 統合メディアコンソール",
  description: "SNS 投稿・画像資産・SVG カタログ・プロジェクト現況の横断管理",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <ConsoleNav />
        <main className="mx-auto max-w-[1400px] px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
