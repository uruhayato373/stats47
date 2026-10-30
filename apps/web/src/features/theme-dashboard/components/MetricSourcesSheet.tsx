'use client';

import { buttonVariants } from '@stats47/components';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@stats47/components/atoms/ui/sheet';
import { hrefFor } from '@stats47/data-configs/content/href';
import { BookOpenText, ChartNoAxesColumnIncreasing, ExternalLink } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';

import type { MetricKpi } from './metric-kpi';

/**
 * テーマの指標カードの出典と指標の定義 (2026-10-29)。数値タイルごとに出していた「出典・ランキング」の行をやめ、
 * チャートの下のボタン 1 つにまとめる。押すと右から Sheet が開き、指標ごとに出典 (調査) とランキング (指標の定義) へのリンクを並べる。
 * Sheet はテーマの切り替え (ThemeSwitcher) と同じテンプレートの部品。
 * 指標が 1 つの数値タイルは、開き口をタイルの右上の枠なしのアイコンにする (trigger="icon"。2026-10-30)。
 */
export function MetricSourcesSheet({
  metrics,
  labels,
  trigger = 'button',
}: {
  metrics: readonly MetricKpi[];
  /** rankingKey → 短い名前 (無ければ title) */
  labels: Record<string, string>;
  /** 開き口。button = 文字付きのボタン (チャートの下)、icon = 本のアイコンだけ (数値タイルの右上) */
  trigger?: 'button' | 'icon';
}) {
  if (metrics.length === 0) return null;
  return (
    <Sheet>
      {trigger === 'icon' ? (
        <SheetTrigger
          aria-label="出典・指標の定義"
          title="出典・指標の定義"
          className={buttonVariants({ variant: 'ghost', size: 'icon-sm', className: 'text-muted-foreground' })}
        >
          <BookOpenText aria-hidden="true" />
        </SheetTrigger>
      ) : (
        <SheetTrigger className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'text-muted-foreground' })}>
          <BookOpenText aria-hidden="true" />
          出典・指標の定義
        </SheetTrigger>
      )}
      {/* サイトの上端のヘッダー (sticky・z-200) と Cookie 同意 (z-[1100]) より前に出す。Sheet の既定は z-50 */}
      <SheetContent side="right" className="z-[1200]! overflow-y-auto">
        <SheetHeader>
          <SheetTitle>出典・指標の定義</SheetTitle>
          <SheetDescription>指標ごとの出典と、定義・都道府県ランキングへのリンクです。</SheetDescription>
        </SheetHeader>
        <ul className="flex flex-col divide-y divide-border px-4 pb-6">
          {metrics.map((metric) => {
            const sources = sourcesOf(metric);
            return (
              <li key={metric.metricKey} className="flex flex-col gap-2 py-3">
                <p className="text-sm font-medium text-foreground">{labels[metric.metricKey] ?? metric.title}</p>
                {sources.map((source) => (
                  <SourceRow key={source.url ?? source.label} label={source.label} url={source.url} />
                ))}
                <Link
                  href={hrefFor('ranking', { rankingKey: metric.metricKey })}
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
                >
                  <ChartNoAxesColumnIncreasing aria-hidden="true" className="size-4 shrink-0" />
                  指標の定義・ランキングを見る
                </Link>
              </li>
            );
          })}
        </ul>
      </SheetContent>
    </Sheet>
  );
}

/** 調査ハブ (sourceLinks) を優先し、無ければ出典名とそのリンク */
function sourcesOf(metric: MetricKpi): Array<{ label: string; url?: string }> {
  if (metric.sourceLinks?.length) return metric.sourceLinks;
  if (metric.sourceName) return [{ label: metric.sourceName, url: metric.sourceLink }];
  return [];
}

function SourceRow({ label, url }: { label: string; url?: string }) {
  const className =
    'inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-primary hover:underline';
  const content = (
    <>
      <BookOpenText aria-hidden="true" className="size-4 shrink-0" />
      <span>出典: {label}</span>
    </>
  );
  if (!url) return <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">{content}</p>;
  return /^https?:\/\//.test(url) ? (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      {content}
      <ExternalLink aria-hidden="true" className="size-3 shrink-0" />
    </a>
  ) : (
    <Link href={url} className={className}>
      {content}
    </Link>
  );
}
