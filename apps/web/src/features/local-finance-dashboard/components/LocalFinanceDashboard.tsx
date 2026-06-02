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

import type {
  FinanceTrendData,
  TrendPoint,
  FinanceMetricMeta,
} from "../lib/load-finance-trends";

interface Props {
  trends: FinanceTrendData;
  /** 既定県 (13 東京) の財政フロー: SSR 初期表示 + 総額カード */
  initialFinanceFlow?: FinanceFlowData;
}

const VALID_CODES = new Set(PREFECTURES.map((p) => p.code));

function fmt(value: number, meta: Pick<FinanceMetricMeta, "decimals" | "unit">): string {
  return `${value.toFixed(meta.decimals)}${meta.unit}`;
}

/** 千円 → 億円 / 兆円 */
function yen(thousandYen: number): string {
  const oku = thousandYen / 100000;
  if (oku >= 10000) return `${(oku / 10000).toFixed(1)} 兆円`;
  return `${Math.round(oku).toLocaleString("ja-JP")} 億円`;
}

/** ミニ推移スパークライン (当該団体の実線のみ。類似団体データは未保有のため非表示) */
function Sparkline({ points }: { points: TrendPoint[] }) {
  const W = 220;
  const H = 56;
  const PAD = 6;
  if (points.length < 2) {
    return (
      <div className="flex h-[56px] items-center text-xs text-muted-foreground">
        単年データ（推移なし）
      </div>
    );
  }
  const xs = points.map((p) => p.year);
  const ys = points.map((p) => p.value);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX || 1;
  const spanY = maxY - minY || 1;
  const px = (x: number) => PAD + ((x - minX) / spanX) * (W - PAD * 2);
  const py = (y: number) => H - PAD - ((y - minY) / spanY) * (H - PAD * 2);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${px(p.year).toFixed(1)},${py(p.value).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="推移">
      <path d={d} fill="none" stroke="#2563eb" strokeWidth={1.6} />
      {points.map((p) => (
        <circle key={p.year} cx={px(p.year)} cy={py(p.value)} r={1.6} fill="#2563eb" />
      ))}
      <circle cx={px(last.year)} cy={py(last.value)} r={3} fill="#2563eb" />
    </svg>
  );
}

function KpiTrendCard({ meta, points }: { meta: FinanceMetricMeta; points: TrendPoint[] }) {
  const latest = points[points.length - 1];
  return (
    <div className="border border-border bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-slate-600">{meta.label}</span>
        {latest && (
          <span className="text-2xl font-bold text-slate-900">{fmt(latest.value, meta)}</span>
        )}
      </div>
      <div className="mt-2">
        <Sparkline points={points} />
      </div>
      {latest && (
        <div className="mt-1 text-xs text-muted-foreground">
          {latest.year}年度・全国 {latest.rank} 位/47
        </div>
      )}
    </div>
  );
}

function TotalCard({ label, thousandYen }: { label: string; thousandYen: number | null }) {
  return (
    <div className="border border-border bg-primary p-4 text-primary-foreground shadow-sm">
      <div className="text-sm font-medium opacity-90">{label}</div>
      <div className="mt-1 text-2xl font-bold">
        {thousandYen == null ? "—" : yen(thousandYen)}
      </div>
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

  // 総額カード用 (Sankey と同じ R2 財政フローを再利用)
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
            <span className="ml-2 text-base font-normal text-muted-foreground">
              {trends.latestYear}年度
            </span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            出典: 総務省「地方財政状況調査」（Japan Dashboard 互換・都道府県版）
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

      {/* Page 1: 財政状況 */}
      <section className="mb-10">
        <h2 className="mb-3 text-lg font-bold text-slate-900">{prefName} の財政状況</h2>

        {/* 総額カード */}
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <TotalCard label="歳入総額" thousandYen={flow?.totals.revenue ?? null} />
          <TotalCard label="歳出総額" thousandYen={flow?.totals.expenditure ?? null} />
          <TotalCard
            label="実質収支（歳入−歳出）"
            thousandYen={flow ? flow.totals.revenue - flow.totals.expenditure : null}
          />
        </div>

        {/* KPI 推移カード */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {trends.metrics.map((meta) => {
            const points = trends.series[meta.key]?.[prefCode] ?? [];
            if (points.length === 0) return null;
            return <KpiTrendCard key={meta.key} meta={meta} points={points} />;
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ※ 推移は当該都道府県の値。類似団体平均は stats47 では未保有のため、全国順位を併記しています。
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
