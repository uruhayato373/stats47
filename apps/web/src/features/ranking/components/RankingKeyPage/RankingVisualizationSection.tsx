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

import type { AreaType } from "@/features/area";

import { trackUiInteraction } from "@/lib/analytics/events";

import { RankingDataTable } from "../RankingDataTable";
import { RankingMapChartClient } from "../RankingMapChart/RankingMapChartClient";


import type { RankingItem, RankingValue } from "@stats47/ranking";

type VisualizationTab = "map" | "table";

/**
 * lg 未満: 選んでいない側を隠す (タブ切替として振る舞う)
 * lg 以上: タブ選択に関係なく両方表示する (地図とテーブルを並べる)
 *
 * hidden 属性ではなく Tailwind の `hidden` クラスで隠す。hidden 属性は preflight の
 * `[hidden]{display:none!important}` が lg の表示指定にレイヤー順で勝ち、PC でテーブルが消えていた。
 */
function panelClassName(isActive: boolean) {
    return cn("min-w-0", isActive ? "block" : "hidden lg:block");
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

    return (
        // 地図・テーブルとも各 1 インスタンスに保つ (地図を 2 つマウントすると Leaflet が二重に動く)。
        // lg 未満だけタブの切替を出し、パネルは className の切替で出し分ける。
        <div className="w-full">
            {/* 年の切替は地図とテーブルで共有するので 1 つだけ置く。狭い幅は同じ行にタブを並べる。 */}
            <div className="mb-4 flex items-center gap-2">
                <Tabs
                    value={activeTab}
                    className="min-w-0 flex-1 lg:hidden"
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
                            テーブル
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                {headerActions && <div className="ml-auto shrink-0">{headerActions}</div>}
            </div>
            <div className="relative flex flex-col gap-4 xl:grid xl:grid-cols-2 xl:items-start">
                {isPending && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 backdrop-blur-[1px]">
                        <Skeleton className="h-full w-full opacity-50" />
                    </div>
                )}
                <div className={panelClassName(activeTab === "map")}>
                    <RankingMapChartClient
                        rankingItem={activeRankingItem}
                        rankingValues={rankingValues}
                        areaType={areaType}
                        cardTitle={areaType === "city" ? "市区町村別の地図" : "都道府県別の地図"}
                        cardFooter={cardFooter}
                    />
                </div>
                <div className={panelClassName(activeTab === "table")}>
                    <RankingDataTable
                        rankingValues={rankingValues}
                        rankingItem={rankingItem}
                        cardTitle={areaType === "city" ? "市区町村別の表" : "都道府県別の表"}
                        cardFooter={cardFooter}
                    />
                </div>
            </div>
        </div>
    );
}
