export interface ListingCopyInput {
  readonly hook: string;
  readonly points: readonly string[];
  readonly forWhom: readonly string[];
}
export interface ListingFacts {
  readonly figures: number;
  readonly fullTables: number;
}
export declare function renderListingDescription(copy: ListingCopyInput, facts: ListingFacts, disclaimer?: string): string;
