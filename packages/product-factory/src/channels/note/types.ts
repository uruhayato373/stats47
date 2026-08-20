/**
 * note 商品展開ファクトリー — 型定義 (SSOT)
 *
 * 恒久仕様: .claude/rules/coconala-product-standards.md §9
 * 現在は旧174商品向けの legacy 実装。削除条件: .claude/todo/backlog.md の
 * COCONALA-PRODUCT-FACTORY-01 完了時に14パック由来の型へ置換する。
 *
 * 完全DBレス: mapping・article-plan・生成コードは git TS が SSOT。
 * 商品側は productId/version、note 側は slug/series を持ち、本ファイルの型で結合する。
 * .local/note-products/ の draft.md 等は派生物 (手編集を正典にしない・note.com へ投稿しない)。
 */

/**
 * note シリーズ (投稿系統の中の商品テーマ束)。仕様 §4 の 9 シリーズ +
 * K=ライセンス説明 / L=無料サンプル の集約先。
 */
export type NoteProductSeries =
  | "prefecture-map-powerpoint" // A, B: 都道府県地図・PPT 図表
  | "prefecture-excel-analysis" // C: Excel ランキング・地図・比較
  | "regional-data-packs" // D: テーマ別データと読み方
  | "business-location-analysis" // E: 出店・採用・観光等
  | "government-statistics-work" // F: 自治体統計業務の時短
  | "media-data-visuals" // G: 記事・動画・SNS 図版
  | "statistics-education" // H: 探究・授業・研修
  | "life-area-comparison" // I: 移住・転職・子育て
  | "custom-analysis-services" // J: 個別制作の選び方・事例 (無料 → ココナラ受注)
  | "license-guide" // K: ライセンス・版の違い (比較記事に集約)
  | "free-samples"; // L: 無料サンプル記事

/**
 * disposition (仕様 §3)。174 商品すべてに必須。
 * - standalone-paid: 単独有料記事 (その記事の唯一の商品)
 * - bundle-member: テーマ記事・マガジンに束ねる (複数商品を 1 有料記事へ)
 * - free-lead: 無料解説からココナラ受注 / 有料商品へ誘導 (J サービス・L 無料サンプル)
 * - catalog-only: 独立記事を作らず比較記事内でのみ扱う (K ライセンス variant)
 */
export type NoteDisposition = "standalone-paid" | "bundle-member" | "free-lead" | "catalog-only";

/** 記事の役割。 */
export type NoteArticleRole = "pillar" | "how-to" | "use-case" | "comparison" | "sample";

/** アクセス区分 (無料 / ペイウォール)。 */
export type NoteAccess = "free" | "paid";

/**
 * 1 商品の note 展開マッピング (仕様 §6)。
 * 複数商品が 1 記事へ束ねられるため canonicalSlug の重複は許可する。ただし
 * 同一 productId の重複、存在しない productId、無料記事への有料添付混入は validator が禁止する。
 */
export interface NoteProductMapping {
  readonly productId: string;
  readonly disposition: NoteDisposition;
  readonly series: NoteProductSeries;
  /** 束ね先の記事 slug (article-plan の記事に対応)。同一 slug の共有可。 */
  readonly canonicalSlug: string;
  readonly articleRole: NoteArticleRole;
  readonly access: NoteAccess;
  /** note 記事の提案価格 (円)。無料は 0。公開時に人間が確定する。 */
  readonly priceJpy: number;
  /** 有料ライン以降に添付する商品 (この商品の生成物)。無料記事は []。 */
  readonly attachmentProductIds: readonly string[];
  /** リンクするココナラ商品 ID (= 束ね対象商品)。 */
  readonly coconalaProductIds: readonly string[];
  /** 送客先 stats47 パス (無料コンテンツへの導線)。 */
  readonly stats47Targets: readonly string[];
  readonly priority: 1 | 2 | 3;
  /** この振り分けにした理由 (機械生成の根拠)。 */
  readonly reason: string;
}

/**
 * 1 canonical 記事の企画 (article-plan の SSOT 単位)。
 * memberProductIds に列挙した商品を 1 記事へ束ねる。draft/attachments はここから決定的に生成する。
 */
export interface NoteArticlePlan {
  /** 安定 ID (= slug)。series 内で一意。 */
  readonly slug: string;
  readonly series: NoteProductSeries;
  readonly title: string;
  readonly role: NoteArticleRole;
  readonly access: NoteAccess;
  /** 提案価格 (円)。無料は 0。 */
  readonly priceJpy: number;
  /** この記事が束ねる商品 ID 群 (1 件以上・全体で 174 を漏れなく覆う)。 */
  readonly memberProductIds: readonly string[];
  /** 送客先 stats47 パス。 */
  readonly stats47Targets: readonly string[];
  readonly priority: 1 | 2 | 3;
  /** 読者の具体的な作業・困りごと (無料部の書き出し用)。 */
  readonly readerJob: string;
  /** ハッシュタグ (note タグ・3〜8 個)。 */
  readonly hashtags: readonly string[];
}
