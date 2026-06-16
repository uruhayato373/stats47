"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";

import { HubSankey } from "@/components/charts/HubSankey";
import { SankeyFallback } from "@/components/charts/SankeyFallback";

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

interface FlowNode {
  name: string;
  value: number;
}
interface CityFlow {
  revenue: FlowNode[];
  expenditure: FlowNode[];
  totals: { revenue: number; expenditure: number };
}
interface CityRecord {
  type?: string;
  years: Record<string, YearRecord>;
  flow?: CityFlow;
}
/** 市区町村 JSON: cityName -> CityRecord */
type CityData = Record<string, CityRecord>;
/** 類似団体平均: 類型 -> 年 -> 指標 */
type SimilarAverages = Record<string, Record<string, YearRecord>>;

const VALID_CODES = new Set(PREFECTURES.map((p) => p.code));
const OKU = 1 / 100000; // 千円 → 億円
const FUND_COLORS = ["#2563eb", "#38bdf8", "#bae6fd"];
const PREF_ALL = "__pref__"; // 「県全体」を表すセンチネル

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

function CardFrame({ label, value, children, footer }: { label: string; value: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="border border-border bg-white p-3 shadow-sm">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <span className="text-xl font-bold text-slate-900">{value}</span>
      </div>
      <div className="mt-1">{children}</div>
      {footer && <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">{footer}</div>}
    </div>
  );
}

export function LocalFinanceDashboard({ cards, initialFinanceFlow }: Props) {
  const [prefCode, setPrefCode] = useState(initialFinanceFlow?.focusCode ?? "13");
  const [cityName, setCityName] = useState<string>(PREF_ALL);
  const [cityData, setCityData] = useState<CityData | null>(null);
  const [similarAvg, setSimilarAvg] = useState<SimilarAverages | null>(null);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("pref");
    if (param && VALID_CODES.has(param)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefCode(param);
    }
    fetch("/finance-cards/similar-averages.json")
      .then((r) => (r.ok ? (r.json() as Promise<SimilarAverages>) : null))
      .then((d) => setSimilarAvg(d))
      .catch(() => setSimilarAvg(null));
  }, []);

  // 都道府県変更時に市区町村データを取得
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCityData(null);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCityName(PREF_ALL);
    fetch(`/finance-cards/cities/${prefCode}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<CityData>) : null))
      .then((d) => {
        if (!cancelled) setCityData(d);
      })
      .catch(() => {
        if (!cancelled) setCityData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [prefCode]);

  const handlePrefChange = (code: string) => {
    setPrefCode(code);
    const url = new URL(window.location.href);
    url.searchParams.set("pref", code);
    window.history.replaceState(null, "", url);
  };

  const { years, averages, latestYear } = cards;
  const prefCard = cards.cards[prefCode];
  const prefName = prefCard?.name ?? PREFECTURES.find((p) => p.code === prefCode)?.name ?? "";

  const isCity = cityName !== PREF_ALL && !!cityData?.[cityName];
  const activeName = isCity ? cityName : `${prefName}（県全体）`;

  // 県内市区町村平均 (市区町村ビューの比較破線用)
  const cityAverages = useMemo<Record<number, YearRecord> | null>(() => {
    if (!cityData) return null;
    const keys = Object.keys(cityData);
    if (keys.length === 0) return null;
    const out: Record<number, YearRecord> = {};
    const fields: (keyof YearRecord)[] = [
      "revenue", "expenditure", "realBalance", "standardScale", "fiscalIndex",
      "currentBalanceRatio", "debtServiceRatio", "futureBurdenRatio",
      "fundAdjust", "fundRedemption", "fundOther", "localDebt",
    ];
    for (const y of years) {
      const acc = Object.fromEntries(fields.map((f) => [f, 0])) as unknown as YearRecord;
      let n = 0;
      for (const k of keys) {
        const rec = cityData[k].years[String(y)];
        if (!rec) continue;
        n += 1;
        for (const f of fields) acc[f] += rec[f] ?? 0;
      }
      if (n > 0) for (const f of fields) acc[f] = acc[f] / n;
      out[y] = acc;
    }
    return out;
  }, [cityData, years]);

  const cityType = isCity ? cityData?.[cityName]?.type : undefined;
  const cityFlow = isCity ? cityData?.[cityName]?.flow : undefined;
  const simForType = cityType ? similarAvg?.[cityType] : undefined;

  const recordFor = (year: number): YearRecord | undefined =>
    isCity ? cityData?.[cityName]?.years[String(year)] : prefCard?.years[String(year)];
  const avgFor = (year: number): YearRecord | undefined => {
    if (!isCity) return averages[year];
    if (simForType?.[String(year)]) return simForType[String(year)];
    return cityAverages?.[year];
  };

  const latest = recordFor(latestYear);
  const avgLabel = !isCity ? "全国平均" : simForType ? "類似団体平均" : "県内市区町村平均";
  const avgLegend = (
    <span className="flex items-center gap-1">
      <span className="inline-block h-px w-3 border-t border-dashed border-slate-400" />
      {avgLabel}
    </span>
  );

  const lineSeries = (key: keyof YearRecord, scale: number): ChartPoint[] =>
    years.flatMap((y) => {
      const r = recordFor(y);
      return r ? [{ year: y, value: r[key] * scale }] : [];
    });
  const avgSeries = (key: keyof YearRecord, scale: number): ChartPoint[] =>
    years.flatMap((y) => {
      const a = avgFor(y);
      return a ? [{ year: y, value: a[key] * scale }] : [];
    });
  const fundStacks: StackPoint[] = years.flatMap((y) => {
    const r = recordFor(y);
    return r ? [{ year: y, segments: [r.fundAdjust * OKU, r.fundRedemption * OKU, r.fundOther * OKU] }] : [];
  });
  const fundTotalLatest = latest ? latest.fundAdjust + latest.fundRedemption + latest.fundOther : 0;

  const cityOptions = cityData ? Object.keys(cityData) : [];

  return (
    <div className="container mx-auto px-4 py-6">
      {/* ヘッダー */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            地方財政｜財政状況
            <span className="ml-2 text-base font-normal text-muted-foreground">{latestYear}年度</span>
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            出典: 総務省「地方財政状況調査（決算カード）」2020〜{latestYear}年度
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={prefCode} onValueChange={handlePrefChange}>
            <SelectTrigger className="w-36">
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
          <Select value={cityName} onValueChange={setCityName} disabled={!cityData}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="市区町村" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={PREF_ALL}>県全体</SelectItem>
              {cityOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Page 1 上段: 総額サマリ + 三キーチャート */}
      <section className="mb-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="border border-border bg-primary p-4 text-primary-foreground shadow-sm">
            <div className="text-base font-bold">{activeName}</div>
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

          <CardFrame label="実質収支" value={latest ? oku(latest.realBalance) : "—"} footer={avgLegend}>
            <MiniLineChart points={lineSeries("realBalance", OKU)} average={avgSeries("realBalance", OKU)} averageName={avgLabel} unit="億円" />
          </CardFrame>

          <CardFrame label="積立金現在高" value={oku(fundTotalLatest)}>
            <MiniStackedBarChart points={fundStacks} colors={FUND_COLORS} />
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2" style={{ background: FUND_COLORS[0] }} />財政調整基金</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2" style={{ background: FUND_COLORS[1] }} />減債基金</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2" style={{ background: FUND_COLORS[2] }} />その他特定目的</span>
            </div>
          </CardFrame>

          <CardFrame label="地方債現在高" value={latest ? oku(latest.localDebt) : "—"}>
            <MiniBarChart points={lineSeries("localDebt", OKU)} />
          </CardFrame>
        </div>
      </section>

      {/* Page 1 下段: 財政指標 4 */}
      <section className="mb-10">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {RATIO_METRICS.map((meta) => {
            const latestVal = latest ? latest[meta.key] : null;
            return (
              <CardFrame
                key={String(meta.key)}
                label={meta.label}
                value={latestVal == null ? "—" : `${latestVal.toFixed(meta.decimals)}${meta.unit}`}
                footer={avgLegend}
              >
                <MiniLineChart points={lineSeries(meta.key, 1)} average={avgSeries(meta.key, 1)} averageName={avgLabel} unit={meta.unit} />
              </CardFrame>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          ※ 実線=選択団体、破線={avgLabel}。
          {isCity
            ? simForType
              ? `（${cityType} の全国平均で比較）`
              : "（類型不明のため県内平均で比較）"
            : "（都道府県には類似団体区分が無いため全国平均）"}
        </p>
      </section>

      {/* Page 2: 歳入歳出の構成比 (市区町村は団体別 Sankey、県全体は都道府県 Sankey) */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-slate-900">歳入歳出の構成比</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          歳入の財源（地方税・地方交付税・国庫支出金・地方債など）が一般会計を通じて
          目的別歳出（民生費・教育費・土木費など）へ流れる様子をフロー図で表します。
        </p>
        {isCity ? (
          cityFlow ? (
            <HubSankey
              title={`${cityName} 財政フロー（${latestYear}年度）`}
              subtitle="左: 歳入の財源 → 中央: 一般会計 → 右: 目的別歳出（幅=金額）"
              centerLabel="一般会計"
              centerSub={`歳入 ${oku(cityFlow.totals.revenue)} / 歳出 ${oku(cityFlow.totals.expenditure)}`}
              centerSubColor="#64748b"
              leftNodes={cityFlow.revenue}
              rightNodes={cityFlow.expenditure}
              leftColor="#0ea5e9"
              rightColor="#f59e0b"
              formatValue={oku}
              footer={`出典: 地方財政状況調査 決算カード（${latestYear}年度）`}
              labelGutter={182}
            />
          ) : (
            <SankeyFallback message="この団体のフローデータがありません。" />
          )
        ) : (
          <FinanceSankey code={prefCode} initialData={initialFinanceFlow} />
        )}
      </section>
    </div>
  );
}
