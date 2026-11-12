/**
 * Correlation Package Entry Point (Client-safe)
 */

export * from "./utils";
export * from "./selection-policy";
export type { CorrelatedItem } from "./types/snapshot";
export {
  isExcludedCorrelationPair,
  isExcludedCorrelationKey,
} from "./trivial-pairs";
