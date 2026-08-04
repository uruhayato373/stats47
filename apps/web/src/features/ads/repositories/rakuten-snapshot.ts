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
 *   完全DBレス方針 (docs/01_技術設計/12_完全DBレス設計.md) とも整合する。
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

/** 品目 (例「納豆」) 単位の商品スナップショット。 */
export const rakutenItemsKey = (term: string) =>
  `app/rakuten/items/${encodeURIComponent(term)}.json`;

/** 都道府県コード (例「13000」) 単位のふるさと納税スナップショット。 */
export const rakutenFurusatoKey = (prefCode: string) => `app/rakuten/furusato/${prefCode}.json`;

const EMPTY: RakutenSnapshot = { generatedAt: new Date(0).toISOString(), items: [] };

/**
 * key ごとに reader を作る (品目数が多いので都度生成する)。
 * module-level キャッシュは持たない (r2-storage-design.md)。miss を恒久キャッシュしないため。
 */
function read(key: string, label: string): Promise<RakutenSnapshot> {
  return createSnapshotReader<RakutenSnapshot, RakutenSnapshot>({
    key,
    label,
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
