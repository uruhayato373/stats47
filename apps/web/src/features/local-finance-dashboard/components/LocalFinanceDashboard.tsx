"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";

import { useFlowData } from "@/components/charts/useFlowData";

import { FinanceSankey } from "@/features/finance-flow/components/FinanceSankey";
import type { FinanceFlowData } from "@/features/finance-flow/lib/types";
import { PREFECTURES } from "@/features/migration-flow/lib/prefectures";

import { MiniBarChart, MiniLineChart, type ChartPoint } from "./MiniCharts";

import type { FinanceTrendData, FinanceMetricMeta } from "../lib/load-finance-trends";

interface Props {
  trends: FinanceTrendData;
  /** 既定県 (13 東京) の財政フロー: SSR 初期表示 + 総額カード */
  initialFinanceFlow?: FinanceFlowData;
}

const VALID_CODES = new Set(PREFECTURES.map((p) => p.code));

/** 千円 → 億円/兆円 */
function yen(thousandYen: number): string {
  const oku = thousandYen / 100000;
  if (Math.abs(oku) >= 10000) return `${(oku / 10000).toFixed(1)} 兆円`;
  return `${Math.round(oku).toLocaleString("ja-JP")} 億円`;
}

/** メトリクスの最新生値を表示文字列に整形 */
function formatValue(meta: FinanceMetricMeta, rawValue: number): string {
  const scaled = rawValue * meta.scale;
  if (meta.unit === "億円") return `${Math.round(scaled).toLocaleString("ja-JP")} 億円`;
  return `${scaled.toFixed(meta.decimals)}${meta.unit}`;
}

interface MetricCardProps {
  meta: FinanceMetricMeta;
  trends: FinanceTrendData;
  prefCode: string;
}

function MetricCard({ meta, trends, prefCode }: MetricCardProps) {
  const raw = trends.series[meta.key]?.[prefCode] ?? [];
  if (raw.length === 0) return null;
  const latest = raw[raw.length - 1];
  const points: ChartPoint[] = raw.map((p) => ({ year: p.year, value: p.value * meta.scale }));
  const avg: ChartPoint[] | undefined = meta.showAverage
    ? raw
        .map((p) => {
          const a = trends.nationalAvg[meta.key]?.[p.year];
          return a == null ? null : { year: p.year, value: a * meta.scale };
        })
        .filter((p): p is ChartPoint => p !== null)
    : undefined;

  return (
    <div className="border border-border bg-white p-3 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-slate-600">{meta.label}</span>
        <span className="text-xl font-bold text-slate-900">{formatValue(meta, latest.value)}</span>
      </div>
      <div className="mt-1">
        {meta.chartType === "bar" ? (
          <MiniBarChart points={points} />
        ) : (
          <MiniLineChart points={points} average={avg} />
        )}
      </div>
      <div className="mt-0.5 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>{latest.year}年度・全国 {latest.rank} 位</span>
        {meta.showAverage && <span className="flex items-center gap-1"><span className="inline-block h-px w-3 border-t border-dashed border-slate-400" />全国平均</span>}
      </div>
    </div>
  );
}

function TotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-white/20 py-1.5 last:border-0">
      <span className="text-xs opacity-90">{label}</span>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

export function LocalFinanceDashboard({ trends, initialFinanceFlow }: Props) {
  const [prefCode, setPrefCode] = useState(initialFinanceFlow?.focusCode ?? "13");

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("pref");
    if (param && VALID_CODES.has(param)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefCode(param);
    }
  }, []);

  const handleChange = (code: string) => {
    setPrefCode(code);
    const url = new URL(window.location.href);
    url.searchParams.set("pref", code);
    window.history.replaceState(null, "", url);
  };

  const { data: flow } = useFlowData<FinanceFlowData>("finance", prefCode, initialFinanceFlow);

  const prefName = useMemo(
    () => PREFECTURES.find((p) => p.code === prefCode)?.name ?? "",
    [prefCode],
  );

  return (
    <div className="container mx-auto px-4 py-6">
      {/* ヘッダー (タイトル + スライサー) */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            地方財政｜財政状況
            <span className="ml-2 text-base font-normal text-muted-foreground">{trends.latestYear}年度</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            出典: 総務省「地方財政状況調査・社会人口統計体系」（Japan Dashboard 互換・都道府県版）
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">都道府県</span>
          <Select value={prefCode} onValueChange={handleChange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PREFECTURES.map((p) => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Page 1: 財政状況 — 上段: 総額サマリ + 三キーチャート */}
      <section className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {/* 総額サマリカード */}
          <div className="border border-border bg-primary p-4 text-primary-foreground shadow-sm">
            <div className="text-base font-bold">{prefName}</div>
            <div className="mt-2">
              <TotalRow label="歳入総額" value={flow ? yen(flow.totals.revenue) : "—"} />
              <TotalRow label="歳出総額" value={flow ? yen(flow.totals.expenditure) : "—"} />
              <TotalRow
                label="実質収支（歳入−歳出）"
                value={flow ? yen(flow.totals.revenue - flow.totals.expenditure) : "—"}
              />
            </div>
            <div className="mt-2 text-[10px] opacity-80">{flow?.year ?? trends.latestYear}年度</div>
          </div>

          {/* 三キーチャート */}
          {trends.topMetrics.map((meta) => (
            <MetricCard key={meta.key} meta={meta} trends={trends} prefCode={prefCode} />
          ))}
        </div>
      </section>

      {/* Page 1 下段: 財政指標 4 折れ線 */}
      <section className="mb-10">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {trends.ratioMetrics.map((meta) => (
            <MetricCard key={meta.key} meta={meta} trends={trends} prefCode={prefCode} />
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ※ 実線=当該都道府県、破線=全国平均（類似団体平均は stats47 では未保有のため全国平均で代替）。
          積立金・地方債現在高は社会人口統計体系の取得年のみ表示。
        </p>
      </section>

      {/* Page 2: 歳入歳出の構成比 (Sankey) */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">歳入歳出の構成比</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          歳入の財源（地方税・地方交付税・国庫支出金・地方債など）が一般会計を通じて
          目的別歳出（民生費・教育費・土木費など）へ流れる様子をフロー図で表します。
        </p>
        <FinanceSankey code={prefCode} initialData={initialFinanceFlow} />
      </section>
    </div>
  );
}
