import { ChartPanel } from '@stats47/components';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { hrefFor } from '@stats47/data-configs/content/href';
import { formatUnitForDisplay } from '@stats47/data-configs/unit';

import Link from '@/components/atoms/SiteLink';
import { SourcesSheet } from '@/components/charts/SourcesSheet';

import { metricSourceGroups } from '../lib/metric-source-groups';

import { formatMetricValue, type MetricKpi } from './metric-kpi';

interface MetricTableProps {
  id?: string;
  /** グループ名 (ThemeCatalog.metricGroups[].title) */
  title?: string;
  metrics: readonly MetricKpi[];
  /** rankingKey → 短ラベル */
  tabLabels: Record<string, string>;
  /** 選択中の都道府県コード (null = 全国のページ) */
  selectedPrefectureCode: string | null;
}

function percentDiff(value: number, base: number): string {
  const ratio = value / base - 1;
  const percent = Math.round(ratio * 100);
  return percent === 0 ? '±0%' : `${percent > 0 ? '+' : ''}${percent}%`;
}

/**
 * 項目の多いグループ (view "table") を、この地域の 1 行ずつの表で見せる (2026-11-03)。
 * 列は 項目・値・全国順位・全国の値・全国との差。全国のページは 項目・値・年。
 * 47 都道府県を並べる表ではない (比較はランキングのページ。2026-10-31 オーナー決定)。順位は表の中なので文字のまま書く (RankBadge にしない)。
 * 推移は取りに行かない (時系列が主題のものは章の図が受け持つ)。
 */
export function MetricTable({ id, title, metrics, tabLabels, selectedPrefectureCode }: MetricTableProps) {
  const isPrefecture = selectedPrefectureCode !== null;
  const rows = metrics.filter((metric) => metric.value !== null);
  if (rows.length === 0) return null;
  // 全国の値がどの行にも無い表は、全国・全国との差の列を出さない (「—」だけの列を作らない)
  const hasNational = isPrefecture && rows.some((metric) => metric.nationalValue !== undefined);
  const years = new Set(rows.map((metric) => metric.yearName));
  const singleYear = years.size === 1 ? [...years][0] : undefined;
  return (
    <ChartPanel
      id={id}
      title={title}
      description={singleYear}
      action={<SourcesSheet trigger="icon" groups={metricSourceGroups(rows, tabLabels)} />}
      contentClassName="p-0!"
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>項目</TableHead>
            <TableHead className="text-right!">値</TableHead>
            {isPrefecture && <TableHead className="text-right!">全国順位</TableHead>}
            {hasNational && <TableHead className="text-right!">全国</TableHead>}
            {hasNational && <TableHead className="text-right!">全国との差</TableHead>}
            {!singleYear && <TableHead className="text-right!">年</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((metric) => {
            const unit = metric.unit ? formatUnitForDisplay(metric.unit) : '';
            const value = metric.value as number;
            return (
              <TableRow key={metric.metricKey}>
                <TableCell>
                  <Link
                    href={hrefFor('ranking', { rankingKey: metric.metricKey })}
                    className="underline-offset-4 hover:text-primary hover:underline"
                  >
                    {tabLabels[metric.metricKey] ?? metric.title}
                  </Link>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatMetricValue(value, metric.precision)}
                  <span className="ml-0.5 text-xs text-muted-foreground">{unit}</span>
                </TableCell>
                {isPrefecture && (
                  <TableCell className="text-right tabular-nums">{metric.rank !== null ? `${metric.rank}位` : '—'}</TableCell>
                )}
                {hasNational && (
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {metric.nationalValue !== undefined ? formatMetricValue(metric.nationalValue, metric.precision) : '—'}
                  </TableCell>
                )}
                {hasNational && (
                  <TableCell className="text-right tabular-nums">
                    {metric.nationalValue ? percentDiff(value, metric.nationalValue) : '—'}
                  </TableCell>
                )}
                {!singleYear && <TableCell className="text-right tabular-nums">{metric.yearName}</TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ChartPanel>
  );
}
