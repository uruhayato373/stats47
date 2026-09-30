import "server-only";

import { ALL_PRODUCTS } from "../../../../packages/product-factory/src/catalog/products";
import { cached, readJson, TTL, wrap, type Wrapped } from "./state-io";

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
}

export interface CoconalaSummary {
  rows: CoconalaRow[];
  listed: number;
  draft: number;
  unlisted: number;
  source: string;
}

export function coconalaSummary(): Wrapped<CoconalaSummary> {
  return cached("coconala", TTL.daily, () =>
    wrap(() => {
      const { listings } = readJson<{ listings: Record<string, RawListing> }>(LISTINGS);
      const listedRows: CoconalaRow[] = Object.entries(listings).map(([id, row]) => ({
        id,
        title: row.title ?? id,
        priceYen: row.priceYen ?? null,
        state: row.status === "listed" && row.serviceUrl ? "listed" : "draft",
        serviceUrl: row.serviceUrl ?? null,
        listedAt: row.listedAt ?? null,
      }));
      const unlistedRows: CoconalaRow[] = ALL_PRODUCTS.filter((p) => !(p.id in listings)).map((p) => ({
        id: p.id,
        title: p.name,
        priceYen: null,
        state: "unlisted",
        serviceUrl: null,
        listedAt: null,
      }));
      const rows = [...listedRows, ...unlistedRows].sort((a, b) => a.id.localeCompare(b.id));
      const count = (state: CoconalaRow["state"]) => rows.filter((r) => r.state === state).length;
      return {
        rows,
        listed: count("listed"),
        draft: count("draft"),
        unlisted: count("unlisted"),
        source: `${LISTINGS} + packages/product-factory/src/catalog/products`,
      };
    }),
  );
}
