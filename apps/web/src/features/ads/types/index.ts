/**
 * アフィリエイト広告の型。完全DBレス Phase F で D1 `affiliate_ads` schema ($inferSelect) から
 * relocate。配信は R2 app/affiliate-ads/all.json (register-affiliate-banner で生成)。
 */
export interface AffiliateAd {
  id: string;
  title: string;
  htmlContent: string;
  areaCode: string | null;
  categoryKey: string | null;
  locationCode: string;
  isActive: boolean | null;
  priority: number | null;
  startDate: string | null;
  endDate: string | null;
  targetCategories: string | null;
  adType: string;
  imageUrl: string | null;
  trackingPixelUrl: string | null;
  width: number | null;
  height: number | null;
  createdAt: string | null;
  updatedAt: string | null;
  /**
   * A/B テスト用 (AFF-05・任意)。同一 experimentId を持つ active エントリが
   * 「同じ枠で競合する variant 候補」。未設定なら従来どおり priority 解決 (後方互換)。
   */
  experimentId?: string | null;
  /** 実験内で一意なクリエイティブ ID 例: "300x250-A" / "text-cta-benefit" */
  variantId?: string | null;
  /** 加重ランダムの重み (既定 1) */
  weight?: number | null;
}

export type AffiliateLocationCode =
  | "sidebar-top"
  | "sidebar-bottom"
  | "sidebar-sticky"
  | "sidebar-inline"
  | "area-sidebar"
  | "blog-bottom"
  | "footer";
