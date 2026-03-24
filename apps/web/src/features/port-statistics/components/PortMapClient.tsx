"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { Map as MapIcon, Table as TableIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@stats47/components/atoms/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@stats47/components/atoms/ui/table";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";

import { useBreakpoint } from "@/hooks/useBreakpoint";
import type { PortWithStats } from "../lib/load-port-data";
import { fetchPortYearDataAction } from "../actions/fetch-port-year-data";
import { PortChartsSection } from "./PortChartsSection";

const PortLeafletMap = dynamic(() => import("./PortLeafletMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full rounded-lg" />,
});

type MetricKey = "cargoTotal" | "shipsTotal" | "passengersTotal" | "containerTonnage";

const METRICS: { key: MetricKey; label: string; unit: string }[] = [
  { key: "cargoTotal", label: "貨物量", unit: "トン" },
  { key: "shipsTotal", label: "船舶隻数", unit: "隻" },
  { key: "passengersTotal", label: "旅客数", unit: "人" },
  { key: "containerTonnage", label: "コンテナ", unit: "トン" },
];

function formatNumber(n: number | null): string {
  if (n === null) return "-";
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}億`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}万`;
  return n.toLocaleString();
}

interface Props {
  ports: PortWithStats[];
  years: string[];
}

export function PortMapClient({ ports: initialPorts, years }: Props) {
  const [metric, setMetric] = useState<MetricKey>("cargoTotal");
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(years[0] || "2023");
  const [ports, setPorts] = useState(initialPorts);
  const [isYearPending, startYearTransition] = useTransition();
  const { resolvedTheme } = useTheme();
  const isBelowLg = useBreakpoint("belowLg");

  const currentMetric = METRICS.find((m) => m.key === metric)!;

  const handleYearChange = useCallback(
    (year: string) => {
      setSelectedYear(year);
      if (year === initialPorts[0]?.latestYear) {
        setPorts(initialPorts);
        return;
      }
      startYearTransition(async () => {
        const data = await fetchPortYearDataAction(year);
        setPorts(data);
      });
    },
    [initialPorts],
  );

  const selectedPortData = useMemo(
    () => ports.find((p) => p.portCode === selectedPort),
    [ports, selectedPort],
  );

  const rankedPorts = useMemo(() => {
    return ports
      .filter((p) => p[metric] !== null)
      .sort((a, b) => (b[metric] ?? 0) - (a[metric] ?? 0))
      .slice(0, 30);
  }, [ports, metric]);

  // --- 共通パーツ ---

  const indicatorTabs = (
    <Tabs value={metric} onValueChange={(v) => setMetric(v as MetricKey)}>
      <TabsList className="inline-flex w-max">
        {METRICS.map((m) => (
          <TabsTrigger
            key={m.key}
            value={m.key}
            className="text-xs sm:text-sm whitespace-nowrap"
          >
            {m.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );

  const yearSelector = (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={selectedYear} onValueChange={handleYearChange}>
        <SelectTrigger className="h-8 w-[120px] text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={y}>
              {y}年
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isYearPending && (
        <span className="text-xs text-muted-foreground animate-pulse">
          読込中...
        </span>
      )}
    </div>
  );

  const mapSection = (
    <Card>
      <CardContent className="p-0 overflow-hidden rounded-lg">
        <PortLeafletMap
          ports={ports}
          metric={metric}
          selectedPort={selectedPort}
          onSelectPort={setSelectedPort}
          isDark={resolvedTheme === "dark"}
        />
      </CardContent>
    </Card>
  );

  const detailPanel = selectedPortData ? (
    <PortDetail port={selectedPortData} onDeselect={() => setSelectedPort(null)} />
  ) : (
    <RankingTable
      ports={rankedPorts}
      metric={metric}
      currentMetric={currentMetric}
      onSelectPort={setSelectedPort}
    />
  );

  // --- レイアウト ---

  if (isBelowLg) {
    return (
      <div className="space-y-3 min-w-0 overflow-hidden">
        {indicatorTabs}
        {yearSelector}

        <Tabs defaultValue="map" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="map" className="flex items-center gap-1">
              <MapIcon className="w-3.5 h-3.5" />
              地図
            </TabsTrigger>
            <TabsTrigger value="table" className="flex items-center gap-1">
              <TableIcon className="w-3.5 h-3.5" />
              ランキング
            </TabsTrigger>
          </TabsList>
          <TabsContent value="map" className="mt-3">
            {mapSection}
            {selectedPortData && (
              <div className="mt-3">
                <PortDetail port={selectedPortData} onDeselect={() => setSelectedPort(null)} />
              </div>
            )}
          </TabsContent>
          <TabsContent value="table" className="mt-3">
            <RankingTable
              ports={rankedPorts}
              metric={metric}
              currentMetric={currentMetric}
              onSelectPort={setSelectedPort}
            />
          </TabsContent>
        </Tabs>

        <PortChartsSection
          ports={ports}
          metric={metric}
          selectedPort={selectedPort}
          selectedYear={selectedYear}
        />
      </div>
    );
  }

  // デスクトップ
  return (
    <div className="space-y-4 overflow-hidden">
      <div className="grid grid-cols-[1fr_380px] gap-4 items-start">
        {/* 左カラム: タブ + 年度 + 地図 */}
        <div className="space-y-3 min-w-0">
          {indicatorTabs}
          {yearSelector}
          {mapSection}
        </div>

        {/* 右カラム: 詳細 or ランキング */}
        <div className="max-h-[calc(100vh-6rem)] overflow-auto">
          {detailPanel}
        </div>
      </div>

      <PortChartsSection
        ports={ports}
        metric={metric}
        selectedPort={selectedPort}
        selectedYear={selectedYear}
      />
    </div>
  );
}

// --- サブコンポーネント ---

/** 指標行の定義 */
interface MetricRow {
  label: string;
  value: number | null;
  unit: string;
  indent?: boolean;
}

function MetricSection({
  title,
  rows,
}: {
  title: string;
  rows: MetricRow[];
}) {
  const hasData = rows.some((r) => r.value !== null);
  if (!hasData) return null;
  return (
    <>
      <tr>
        <td
          colSpan={2}
          className="pt-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide"
        >
          {title}
        </td>
      </tr>
      {rows.map(
        (r) =>
          r.value !== null && (
            <tr key={r.label} className="border-b border-border/50 last:border-0">
              <td className={`py-1 text-muted-foreground ${r.indent ? "pl-3" : ""}`}>
                {r.label}
              </td>
              <td className="py-1 text-right font-mono tabular-nums">
                {formatNumber(r.value)}{" "}
                <span className="text-muted-foreground text-xs">{r.unit}</span>
              </td>
            </tr>
          )
      )}
    </>
  );
}

function PortDetail({
  port,
  onDeselect,
}: {
  port: PortWithStats;
  onDeselect: () => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {port.prefectureName} {port.portName}港
        </CardTitle>
        {(port.portGrade || port.administrator) && (
          <p className="text-xs text-muted-foreground">
            {[port.portGrade, port.administrator].filter(Boolean).join(" / ")}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <table className="w-full text-sm">
          <tbody>
            <MetricSection
              title="船舶"
              rows={[
                { label: "入港隻数", value: port.shipsTotal, unit: "隻" },
                { label: "入港総トン数", value: port.shipsTonnage, unit: "総トン" },
              ]}
            />
            <MetricSection
              title="貨物"
              rows={[
                { label: "合計", value: port.cargoTotal, unit: "トン" },
                { label: "輸出", value: port.cargoExport, unit: "トン", indent: true },
                { label: "輸入", value: port.cargoImport, unit: "トン", indent: true },
                { label: "移出", value: port.cargoCoastalOut, unit: "トン", indent: true },
                { label: "移入", value: port.cargoCoastalIn, unit: "トン", indent: true },
              ]}
            />
            <MetricSection
              title="旅客"
              rows={[
                { label: "合計", value: port.passengersTotal, unit: "人" },
                { label: "乗込", value: port.passengersBoarding, unit: "人", indent: true },
                { label: "上陸", value: port.passengersLanding, unit: "人", indent: true },
              ]}
            />
            <MetricSection
              title="コンテナ"
              rows={[
                { label: "トン数", value: port.containerTonnage, unit: "トン" },
              ]}
            />
            <MetricSection
              title="自動車航送"
              rows={[
                { label: "合計", value: port.vehicleFerryTotal, unit: "台" },
                { label: "トラック", value: port.vehicleFerryTruck, unit: "台", indent: true },
                { label: "乗用車", value: port.vehicleFerryCar, unit: "台", indent: true },
              ]}
            />
          </tbody>
        </table>
        <button
          type="button"
          className="mt-4 text-sm text-primary underline"
          onClick={onDeselect}
        >
          選択解除
        </button>
      </CardContent>
    </Card>
  );
}

function RankingTable({
  ports,
  metric,
  currentMetric,
  onSelectPort,
}: {
  ports: PortWithStats[];
  metric: MetricKey;
  currentMetric: { label: string; unit: string };
  onSelectPort: (code: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          {currentMetric.label} トップ30
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[460px] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8">#</TableHead>
                <TableHead>港湾</TableHead>
                <TableHead className="text-right">{currentMetric.unit}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ports.map((p, i) => (
                <TableRow
                  key={p.portCode}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onSelectPort(p.portCode)}
                >
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground mr-1">
                      {p.prefectureName}
                    </span>
                    {p.portName}
                    {p.portGrade && (
                      <span className="ml-1 text-[10px] text-muted-foreground">
                        ({p.portGrade.replace("港湾", "")})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatNumber(p[metric])}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
