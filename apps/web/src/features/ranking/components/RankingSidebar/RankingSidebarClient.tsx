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
import { CategoryIcon } from "@/features/category/components/CategoryIcon";
import type { AreaType } from "@/features/area";



const MAX_COLLAPSED_ITEMS = 7;
const MAX_EXPANDED_ITEMS = 20;

/** サイドバーに必要な最小限のランキング項目型 */
export interface SidebarRankingItem {
    rankingKey: string;
    areaType: string;
    title: string;
    subtitle?: string | null;
    demographicAttr?: string | null;
    normalizationBasis?: string | null;
    groupKey?: string | null;
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
    /** カテゴリアイコン（lucideアイコン名） */
    categoryIcon?: string;
    /** カテゴリキー */
    categoryKey?: string;
    /** リンクのベースパス（デフォルト: "/ranking"） */
    linkPrefix?: string;
    /** カテゴリ一覧リンクのベースパス */
    categoryLinkPrefix?: string;
}

/**
 * 現在ページと同グループを除外し、各グループから代表1件のみ表示。
 * 同タイトル優先・安定ソートで関連アイテムを選別する。
 * 同グループのアイテムは RelatedGroupCard で表示するため、ここでは重複を避ける。
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
    const currentGroupKey = currentItem?.groupKey;

    // 現在ページ自身と、同グループのアイテムを除外
    const filtered = items.filter((i) => {
        if (i.rankingKey === rankingKey && i.areaType === areaType) return false;
        if (currentGroupKey && i.groupKey === currentGroupKey) return false;
        return true;
    });

    // 各グループから代表1件のみ残す（groupKey がないものはそのまま）
    // 代表 = ranking_key が groupKey と一致するもの（総数）
    // 代表がカテゴリ内に存在しない場合はグループごと非表示（別カテゴリに総数がある）
    const groupMap = new Map<string, SidebarRankingItem>();
    const rest: SidebarRankingItem[] = [];
    for (const i of filtered) {
        if (!i.groupKey) {
            rest.push(i);
            continue;
        }
        const existing = groupMap.get(i.groupKey);
        if (!existing) {
            groupMap.set(i.groupKey, i);
        } else {
            const iIsRepresentative = i.rankingKey === i.groupKey;
            const existingIsRepresentative = existing.rankingKey === existing.groupKey;
            if (iIsRepresentative && !existingIsRepresentative) {
                groupMap.set(i.groupKey, i);
            } else if (!existingIsRepresentative && !iIsRepresentative && !i.normalizationBasis && existing.normalizationBasis) {
                groupMap.set(i.groupKey, i);
            }
        }
    }
    // 代表（normalizationBasis なし）のみ表示。非代表しかない場合は除外
    for (const [, item] of groupMap) {
        if (!item.normalizationBasis || item.rankingKey === item.groupKey) {
            rest.push(item);
        }
    }

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
    categoryIcon,
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
                {categoryIcon && (
                    <CategoryIcon categoryKey={categoryKey ?? ""} lucideIconName={categoryIcon} className="h-4 w-4 text-muted-foreground" />
                )}
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {categoryName ?? "同カテゴリ"}
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
                                {(() => {
                                    const detail = item.subtitle
                                        || [item.demographicAttr, item.normalizationBasis].filter(Boolean).join("・")
                                        || null;
                                    return detail ? (
                                        <span className="text-muted-foreground">
                                            {" "}({detail})
                                        </span>
                                    ) : null;
                                })()}
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
