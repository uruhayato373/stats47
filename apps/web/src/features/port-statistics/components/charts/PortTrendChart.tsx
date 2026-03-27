"use client";

import { useState, useEffect, useTransition } from "react";
import dynamic from "next/dynamic";

const D3LineChart = dynamic(
  () => import("@stats47/visualization/d3/LineChart").then((m) => m.D3LineChart),
  { ssr: false },
);
import { fetchPortTimeSeriesAction } from "../../actions/fetch-port-year-data";

type MetricKey = "cargoTotal" | "shipsTotal" | "passengersTotal" | "containerTonnage";

const METRIC_TO_DB_KEY: Record<MetricKey, string> = {
  cargoTotal: "cargo_total",
  shipsTotal: "ships_total",
  passengersTotal: "passengers_total",
  containerTonnage: "container_tonnage",
};

const METRIC_LABELS: Record<MetricKey, { label: string; unit: string }> = {
  cargoTotal: { label: "貨物量", unit: "トン" },
  shipsTotal: { label: "船舶隻数", unit: "隻" },
  passengersTotal: { label: "旅客数", unit: "人" },
  containerTonnage: { label: "コンテナ", unit: "トン" },
};

function formatCompact(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}万`;
  return n.toLocaleString();
}

interface Props {
  selectedPort: string | null;
  portName: string | null;
  metric: MetricKey;
}

export function PortTrendChart({ selectedPort, portName, metric }: Props) {
  const [timeSeriesData, setTimeSeriesData] = useState<
    Array<{ year: string; metricKey: string; value: number; unit: string }>
  >([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedPort) {
      setTimeSeriesData([]);
      return;
    }
    startTransition(async () => {
      const data = await fetchPortTimeSeriesAction(selectedPort);
      setTimeSeriesData(data);
    });
  }, [selectedPort]);

  const { label, unit } = METRIC_LABELS[metric];
  const dbKey = METRIC_TO_DB_KEY[metric];

  if (!selectedPort) {
    return (
      <div className="flex items-center justify-center h-[320px] text-sm text-muted-foreground">
        地図上の港をクリックすると年度推移を表示します
      </div>
    );
  }

  const chartData = timeSeriesData
    .filter((d) => d.metricKey === dbKey)
    .sort((a, b) => a.year.localeCompare(b.year))
    .map((d) => ({
      category: d.year,
      label: `${d.year}年`,
      value: d.value,
    }));

  return (
    <D3LineChart
      data={chartData}
      height={320}
      title={portName ? `${portName}港 ${label}の推移` : `${label}の推移`}
      unit={unit}
      isLoading={isPending}
      yAxisFormatter={formatCompact}
      tooltipFormatter={formatCompact}
      colors={["#3b82f6"]}
    />
  );
}
