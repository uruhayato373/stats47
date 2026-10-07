import "server-only";

import { ALL_PRODUCTS } from "../../../../packages/product-factory/src/catalog/products";
import { COCONALA_LISTINGS } from "../../../../config/paths.mjs";
import { readProductSales } from "./revenue";
import { cached, fileExists, hasError, readJson, TTL, wrap, type Wrapped } from "./state-io";
import { datasetPath } from "../../../../config/datasets.mjs";

/**
 * ココナラの出品状況 (読み取り専用)。
 * 公開状態の真実源は config/coconala-listings.json、商品設計の上流は product-factory のカタログ。
 * 両者を突き合わせ、カタログにあって出品台帳に無い商品を「未出品」として出す。
 */

const LISTINGS = COCONALA_LISTINGS;
/**
 * 閲覧数・お気に入り数。CI の authenticated-measurement.yml (marketplace-status.mjs) が毎日「サービス別分析」を読み、
 * 暗号化 private R2 に置く。ローカルへは `npm run measurement:restore -- coconala` (要 MEASUREMENT_VAULT_KEY) で復元する。
 * 全サービスの合計が口座全体の値と一致したとき (coverage.complete) だけ使う。
 */
const RESTORED = ".local/authenticated-measurement/restored/coconala.json";

type RestoredCoconala = {
  generatedAt: string;
  records: Array<{ id: string; period: { start: string; end: string }; views: number; favorites: number }>;
  analytics: { views: number; period: { start: string; end: string } };
  coverage?: { complete?: boolean };
};

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
  /** 最新の閲覧数の記録 (過去30日)。記録が無ければ null (= 未計測) */
  views: { views: number; favorites: number; periodEnd: string } | null;
}

export interface CoconalaSummary {
  rows: CoconalaRow[];
  listed: number;
  draft: number;
  unlisted: number;
  /** 販売台帳が読めないときの理由 (読めたら null) */
  salesError: string | null;
  /** 閲覧数の集計 (過去30日・口座全体)。復元ファイルが無い・不完全なら null */
  viewsTotal: { views: number; start: string; end: string; observedAt: string } | null;
  source: string;
}

export function coconalaSummary(): Wrapped<CoconalaSummary> {
  return cached("coconala", TTL.daily, () =>
    wrap(() => {
      const { listings } = readJson<{ listings: Record<string, RawListing> }>(LISTINGS);
      const ledger = readProductSales();
      const restored = fileExists(RESTORED) ? readJson<RestoredCoconala>(RESTORED) : null;
      const measured = restored?.coverage?.complete === true ? restored : null;
      const viewsOf = (id: string): CoconalaRow["views"] => {
        const r = measured?.records.find((x) => x.id === id);
        return r ? { views: r.views, favorites: r.favorites, periodEnd: r.period.end } : null;
      };
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
        views: viewsOf(id),
      }));
      const unlistedRows: CoconalaRow[] = ALL_PRODUCTS.filter((p) => !(p.id in listings)).map((p) => ({
        id: p.id,
        title: p.name,
        priceYen: null,
        state: "unlisted",
        serviceUrl: null,
        listedAt: null,
        sales: salesOf(p.id),
        views: viewsOf(p.id),
      }));
      const rows = [...listedRows, ...unlistedRows].sort((a, b) => a.id.localeCompare(b.id));
      const count = (state: CoconalaRow["state"]) => rows.filter((r) => r.state === state).length;
      return {
        rows,
        listed: count("listed"),
        draft: count("draft"),
        unlisted: count("unlisted"),
        salesError: hasError(ledger) ? ledger.error : null,
        viewsTotal: measured
          ? { views: measured.analytics.views, start: measured.analytics.period.start, end: measured.analytics.period.end, observedAt: measured.generatedAt }
          : null,
        source: `${LISTINGS} + packages/product-factory/src/catalog/products + ${datasetPath("sales.ledger")} + ${RESTORED}`,
      };
    }),
  );
}
