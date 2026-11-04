import "server-only";

import { datasetPath } from "../../../../config/datasets.mjs";
import { fileExists, readJson } from "./state-io";

/** 商品の台帳の読み込み。build-product-ledger.mjs が作った記録と、人が書く商品戦略の台帳を読む */

export const PRODUCT_LEDGER_PATH = datasetPath("products.ledger");
export const PRODUCT_STRATEGY_PATH = datasetPath("products.strategy");

export type ProductLineSummary = {
  id: string;
  name: string;
  stance: "price-test" | "keep" | "hold" | "stop";
  products: number;
  priceMinYen: number | null;
  priceMaxYen: number | null;
  pageViews: number | null;
  salesYen: number | null;
  nextReviewOn: string;
  reviewDue: boolean;
};

export type ProductLedger = {
  asOf: string;
  notePeriod: { start: string; end: string } | null;
  lines: ProductLineSummary[];
  experiments: { id: string; status: string; reviewOn: string; due: boolean }[];
  unassigned: string[];
};

export type ProductStrategy = {
  lines: { id: string; audience: string; harm: string; payReason: string; priceRule: string; demandEvidence: string }[];
  decisions: { date: string; topic: string; decision: string; reason: string }[];
  agenda: { topic: string; question: string; evidenceNeeded: string }[];
};

export function readProductLedger() {
  return {
    ledger: fileExists(PRODUCT_LEDGER_PATH) ? readJson<ProductLedger>(PRODUCT_LEDGER_PATH) : null,
    strategy: fileExists(PRODUCT_STRATEGY_PATH) ? readJson<ProductStrategy>(PRODUCT_STRATEGY_PATH) : null,
  };
}
