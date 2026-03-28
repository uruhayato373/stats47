import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";

import { loadPageComponents } from "@/features/stat-charts/server";

import { ThemeDashboardClient } from "./ThemeDashboardClient";

import type { ThemePageData } from "../lib/load-theme-data";
import type { ThemeConfig } from "../types";

interface Props {
  theme: ThemeConfig;
  data: ThemePageData;
}

/**
 * テーマダッシュボードの共通レイアウト
 *
 * Breadcrumb + ヘッダー + ThemeDashboardClient を配置。
 * chart_definitions から DB 管理チャートを取得してクライアントに渡す。
 */
export async function ThemePageLayout({ theme, data }: Props) {
  const pageCharts = await loadPageComponents("theme", theme.themeKey);
  return (
    <div className="container mx-auto px-4 py-4 text-foreground">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">ホーム</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{theme.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-lg font-bold">{theme.title}</h1>
      </div>

      <ThemeDashboardClient
        themeConfig={theme}
        indicatorDataMap={data.indicatorDataMap}
        topology={data.topology}
        pageCharts={pageCharts}
      />
    </div>
  );
}
