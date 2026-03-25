import type { Metadata } from "next";

import Link from "next/link";

import { ALL_THEMES } from "@/features/theme-dashboard/server";
import { generateOGMetadata } from "@/lib/metadata/og-generator";

export const revalidate = 86400;

export function generateMetadata(): Metadata {
  const title = "テーマダッシュボード一覧 - 統計で見る都道府県";
  const description =
    "少子高齢化・労働・医療・観光・物価・外国人など、テーマ別に都道府県の統計データをダッシュボードで比較分析";
  return {
    title,
    description,
    alternates: { canonical: "/themes" },
    ...generateOGMetadata({ title, description, imageUrl: "/og-image.jpg" }),
  };
}

export default function ThemesPage() {
  return (
    <div className="container mx-auto px-4 py-4 text-foreground">
      <h1 className="text-lg font-bold">テーマダッシュボード</h1>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        テーマ別に複数の指標を横断して都道府県を比較できます
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ALL_THEMES.map((theme) => (
          <Link
            key={theme.themeKey}
            href={`/themes/${theme.themeKey}`}
            className="block rounded-lg border bg-card p-4 shadow-sm transition-colors hover:bg-accent/50 hover:shadow-md"
          >
            <h2 className="text-base font-semibold text-foreground">
              {theme.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
              {theme.description}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {theme.rankingKeys.length} 指標
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
