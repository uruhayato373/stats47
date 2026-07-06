import type { AffiliateVertical } from "../constants/affiliate-category";

/**
 * アフィリエイト広告の型。完全DBレス Phase F で D1 `affiliate_ads` schema ($inferSelect) から
 * relocate。配信は R2 app/affiliate-ads/all.json (register-affiliate-banner で生成)。
 */
export interface AffiliateAd {
  id: string;
  title: string;
  htmlContent: string;
  areaCode: string | null;
  /**
   * 広告意図軸 (10 vertical)。ページ→vertical→広告 の解決に使う SSOT の正フィールド。
   * 移行期は任意 (未設定なら categoryKey から写像。`adVertical()` 参照)。Step B で必須化予定。
   */
  vertical?: AffiliateVertical | null;
  /**
   * @deprecated e-Stat 17 軸の categoryKey。vertical へ移行中 (後方互換で残置)。
   * マルチカテゴリ複製の元凶。解決は vertical ベースに切替済。
   */
  categoryKey: string | null;
  locationCode: string;
  isActive: boolean | null;
  priority: number | null;
  startDate: string | null;
  endDate: string | null;
  targetCategories: string | null;
  /**
   * ranking-key 単位のターゲティング (任意・転職クラスタの文脈一致配置用)。
   * - 未設定/空 → categoryKey 単位の従来挙動 (後方互換)。
   * - 設定済 → ranking ページではこの key 群に一致する時のみ表示。非 ranking 文脈 (blog 等) では適用しない。
   * 例: エンジニア転職広告を職種年収 ranking のうち software-engineer / system-consultant 等にだけ出す。
   */
  targetRankingKeys?: string[] | null;
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
