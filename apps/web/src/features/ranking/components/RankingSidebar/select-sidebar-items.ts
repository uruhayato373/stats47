/**
 * サイドバーの関連ランキング選別。
 *
 * React 非依存の純関数として切り出してある。サーバー (RankingSidebarContainer) が
 * 選別してから Client へ渡すため、カテゴリの全件 (最大 137 件 / 135KB) が RSC
 * payload へ直列化されない。2026-08-05 の監査で ranking HTML は非圧縮
 * 1,287,062 bytes あり、その主因の一つがこの全件直列化だった。
 */

/** サイドバーに必要な最小限のランキング項目型 */
export interface SidebarRankingItem {
    rankingKey: string;
    areaType: string;
    title: string;
    readerLabel?: string | null;
    subtitle?: string | null;
    demographicAttr?: string | null;
    normalizationBasis?: string | null;
    groupKey?: string | null;
    /** 最新年の「1 位」(items.json の top1)。mini 表示用。欠損時は text-first に縮退 */
    top1?: { rank?: number; areaName: string; value: string | null } | null;
    /** 値の単位 (top1 の値に付す)。 */
    unit?: string;
}

/** サーバー側で Client へ渡す上限。Client の展開時表示件数と一致させる */
export const MAX_SIDEBAR_ITEMS = 20;

/** 文字列の簡易ハッシュ（安定ソート用） */
export function hashString(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        const c = s.charCodeAt(i);
        h = (h << 5) - h + c;
        h |= 0;
    }
    return h;
}

/**
 * 現在ページと同グループを除外し、各グループから代表1件のみ表示。
 * 同タイトル優先・安定ソートで関連アイテムを選別する。
 * 同グループのアイテムは RelatedGroupCard で表示するため、ここでは重複を避ける。
 */
export function selectSidebarItems<T extends SidebarRankingItem>(
    items: T[],
    rankingKey: string,
    areaType: string,
    max: number = MAX_SIDEBAR_ITEMS
): T[] {
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
    const groupMap = new Map<string, T>();
    const rest: T[] = [];
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
