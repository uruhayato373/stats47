"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import type { PortWithStats } from "../lib/load-port-data";
import { TopPortsChart } from "./charts/TopPortsChart";
import { PortTrendChart } from "./charts/PortTrendChart";
import { CargoCompositionChart } from "./charts/CargoCompositionChart";
import { PrefectureAggregateChart } from "./charts/PrefectureAggregateChart";
import { PortGradeChart } from "./charts/PortGradeChart";
import { CommodityTreemapChart } from "./charts/CommodityTreemapChart";
import { CommoditySunburstChart } from "./charts/CommoditySunburstChart";

type MetricKey = "cargoTotal" | "shipsTotal" | "passengersTotal" | "containerTonnage";

interface Props {
  ports: PortWithStats[];
  metric: MetricKey;
  selectedPort: string | null;
  selectedYear: string;
}

export function PortChartsSection({ ports, metric, selectedPort, selectedYear }: Props) {
  const selectedPortData = ports.find((p) => p.portCode === selectedPort);

  return (
    <section className="space-y-4 mt-6">
      <h2 className="text-lg font-bold">統計チャート</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top10 横棒 */}
        <Card>
          <CardContent className="pt-4 pb-2 px-2">
            <TopPortsChart ports={ports} metric={metric} />
          </CardContent>
        </Card>

        {/* 年度推移折れ線 */}
        <Card>
          <CardContent className="pt-4 pb-2 px-2">
            <PortTrendChart
              selectedPort={selectedPort}
              portName={selectedPortData?.portName ?? null}
              metric={metric}
            />
          </CardContent>
        </Card>

        {/* 貨物内訳 積み上げ棒 */}
        <Card>
          <CardContent className="pt-4 pb-2 px-2">
            <CargoCompositionChart ports={ports} />
          </CardContent>
        </Card>

        {/* 都道府県集計 */}
        <Card>
          <CardContent className="pt-4 pb-2 px-2">
            <PrefectureAggregateChart ports={ports} metric={metric} />
          </CardContent>
        </Card>
      </div>

      {/* 等級別ドーナツ — 中央配置 */}
      <div className="flex justify-center">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-4 pb-2 px-2 flex justify-center">
            <PortGradeChart ports={ports} metric={metric} />
          </CardContent>
        </Card>
      </div>

      {/* 品種別貨物構成 */}
      <h2 className="text-lg font-bold mt-8">品種別貨物構成</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 pb-2 px-2">
            <CommodityTreemapChart
              prefectureCode={selectedPortData?.prefectureCode ?? null}
              prefectureName={selectedPortData?.prefectureName ?? null}
              year={selectedYear}
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-2 px-2">
            <CommoditySunburstChart
              prefectureCode={selectedPortData?.prefectureCode ?? null}
              prefectureName={selectedPortData?.prefectureName ?? null}
              year={selectedYear}
            />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
