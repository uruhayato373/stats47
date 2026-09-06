/**
 * リリース台帳 (catalog-status) の再生成。
 * `.claude/state/products/catalog-status.json` に、設計・公開記録・固定納品版・残工程を分離して書く。
 * 購入者情報・メッセージ本文・売上は保存しない (販売実績は別途 sales-ledger)。
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_PRODUCTS } from "../catalog/products";
import { buildSalesCatalog, renderSalesCsv, renderSalesHtml } from "./sales-catalog";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
const STATE_PATH = resolve(REPO_ROOT, ".claude/state/products/catalog-status.json");

export function writeReport(generatedAt = new Date().toISOString(), opts: { kindleVersion?: string; noteRevision?: string } = {}): string {
  const catalog = buildSalesCatalog(REPO_ROOT, generatedAt, opts.kindleVersion, opts.noteRevision);
  const products = ALL_PRODUCTS.map((p) => ({
    id: p.id,
    theme: p.theme,
    name: p.name,
    catalogStatus: p.status,
    buildStatus: catalog.offers.find(o => o.id === p.id)!.buildStatus,
  }));
  const report = {
    ...catalog,
    generatedAt,
    total: catalog.offers.length,
    packCount: products.length,
    note: "商品定義TSと出品記録を結合した派生カタログ。公開記録と改訂版の品質は別管理。生成済みを販売準備完了としない。",
    products,
  };
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(report, null, 2) + "\n");
  const out = join(REPO_ROOT, ".local/product-portfolio");
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "catalog.csv"), renderSalesCsv(catalog));
  writeFileSync(join(out, "catalog.html"), renderSalesHtml(catalog));
  return STATE_PATH;
}
