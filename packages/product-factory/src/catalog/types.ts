/**
 * ココナラ商品ファクトリー — 型定義 (SSOT)
 *
 * 正典: docs/02_実装計画/30_ココナラ商品ファクトリー実装仕様.md
 * 対応レビュー: docs/04_レビュー/2026-07-18-coconala-content-monetization.md (A-01〜L-07)
 *
 * 完全DBレス: 商品定義・テンプレート・生成コードは git TS が SSOT。
 * 観測値は既存 R2 が SSOT。Office 等のバイナリは派生物 (手編集を正典にしない・公開R2へ置かない)。
 */

/** 商品ファミリー。レビュー文書の節 A〜L と 1:1 対応する。 */
export type ProductFamily =
  | "asset" // A: 汎用の地図・チャート素材
  | "powerpoint" // B: PowerPoint テンプレート
  | "excel" // C: Excel テンプレート
  | "data" // D: データ入り完成商品
  | "industry" // E: 業種・用途特化パック
  | "government" // F: 自治体・公務員向け商品
  | "media" // G: メディア・クリエイター向け商品
  | "education" // H: 教育・学習向け商品
  | "consumer" // I: 個人の生活意思決定向け商品
  | "service" // J: サービス型商品
  | "license" // K: 更新・ライセンス違いの商品
  | "entry"; // L: 無料・低価格の入口商品

/** 納品ファイル形式。ココナラ対応形式のうち本ファクトリーが扱う範囲。 */
export type ProductFormat =
  | "pptx"
  | "xlsx"
  | "csv"
  | "svg"
  | "png"
  | "pdf"
  | "docx"
  | "web";

/**
 * データ同梱モード。更新責任と価値の境界を分ける
 * (レビュー §データを同梱する場合の設計)。
 */
export type DataMode =
  | "empty" // 空テンプレート (更新責任なし)
  | "sample" // 架空 or 公的サンプル付き
  | "fixed-year" // 基準年固定の買い切り
  | "updated" // 年次更新版 (更新条件を明示)
  | "customer"; // 顧客データ反映 (役務)

/** サポートレベル。 */
export type SupportLevel = "none" | "manual" | "limited" | "custom";

/** リスク区分。high-stakes / rights-review は制作前に個別確認が必須。 */
export type ProductRisk = "normal" | "high-stakes" | "rights-review";

/** ライフサイクル状態。cataloged から listed まで一方向に進む。 */
export type ProductStatus =
  | "cataloged"
  | "spike"
  | "buildable"
  | "generated"
  | "reviewed"
  | "approved"
  | "listed"
  | "paused";

/** 価格帯 (円・税抜)。initialYen は出品検証の起点。entry / license は 0 を許可する。 */
export interface ProductPrice {
  readonly minYen: number;
  readonly maxYen: number;
  readonly initialYen: number;
}

/** 1 商品の型付き定義。レビュー A-01〜L-07 を全登録する。 */
export interface ProductDefinition {
  /** 一意 ID。`^[A-L]-\d{2}$` (レビュー文書の商品 ID と一致)。 */
  readonly id: string;
  readonly family: ProductFamily;
  /** 商品名 (レビュー文書の「商品案」列)。 */
  readonly name: string;
  /** 主な購入者。 */
  readonly audience: readonly string[];
  /** 購入者が片づけたい仕事 (jobs-to-be-done)。 */
  readonly jobToBeDone: string;
  readonly formats: readonly ProductFormat[];
  readonly price: ProductPrice;
  readonly dataMode: DataMode;
  /** 使用する R2 ranking key 群。Phase 1 は [] (Phase 2 で実在キーを接続)。 */
  readonly metrics: readonly string[];
  /** 参照テンプレート ID 群。TEMPLATE_REGISTRY を参照。Phase 1 は [] (テンプレ未実装)。 */
  readonly templateIds: readonly string[];
  /** LICENSE_REGISTRY を参照するライセンス ID。 */
  readonly licenseId: string;
  readonly supportLevel: SupportLevel;
  /** 動作保証する環境 (Office バージョン等)。 */
  readonly compatibility: readonly string[];
  readonly risk: ProductRisk;
  readonly status: ProductStatus;
}

/** ライセンス定義。テンプレート・素材単体の再販売 / 再配布は常に禁止 (resale: false)。 */
export interface LicenseDefinition {
  readonly id: string;
  readonly name: string;
  /** 利用範囲 (購入者本人 / 1 法人内 / 教育機関等)。 */
  readonly scope: string;
  /** クライアント納品物への組み込み可否。 */
  readonly clientWork: boolean;
  /** テンプレート / shape / SVG / 元データ単体の再販売・再配布は常に不可。 */
  readonly resale: false;
  /** 出典表示義務 (e-Stat 等)。 */
  readonly attribution: string;
}

/** テンプレート定義。Phase 2 以降で実装 (Phase 1 は空レジストリ)。 */
export interface TemplateDefinition {
  readonly id: string;
  readonly kind: "powerpoint" | "excel" | "manual" | "listing";
  readonly description: string;
}
