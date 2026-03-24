/**
 * 子要素（サブカテゴリ）とランキングキーを紐付けるための抽象型
 */
export interface ItemWithId {
  id: string;
}

/**
 * 親要素（カテゴリ）
 */
export interface ParentWithChildren<T extends ItemWithId> {
  id: string;
  children?: T[];
}

/**
 * 変換後の子要素
 */
export interface ChildWithRankingKey<T extends ItemWithId> {
  data: T;
  rankingKey: string;
}

/**
 * 変換後の親要素
 */
export interface ParentWithRankings<P extends ItemWithId, C extends ItemWithId> {
  parent: P;
  children: ChildWithRankingKey<C>[];
}

/**
 * 階層構造を持つデータを、ランキングキーが紐付いた構造に変換する共通ロジック
 * 
 * @param parents - 親要素の配列
 * @param getChildren - 親から子を取得する関数
 * @param getRankingKey - 子からランキングキーを取得する（非同期）関数
 * @returns ランキングキーが紐付いた階層データの配列
 */
export async function prepareHierarchicalRankings<
  P extends ItemWithId,
  C extends ItemWithId
>(
  parents: P[],
  getChildren: (parent: P) => C[] | undefined,
  getRankingKey: (childId: string) => Promise<string | null>
): Promise<ParentWithRankings<P, C>[]> {
  const result = await Promise.all(
    parents.map(async (parent) => {
      const children = getChildren(parent) || [];
      
      const childrenWithKeys = await Promise.all(
        children.map(async (child) => {
          const rankingKey = await getRankingKey(child.id);
          return { data: child, rankingKey };
        })
      );
      
      const validChildren = childrenWithKeys.filter(
        (c): c is ChildWithRankingKey<C> => c.rankingKey !== null
      );
      
      return {
        parent,
        children: validChildren,
      };
    })
  );
  
  return result.filter((r) => r.children.length > 0);
}
