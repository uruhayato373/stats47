"use client";

import { useState } from "react";

import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuSubButton,
} from "@stats47/components/atoms/ui/sidebar";
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { metricShortName } from "@stats47/ranking";

import Link from "@/components/atoms/SiteLink";
import { RailCard } from "@/components/surface";

import type { AreaType } from "@/features/area";
import { CategoryIcon } from "@/features/category";

import { trackRailClick } from "@/lib/analytics/events";

import { useBreakpoint } from "@/hooks/useBreakpoint";

import { RANK_GOLD_TEXT } from "../../utils/rank-medal.palette";

import { getSidebarDetail, type SidebarRankingItem } from "./select-sidebar-items";



const MAX_COLLAPSED_ITEMS = 7;

interface RankingSidebarClientProps {
    /** 選別済みのランキング項目リスト (Container が selectSidebarItems で最大 20 件に絞る) */
    items: SidebarRankingItem[];
    /** 現在表示中のランキングキー */
    rankingKey: string;
    /** 地域タイプ */
    areaType: AreaType;
    /** カテゴリ名 */
    categoryName?: string;
    /** カテゴリアイコン（lucideアイコン名） */
    categoryIcon?: string;
    /** カテゴリキー */
    categoryKey?: string;
    /** リンクのベースパス（デフォルト: "/ranking"） */
    linkPrefix?: string;
    /** カテゴリ一覧リンクのベースパス */
    categoryLinkPrefix?: string;
}

export function RankingSidebarClient({
    items,
    rankingKey,
    categoryName,
    categoryIcon,
    categoryKey,
    linkPrefix = "/ranking",
}: RankingSidebarClientProps) {
    const isDesktop = useBreakpoint("aboveLg");
    const [isExpanded, setIsExpanded] = useState(false);
    const effectiveExpanded = isDesktop || isExpanded;

    // 選別は Container (server) が済ませている。ここは表示件数の開閉だけを持つ
    const others = items;

    const displayOthers = effectiveExpanded
        ? others
        : others.slice(0, MAX_COLLAPSED_ITEMS);
    const hasMore = !isDesktop && others.length > MAX_COLLAPSED_ITEMS;

    if (others.length === 0) {
        return null;
    }

    return (
        <RailCard
            title={categoryName ?? "同カテゴリ"}
            icon={categoryIcon ? (
                <CategoryIcon categoryKey={categoryKey ?? ""} lucideIconName={categoryIcon} className="h-4 w-4 text-muted-foreground" />
            ) : undefined}
        >
                {/* 関連ランキング: テンプレートの SidebarMenu で描く */}
                {/* rail_click で計測するので、共通のクリック監視 (NavClickTracker) からは外す */}
                {/* SidebarMenuButton は SidebarProvider の context を必須にするため、context を読まない Sub 版を使う */}
                <SidebarGroup className="-mx-2 p-0">
                    <nav data-click-owner="rail">
                        <SidebarMenu>
                            {displayOthers.map((item, index) => {
                                const href = `${linkPrefix}/${item.rankingKey}`;
                                const detail = getSidebarDetail(item);
                                return (
                                    <SidebarMenuItem key={`${item.rankingKey}-${item.areaType}`}>
                                        <SidebarMenuSubButton
                                            title={metricShortName(item)}
                                            className="h-auto min-h-11 translate-x-0 py-1.5 sm:min-h-9"
                                            onClick={() =>
                                                trackRailClick({
                                                    widget: "related-rankings",
                                                    href,
                                                    slot: index + 1,
                                                    rankingKey,
                                                })
                                            }
                                            render={<Link href={href} />}
                                        >
                                            {/* 2 行で描く。SidebarMenuSubButton は最後の span を truncate するので div で包む */}
                                            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                <span className="line-clamp-1 leading-snug">
                                                    {metricShortName(item)}
                                                    {detail ? (
                                                        <span className="text-muted-foreground">
                                                            {" "}({detail})
                                                        </span>
                                                    ) : null}
                                                </span>
                                                {item.top1 ? (
                                                    <span className="line-clamp-1 text-xs leading-snug text-muted-foreground">
                                                        <span className={`font-semibold ${RANK_GOLD_TEXT}`}>
                                                            {item.top1.rank ?? 1}位
                                                        </span>{" "}
                                                        {item.top1.areaName}{" "}
                                                        {item.top1.value ? (
                                                            <span className="font-semibold text-foreground">
                                                                {item.top1.value}{formatUnitForDisplay(item.unit)}
                                                            </span>
                                                        ) : null}
                                                    </span>
                                                ) : null}
                                            </div>
                                        </SidebarMenuSubButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </nav>
                </SidebarGroup>

                {/* もっと見る / 折りたたむ */}
                {hasMore && (
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="block w-full text-xs text-primary hover:text-primary/80 font-medium text-center py-1 transition-colors"
                    >
                        {isExpanded
                            ? "折りたたむ"
                            : `もっと見る（残り${others.length - MAX_COLLAPSED_ITEMS}件）`}
                    </button>
                )}
        </RailCard>
    );
}
