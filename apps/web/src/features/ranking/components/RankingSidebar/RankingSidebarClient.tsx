"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@stats47/components/atoms/ui/card";

import { cn } from "@stats47/components";

import { useBreakpoint } from "@/hooks/useBreakpoint";
import type { AreaType } from "@/features/area";



const MAX_COLLAPSED_ITEMS = 7;
const MAX_EXPANDED_ITEMS = 20;

/** サイドバーに必要な最小限のランキング項目型 */
export interface SidebarRankingItem {
    rankingKey: string;
    areaType: string;
    title: string;
    subtitle?: string | null;
}

/** 文字列の簡易ハッシュ（安定ソート用） */
function hashString(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        h = (h << 5) - h + c;
        h |= 0;
    }
    return h;
}

export interface RankingSidebarClientProps {
    /** ランキング項目リスト */
    items: SidebarRankingItem[];
    /** 現在表示中のランキングキー */
    rankingKey: string;
    /** 地域タイプ */
    areaType: AreaType;
    /** カテゴリ名 */
    categoryName?: string;
    /** カテゴリキー */
    categoryKey?: string;
    /** リンクのベースパス（デフォルト: "/ranking"） */
    linkPrefix?: string;
    /** カテゴリ一覧リンクのベースパス */
    categoryLinkPrefix?: string;
}

/**
 * 現在ページを除外し、同タイトル優先・安定ソートで関連アイテムを選別
 */
function selectSidebarItems(
    items: SidebarRankingItem[],
    rankingKey: string,
    areaType: string,
    max: number
): SidebarRankingItem[] {
    const currentItem = items.find(
        (i) => i.rankingKey === rankingKey && i.areaType === areaType
    );
    const rest = items.filter(
        (i) => !(i.rankingKey === rankingKey && i.areaType === areaType)
    );

    const currentTitle = currentItem?.title;
    const sameTitle = currentTitle
        ? rest.filter((i) => i.title === currentTitle)
        : [];
    const otherTitle = currentTitle
        ? rest.filter((i) => i.title !== currentTitle)
        : rest;

    const seed = `${rankingKey}-${areaType}`;
    const sortByHash = (a: SidebarRankingItem, b: SidebarRankingItem) =>
        hashString(seed + a.rankingKey) - hashString(seed + b.rankingKey);
    sameTitle.sort(sortByHash);
    otherTitle.sort(sortByHash);

    return [...sameTitle, ...otherTitle].slice(0, max);
}

export function RankingSidebarClient({
    items,
    rankingKey,
    areaType,
    categoryName,
    categoryKey,
    linkPrefix = "/ranking",
    categoryLinkPrefix,
}: RankingSidebarClientProps) {
    const isDesktop = useBreakpoint("aboveLg");
    const [isExpanded, setIsExpanded] = useState(false);
    const effectiveExpanded = isDesktop || isExpanded;

    const others = useMemo(
        () => selectSidebarItems(items, rankingKey, areaType, MAX_EXPANDED_ITEMS),
        [items, rankingKey, areaType]
    );

    const displayOthers = effectiveExpanded
        ? others
        : others.slice(0, MAX_COLLAPSED_ITEMS);
    const hasMore = !isDesktop && others.length > MAX_COLLAPSED_ITEMS;

    if (others.length === 0) {
        return null;
    }

    return (
        <Card className="h-full w-full overflow-hidden animate-in fade-in duration-500">
            <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {categoryName ? `${categoryName}のランキング` : "同カテゴリのランキング"}
                </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 pt-2 flex flex-col gap-0.5">
                {/* 関連ランキング: コンパクトリスト */}
                <nav className="flex flex-col gap-0.5">
                    {displayOthers.map((item) => (
                        <Link
                            key={`${item.rankingKey}-${item.areaType}`}
                            href={`${linkPrefix}/${item.rankingKey}`}
                            title={item.title}
                            className={cn(
                                "group flex items-center py-1.5 transition-colors",
                                "text-xs hover:text-primary"
                            )}
                        >
                            <span className="line-clamp-1 leading-snug">
                                {item.title}
                                {item.subtitle && (
                                    <span className="text-muted-foreground">
                                        {" "}({item.subtitle})
                                    </span>
                                )}
                            </span>
                        </Link>
                    ))}
                </nav>

                {/* もっと見る / 折りたたむ */}
                {hasMore && (
                    <button
                        type="button"
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-xs text-primary hover:text-primary/80 font-medium text-center py-1 transition-colors"
                    >
                        {isExpanded
                            ? "折りたたむ"
                            : `もっと見る（残り${others.length - MAX_COLLAPSED_ITEMS}件）`}
                    </button>
                )}

            </CardContent>
        </Card>
    );
}
