"use client";

import { useId, useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, NativeSelect, NativeSelectOption, ToggleGroup, ToggleGroupItem } from "@stats47/components";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "./chart";

/**
 * 推移のチャート。公式 chart-area-interactive の仕組み (ChartContainer + 期間の切り替え) を、見本 (shadcndashboard.dev) の
 * パネルの形 (アイコン + 題名の見出し行と下線) で包む。
 * 面 (area)・棒 (bar)・折れ線 (line) を選べる。軸は 1 本だけ (単位の違う量は別のチャートにする)。
 * 色: 公開サイトと同じ --chart-1〜5 (@stats47/ui-theme の HSL 数値なので hsl() で包む) を順に固定。2 本以上は凡例を必ず出す。
 * サーバーから渡せるよう、書式は関数でなく valueFormat の名前で指定する。
 */
export type TrendSeries = { key: string; label: string };
export type TrendRow = Record<string, string | number | null>;
export type ValueFormat = "number" | "yen" | "percent" | "decimal";

const FORMAT: Record<ValueFormat, Intl.NumberFormat> = {
  number: new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 0 }),
  yen: new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }),
  percent: new Intl.NumberFormat("ja-JP", { style: "percent", maximumFractionDigits: 1 }),
  decimal: new Intl.NumberFormat("ja-JP", { maximumFractionDigits: 2 }),
};

/** ISO 日付 (2026-10-27) は M/D に縮め、週ラベル (2026-W42) などはそのまま出す */
function shortX(value: unknown): string {
  const s = String(value ?? "");
  const m = /^\d{4}-(\d{2})-(\d{2})/.exec(s);
  return m ? `${Number(m[1])}/${Number(m[2])}` : s.replace(/^\d{4}-/, "");
}

export function TrendChart({
  title,
  description,
  data,
  xKey,
  series,
  kind = "area",
  stacked = false,
  valueFormat = "number",
  ranges,
  footer,
  icon,
  height = 250,
}: {
  title: ReactNode;
  description?: ReactNode;
  data: TrendRow[];
  xKey: string;
  series: TrendSeries[];
  kind?: "area" | "bar" | "line";
  stacked?: boolean;
  valueFormat?: ValueFormat;
  /** 期間の切り替え (末尾から何件を見せるか)。先頭が既定。件数が足りない選択肢は出さない */
  ranges?: { label: string; last: number }[];
  footer?: ReactNode;
  /** 見出しのアイコン要素 (例: <TrendingUpIcon />) */
  icon?: ReactNode;
  height?: 200 | 250 | 300;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const usable = (ranges ?? []).filter((r, i) => i === 0 || r.last < data.length);
  const [range, setRange] = useState(usable[0]?.label ?? "");
  const last = usable.find((r) => r.label === range)?.last;
  const rows = last ? data.slice(-last) : data;

  const config: ChartConfig = Object.fromEntries(
    series.map((s, i) => [s.key, { label: s.label, color: `hsl(var(--chart-${(i % 5) + 1}))` }]),
  );
  const fmt = (v: unknown) => (typeof v === "number" ? FORMAT[valueFormat].format(v) : String(v ?? "—"));
  const stackId = stacked ? "a" : undefined;
  const heightClass = { 200: "h-[200px]", 250: "h-[250px]", 300: "h-[300px]" }[height];

  const common = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis dataKey={xKey} tickLine={false} axisLine={false} tickMargin={8} minTickGap={32} tickFormatter={shortX} />
      <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={fmt} />
      <ChartTooltip
        cursor={kind === "bar" ? { fill: "hsl(var(--muted))" } : false}
        content={<ChartTooltipContent indicator="dot" labelFormatter={(v) => String(v)} />}
      />
      {series.length > 1 ? <ChartLegend content={<ChartLegendContent />} /> : null}
    </>
  );

  return (
    <Card className="@container/card">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2">
          {icon ? (
            <span className="text-muted-foreground [&_svg]:size-4" aria-hidden="true">
              {icon}
            </span>
          ) : null}
          {title}
        </CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {usable.length > 1 ? (
          <CardAction>
            <ToggleGroup
              multiple={false}
              value={[range]}
              onValueChange={(value) => setRange(value[0] ?? usable[0].label)}
              variant="outline"
              size="sm"
              className="hidden @[560px]/card:flex"
            >
              {usable.map((r) => (
                <ToggleGroupItem key={r.label} value={r.label}>
                  {r.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            {/* カードが狭いときは公式と同じくプルダウンに切り替える */}
            <NativeSelect size="sm" value={range} onChange={(e) => setRange(e.target.value)} aria-label="表示する期間" className="@[560px]/card:hidden">
              {usable.map((r) => (
                <NativeSelectOption key={r.label} value={r.label}>
                  {r.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="px-2 sm:px-4">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだ記録がありません。</p>
        ) : (
          <ChartContainer config={config} className={`aspect-auto ${heightClass} w-full`}>
            {kind === "bar" ? (
              <BarChart data={rows}>
                {common}
                {series.map((s, i) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    fill={`var(--color-${s.key})`}
                    stackId={stackId}
                    radius={stacked && i < series.length - 1 ? 0 : [4, 4, 0, 0]}
                  />
                ))}
              </BarChart>
            ) : kind === "line" ? (
              <LineChart data={rows}>
                {common}
                {series.map((s) => (
                  <Line key={s.key} dataKey={s.key} type="monotone" stroke={`var(--color-${s.key})`} strokeWidth={2} dot={false} connectNulls={false} />
                ))}
              </LineChart>
            ) : (
              <AreaChart data={rows}>
                <defs>
                  {series.map((s) => (
                    <linearGradient key={s.key} id={`${uid}-fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={`var(--color-${s.key})`} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={`var(--color-${s.key})`} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
                </defs>
                {common}
                {series.map((s) => (
                  <Area key={s.key} dataKey={s.key} type="monotone" fill={`url(#${uid}-fill-${s.key})`} stroke={`var(--color-${s.key})`} stackId={stackId} />
                ))}
              </AreaChart>
            )}
          </ChartContainer>
        )}
      </CardContent>
      {footer ? <CardFooter className="flex-col items-start gap-1.5 text-sm text-muted-foreground">{footer}</CardFooter> : null}
    </Card>
  );
}
