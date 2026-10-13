/**
 * note 記事台帳の型定義。正本は data/note/articles.json と data/note/magazines.json (JSON Schema 付き)。
 *
 * 派生物 (手編集しない。generate-note-catalog.ts が台帳から作る):
 *   - data/note/note-published-urls.json
 *   - data/note/note-draft-index.json
 *
 * 正典ルール: .claude/scripts/note/catalog/README.md
 */

/** note の投稿系統 (アカウント内のコンテンツ束) */
export type NoteVertical =
  | "stats47-note" // 都道府県ランキング系 (A/B/C/D シリーズ)。stats47 送客の主力
  | "koumuin-claude-code" // 自治体職員向け Claude Code 実務ガイド
  | "koumuin-estat-claude-code" // 自治体職員向け e-Stat × Claude Code
  | "koumuin-gis" // 自治体職員向け GIS (国土数値情報) 入門
  | "product-sales" // 都道府県データ商品 (PowerPoint/Excel/データパック) の販売記事。product-factory 由来
  | "membership"; // メンバーシップ (有料) 記事群

/**
 * stats47-note 内のシリーズ分類 (docs/30 note戦略.md の A/B/C/D)。
 * koumuin-* 系はシリーズ = vertical なので通常 undefined。
 */
export type NoteSeries =
  | "A" // ランキング記事 (量産・自動生成)
  | "B" // ランキング読み物 (考察)
  | "C" // 統計調査ガイド
  | "D"; // 深掘り分析

export type NoteArticleStatus = "draft" | "published";

/** r2-public = 無料記事を公開 R2 / r2-private = 有料記事を private R2 / note-only = 本文が note.com にしか無い */
export type NoteBodyStore = "r2-public" | "r2-private" | "note-only";

export interface NoteArticleBody {
  store: NoteBodyStore;
  /** private R2 の note-archive/manifests/<key>/<sha256>.json。null は未取り込み */
  manifest: { sha256: string; files: number; bytes: number; savedAt: string } | null;
  verifiedAt?: string;
}

export type PublishedLinkRepair =
  | {
      mode: "replace-url";
      fromUrl: string;
      toUrl: string;
    }
  | {
      mode: "replace-card";
      fromUrl: string;
      toUrl: string;
      linkText: string;
      headingFrom?: string;
      headingTo?: string;
    };

/**
 * 1 記事のカタログエントリ。key (= slug) が安定 ID。
 */
export interface NoteArticle {
  /** 安定 ID (= R2 スラッグ)。vertical 内で一意 */
  key: string;
  vertical: NoteVertical;
  /** stats47-note のシリーズ。koumuin-* は undefined */
  series?: NoteSeries;
  title: string;
  /**
   * 所属マガジンキー (→ magazines.ts のレジストリ)。null = 未割当。
   * 「類似記事を 1 マガジンに束ねる」編集はこのフィールドを変えるだけで完結する。
   */
  magazine: string | null;
  /** 有料記事か (note のペイウォール per-article) */
  isPaid: boolean;
  /** 有料時の価格 (円)。無料は 0 / 省略 */
  priceJpy?: number;
  status: NoteArticleStatus;
  /** 公開時に note.com が採番する URL (external reference)。公開後に publish フローが書き戻す */
  noteUrl?: string;
  /** 公開日 (YYYY-MM-DD) */
  publishedAt?: string;
  /** クリエイターページ先頭への固定表示を監査する。 */
  pinned?: boolean;
  /** note のプロフィール記事としての設定を監査する。 */
  profiled?: boolean;
  /** 無料記事を有料マガジン内でも一般公開するために保持すべき既存境界ID。 */
  publishedSeparator?: string;
  /** R2 上の格納パス (draft.md / images はこの下)。無料は公開 R2、有料は private R2 の同じパス */
  r2Path: string;
  /** 本文の所在と、最後に保存したファイル一覧のマニフェスト (data/note/articles.json が正本) */
  body: NoteArticleBody;
  /**
   * 台帳には書かない派生値。body.manifest があり、R2 に本文を保存済みと確認できたときだけ true。
   * false = 回収前の note-only か、まだ save していない記事。
   */
  readonly r2Body: boolean;
  /**
   * 送客先 stats47 パス (例: "/ranking/annual-sunshine-duration")。
   * ranking キーの実在を validate-note-catalog.ts が検証する。
   */
  stats47Targets?: string[];
  /**
   * この記事の元になった参考文献 (教材) の分析企画 ID。data/source-inventory/<sourceKey>/<edition>/analyses.json の
   * analyses[].id を指し、その企画の contentRoles に "note" があること (台帳の書き込み時に検査する)。
   */
  sourceAnalyses?: string[];
  /**
   * 記事末の「次に読む」主 CTA。NOTE_ARTICLES.key を参照する。
   * 全記事へ機械的な前後リンクを付けず、実測で選んだ記事だけに設定する。
   */
  nextBestArticle?: string;
  /**
   * 公開済み本文に残った旧URLの決定的な修復契約。
   * updater は価格・有料境界・タグ・既存本文を照合してから、この差分だけを反映する。
   */
  publishedLinkRepairs?: PublishedLinkRepair[];
}

/**
 * マガジン (note のマガジン = 記事を束ねる導線)。
 * 無料キュレーション (isPaid=false) と 有料メンバーシップ (isPaid=true) の両方を表す。
 */
export interface NoteMagazine {
  /** 安定キー (NoteArticle.magazine が参照) */
  key: string;
  name: string;
  /** true = 有料メンバーシップ / false = 無料キュレーション (有料記事を含めてよい) */
  isPaid: boolean;
  description: string;
  /** このマガジンが束ねる vertical (整合チェック用) */
  verticals: NoteVertical[];
  /**
   * note.com 上のマガジン URL (https://note.com/<handle>/m/...)。
   * マガジン作成前は null。作成後に inject-magazine-url 相当で書き戻す。
   */
  noteUrl: string | null;
  /** 同テーマの販売導線。noteカード化のため query/hash なしの stats47 固定URLだけを許可する。 */
  productTarget?: `/products/${string}`;
  /** フッター注入で使うプレースホルダ (既存 inject-magazine-url.cjs 互換) */
  placeholder?: string;
}
