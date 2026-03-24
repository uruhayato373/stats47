"use client";

import { useMemo } from "react";
import { DonutChart } from "@stats47/visualization/d3";
import type { PortWithStats } from "../../lib/load-port-data";

type MetricKey = "cargoTotal" | "shipsTotal" | "passengersTotal" | "containerTonnage";

const GRADE_ORDER = ["国際戦略港湾", "国際拠点港湾", "重要港湾", "その他"];
const GRADE_COLORS = ["#dc2626", "#f59e0b", "#3b82f6", "#94a3b8"];

interface Props {
  ports: PortWithStats[];
  metric: MetricKey;
}

export function PortGradeChart({ ports, metric }: Props) {
  const data = useMemo(() => {
    const gradeMap = new Map<string, number>();
    for (const p of ports) {
      const val = p[metric];
      if (val === null || val <= 0) continue;
      const grade = p.portGrade ?? "その他";
      gradeMap.set(grade, (gradeMap.get(grade) ?? 0) + val);
    }
    return GRADE_ORDER
      .filter((g) => (gradeMap.get(g) ?? 0) > 0)
      .map((g, i) => ({
        name: g,
        value: gradeMap.get(g) ?? 0,
        color: GRADE_COLORS[i],
      }));
  }, [ports, metric]);

  if (data.length === 0) return null;

  return (
    <DonutChart
      data={data}
      height={280}
      width={400}
      title="港湾等級別シェア"
      colors={GRADE_COLORS}
    />
  );
}
