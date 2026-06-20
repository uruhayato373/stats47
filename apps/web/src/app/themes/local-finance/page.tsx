import Link from "next/link";
import { notFound } from "next/navigation";

import { PageShell } from "@/components/layout";

import type { FinanceFlowData } from "@/features/finance-flow";
import {
  LocalFinanceDashboard,
  loadFinanceCards,
} from "@/features/local-finance-dashboard";
import { ALL_THEMES } from "@/features/theme-dashboard/config/all-themes";
import { ThemeSidebar } from "@/features/theme-dashboard/server";

import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

/** サイドバー用に ALL_THEMES のエントリ (テーマ一覧 + 指標) を使う */
const theme = ALL_THEMES.find((t) => t.themeKey === "local-finance");

const R2_BASE = "https://storage.stats47.jp";

// 財政フロー(R2 public URL fetch) を runtime で確実に読むため force-dynamic。
// 本ページは bespoke LocalFinanceDashboard を使い、汎用 loadThemeData は経由しない。
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  if (!theme) return {};
  const title = theme.title;
  return {
    title,
    description: theme.description,
    keywords: theme.keywords,
    alternates: { canonical: `/themes/local-finance` },
    ...generateOGMetadata({
      title,
      description: theme.description ?? "",
      imageUrl: `/themes/local-finance/opengraph-image`,
    }),
  };
}

/** 既定県 (13 東京) の財政フローを SSR で R2 公開 URL から読む */
async function loadInitialFinanceFlow(): Promise<FinanceFlowData | undefined> {
  try {
    const res = await fetch(`${R2_BASE}/app/finance-flow/13.json`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) return (await res.json()) as FinanceFlowData;
  } catch {
    // client 側 /api/flow フォールバックに任せる
  }
  return undefined;
}

export default async function LocalFinanceThemePage() {
  if (!theme) notFound();

  const cards = loadFinanceCards();
  const initialFinanceFlow = await loadInitialFinanceFlow();

  return (
    <PageShell leftRail={<ThemeSidebar theme={theme} />}>
      {/* 都道府県 / 市区町村 切替 */}
      <nav
        aria-label="表示単位切替"
        className="mb-4 inline-flex rounded-full border border-border bg-white p-1 shadow-sm text-xs"
      >
        <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground font-medium">
          都道府県
        </span>
        <Link
          href="/themes/local-finance/cities"
          className="px-3 py-1 rounded-full text-muted-foreground hover:text-foreground transition-colors"
        >
          市区町村
        </Link>
      </nav>
      <LocalFinanceDashboard cards={cards} initialFinanceFlow={initialFinanceFlow} />
    </PageShell>
  );
}
