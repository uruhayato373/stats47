/**
 * Kindle 出版ファクトリー — 型定義 (SSOT)
 *
 * 正典: .claude/rules/coconala-product-standards.md (§kindle) / このファイル
 * 企画の SSOT: book-catalog.ts の sourceIdeas / newContentNote。
 * 初期市場調査・書籍調査は Git 履歴に保持する。
 *
 * 完全DBレス: 書籍カタログ (KINDLE_BOOKS) は git TS が SSOT。本文素材は R2
 * (`app/blog/<slug>/article.md` + `data/*.svg`) が SSOT。生成物 (.local/kindle-books/<id>/v1/book.epub)
 * は派生物 (手編集を正典にしない・公開 R2 へ置かない)。KDP へのアップロードは人間工程。
 *
 * 著作権規律 (pdf-book-survey と同一): 参照書籍からは論点・見せ方の型のみ抽出し、文言・図案・写真・
 * 編集構成は複製しない。数値は e-Stat / R2 から取得した自社データのみを使う。自ブログ記事の再利用は
 * 自己著作物なので権利問題なし。ただし KDP の「Web 無料公開コンテンツ」規定に備え、各書籍は再構成 +
 * 30% 以上の書き下ろし (freshText 章 = はじめに / 章間ブリッジ / 終章の横断分析) を必須とする。
 */

/** 書籍シリーズ (4 型・2026-07-23 オーナー決定)。 */
export type BookSeries =
  | "S1-issues" // 論点抽出の読み物 (最優先・既存ブログのテーマクラスタ束ね)
  | "S2-theme-databook" // テーマ別データブック (コナラ P-01〜P-14 の書籍版ダイジェスト)
  | "S3-region" // 47 県を 8 地方ブロックで 1 冊
  | "S4-ranking-compendium"; // ランキング大全 (競合最強ゾーン・最後発)

/** 書籍のライフサイクル状態。idea から published まで一方向に進む。 */
export type BookStatus =
  | "idea" // 企画のみ (章立て未確定)
  | "planned" // 章立て確定 (素材 slug 割当済・原稿未収集)
  | "manuscript" // 原稿収集済 (書き下ろしドラフト作成中)
  | "generated" // EPUB 生成済 (Kindle Previewer 検証待ち)
  | "published"; // KDP 公開済

/** 章の素材ソース種別。 */
export type ChapterSource =
  | "blog" // R2 `app/blog/<slug>/article.md` を本文化 (画像は data/*.svg)
  | "ranking" // R2 `app/ranking/<key>/` から表 + ai-content 考察を組む (S2/S4)
  | "fresh"; // 書き下ろし (freshText 必須・30% ルールの実体)

/** 1 章の定義。 */
export interface BookChapter {
  /** 章タイトル (目次に出る)。 */
  readonly title: string;
  readonly source: ChapterSource;
  /** source="blog" の参照 slug (R2 実在必須・manuscript 以降で検証)。 */
  readonly blogSlug?: string;
  /** source="ranking" の参照 ranking key 群。 */
  readonly rankingKeys?: readonly string[];
  /** source="ranking" (S3 地域別) で、この地域の県を考察で強調する。 */
  readonly highlightRegionLabel?: string;
  /**
   * ai-content の regionalAnalysis から抜き出す地方ブロックの見出し語。
   * S3 で「その地域の段落」だけを章に載せるのに使う (全冊同一本文の再発防止)。
   */
  readonly regionBlockLabel?: string;
  /** highlightRegionLabel の対象県コード (5桁)。 */
  readonly highlightCodes?: readonly string[];
  /** source="fresh" の書き下ろし本文 (markdown・短文をインライン指定する場合)。 */
  readonly freshText?: string;
  /**
   * source="fresh" の書き下ろし本文を markdown ファイルで持つ場合のパス
   * (manuscripts/<bookId>/<file>.md・product-factory ルート相対)。長文の書き下ろし章はこちらを使う
   * (TS 文字列リテラルの肥大を避ける)。freshText と併用時は freshFile を優先。
   */
  readonly freshFile?: string;
}

/** 1 書籍の定義。KINDLE_BOOKS に全登録する。 */
export interface KindleBook {
  /** 一意 ID。`^K-S[1-4]-\d{2}$` (例 K-S1-01)。 */
  readonly id: string;
  readonly series: BookSeries;
  /** 書名 (検索キーワードを先頭に・全角 40 字目安)。 */
  readonly title: string;
  /** サブタイトル (任意)。 */
  readonly subtitle?: string;
  /** 1-2 文の企画意図。 */
  readonly concept: string;
  /** 著者表示名。 */
  readonly author: string;
  /** 章立て (先頭は通例 fresh の「はじめに」、末尾は fresh の「おわりに/横断分析」)。 */
  readonly chapters: readonly BookChapter[];
  /** 販売価格 (円)。KDP 電子は ¥250-1,250 が印税 70% 帯。 */
  readonly priceYen: 0 | 500 | 800 | 1000;
  /** 書き下ろし部分の宣言 (30% ルールの根拠・validator が非空を要求)。 */
  readonly newContentNote: string;
  /** pdf-book-survey カタログ C の論点や吸収元のトレース (任意)。 */
  readonly sourceIdeas?: readonly string[];
  /** KDP カテゴリ・キーワード (出品時の設定候補)。 */
  readonly keywords: readonly string[];
  readonly status: BookStatus;
  /** 公開後のみ。 */
  readonly asin?: string;
  readonly publishedAt?: string;
}
