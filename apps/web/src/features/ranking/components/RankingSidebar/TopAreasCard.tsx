"use client";

import { useMemo } from "react";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { formatValueWithPrecision } from "@stats47/utils";
import { Crown, ChevronRight } from "lucide-react";

import type { RankingValue } from "@stats47/ranking";


interface TopAreasCardProps {
  rankingValues: RankingValue[];
  unit: string;
  decimalPlaces: number;
}

export function TopAreasCard({
  rankingValues,
  unit,
  decimalPlaces,
}: TopAreasCardProps) {
  const top5 = useMemo(
    () =>
      [...rankingValues]
        .filter((v) => v.areaCode !== "00000" && v.rank != null)
        .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
        .slice(0, 5),
    [rankingValues],
  );

  if (top5.length === 0) return null;

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <Crown className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground">
          上位の都道府県
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <nav className="flex flex-col gap-1">
          {top5.map((v) => (
            <Link
              key={v.areaCode}
              href={`/areas/${v.areaCode}`}
              className="group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-muted-foreground w-5 text-right shrink-0">
                  {v.rank}
                </span>
                <span className="text-sm truncate">{v.areaName}</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <span className="text-xs tabular-nums text-muted-foreground">
                  {formatValueWithPrecision(v.value, decimalPlaces)}
                  <span className="ml-0.5">{unit}</span>
                </span>
                <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}
