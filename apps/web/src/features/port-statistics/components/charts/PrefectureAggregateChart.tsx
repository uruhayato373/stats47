"use client";

import { useMemo } from "react";
import { BarChart } from "@stats47/visualization/d3";
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

export function PrefectureAggregateChart({ ports, metric }: Props) {
  const { label, unit } = METRIC_LABELS[metric];

  const data = useMemo(() => {
    const prefMap = new Map<string, { name: string; total: number }>();
    for (const p of ports) {
      const val = p[metric];
      if (val === null || val <= 0) continue;
      const existing = prefMap.get(p.prefectureCode);
      if (existing) {
        existing.total += val;
      } else {
        prefMap.set(p.prefectureCode, {
          name: p.prefectureName,
          total: val,
        });
      }
    }
    return Array.from(prefMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 15)
      .map((d) => ({ name: d.name, value: d.total }));
  }, [ports, metric]);

  if (data.length === 0) return null;

  return (
    <BarChart
      data={data}
      height={380}
      title={`都道府県別 ${label}`}
      unit={unit}
      valueFormat={formatCompact}
      marginLeft={72}
      colors={["#8b5cf6"]}
    />
  );
}
