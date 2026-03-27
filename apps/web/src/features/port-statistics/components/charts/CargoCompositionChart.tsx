"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";

const BarChart = dynamic(
  () => import("@stats47/visualization/d3/BarChart").then((m) => m.BarChart),
  { ssr: false },
);
import type { PortWithStats } from "../../lib/load-port-data";

function formatCompact(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億`;
  if (n >= 10_000) return `${Math.round(n / 10_000)}万`;
  return n.toLocaleString();
}

interface Props {
  ports: PortWithStats[];
}

const KEYS = ["export", "import", "coastalOut", "coastalIn"] as const;
const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b"];

export function CargoCompositionChart({ ports }: Props) {
  const data = useMemo(() => {
    return ports
      .filter((p) => p.cargoTotal !== null && (p.cargoTotal ?? 0) > 0)
      .sort((a, b) => (b.cargoTotal ?? 0) - (a.cargoTotal ?? 0))
      .slice(0, 10)
      .map((p) => ({
        name: p.portName,
        value: p.cargoTotal ?? 0,
        export: p.cargoExport ?? 0,
        import: p.cargoImport ?? 0,
        coastalOut: p.cargoCoastalOut ?? 0,
        coastalIn: p.cargoCoastalIn ?? 0,
      }));
  }, [ports]);

  if (data.length === 0) return null;

  return (
    <BarChart
      data={data}
      keys={[...KEYS]}
      height={320}
      title="貨物内訳 Top10"
      unit="トン"
      valueFormat={formatCompact}
      marginLeft={80}
      colors={COLORS}
      showLegend
      mode="stacked"
    />
  );
}
