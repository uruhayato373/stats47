import "server-only";

import { createSnapshotReader } from "@stats47/r2-storage/server";

/**
 * 楽天の商品・返礼品カタログ R2 snapshot リーダー。
 *
 * ★**なぜ実行時に楽天 API を呼ばないのか** (2026-08-04):
 *   楽天に申告した Expected QPS は **1**。一方 deploy-workers.yml の warm-cache は
 *   **sitemap の全 URL を順に叩く**ため、デプロイのたびに buildId が変わって ISR が
 *   総入れ替えになり、**646 ページ分の楽天 API 呼び出しがバースト**していた。
 *   429 で弾かれてもカードは `[]` に degrade して静かに消えるだけで気づけない。
 *   そこで日次 cron (GitHub Actions) で全品目を取得して R2 に焼き、ページは R2 だけを読む。
 *   鮮度は劣化しない (旧設計も ISR 24h だったため日次と同等)。
 *   完全DBレス方針 (docs/01_技術設計/02_データアーキテクチャ.md) とも整合する。
 *
 *   ★これが可能になったのは、楽天アプリの Allowed IP を `0.0.0.0/0` にしたため
 *   (それ以前は許可 IP を持つ端末からしか取得できなかった)。
 *   正典: .claude/rules/affiliate-ads-standards.md §12
 */

/** 配信に要るフィールドだけを持つ (R2 容量と転送量を抑える)。 */
export interface RakutenSnapshotItem {
  /** 商品名 */
  name: string;
  /** 遷移先。affiliateUrl があればそれ、無ければ itemUrl */
  url: string;
  price: number;
  image: string | null;
  reviewCount: number;
  reviewAverage: number;
}

export interface RakutenSnapshot {
  generatedAt: string;
  items: RakutenSnapshotItem[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseRakutenSnapshot(value: unknown): RakutenSnapshot {
  if (!isRecord(value)) throw new Error("rakuten snapshot must be an object");
  if (typeof value.generatedAt !== "string" || !Number.isFinite(Date.parse(value.generatedAt))) {
    throw new Error("rakuten snapshot generatedAt must be a valid date string");
  }
  if (!Array.isArray(value.items)) throw new Error("rakuten snapshot items must be an array");
  const items = value.items.map((item, index): RakutenSnapshotItem => {
    if (!isRecord(item)) throw new Error(`items[${index}] must be an object`);
    if (typeof item.name !== "string" || typeof item.url !== "string") {
      throw new Error(`items[${index}] name and url must be strings`);
    }
    if (item.image !== null && typeof item.image !== "string") {
      throw new Error(`items[${index}].image must be string or null`);
    }
    for (const field of ["price", "reviewCount", "reviewAverage"] as const) {
      if (!Number.isFinite(item[field])) {
        throw new Error(`items[${index}].${field} must be a finite number`);
      }
    }
    return {
      name: item.name,
      url: item.url,
      price: item.price as number,
      image: item.image,
      reviewCount: item.reviewCount as number,
      reviewAverage: item.reviewAverage as number,
    };
  });
  return { generatedAt: value.generatedAt, items };
}

/**
 * 品目 (例「納豆」) 単位の商品スナップショット。
 *
 * ★キーは **encodeURIComponent しない**。R2 のキーは UTF-8 をそのまま持てる。
 *   encode すると R2 上のキーが literal `%E3%82%...` になり、公開 URL
 *   (`storage.stats47.jp/...`) から引くときに HTTP 側が decode するため
 *   キーが一致せず 404 になる (= 目視・curl での検証手段を失う)。
 *   品目語 459 件に `/ \ ? # % 空白` は 1 つも含まれないことを確認済み。
 */
export const rakutenItemsKey = (term: string) => `app/rakuten/items/${term}.json`;

/** 都道府県コード (例「13000」) 単位のふるさと納税スナップショット。 */
export const rakutenFurusatoKey = (prefCode: string) => `app/rakuten/furusato/${prefCode}.json`;

const EMPTY: RakutenSnapshot = { generatedAt: new Date(0).toISOString(), items: [] };

/** 取得スクリプトが焼く前の元データ (rakuten-api の RakutenItem と同形の必要部分)。 */
interface RakutenApiItemLike {
  itemName: string;
  itemPrice: number;
  itemUrl: string;
  affiliateUrl?: string;
  mediumImageUrls: { imageUrl: string }[];
  smallImageUrls: { imageUrl: string }[];
  reviewCount: number;
  reviewAverage: number;
}

/**
 * API レスポンスを snapshot 形へ削る。**取得スクリプトと配信で形がズレないよう
 * ここを単一の実装とする** (sync 側に置くとテストできず、実際に落ちた)。
 *
 * url は **affiliateUrl を優先**する。itemUrl を使うとクリックが成果にならない。
 */
export function toSnapshotItems(items: RakutenApiItemLike[]): RakutenSnapshotItem[] {
  return items.map((it) => ({
    name: it.itemName,
    url: it.affiliateUrl ?? it.itemUrl,
    price: it.itemPrice,
    image: it.mediumImageUrls[0]?.imageUrl ?? it.smallImageUrls[0]?.imageUrl ?? null,
    reviewCount: it.reviewCount,
    reviewAverage: it.reviewAverage,
  }));
}

/** 47 都道府県コード ("01000".."47000")。取得スクリプトの対象列挙に使う。 */
export function allPrefCodes(): string[] {
  return Array.from({ length: 47 }, (_, i) => `${String(i + 1).padStart(2, "0")}000`);
}

/**
 * key ごとに reader を作る (品目数が多いので都度生成する)。
 * module-level キャッシュは持たない (r2-storage-design.md)。miss を恒久キャッシュしないため。
 */
function read(key: string, label: string): Promise<RakutenSnapshot> {
  return createSnapshotReader<RakutenSnapshot, RakutenSnapshot>({
    key,
    label,
    parse: parseRakutenSnapshot,
    select: (snapshot) => snapshot,
    fallback: EMPTY,
  })();
}

/** 品目名から商品カード用の商品を読む。未取得の品目では空配列 (カードを出さない)。 */
export async function readRakutenItemsFromR2(term: string): Promise<RakutenSnapshotItem[]> {
  const snap = await read(rakutenItemsKey(term), `rakuten-items:${term}`);
  return snap.items ?? [];
}

/** 都道府県コードからふるさと納税の返礼品を読む。未取得なら空配列 (静的リンクへ degrade)。 */
export async function readRakutenFurusatoFromR2(prefCode: string): Promise<RakutenSnapshotItem[]> {
  const snap = await read(rakutenFurusatoKey(prefCode), `rakuten-furusato:${prefCode}`);
  return snap.items ?? [];
}
