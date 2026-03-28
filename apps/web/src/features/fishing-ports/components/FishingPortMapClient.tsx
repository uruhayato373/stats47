"use client";

import { useState, useMemo } from "react";

import dynamic from "next/dynamic";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@stats47/components/atoms/ui/select";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@stats47/components/atoms/ui/table";
import { useTheme } from "next-themes";

import type { FishingPortData } from "../lib/load-fishing-port-data";

const FishingPortLeafletMap = dynamic(() => import("./FishingPortLeafletMap"), {
  ssr: false,
  loading: () => <Skeleton className="h-[500px] w-full rounded-lg" />,
});

const PORT_TYPES = [
  { value: "all", label: "全種別" },
  { value: "5", label: "特定第3種漁港" },
  { value: "3", label: "第3種漁港" },
  { value: "2", label: "第2種漁港" },
  { value: "4", label: "第4種漁港" },
  { value: "1", label: "第1種漁港" },
];

interface Props {
  ports: FishingPortData[];
  stats: {
    total: number;
    byType: Array<{ typeName: string; count: number }>;
    byPrefecture: Array<{ prefectureName: string; count: number }>;
  };
}

export function FishingPortMapClient({ ports, stats }: Props) {
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedPort, setSelectedPort] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();

  const selectedType = typeFilter === "all" ? null : typeFilter;

  const selectedPortData = useMemo(
    () => ports.find((p) => p.portCode === selectedPort),
    [ports, selectedPort]
  );

  const filteredPorts = useMemo(() => {
    if (!selectedType) return ports;
    return ports.filter((p) => p.portType === selectedType);
  }, [ports, selectedType]);

  // 都道府県別集計（フィルタ後）
  const prefCounts = useMemo(() => {
    const map = new Map<string, { name: string; count: number }>();
    for (const p of filteredPorts) {
      const entry = map.get(p.prefectureCode) || {
        name: p.prefectureName,
        count: 0,
      };
      entry.count++;
      map.set(p.prefectureCode, entry);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [filteredPorts]);

  return (
    <div className="space-y-4">
      {/* フィルタ */}
      <div className="flex items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PORT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredPorts.length.toLocaleString()} 港
        </span>
      </div>

      {/* 種別凡例 */}
      <div className="flex flex-wrap gap-3 text-xs">
        {stats.byType.map(({ typeName, count }) => (
          <span key={typeName} className="text-muted-foreground">
            {typeName}: {count}
          </span>
        ))}
      </div>

      {/* 地図 + サイドパネル */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-lg">
              <FishingPortLeafletMap
                ports={ports}
                selectedType={selectedType}
                selectedPort={selectedPort}
                onSelectPort={setSelectedPort}
                isDark={resolvedTheme === "dark"}
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {selectedPortData ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {selectedPortData.portName}漁港
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">都道府県</dt>
                    <dd className="font-medium">
                      {selectedPortData.prefectureName}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">種別</dt>
                    <dd className="font-medium">
                      {selectedPortData.portTypeName}
                    </dd>
                  </div>
                  {selectedPortData.administratorName && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">管理者</dt>
                      <dd className="font-medium">
                        {selectedPortData.administratorName}
                      </dd>
                    </div>
                  )}
                </dl>
                <button
                  type="button"
                  className="mt-4 text-sm text-primary underline"
                  onClick={() => setSelectedPort(null)}
                >
                  選択解除
                </button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  都道府県別 漁港数
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[460px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8">#</TableHead>
                        <TableHead>都道府県</TableHead>
                        <TableHead className="text-right">漁港数</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prefCounts.map((p, i) => (
                        <TableRow key={p.name}>
                          <TableCell className="text-muted-foreground">
                            {i + 1}
                          </TableCell>
                          <TableCell>{p.name}</TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {p.count}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
