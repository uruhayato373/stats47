import Link from "next/link";

import { PageShell } from "@/components/layout";

import type { FinanceFlowData } from "@/features/finance-flow";
import {
  LocalFinanceDashboard,
  loadFinanceCards,
} from "@/features/local-finance-dashboard";
import { LOCAL_FINANCE_THEME } from "@/features/theme-dashboard/server";


import { generateOGMetadata } from "@/lib/metadata/og-generator";

import type { Metadata } from "next";

const theme = LOCAL_FINANCE_THEME;

const R2_BASE = "https://storage.stats47.jp";

export function generateMetadata(): Metadata {
  const title = `${theme.title}`;
  return {
    title,
    description: theme.description,
    keywords: theme.keywords,
    alternates: { canonical: `/themes/${theme.themeKey}` },
    ...generateOGMetadata({ title, description: theme.description, imageUrl: `/themes/${theme.themeKey}/opengraph-image` }),
  };
}

/** 既定県 (13 東京) の財政フローを SSR で R2 から読む */
async function loadInitialFinanceFlow(): Promise<FinanceFlowData | undefined> {
  try {
    const res = await fetch(`${R2_BASE}/app/finance-flow/13.json`, { next: { revalidate: 86400 } });
    if (res.ok) return (await res.json()) as FinanceFlowData;
  } catch {
    // client 側 /api/flow フォールバックに任せる
  }
  return undefined;
}

export default async function LocalFinanceThemePage() {
  const cards = loadFinanceCards();
  const initialFinanceFlow = await loadInitialFinanceFlow();

  return (
    <div>
      {/* 都道府県 / 市区町村 切替 */}
      <PageShell className="pb-0">
        <nav
          aria-label="表示単位切替"
          className="inline-flex rounded-full border border-border bg-white p-1 shadow-sm text-xs"
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
      </PageShell>
      <LocalFinanceDashboard cards={cards} initialFinanceFlow={initialFinanceFlow} />
    </div>
  );
}
