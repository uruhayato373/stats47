import type { Metadata } from "next";

export const metadata: Metadata = {
  description: "都道府県ランキング・ダッシュボード・地域の特徴を横断検索できます。",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
