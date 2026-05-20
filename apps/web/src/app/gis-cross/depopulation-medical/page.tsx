// ISR 24h: 過疎地域・医療機関データは年次更新のため頻繁な再生成は不要。
export const revalidate = 86400;

import Link from "next/link";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@stats47/components/atoms/ui/breadcrumb";
import { fetchPrefectureTopology } from "@stats47/gis/geoshape";

import { DepopulationMedicalMapClient } from "@/features/depopulation-medical";
import { loadDepopulationMedicalSummary } from "@/features/depopulation-medical/server";

import type { TopoJSONTopology } from "@stats47/types";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "過疎地域と医療機関 | 統計で見る都道府県",
  description:
    "過疎地域に医療機関がどれだけあるかを都道府県別に可視化。国土数値情報の過疎地域データと医療機関データを空間結合し、過疎地域内の医療機関数・比率をランキングと地図で表示。",
  alternates: {
    canonical: "/gis-cross/depopulation-medical",
  },
};

export default async function DepopulationMedicalPage() {
  const summary = await loadDepopulationMedicalSummary();

  let topology: TopoJSONTopology | null = null;
  try {
    topology = await fetchPrefectureTopology();
  } catch {
    topology = null;
  }

  return (
    <div className="container mx-auto px-4 py-4 text-foreground">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">ホーム</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>過疎地域と医療機関</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          過疎地域と医療機関
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          過疎地域に医療機関がどれだけあるかを都道府県別に集計しました。
          地図の県をクリックすると、過疎地域（面）と医療機関（点）の重なりを詳細表示します。
        </p>
      </div>

      <DepopulationMedicalMapClient summary={summary} topology={topology} />

      <p className="text-xs text-muted-foreground mt-6">
        出典: 国土交通省 国土数値情報「過疎地域（A17）」「医療機関（P04）」。
        過疎地域内の医療機関数は、医療機関の座標が過疎地域ポリゴン内にあるかを
        空間結合（point-in-polygon）で判定して集計。
      </p>
    </div>
  );
}
