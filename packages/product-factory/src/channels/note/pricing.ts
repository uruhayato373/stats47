/**
 * note 商品の価格帯 (仕様 §9)。提案値であり、公開時に人間が確定する。
 * 同一ファイルをココナラでも売る場合は価格・ライセンス・更新条件を合わせる。
 */

export type NotePriceTier = "lite" | "business" | "data-pack" | "magazine" | "free";

export interface NotePriceRange {
  readonly tier: NotePriceTier;
  readonly label: string;
  readonly minYen: number;
  readonly maxYen: number;
}

export const NOTE_PRICE_TIERS: Readonly<Record<NotePriceTier, NotePriceRange>> = {
  free: { tier: "free", label: "無料", minYen: 0, maxYen: 0 },
  lite: { tier: "lite", label: "Lite テンプレート＋解説", minYen: 500, maxYen: 1980 },
  business: { tier: "business", label: "業務テンプレート＋詳細手順", minYen: 1980, maxYen: 4980 },
  "data-pack": { tier: "data-pack", label: "テーマ別データパック", minYen: 1980, maxYen: 4980 },
  magazine: { tier: "magazine", label: "有料マガジン", minYen: 3980, maxYen: 9800 },
} as const;

/** 価格が tier のレンジ内かを判定する (validator 用)。free は 0 のみ。 */
export function isPriceInTier(priceJpy: number, tier: NotePriceTier): boolean {
  const r = NOTE_PRICE_TIERS[tier];
  if (tier === "free") return priceJpy === 0;
  return priceJpy >= r.minYen && priceJpy <= r.maxYen;
}

/** 提案価格がいずれかの有料 tier に収まるか (無料以外)。 */
export function isValidPaidPrice(priceJpy: number): boolean {
  return (["lite", "business", "data-pack", "magazine"] as const).some((t) =>
    isPriceInTier(priceJpy, t),
  );
}
