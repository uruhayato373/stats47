"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

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

import {
  MiniBarChart,
  MiniLineChart,
  MiniStackedBarChart,
  type ChartPoint,
  type StackPoint,
} from "./MiniCharts";

import type { FinanceCardsData, YearRecord } from "../lib/load-finance-cards";

interface Props {
  cards: FinanceCardsData;
  initialFinanceFlow?: FinanceFlowData;
}

const VALID_CODES = new Set(PREFECTURES.map((p) => p.code));
const OKU = 1 / 100000; // 千円 → 億円

/** 積立金内訳の色 (財政調整 / 減債 / その他特定目的) */
const FUND_COLORS = ["#2563eb", "#38bdf8", "#bae6fd"];

function oku(thousandYen: number): string {
  const v = thousandYen * OKU;
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)} 兆円`;
  return `${Math.round(v).toLocaleString("ja-JP")} 億円`;
}

interface RatioMeta {
  key: keyof YearRecord;
  label: string;
  unit: string;
  decimals: number;
}

const RATIO_METRICS: RatioMeta[] = [
  { key: "fiscalIndex", label: "財政力指数", unit: "", decimals: 2 },
  { key: "currentBalanceRatio", label: "経常収支比率", unit: "%", decimals: 1 },
  { key: "debtServiceRatio", label: "実質公債費比率", unit: "%", decimals: 1 },
  { key: "futureBurdenRatio", label: "将来負担比率", unit: "%", decimals: 1 },
];

interface CardFrameProps {
  label: string;
  value: string;
  children: ReactNode;
  footer?: ReactNode;
}

function CardFrame({ label, value, children, footer }: CardFrameProps) {
  return (
    <div className="border border-border bg-white p-3 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-xl font-bold text-slate-900">{value}</span>
      </div>
      <div className="mt-1">{children}</div>
      {footer && (
        <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">{footer}</div>
      )}
    </div>
  );
}

const avgLegend = (
  <span className="flex items-center gap-1">
    <span className="inline-block h-px w-3 border-t border-dashed border-slate-400" />
    全国平均
  </span>
);

export function LocalFinanceDashboard({ cards, initialFinanceFlow }: Props) {
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

  const { years, averages, latestYear } = cards;
  const card = cards.cards[prefCode];
  const prefName = useMemo(
    () => card?.name ?? PREFECTURES.find((p) => p.code === prefCode)?.name ?? "",
    [card, prefCode],
  );

  const recFor = (year: number): YearRecord | undefined => card?.years[String(year)];
  const latest = recFor(latestYear);

  // 折れ線/棒の系列ビルダ
  const lineSeries = (key: keyof YearRecord, scale: number): ChartPoint[] =>
    years.flatMap((y) => {
      const r = recFor(y);
      return r ? [{ year: y, value: r[key] * scale }] : [];
    });
  const avgSeries = (key: keyof YearRecord, scale: number): ChartPoint[] =>
    years.flatMap((y) => (averages[y] ? [{ year: y, value: averages[y][key] * scale }] : []));

  const fundStacks: StackPoint[] = years.flatMap((y) => {
    const r = recFor(y);
    return r ? [{ year: y, segments: [r.fundAdjust * OKU, r.fundRedemption * OKU, r.fundOther * OKU] }] : [];
  });
  const fundTotalLatest = latest ? (latest.fundAdjust + latest.fundRedemption + latest.fundOther) : 0;

  if (!card) {
    return <div className="container mx-auto px-4 py-6 text-muted-foreground">データがありません。</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* ヘッダー (タイトル + スライサー) */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            地方財政｜財政状況
            <span className="ml-2 text-base font-normal text-muted-foreground">{latestYear}年度</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            出典: 総務省「地方財政状況調査（都道府県決算カード）」2020〜{latestYear}年度
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

      {/* Page 1 上段: 総額サマリ + 三キーチャート */}
      <section className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {/* 総額サマリ */}
          <div className="border border-border bg-primary p-4 text-primary-foreground shadow-sm">
            <div className="text-base font-bold">{prefName}</div>
            <div className="mt-2 space-y-1.5">
              <div className="flex items-baseline justify-between border-b border-white/20 pb-1.5">
                <span className="text-xs opacity-90">歳入総額</span>
                <span className="text-lg font-bold">{latest ? oku(latest.revenue) : "—"}</span>
              </div>
              <div className="flex items-baseline justify-between border-b border-white/20 pb-1.5">
                <span className="text-xs opacity-90">歳出総額</span>
                <span className="text-lg font-bold">{latest ? oku(latest.expenditure) : "—"}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs opacity-90">標準財政規模</span>
                <span className="text-lg font-bold">{latest ? oku(latest.standardScale) : "—"}</span>
              </div>
            </div>
            <div className="mt-2 text-[10px] opacity-80">{latestYear}年度</div>
          </div>

          {/* 実質収支 (折れ線・億円) */}
          <CardFrame
            label="実質収支"
            value={latest ? oku(latest.realBalance) : "—"}
            footer={avgLegend}
          >
            <MiniLineChart points={lineSeries("realBalance", OKU)} average={avgSeries("realBalance", OKU)} />
          </CardFrame>

          {/* 積立金現在高 (積み上げ棒) */}
          <CardFrame label="積立金現在高" value={oku(fundTotalLatest)}>
            <MiniStackedBarChart points={fundStacks} colors={FUND_COLORS} />
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2" style={{ background: FUND_COLORS[0] }} />財政調整基金</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2" style={{ background: FUND_COLORS[1] }} />減債基金</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2" style={{ background: FUND_COLORS[2] }} />その他特定目的</span>
            </div>
          </CardFrame>

          {/* 地方債現在高 (棒) */}
          <CardFrame label="地方債現在高" value={latest ? oku(latest.localDebt) : "—"}>
            <MiniBarChart points={lineSeries("localDebt", OKU)} />
          </CardFrame>
        </div>
      </section>

      {/* Page 1 下段: 財政指標 4 (折れ線 + 全国平均破線) */}
      <section className="mb-10">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {RATIO_METRICS.map((meta) => {
            const latestVal = latest ? latest[meta.key] : null;
            return (
              <CardFrame
                key={meta.key}
                label={meta.label}
                value={latestVal == null ? "—" : `${latestVal.toFixed(meta.decimals)}${meta.unit}`}
                footer={avgLegend}
              >
                <MiniLineChart points={lineSeries(meta.key, 1)} average={avgSeries(meta.key, 1)} />
              </CardFrame>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ※ 実線=当該都道府県、破線=全国（都道府県）平均。都道府県には「類似団体」区分が存在しないため全国平均で比較。
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
