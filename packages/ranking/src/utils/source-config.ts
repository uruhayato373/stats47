import { parseRecipe, type EstatQueryParams, type MetricRecipe } from "@stats47/data-configs";
import type { RankingItem } from "../types";
type SourceConfigLike = RankingItem["sourceConfig"];
/** The compiled recipe is the only source of query coordinates and declared operations. */
export function readRecipe(sourceConfig: SourceConfigLike): MetricRecipe | null {
 return parseRecipe(sourceConfig?.recipe);
}
export function isDerivedSource(sourceConfig: SourceConfigLike): boolean {
 return readRecipe(sourceConfig)?.derived === true;
}
/** Derived recipes must still be read from their R2 observations by the caller. */
export function resolveEstatParams(sourceConfig: SourceConfigLike): EstatQueryParams | null {
 return readRecipe(sourceConfig)?.estatParams ?? null;
}
