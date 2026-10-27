"use client";

import type { ReactNode } from "react";

import { Skeleton } from "@stats47/components/atoms/ui/skeleton";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@stats47/components/atoms/ui/tabs";
import { Map as MapIcon, Table as TableIcon } from "lucide-react";

import type { AreaType } from "@/features/area";

import { trackUiInteraction } from "@/lib/analytics/events";

import { RankingDataTable } from "../RankingDataTable";
import { RankingMapChartClient } from "../RankingMapChart/RankingMapChartClient";


import type { RankingItem, RankingValue } from "@stats47/ranking";

/**
 * lg 未満: 非アクティブなタブ内容を隠す (タブ切替として振る舞う)
 * lg 以上: タブ選択に関係なく両方表示する (地図とテーブルを並べる)
 */
const CONTENT_CLASS =
    "mt-0 min-w-0 lg:data-[hidden]:block!";

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
    return (
        // Tabs は 1 本だけ置く。地図・テーブルとも各 1 インスタンスに保つため
        // keepMounted + lg:block で「モバイル=タブ切替 / lg+=常時 2 枚」を CSS だけで両立する。
        // (旧実装は lg:hidden と hidden lg:block の 2 ブロックに分かれており、
        //  CSS で隠しているだけで DOM には両方存在した。地図を初期タブにすると
        //  デスクトップで Leaflet が 2 インスタンスマウントされてしまう)
        <Tabs
            defaultValue="map"
            className="w-full"
            onValueChange={(value) => trackUiInteraction({ action: "tab_switch", target: value === "table" ? "table" : "map" })}
        >
            <TabsList className="w-full grid grid-cols-2 lg:hidden">
                <TabsTrigger value="map" className="flex items-center gap-1.5">
                    <MapIcon className="w-4 h-4" />
                    地図
                </TabsTrigger>
                <TabsTrigger value="table" className="flex items-center gap-1.5">
                    <TableIcon className="w-4 h-4" />
                    テーブル
                </TabsTrigger>
            </TabsList>
            <div className="relative mt-4 flex flex-col gap-4 xl:grid xl:grid-cols-2 xl:gap-4 xl:items-start">
                {isPending && (
                    <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-[1px]">
                        <Skeleton className="w-full h-full opacity-50" />
                    </div>
                )}
                {/* keepMounted の非アクティブなパネルには Base UI が hidden 属性 (と data-hidden) を付ける。
                    lg 未満はそのまま隠し、lg+ は常に 2 枚出す。Tailwind v4 の preflight は [hidden] を
                    display:none !important にするので、lg+ の表示指定にも ! (important) が要る。 */}
                <TabsContent
                    keepMounted
                    value="map"
                    className={CONTENT_CLASS}
                >
                    <RankingMapChartClient
                        rankingItem={activeRankingItem}
                        rankingValues={rankingValues}
                        areaType={areaType}
                        headerActions={headerActions}
                        cardFooter={cardFooter}
                    />
                </TabsContent>
                <TabsContent
                    keepMounted
                    value="table"
                    className={CONTENT_CLASS}
                >
                    <RankingDataTable
                        rankingValues={rankingValues}
                        rankingItem={rankingItem}
                        headerActions={headerActions}
                        cardFooter={cardFooter}
                    />
                </TabsContent>
            </div>
        </Tabs>
    );
}
