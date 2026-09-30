import "server-only";

import { ALL_PRODUCTS } from "../../../../packages/product-factory/src/catalog/products";
import { readProductSales } from "./revenue";
import { cached, hasError, readJson, TTL, wrap, type Wrapped } from "./state-io";

/**
 * ココナラの出品状況 (読み取り専用)。
 * 公開状態の真実源は .claude/config/coconala-listings.json、商品設計の上流は product-factory のカタログ。
 * 両者を突き合わせ、カタログにあって出品台帳に無い商品を「未出品」として出す。
 */

const LISTINGS = ".claude/config/coconala-listings.json";

type RawListing = { title?: string; priceYen?: number; status?: string; serviceUrl?: string | null; listedAt?: string };

export interface CoconalaRow {
  id: string;
  title: string;
  priceYen: number | null;
  /** listed = 出品台帳で公開済み (serviceUrl あり) / draft = 台帳にあるが未公開 / unlisted = カタログのみ */
  state: "listed" | "draft" | "unlisted";
  serviceUrl: string | null;
  listedAt: string | null;
  /** 販売台帳 (sales-ledger.json) のこの商品の合計。記録が 1 件も無ければ null (= 未計測。0 件と区別する) */
  sales: { orders: number; units: number; netRevenueYen: number; latestPeriodEnd: string } | null;
}

export interface CoconalaSummary {
  rows: CoconalaRow[];
  listed: number;
  draft: number;
  unlisted: number;
  /** 販売台帳が読めないときの理由 (読めたら null) */
  salesError: string | null;
  source: string;
}

export function coconalaSummary(): Wrapped<CoconalaSummary> {
  return cached("coconala", TTL.daily, () =>
    wrap(() => {
      const { listings } = readJson<{ listings: Record<string, RawListing> }>(LISTINGS);
      const ledger = readProductSales();
      const salesOf = (id: string): CoconalaRow["sales"] => {
        if (hasError(ledger)) return null;
        const rows = ledger.observations.filter((o) => o.channel === "coconala" && o.productId === id);
        if (rows.length === 0) return null;
        return {
          orders: rows.reduce((sum, o) => sum + o.orders, 0),
          units: rows.reduce((sum, o) => sum + o.units, 0),
          netRevenueYen: rows.reduce((sum, o) => sum + o.netRevenueYen, 0),
          latestPeriodEnd: rows.reduce((max, o) => (o.periodEnd > max ? o.periodEnd : max), ""),
        };
      };
      const listedRows: CoconalaRow[] = Object.entries(listings).map(([id, row]) => ({
        id,
        title: row.title ?? id,
        priceYen: row.priceYen ?? null,
        state: row.status === "listed" && row.serviceUrl ? "listed" : "draft",
        serviceUrl: row.serviceUrl ?? null,
        listedAt: row.listedAt ?? null,
        sales: salesOf(id),
      }));
      const unlistedRows: CoconalaRow[] = ALL_PRODUCTS.filter((p) => !(p.id in listings)).map((p) => ({
        id: p.id,
        title: p.name,
        priceYen: null,
        state: "unlisted",
        serviceUrl: null,
        listedAt: null,
        sales: salesOf(p.id),
      }));
      const rows = [...listedRows, ...unlistedRows].sort((a, b) => a.id.localeCompare(b.id));
      const count = (state: CoconalaRow["state"]) => rows.filter((r) => r.state === state).length;
      return {
        rows,
        listed: count("listed"),
        draft: count("draft"),
        unlisted: count("unlisted"),
        salesError: hasError(ledger) ? ledger.error : null,
        source: `${LISTINGS} + packages/product-factory/src/catalog/products + .claude/state/products/sales-ledger.json`,
      };
    }),
  );
}
