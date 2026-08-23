import { readRankingItemFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

import type { AreaType } from "@/features/area";
import { findCategoryByKey } from "@/features/category/server";
import { readRankingItemsByCategory } from "@/features/ranking/lib/cached-category-items";

import { RankingSidebarClient } from "./RankingSidebarClient";
import { MAX_SIDEBAR_ITEMS, selectSidebarItems } from "./select-sidebar-items";

/**
 * RankingSidebarContainer のProps型定義
 */
interface RankingSidebarContainerProps {
    /** ランキングキー */
    rankingKey: string;
    /** 地域タイプ */
    areaType: AreaType;
    /** カテゴリキー（page.tsx から注入、省略時は DB から取得） */
    categoryKey?: string;
}

/**
 * RankingSidebarContainer
 *
 * データをサーバー側で取得し、RankingSidebarClientに渡すコンテナコンポーネント
 */
export async function RankingSidebarContainer({
    rankingKey,
    areaType,
    categoryKey: categoryKeyProp,
}: RankingSidebarContainerProps) {
    const commonProps = { rankingKey, areaType };

    // categoryKey が渡されていない場合のみ DB から取得（後方互換）
    let categoryKey = categoryKeyProp;
    if (!categoryKey) {
        const itemResult = await readRankingItemFromR2(rankingKey, areaType);
        if (!isOk(itemResult) || !itemResult.data?.categoryKey) {
            return null;
        }
        categoryKey = itemResult.data.categoryKey;
    }

    // 2. カテゴリ名とランキングアイテムを並列取得
    const [catResult, result] = await Promise.all([
        findCategoryByKey(categoryKey),
        readRankingItemsByCategory(categoryKey),
    ]);

    if (!isOk(result)) {
        return null;
    }

    let categoryName: string | undefined;
    let categoryIcon: string | undefined;
    if (isOk(catResult) && catResult.data) {
        categoryName = catResult.data.categoryName;
        categoryIcon = catResult.data.icon ?? undefined;
    }

    // areaType は metrics から削除済み（全件 prefecture 相当）
    const items = result.data;

    if (items.length === 0) {
        return null;
    }

    // 選別をサーバー側で済ませ、Client へは表示に必要な最大 20 件だけ渡す。
    // カテゴリ全件 (最大 137 件 / 135KB) を props に載せると RSC payload へ
    // そのまま直列化される (2026-08-05 監査: ranking HTML 非圧縮 1,287,062 bytes)。
    const sidebarItems = selectSidebarItems(
        items.map((item) => ({
            rankingKey: item.rankingKey,
            areaType: "prefecture" as const,
            title: item.title,
            readerLabel: item.readerLabel,
            subtitle: item.subtitle,
            demographicAttr: item.demographicAttr,
            normalizationBasis: item.normalizationBasis,
            groupKey: item.groupKey,
            top1: item.top1 ?? null,
            unit: item.unit,
        })),
        rankingKey,
        areaType,
        MAX_SIDEBAR_ITEMS
    );

    if (sidebarItems.length === 0) {
        return null;
    }

    return (
        <RankingSidebarClient
            {...commonProps}
            categoryName={categoryName}
            categoryIcon={categoryIcon}
            categoryKey={categoryKey}
            items={sidebarItems}
        />
    );
}
