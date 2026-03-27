"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";

import {
  DataTable,
} from "@stats47/components";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@stats47/components/atoms/ui/toggle-group";
import { rankByValue } from "@stats47/ranking";
import type { TopoJSONTopology } from "@stats47/types";
import { computeDeviationScores } from "@stats47/utils";
import { CityMapChart } from "@stats47/visualization/d3";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

interface CityRankingItem {
  rankingKey: string;
  title: string;
  unit: string;
}

interface CityRankingValue {
  areaCode: string;
  areaName: string;
  value: number;
  unit: string;
}

interface Props {
  areaCode: string;
  prefName: string;
  categoryKey: string;
  categoryItems: CityRankingItem[];
  selectedRankingKey: string;
  rankingValues: CityRankingValue[];
  topology?: TopoJSONTopology | null;
}

type CityRankingRow = {
  rank: number;
  areaCode: string;
  areaName: string;
  value: number;
  unit: string;
  deviationValue: number | null;
};

export function CityRankingSection({
  areaCode,
  prefName,
  categoryKey,
  categoryItems,
  selectedRankingKey,
  rankingValues,
  topology,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const selectedItem = categoryItems.find(
    (item) => item.rankingKey === selectedRankingKey
  );

  const processedData = useMemo<CityRankingRow[]>(() => {
    if (rankingValues.length === 0) return [];

    const ranked = rankByValue(rankingValues);
    const values = ranked.map((v) => v.value);
    const deviations = computeDeviationScores(values);

    return ranked.map((item, i) => ({
      rank: item.rank,
      areaCode: item.areaCode,
      areaName: item.areaName,
      value: item.value,
      unit: item.unit,
      deviationValue: deviations[i],
    }));
  }, [rankingValues]);

  const mapData = useMemo(
    () =>
      rankingValues.map((v) => ({
        areaCode: v.areaCode,
        value: v.value,
      })),
    [rankingValues]
  );

  const columns = useMemo<ColumnDef<CityRankingRow>[]>(
    () => [
      {
        accessorKey: "rank",
        header: "順位",
        meta: { width: "60px" },
        cell: ({ row }) => (
          <div className="text-center font-medium">
            {row.getValue("rank")}
          </div>
        ),
      },
      {
        accessorKey: "areaName",
        header: "",
        meta: {
          filterable: true,
          filterPlaceholder: "市区町村名で検索...",
          width: "150px",
        },
        cell: ({ row }) => (
          <Link
            href={`/areas/${areaCode}/cities/${row.original.areaCode}`}
            className="font-medium text-primary hover:underline"
          >
            {row.original.areaName}
          </Link>
        ),
      },
      {
        accessorKey: "value",
        header: () => <div className="text-right">値</div>,
        cell: ({ row }) => {
          const unit = selectedItem?.unit || "";
          return (
            <div className="text-right font-mono whitespace-nowrap">
              {row.getValue<number>("value").toLocaleString("ja-JP")}
              {unit && (
                <span className="text-xs text-muted-foreground ml-1">
                  {unit}
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "deviationValue",
        header: "偏差値",
        meta: { width: "80px" },
        cell: ({ row }) => {
          const val = row.getValue<number | null>("deviationValue");
          return (
            <div className="text-right font-mono text-muted-foreground">
              {val === null ? "-" : val.toFixed(1)}
            </div>
          );
        },
      },
    ],
    [areaCode, selectedItem]
  );

  const handleRankingChange = (key: string) => {
    if (!key) return; // ToggleGroup で同じボタンを押した場合は空文字
    startTransition(() => {
      router.push(
        `/areas/${areaCode}/${categoryKey}?ranking=${key}`,
        { scroll: false }
      );
    });
  };

  if (categoryItems.length === 0) return null;

  return (
    <section className="space-y-4">
      {/* セクション見出し + 区切り線 */}
      <div className="border-t pt-6">
        <h2 className="text-lg font-bold">{prefName}の市区町村ランキング</h2>
      </div>

      {/* 指標切替タブ */}
      {categoryItems.length > 1 && (
        <ToggleGroup
          type="single"
          value={selectedRankingKey}
          onValueChange={handleRankingChange}
          className="flex flex-wrap gap-1.5 justify-start"
        >
          {categoryItems.map((item) => (
            <ToggleGroupItem
              key={item.rankingKey}
              value={item.rankingKey}
              className="text-xs px-3 py-1.5 rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary transition-all"
            >
              {item.title}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      )}

      {/* コンテンツ */}
      <div className="relative">
        {isPending && (
          <div className="absolute inset-0 z-10 bg-background/60 flex items-center justify-center backdrop-blur-[1px] rounded-xl">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/70" />
          </div>
        )}

        <div className={`grid gap-4 ${topology ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* 地図カード */}
          {topology && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {selectedItem?.title ?? "地図"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <CityMapChart
                  data={mapData}
                  colorConfig={{ colorSchemeType: "sequential" }}
                  topology={topology}
                  unit={selectedItem?.unit ?? ""}
                  onCityClick={(cityCode) => {
                    router.push(`/areas/${areaCode}/cities/${cityCode}`);
                  }}
                />
              </CardContent>
            </Card>
          )}

          {/* テーブルカード */}
          {processedData.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {selectedItem?.title ?? "ランキング"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DataTable
                  columns={columns}
                  data={processedData}
                  showIndex={false}
                  maxRows={10}
                  enableFiltering={true}
                  enableSorting={true}
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {selectedItem?.title ?? "ランキング"}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-8 text-center text-muted-foreground">
                データがありません
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
}
