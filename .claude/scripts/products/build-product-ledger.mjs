#!/usr/bin/env node
/**
 * 商品の台帳を作り直す。入力は記事台帳・KDP の出品台帳・note の閲覧の記録・販売台帳・価格の履歴・商品戦略の台帳。
 * 出力は data/products/product-ledger.json と PRODUCT-LEDGER.md。どの商品群にも入らない商品があれば exit 1。
 * 呼び出し元: refresh-measurement-cycle.sh (土曜の計測と週次レビュー)。単独でも実行できる。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { datasetDir, datasetPath } from "../../../config/datasets.mjs";
import { buildLedger, collectProducts, renderLedgerMarkdown } from "./lib/product-ledger.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (path) => JSON.parse(readFileSync(join(ROOT, path), "utf8"));
const asOf = process.argv[2] ?? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Tokyo" }).format(new Date());

const strategy = read(datasetPath("products.strategy"));
const dashboardPath = `${datasetDir("note.dashboard")}/latest.json`;
const ledger = buildLedger({
  strategy,
  products: collectProducts({ articles: read(datasetPath("note.articles")).articles, listings: read(datasetPath("kdp.listings")).listings }),
  dashboard: existsSync(join(ROOT, dashboardPath)) ? read(dashboardPath) : null,
  salesObservations: read(datasetPath("sales.ledger")).observations,
  priceHistory: read(datasetPath("products.price-history")),
  asOf,
});
writeFileSync(join(ROOT, datasetPath("products.ledger")), `${JSON.stringify(ledger, null, 2)}\n`);
writeFileSync(join(ROOT, datasetPath("products.ledger-summary")), renderLedgerMarkdown(ledger, strategy));
console.log(`[product-ledger] 商品 ${ledger.products.length} 件・商品群 ${ledger.lines.length}・未分類 ${ledger.unassigned.length}`);
if (ledger.unassigned.length) {
  console.error(`どの商品群にも入らない商品: ${ledger.unassigned.join(", ")}`);
  process.exitCode = 1;
}
