export interface ListingCopyInput {
  readonly hook: string;
  readonly points: readonly string[];
  readonly forWhom: readonly string[];
  /** 家計調査以外で県全体でない値を載せる本の断り書き。【データの範囲】の末尾に入る */
  readonly scopeNote?: string;
  /** 比較の単位の 1 文目を差し替える (県庁所在市を比べる本など)。 */
  readonly scopeLead?: string;
  /** 【データについて】の末尾の 1 文を差し替える (1 つの統計で年をそろえた本)。 */
  readonly dataSourceLine?: string;
}
export interface ListingFacts {
  readonly figures: number;
  readonly fullTables: number;
  readonly chars?: number;
  /** 全県表の見出しから測った指標・年・単位。【全県の値を表で収録している指標】に入る */
  readonly fullTableIndicators: readonly { readonly label: string; readonly period: string; readonly unit: string }[];
  /** 家計調査の値が県庁所在市のものだという注記が本にあるか。【データの範囲】に入る */
  readonly householdCityValues: boolean;
}
export declare function dataScopeBlock(facts: ListingFacts, copy?: Pick<ListingCopyInput, "scopeNote" | "scopeLead">): string;
export declare function indicatorBlock(facts: ListingFacts): string;
export declare function renderListingDescription(copy: ListingCopyInput, facts: ListingFacts, disclaimer?: string): string;
