"use client";

import Link from "next/link";

import { ExternalLink } from "lucide-react";


import { isLinkableSurveyId } from "@/components/molecules/SourceAttribution";

import { trackNavClick, type NavSurface } from "@/lib/analytics/events";

import type { DataSourceEntry, DataSourceLink } from "@stats47/data-configs/data-source";

interface DataSourceListProps {
  sources: readonly DataSourceEntry[];
  surface: Extract<
    NavSurface,
    "blog_source" | "ranking_source" | "municipality_source" | "geo_source"
  >;
  className?: string;
}

const ESTAT_TABLE_PREFIX = "https://www.e-stat.go.jp/dbview";

function tableText(table: DataSourceLink, index: number, total: number): string {
  const base = table.url.startsWith(ESTAT_TABLE_PREFIX) ? "統計表" : "資料";
  return total > 1 ? `${base}${index + 1}` : base;
}

function ExternalAnchor({
  href,
  label,
  surface,
  className,
  children,
}: {
  href: string;
  label: string;
  surface: DataSourceListProps["surface"];
  className: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={label}
      aria-label={`${label}（新しいタブで開く）`}
      className={className}
      onClick={() => trackNavClick({ label, href, surface })}
    >
      {children}
    </a>
  );
}

function SourceName({
  entry,
  surface,
}: {
  entry: DataSourceEntry;
  surface: DataSourceListProps["surface"];
}) {
  const nameClass = "font-medium text-foreground underline-offset-2 hover:text-primary hover:underline";
  if (entry.surveyId && isLinkableSurveyId(entry.surveyId)) {
    const href = `/survey/${entry.surveyId}`;
    return (
      <Link
        href={href}
        className={nameClass}
        onClick={() => trackNavClick({ label: entry.surveyId ?? entry.label, href, surface })}
      >
        {entry.label}
      </Link>
    );
  }
  if (entry.url) {
    return (
      <ExternalAnchor href={entry.url} label={entry.label} surface={surface} className={nameClass}>
        {entry.label}
      </ExternalAnchor>
    );
  }
  return <span className="font-medium text-foreground">{entry.label}</span>;
}

/**
 * ページ末尾の「データ出典」。サイト全体でこの部品だけが出典の一覧を描画する。
 *
 * 1 行 = 調査 (サイト内の調査ページへ) + 機関 + [統計表 ↗] (e-Stat 等の実データ表)。
 * 行はデータ (`DataSourceEntry`) から派生させ、画面側で出典の文字列を組み立てない。
 * 図ごとの出典は `ChartFooter`、調査ハブへの回遊は右レールの `SurveyTaxonomyCard` が担う。
 * 正典: `docs/01_技術設計/04_デザインシステム.md`「データ出典」
 */
export function DataSourceList({ sources, surface, className }: DataSourceListProps) {
  if (sources.length === 0) return null;
  return (
    <section
      aria-labelledby={`${surface}-heading`}
      data-testid="data-source-section"
      className={`not-prose mt-10 border-t border-border pt-6 ${className ?? ""}`}
    >
      <h2 id={`${surface}-heading`} className="text-base font-bold text-foreground">
        データ出典
      </h2>
      <ul className="mt-3 space-y-2">
        {sources.map((entry) => (
          <li
            key={entry.surveyId ?? `${entry.label}::${entry.url ?? ""}`}
            className="break-words text-sm leading-6 text-muted-foreground"
          >
            {entry.note && (
              <span className="mr-1.5 text-xs text-muted-foreground">{entry.note}:</span>
            )}
            <SourceName entry={entry} surface={surface} />
            {entry.organization && <span>（{entry.organization}）</span>}
            {entry.tables.map((table, index) => (
              <ExternalAnchor
                key={table.url}
                href={table.url}
                label={table.label}
                surface={surface}
                className="ml-2 inline-flex items-center gap-0.5 whitespace-nowrap text-xs text-primary underline-offset-2 hover:underline"
              >
                {tableText(table, index, entry.tables.length)}
                <ExternalLink className="h-3 w-3" aria-hidden />
              </ExternalAnchor>
            ))}
            {entry.license && (
              <span className="ml-2 whitespace-nowrap text-xs">ライセンス: {entry.license}</span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
