"use client";

import { useMemo, useState } from "react";

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
import { formatValueWithPrecision } from "@stats47/utils";
import { MapPin } from "lucide-react";

import type { RankingValue } from "@stats47/ranking";

interface PrefectureHighlightCardProps {
  rankingValues: RankingValue[];
  unit: string;
  decimalPlaces: number;
}

export function PrefectureHighlightCard({
  rankingValues,
  unit,
  decimalPlaces,
}: PrefectureHighlightCardProps) {
  const [selectedArea, setSelectedArea] = useState("");

  const areas = useMemo(
    () =>
      [...rankingValues]
        .filter((v) => v.areaCode !== "00000")
        .sort((a, b) => a.areaCode.localeCompare(b.areaCode)),
    [rankingValues],
  );

  const selected = useMemo(
    () => areas.find((v) => v.areaCode === selectedArea),
    [areas, selectedArea],
  );

  const total = areas.length;

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground">
          あなたの県は？
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <Select value={selectedArea} onValueChange={setSelectedArea}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="都道府県を選択" />
          </SelectTrigger>
          <SelectContent>
            {areas.map((v) => (
              <SelectItem key={v.areaCode} value={v.areaCode}>
                {v.areaName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selected && (
          <div className="mt-3 rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">
              {selected.areaName}
            </p>
            <p className="text-2xl font-bold tabular-nums">
              {selected.rank != null && (
                <span>
                  {selected.rank}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{total}位
                  </span>
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {formatValueWithPrecision(selected.value, decimalPlaces)}
              <span className="ml-0.5">{unit}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
