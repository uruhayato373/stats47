"use client";

import { useEffect, useState } from "react";

import { PREFECTURE_LIST_2DIGIT as PREFECTURES } from "@stats47/area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";

import { ChartCard } from "@/components/charts/ChartCard";
import { ChartFooter } from "@/components/charts/ChartFooter";
import { ChartLegend } from "@/components/charts/ChartLegend";
import { FINANCE_CHART_COLORS, getChartColors } from "@/components/charts/ChartPalette";
import { ChartPanel } from "@/components/charts/ChartPanel";
import { HubSankey } from "@/components/charts/HubSankey";
import { KeyMetricsTableCard } from "@/components/charts/KeyMetricsTableCard";
import {
  MiniBarChart,
  MiniLineChart,
  MiniStackedBarChart,
  type ChartPoint,
  type StackPoint,
} from "@/components/charts/MiniCharts";
import { SankeyFallback } from "@/components/charts/SankeyFallback";

import {
  FinanceSankey,
  LOCAL_FINANCE_SOURCE_LINKS,
  type FinanceFlowData,
} from "@/features/finance-flow/client";

import {
  parseCityFinanceCards,
  type CityData,
  type FinanceCardsData,
  type YearRecord,
} from "../lib/load-finance-cards";

interface Props {
  cards: FinanceCardsData;
  initialFinanceFlow?: FinanceFlowData;
}

const VALID_CODES = new Set(PREFECTURES.map((p) => p.code));
const OKU = 1 / 100000; // 千円 → 億円
const FUND_COLORS = getChartColors(3);
const FUND_LEGEND_ITEMS = [
  { label: "財政調整基金", color: FUND_COLORS[0] },
  { label: "減債基金", color: FUND_COLORS[1] },
  { label: "その他特定目的", color: FUND_COLORS[2] },
];
const PREF_ALL = "__pref__"; // 「県全体」を表すセンチネル

function oku(thousandYen: number): string {
  const v = thousandYen * OKU;
  if (Math.abs(v) >= 10000) return `${(v / 10000).toFixed(1)} 兆円`;
  return `${Math.round(v).toLocaleString("ja-JP")} 億円`;
}

interface RatioMeta {
  key: keyof YearRecord;
  componentKey: string;
  label: string;
  unit: string;
  decimals: number;
}
const RATIO_METRICS: RatioMeta[] = [
  { key: "fiscalIndex", componentKey: "kpi-lf-fiscal-strength", label: "財政力指数", unit: "", decimals: 2 },
  { key: "currentBalanceRatio", componentKey: "kpi-lf-current-balance", label: "経常収支比率", unit: "%", decimals: 1 },
  { key: "debtServiceRatio", componentKey: "kpi-lf-debt-service", label: "実質公債費比率", unit: "%", decimals: 1 },
  { key: "futureBurdenRatio", componentKey: "kpi-lf-future-burden", label: "将来負担比率", unit: "%", decimals: 1 },
];


export function LocalFinanceDashboard({ cards, initialFinanceFlow }: Props) {
  const [prefCode, setPrefCode] = useState(initialFinanceFlow?.focusCode ?? "13");
  const [cityName, setCityName] = useState<string>(PREF_ALL);
  const [cityData, setCityData] = useState<CityData | null>(null);

  useEffect(() => {
    const param = new URLSearchParams(window.location.search).get("pref");
    if (param && VALID_CODES.has(param)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrefCode(param);
    }
  }, []);

  // 都道府県変更時に市区町村データを取得
  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCityData(null);

    setCityName(PREF_ALL);
    fetch(`/finance-cards/cities/${prefCode}.json`)
      .then(async (r) => (r.ok ? parseCityFinanceCards(await r.json()) : null))
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

  const { years, latestYear } = cards;
  const prefCard = cards.cards[prefCode];
  const prefName = prefCard?.name ?? PREFECTURES.find((p) => p.code === prefCode)?.name ?? "";

  const isCity = cityName !== PREF_ALL && !!cityData?.[cityName];
  const activeName = isCity ? cityName : `${prefName}（県全体）`;

  const cityFlow = isCity ? cityData?.[cityName]?.flow : undefined;

  const recordFor = (year: number): YearRecord | undefined =>
    isCity ? cityData?.[cityName]?.years[String(year)] : prefCard?.years[String(year)];

  const latest = recordFor(latestYear);

  const lineSeries = (key: keyof YearRecord, scale: number): ChartPoint[] =>
    years.flatMap((y) => {
      const r = recordFor(y);
      return r ? [{ year: y, value: r[key] * scale }] : [];
    });
  const fundStacks: StackPoint[] = years.flatMap((y) => {
    const r = recordFor(y);
    return r ? [{ year: y, segments: [r.fundAdjust * OKU, r.fundRedemption * OKU, r.fundOther * OKU] }] : [];
  });
  const fundTotalLatest = latest ? latest.fundAdjust + latest.fundRedemption + latest.fundOther : 0;

  const cityOptions = cityData ? Object.keys(cityData) : [];

  return (
    <div className="py-2">
      {/* ヘッダー */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            地方財政｜財政状況
            <span className="ml-2 text-base font-normal text-muted-foreground">{latestYear}年度</span>
          </h1>
          <ChartFooter
            source="地方財政状況調査（決算カード）"
            sourceLinks={LOCAL_FINANCE_SOURCE_LINKS}
            sourceDetail={`2020〜${latestYear}年度`}
          />
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
          <KeyMetricsTableCard
            title={activeName}
            subtitle="主要指標"
            rows={[
              { label: "歳入総額", value: latest ? oku(latest.revenue) : "—" },
              { label: "歳出総額", value: latest ? oku(latest.expenditure) : "—" },
              { label: "標準財政規模", value: latest ? oku(latest.standardScale) : "—" },
            ]}
            footer={`${latestYear}年度`}
          />

          <ChartCard
            label="実質収支"
            value={latest ? oku(latest.realBalance) : "—"}
            chart={<MiniLineChart points={lineSeries("realBalance", OKU)} unit="億円" />}
          />

          <ChartCard
            label="積立金現在高"
            value={oku(fundTotalLatest)}
            chart={
              <div>
                <MiniStackedBarChart points={fundStacks} colors={FUND_COLORS} />
                <ChartLegend items={FUND_LEGEND_ITEMS} className="mt-1" />
              </div>
            }
          />

          <ChartCard
            label="地方債現在高"
            value={latest ? oku(latest.localDebt) : "—"}
            chart={<MiniBarChart points={lineSeries("localDebt", OKU)} />}
          />
        </div>
      </section>

      {/* Page 1 下段: 財政指標 4 */}
      <section className="mb-10">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {RATIO_METRICS.map((meta) => {
            const latestVal = latest ? latest[meta.key] : null;
            const points = lineSeries(meta.key, 1);
            return (
              <div
                key={String(meta.key)}
                data-theme-chart="true"
                data-theme-component-key={meta.componentKey}
                data-theme-component-type="kpi-card"
                data-data-state={points.length > 0 ? "ready" : "no-data"}
                data-unit={meta.unit || "指数"}
                data-year={`${latestYear}年度`}
                data-series-count={points.length}
              >
                <ChartCard
                  label={meta.label}
                  value={latestVal == null ? "—" : `${latestVal.toFixed(meta.decimals)}${meta.unit}`}
                  chart={<MiniLineChart points={points} unit={meta.unit} />}
                />
              </div>
            );
          })}
        </div>
      </section>

      {/* Page 2: 歳入歳出の構成比 (市区町村は団体別 Sankey、県全体は都道府県 Sankey) */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">歳入歳出の構成比</h2>
        <p className="mb-3 text-sm text-muted-foreground">
          歳入の財源（地方税・地方交付税・国庫支出金・地方債など）が一般会計を通じて
          目的別歳出（民生費・教育費・土木費など）へ流れる様子をフロー図で表します。
        </p>
        {isCity ? (
          cityFlow ? (
            <ChartPanel
              title={`${cityName} 財政フロー（${latestYear}年度）`}
              description="左: 歳入の財源 → 中央: 一般会計 → 右: 目的別歳出（幅=金額）"
              footer={
                <ChartFooter
                  source="地方財政状況調査 決算カード"
                  sourceLinks={LOCAL_FINANCE_SOURCE_LINKS}
                  sourceDetail={`${latestYear}年度`}
                />
              }
            >
              <HubSankey
                title={`${cityName} 財政フロー（${latestYear}年度）`}
                subtitle="左: 歳入の財源 → 中央: 一般会計 → 右: 目的別歳出（幅=金額）"
                centerLabel="一般会計"
                centerSub={`歳入 ${oku(cityFlow.totals.revenue)} / 歳出 ${oku(cityFlow.totals.expenditure)}`}
                centerSubColor={FINANCE_CHART_COLORS.subtext}
                leftNodes={cityFlow.revenue}
                rightNodes={cityFlow.expenditure}
                leftColor={FINANCE_CHART_COLORS.revenue}
                rightColor={FINANCE_CHART_COLORS.expenditure}
                formatValue={oku}
                labelGutter={182}
                chrome="bare"
              />
            </ChartPanel>
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
