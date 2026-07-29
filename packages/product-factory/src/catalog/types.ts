/**
 * ココナラ商品ファクトリー — 型定義 (SSOT)
 *
 * 正典: .claude/rules/coconala-product-standards.md
 * 商品案の由来: Git履歴上の旧 A-01〜L-07。現行トレースは packs.ts の sourceIds。
 *
 * 2026-07-23: 旧 174 件カタログ (A-01〜L-07・family 別) を、テーマ別 14 パック (P-01〜P-14)
 * へ破壊的に縮約した。同一テーマが family 横断で重複していた (観光 = B-06/C-14/D-08/E-06 等) ため、
 * 出品・実データ接続・管理の単位をテーマパックへ集約する。sourceIds に旧 ID をトレースする。
 *
 * 完全DBレス: 商品定義・テンプレート・生成コードは git TS が SSOT。
 * 観測値は既存 R2 が SSOT。Office 等のバイナリは派生物 (手編集を正典にしない・公開R2へ置かない)。
 */

/** パックのテーマ (slug)。P-01〜P-14 と 1:1 対応する。 */
export type PackTheme =
  | "population-household" // P-01: 人口・世帯 (旧 D-01 継承・実データ接続済)
  | "income-wage-hiring" // P-02: 所得・賃金・採用
  | "tourism-lodging" // P-03: 観光・宿泊
  | "municipal-finance" // P-04: 自治体財政
  | "healthcare-nursing" // P-05: 医療・介護
  | "education-childcare" // P-06: 教育・子育て
  | "migration-living" // P-07: 移住・生活
  | "retail-trade-area" // P-08: 出店・商圏
  | "industry-economy" // P-09: 産業・経済
  | "disaster-infrastructure" // P-10: 防災・インフラ
  | "map-chart-assets" // P-11: 汎用地図・チャート素材集
  | "all-in-one" // P-12: 全部入りバンドル
  | "free-trial" // P-13: 無料お試し (note/リード用・コナラ非出品)
  | "household-consumption"; // P-14: 家計・消費 (家計調査の消費品目・旧 P-09 から分離)

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

/**
 * コナラ有料オプション (旧 K 系のライセンス / 更新違いをパックのバリアントへ畳んだもの)。
 * 出品時の追加料金オプションに対応する。
 */
export interface ProductVariantOption {
  readonly id: string;
  readonly label: string;
  /** 基本価格への追加額 (円・税抜)。 */
  readonly addYen: number;
}

/** 1 パックの型付き定義。P-01〜P-14 を全登録する。 */
export interface ProductDefinition {
  /** 一意 ID。`^P-\d{2}$`。 */
  readonly id: string;
  /** パックのテーマ (= id と 1:1)。 */
  readonly theme: PackTheme;
  /** 商品名 (出品タイトルの上流)。 */
  readonly name: string;
  /** 主な購入者。 */
  readonly audience: readonly string[];
  /** 購入者が片づけたい仕事 (jobs-to-be-done)。 */
  readonly jobToBeDone: string;
  readonly formats: readonly ProductFormat[];
  readonly price: ProductPrice;
  readonly dataMode: DataMode;
  /** 使用する R2 ranking key 群。未接続パックは [] (実データ接続後に接続)。 */
  readonly metrics: readonly string[];
  /**
   * そのテーマの「全部入り」ランキングキー列 (= R2 `app/ranking/<key>/values.json` の key)。
   * pack-theme-map.ts が e-Stat カテゴリ 17 分類から機械配分した全指標 (P-01〜P-11)、または
   * 全指標の和集合 (P-12)。生成物は pack-snapshot がこのキー列を R2 から一括取得し
   * `src/data/pack-snapshots/<id>.json` (基準年固定) に焼き込む。R2 不在キーは snapshot 生成時に
   * スキップされる (validator はこの列の実在を検査しない = 誇大表示防止は datasets 側で担保)。
   * 生成元は `pack-rankingkeys.generated.ts` (build-pack-rankingkeys で再生成可)。
   */
  readonly rankingKeys: readonly string[];
  /**
   * 収録する実データセットの key 群 (= src/data/datasets/<key>.ts)。実データ接続台帳 (後方互換)。
   * 未接続パックは []。status が approved/listed のパックは全キーが実在する必要がある
   * (validator が誇大表示を防ぐ)。全部入り本体は rankingKeys + pack snapshot を使う。
   */
  readonly datasets: readonly string[];
  /** 参照テンプレート ID 群。TEMPLATE_REGISTRY を参照。未実装は []。 */
  readonly templateIds: readonly string[];
  /** LICENSE_REGISTRY を参照するライセンス ID。 */
  readonly licenseId: string;
  readonly supportLevel: SupportLevel;
  /** 動作保証する環境 (Office バージョン等)。 */
  readonly compatibility: readonly string[];
  readonly risk: ProductRisk;
  readonly status: ProductStatus;
  /** コナラ有料オプション (任意)。旧 K 系のライセンス / 更新違いを畳む。 */
  readonly variantOptions?: readonly ProductVariantOption[];
  /** 吸収した旧 174 件 ID のトレース (任意・非網羅)。 */
  readonly sourceIds?: readonly string[];
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
