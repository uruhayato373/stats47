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
        <>
            <div className="lg:hidden">
                <Tabs defaultValue="table" className="w-full">
                    <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="map" className="flex items-center gap-1.5">
                            <MapIcon className="w-4 h-4" />
                            地図
                        </TabsTrigger>
                        <TabsTrigger value="table" className="flex items-center gap-1.5">
                            <TableIcon className="w-4 h-4" />
                            テーブル
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="map" className="mt-4">
                        <RankingMapChartClient
                            rankingItem={activeRankingItem}
                            rankingValues={rankingValues}
                            areaType={areaType}
                            topology={topology ?? null}
                            headerActions={headerActions}
                            cardFooter={cardFooter}
                        />
                    </TabsContent>
                    <TabsContent value="table" className="mt-4">
                        <RankingDataTable
                            rankingValues={rankingValues}
                            rankingItem={rankingItem}
                            headerActions={headerActions}
                            cardFooter={cardFooter}
                        />
                    </TabsContent>
                </Tabs>
            </div>
            <div className="hidden lg:block">
                <div className="relative flex flex-col gap-4 xl:grid xl:grid-cols-2 xl:gap-4 xl:items-start">
                    {isPending && (
                        <div className="absolute inset-0 z-10 bg-background/50 flex items-center justify-center backdrop-blur-[1px]">
                            <Skeleton className="w-full h-full opacity-50" />
                        </div>
                    )}
                    <RankingMapChartClient
                        rankingItem={activeRankingItem}
                        rankingValues={rankingValues}
                        areaType={areaType}
                        topology={topology ?? null}
                        headerActions={headerActions}
                        cardFooter={cardFooter}
                    />
                    <RankingDataTable
                        rankingValues={rankingValues}
                        rankingItem={rankingItem}
                        headerActions={headerActions}
                        cardFooter={cardFooter}
                    />
                </div>
            </div>
        </>
    );
}
