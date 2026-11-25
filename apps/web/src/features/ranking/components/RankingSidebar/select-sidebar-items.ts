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

/**
 * サイドバー1行に表示する補足テキストを決める。
 * subtitle が title をそのまま含む場合（家計調査系の「都道府県庁所在市の二人以上世帯の
 * 年間〜」等）は名称の言い換えに過ぎず一覧上の識別に使えないため除外し、
 * demographicAttr/normalizationBasis（男性/人口10万人あたり等の短い区分）へ縮退する。
 */
export function getSidebarDetail(
    item: Pick<SidebarRankingItem, "title" | "subtitle" | "demographicAttr" | "normalizationBasis">,
): string | null {
    const subtitle = item.subtitle?.trim();
    const isRedundant = !!subtitle && !!item.title && subtitle.includes(item.title);
    if (subtitle && !isRedundant) return subtitle;
    return (
        [item.demographicAttr, item.normalizationBasis].filter(Boolean).join("・") || null
    );
}

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
 * 右レールの関連ランキングを選ぶ。
 * - 同じ groupKey の指標 (関連する指標のまとまり。漁業の各指標・魚種別の漁獲量など) を先頭に置く
 * - 続いて同じ題、その他の順。各段の中は安定ソート
 *
 * 2026-11-25: 同じ指標の見方違いのページは親のページの計算方法へ統合した (ページを持たないキーは一覧の
 * 読み手 excludeGone が落とす)。それまでは同じグループを丸ごと除外し、グループから代表 1 件だけを残していた
 * (表示するはずの部品 RelatedGroupCard は実在せず、関連する指標へ行く入口が右レールに無かった)。
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

    const others = items.filter((i) => !(i.rankingKey === rankingKey && i.areaType === areaType));
    const sameGroup = currentGroupKey ? others.filter((i) => i.groupKey === currentGroupKey) : [];
    const rest = currentGroupKey ? others.filter((i) => i.groupKey !== currentGroupKey) : others;

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
    sameGroup.sort(sortByHash);
    sameTitle.sort(sortByHash);
    otherTitle.sort(sortByHash);

    return [...sameGroup, ...sameTitle, ...otherTitle].slice(0, max);
}
