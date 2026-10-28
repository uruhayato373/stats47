"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@stats47/components";
import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@stats47/components/atoms/ui/tabs";
import { Map as MapIcon, Table as TableIcon } from "lucide-react";

import { ChartPanel } from "@/components/charts/ChartPanel";

import type { AreaType } from "@/features/area";

import { trackUiInteraction } from "@/lib/analytics/events";

import { RankingDataTable } from "../RankingDataTable";
import { RankingMapChartClient } from "../RankingMapChart/RankingMapChartClient";


import type { RankingItem, RankingValue } from "@stats47/ranking";

type VisualizationTab = "map" | "table";

/**
 * 狭い幅: 選んでいない側を隠す (タブ切替として振る舞う)。広い幅: タブ選択に関係なく両方表示する。
 *
 * hidden 属性ではなく Tailwind の `hidden` クラスで隠す。hidden 属性は preflight の
 * `[hidden]{display:none!important}` が表示指定にレイヤー順で勝ち、両方を並べる幅で表が消えていた。
 */
function panelClassName(isActive: boolean, className: string) {
    return cn("min-w-0", isActive ? "block" : "hidden @min-[640px]/viz:block", className);
}

interface RankingVisualizationSectionProps {
    rankingItem: RankingItem;
    activeRankingItem: RankingItem;
    rankingValues: RankingValue[];
    areaType: AreaType;
    headerActions?: ReactNode;
    cardFooter?: ReactNode;
    isPending?: boolean;
}

/**
 * 地図と表を 1 枚の枠に描く。見出し・年の選択・出典は 1 回だけ置く (2026-10-28 までは地図と表が別々の
 * カードで、見出しと年の選択が 2 つずつ並んでいた)。
 *
 * 並べ方は画面の幅ではなく部品の幅 (@container/viz) で決める: 640px (地図 260px + 表 380px) 以上は
 * 「地図 | 表」の横並び (840px からは地図を 460px に止める)、未満 (スマホ) はタブで切り替える。サイドバーの開閉や右レールの有無に関係なく並びが決まる。
 * Tailwind はソースの文字列からクラスを作るので、境界の @min-[640px]/viz は組み立てずに書く。
 * 地図は表と同じ高さに伸び、表の右には線を 1 本だけ引く (カードどうしの余白を置かない)。
 */
export function RankingVisualizationSection({
    rankingItem,
    activeRankingItem,
    rankingValues,
    areaType,
    headerActions,
    cardFooter,
    isPending = false,
}: RankingVisualizationSectionProps) {
    const [activeTab, setActiveTab] = useState<VisualizationTab>("map");
    const unitLabel = areaType === "city" ? "市区町村" : "都道府県";

    return (
        <ChartPanel
            title={`${unitLabel}別の地図と表`}
            icon={<MapIcon />}
            action={headerActions}
            footer={cardFooter}
            // 地図を枠の端まで描く: 横は px-0!、上下は Card の gap-4 / pb-4 を外して見出しの下線と出典の上線に接する
            className="gap-0! pb-0!"
            contentClassName="px-0!"
        >
            {/* 地図・表とも各 1 インスタンスに保つ (地図を 2 つマウントすると Leaflet が二重に動く)。
                狭い幅だけタブの切替を出し、パネルは className の切替で出し分ける。 */}
            <div className="@container/viz relative w-full">
                <Tabs
                    value={activeTab}
                    className="border-b px-4 py-2 @min-[640px]/viz:hidden"
                    onValueChange={(value) => {
                        const next: VisualizationTab = value === "table" ? "table" : "map";
                        setActiveTab(next);
                        trackUiInteraction({ action: "tab_switch", target: next });
                    }}
                >
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="map" className="flex items-center gap-1.5">
                            <MapIcon className="size-4" aria-hidden="true" />
                            地図
                        </TabsTrigger>
                        <TabsTrigger value="table" className="flex items-center gap-1.5">
                            <TableIcon className="size-4" aria-hidden="true" />
                            表
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                {isPending && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                        <Skeleton className="h-full w-full opacity-50" />
                    </div>
                )}
                {/* 地図は表と同じ高さ (約 450px) で、日本は縦長なので幅は 460px あれば収まる。それより広げても左右の海が増えるだけなので、
                    部品が 840px (地図 460px + 表 380px) を超えたら地図を 460px に止め、残りを表に回す (表の列は比率どおりに伸びる) */}
                <div className="@min-[640px]/viz:grid @min-[640px]/viz:grid-cols-[minmax(0,1fr)_380px] @min-[840px]/viz:grid-cols-[460px_minmax(0,1fr)]">
                    {/* 狭い幅は地図だけを 420px で描く。並べる幅では表と同じ高さに伸ばす (最低 440px) */}
                    <div className={panelClassName(activeTab === "map", "h-[420px] @min-[640px]/viz:h-auto @min-[640px]/viz:min-h-[440px]")}>
                        <RankingMapChartClient
                            rankingItem={activeRankingItem}
                            rankingValues={rankingValues}
                            areaType={areaType}
                            bare
                            mapClassName="h-full"
                        />
                    </div>
                    <div className={panelClassName(activeTab === "table", "px-2.5 py-2 @min-[640px]/viz:border-l")}>
                        <RankingDataTable
                            rankingValues={rankingValues}
                            rankingItem={rankingItem}
                            bare
                        />
                    </div>
                </div>
            </div>
        </ChartPanel>
    );
}
