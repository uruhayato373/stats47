import type { AreaType } from "@/features/area";
import { isOk } from "@stats47/types";
import { findRankingItem, findRankingItemsByCategory } from "@stats47/ranking/server";
import { findCategoryByKey } from "@/features/category/server";
import { RankingSidebarClient } from "./RankingSidebarClient";

/**
 * RankingSidebarContainer のProps型定義
 */
export interface RankingSidebarContainerProps {
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
        const itemResult = await findRankingItem(rankingKey, areaType);
        if (!isOk(itemResult) || !itemResult.data?.categoryKey) {
            return null;
        }
        categoryKey = itemResult.data.categoryKey;
    }

    // 2. カテゴリ名とランキングアイテムを並列取得
    const [catResult, result] = await Promise.all([
        findCategoryByKey(categoryKey),
        findRankingItemsByCategory(categoryKey),
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

    // 4. areaType でフィルタリング
    const items = result.data.filter(
        (item) => item.areaType === areaType
    );

    if (items.length === 0) {
        return null;
    }

    return (
        <RankingSidebarClient
            {...commonProps}
            categoryName={categoryName}
            categoryIcon={categoryIcon}
            categoryKey={categoryKey}
            items={items.map((item) => ({
                rankingKey: item.rankingKey,
                areaType: item.areaType,
                title: item.title,
                subtitle: item.subtitle,
            }))}
        />
    );
}
