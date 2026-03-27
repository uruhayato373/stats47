"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";

const BarChart = dynamic(
  () => import("@stats47/visualization/d3/BarChart").then((m) => m.BarChart),
  { ssr: false },
);
import type { PortWithStats } from "../../lib/load-port-data";

type MetricKey = "cargoTotal" | "shipsTotal" | "passengersTotal" | "containerTonnage";

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
  ports: PortWithStats[];
  metric: MetricKey;
}

export function TopPortsChart({ ports, metric }: Props) {
  const { label, unit } = METRIC_LABELS[metric];

  const data = useMemo(() => {
    return ports
      .filter((p) => p[metric] !== null && (p[metric] ?? 0) > 0)
      .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
      .slice(0, 10)
      .map((p) => ({
        name: `${p.portName}`,
        value: p[metric] ?? 0,
      }));
  }, [ports, metric]);

  if (data.length === 0) return null;

  return (
    <BarChart
      data={data}
      height={320}
      title={`${label} Top10`}
      unit={unit}
      valueFormat={formatCompact}
      marginLeft={80}
      colors={["#3b82f6"]}
    />
  );
}
