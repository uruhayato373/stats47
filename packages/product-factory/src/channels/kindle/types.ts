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

/** 共通事業方針 (.claude/shared-policy/POLICY.md) の HARM 分類。 */
export type HarmAxis = "H" | "A" | "R" | "M";
/** note 記事構成 (.claude/shared-policy/STRUCTURE.md) のタイトル 5 型。序列は付けない。 */
export type TitleType = "検索・選択" | "数字・チェック" | "実証・体験" | "問い・気づき" | "資料・手順";
/** 同 9 型 (本文の並べ方)。1 冊に複数を重ねてよい。 */
export type BodyPattern =
  | "悩み直撃型"
  | "勘違い破壊型"
  | "Before→After型"
  | "失敗談→教訓型"
  | "ロードマップ型"
  | "チェックリスト型"
  | "比較型"
  | "ケーススタディ型"
  | "販売導線型";

/**
 * 書籍の編集設計 (★2026-09-19 新設)。
 *
 * 共通事業方針の「判断の問い」5 つ (誰のどんな悩み / HARM と理由 / 提供価値と支払う理由 / 需要の証拠 /
 * 次の検証) と、記事構成 SSOT のタイトル 5 型・本文 9 型を、書籍ごとに**書く場所**。
 * 2026-09-19 の監査で、32 冊すべてが「データが何か」(concept) しか持たず、読者の悩み・購入理由・
 * 需要の証拠・タイトルの型がどこにも無いことが分かった (書名 13 冊が「〇〇の地図 — キーワード列挙」)。
 * validator が内容を検査し、generate は design の無い書籍を作らない。
 */
export interface EditorialDesign {
  /** 問い 1: 誰の、どんな具体的な悩み・達成したいことを扱うか (読者の言葉で)。 */
  readonly readerProblem: string;
  /** 問い 2: HARM のどれに関係するか。対象外なら空配列にして harmReason に理由を書く。 */
  readonly harm: readonly HarmAxis[];
  readonly harmReason: string;
  /** 問い 3・4: 何を提供し読者の判断をどう助けるか。無料 (stats47.jp) で得られる価値と、有料で支払う理由。 */
  readonly valueAndPayReason: string;
  /** 問い 5: 需要を示す証拠 (検索・相談・購入)。未確認なら「未検証:」で始め、何を検証するかを書く。 */
  readonly demandEvidence: string;
  /** タイトル案。異なる 2 型で 2 案 (STRUCTURE.md「タイトルの型」)。`title` はこのどちらかと一致させる。 */
  readonly titleCandidates: readonly { readonly type: TitleType; readonly title: string }[];
  /** 本文で主に使う型 (冒頭・本編・末尾で重ねてよい)。 */
  readonly bodyPatterns: readonly BodyPattern[];
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
  /** 1-2 文の企画意図 (データ側の説明)。読者側の設計は design に書く。 */
  readonly concept: string;
  /** 編集設計 (読者の悩み・HARM・支払う理由・需要の証拠・タイトルの型・本文の型)。generate の前提。 */
  readonly design?: EditorialDesign;
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
