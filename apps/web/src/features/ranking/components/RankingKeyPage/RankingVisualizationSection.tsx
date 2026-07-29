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
import {
    RankingDataTable,
    RankingMapChartClient,
} from "@/features/ranking";

import type { RankingItem, RankingValue } from "@stats47/ranking";
import type { TopoJSONTopology } from "@stats47/types";

/**
 * lg 未満: 非アクティブなタブ内容を隠す (タブ切替として振る舞う)
 * lg 以上: タブ選択に関係なく両方表示する (地図とテーブルを並べる)
 */
const CONTENT_CLASS =
    "mt-0 min-w-0 data-[state=inactive]:hidden lg:data-[state=inactive]:block";

interface RankingVisualizationSectionProps {
    rankingItem: RankingItem;
    activeRankingItem: RankingItem;
    rankingValues: RankingValue[];
    areaType: AreaType;
    topology?: TopoJSONTopology | null;
    headerActions?: ReactNode;
    cardFooter?: ReactNode;
    isPending?: boolean;
}

export function RankingVisualizationSection({
    rankingItem,
    activeRankingItem,
    rankingValues,
    areaType,
    topology,
    headerActions,
    cardFooter,
    isPending = false,
}: RankingVisualizationSectionProps) {
    return (
        // Tabs は 1 本だけ置く。地図・テーブルとも各 1 インスタンスに保つため
        // forceMount + lg:block で「モバイル=タブ切替 / lg+=常時 2 枚」を CSS だけで両立する。
        // (旧実装は lg:hidden と hidden lg:block の 2 ブロックに分かれており、
        //  CSS で隠しているだけで DOM には両方存在した。地図を初期タブにすると
        //  デスクトップで Leaflet が 2 インスタンスマウントされてしまう)
        <Tabs defaultValue="map" className="w-full">
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
                {/* forceMount 時 Radix は hidden 属性を付けない (present が常に true になるため)。
                    表示制御は data-state で自前に行う: lg 未満は非アクティブを隠し、lg+ は常に 2 枚出す。 */}
                <TabsContent
                    forceMount
                    value="map"
                    className={CONTENT_CLASS}
                >
                    <RankingMapChartClient
                        rankingItem={activeRankingItem}
                        rankingValues={rankingValues}
                        areaType={areaType}
                        topology={topology ?? null}
                        headerActions={headerActions}
                        cardFooter={cardFooter}
                    />
                </TabsContent>
                <TabsContent
                    forceMount
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
