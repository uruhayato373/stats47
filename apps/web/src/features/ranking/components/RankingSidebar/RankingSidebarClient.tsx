"use client";

import { useState } from "react";

import { RailCard, RailLinkList, RailNavRow } from "@/components/surface";

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
                {/* 関連ランキング: コンパクトリスト */}
                <RailLinkList>
                    {displayOthers.map((item, index) => (
                        <RailNavRow
                            key={`${item.rankingKey}-${item.areaType}`}
                            href={`${linkPrefix}/${item.rankingKey}`}
                            title={item.readerLabel ?? item.title}
                            chevron={false}
                            onClick={() =>
                                trackRailClick({
                                    widget: "related-rankings",
                                    href: `${linkPrefix}/${item.rankingKey}`,
                                    slot: index + 1,
                                    rankingKey,
                                })
                            }
                        >
                            <span className="flex min-w-0 flex-col gap-0.5">
                                <span className="line-clamp-1 leading-snug">
                                    {item.readerLabel ?? item.title}
                                    {(() => {
                                        const detail = getSidebarDetail(item);
                                        return detail ? (
                                            <span className="text-muted-foreground">
                                                {" "}({detail})
                                            </span>
                                        ) : null;
                                    })()}
                                </span>
                                {item.top1 ? (
                                    <span className="line-clamp-1 text-xs leading-snug text-muted-foreground">
                                        <span className={`font-semibold ${RANK_GOLD_TEXT}`}>
                                            {item.top1.rank ?? 1}位
                                        </span>{" "}
                                        {item.top1.areaName}{" "}
                                        {item.top1.value ? (
                                            <span className="font-semibold text-foreground">
                                                {item.top1.value}{item.unit ?? ""}
                                            </span>
                                        ) : null}
                                    </span>
                                ) : null}
                            </span>
                        </RailNavRow>
                    ))}
                </RailLinkList>

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
