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
}

export type AffiliateLocationCode =
  | "sidebar-top"
  | "sidebar-bottom"
  | "sidebar-sticky"
  | "sidebar-inline"
  | "area-sidebar"
  | "blog-bottom"
  | "footer";
