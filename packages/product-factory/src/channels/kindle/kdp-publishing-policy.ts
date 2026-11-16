/**
 * KDP に**申告する**事項の SSOT (DRM / 生成 AI の使用開示)。
 *
 * ★ここは「入力欄を埋める」話ではなく出品者の申告
 *   AI 開示は Amazon への申告で、虚偽は規約違反になる。フォームを通すために
 *   「使っていない」と答えることはしない。**事実をそのまま申告する**。
 *
 * ★DRM は後から変更できない
 *   KDP は DRM の選択を出版後に変更できない。判断を毎回その場でせず、
 *   理由つきでここに固定する。
 */

/** 生成 AI の使用開示 (KDP の質問票にそのまま対応する)。 */
export interface KdpAiDisclosure {
  /** AI ツールを使ったか (「いいえ」なら以下は不要)。 */
  readonly used: boolean;
  /** テキストでの使用量。KDP の選択肢の表示文字列と完全一致させる。 */
  readonly text: string;
  /** 画像での使用量。 */
  readonly images: string;
  /** 翻訳での使用量。 */
  readonly translations: string;
  /** テキスト生成に使った AI ツール名 (KDP は 1 欄 1 ツールで最大 3 つ聞く)。 */
  readonly textTools: readonly string[];
  /** 画像生成に使った AI ツール名。 */
  readonly imageTools: readonly string[];
}

/**
 * 全書籍に共通の申告。
 *
 * **テキスト = 作品全体 (広範な編集あり)**
 *   ランキング章の解説は stats47.jp で公開済みの AI 生成テキスト (ai-content) を素材にし、
 *   書き下ろし章も AI に書かせている。つまり AI が関与しない章は無い。
 *   一方で、採用前に実データとの数値照合を機械で通し、章構成・素材の選定・
 *   レビューは人が行っている。したがって「作品全体」かつ「広範な編集あり」。
 *
 * **画像 = 1 つまたはいくつかの AI 生成画像 (最小限の編集あり、または編集なし)**
 *   AI が作っているのは表紙 1 枚だけ。本文の図表はすべて実データから
 *   決定的に描いた SVG で、生成 AI は関与しない。S1 の表紙は書名の文字ごと AI が描いた 1 枚を
 *   そのまま使い (cover-design.ts の textBaked)、それ以外は背景にタイトルを重ねている。
 *   どちらも画像そのものへの手入れはしていないので「最小限」。
 *
 * **翻訳 = なし** (日本語で書き下ろしており翻訳工程が無い)
 *
 * **ツール名**
 *   テキスト: 書き下ろし章と章構成は Claude、ランキング解説の素材 (ai-content) は Gemini。
 *   画像: 表紙背景は OpenAI の gpt-image-2 (Codex の画像生成)。
 *   本文の図表は実データから決定的に描いた SVG なので、生成 AI のツールには含めない。
 */
export const KDP_AI_DISCLOSURE: KdpAiDisclosure = {
  used: true,
  text: "作品全体 (広範な編集あり)",
  images: "1 つまたはいくつかの AI 生成画像 (最小限の編集あり、または編集なし)",
  translations: "なし",
  textTools: ["Claude", "Gemini"],
  imageTools: ["gpt-image-2"],
};

/**
 * DRM を適用するか。
 *
 * **適用する (true)**。
 *   適用しないと、購入者が EPUB / PDF をそのままダウンロードできる。
 *   本書は e-Stat 由来の数値をまとめた資料集で、ファイルが出回ると再配布されやすい。
 *   出版後に変更できない選択なので、取り返しのつく側 (適用する) に倒す。
 *   無料公開しているサイト (stats47.jp) が別にあるため、読者が最新の数値を
 *   参照する手段は DRM の有無に関わらず確保されている。
 */
export const KDP_APPLY_DRM = true;

/**
 * KDPポートフォリオの運用判断SSOT (管理画面の /content が読む)。
 *
 * 2026-11-14 オーナー決定: 需要は出して確かめる。型ごとに複数冊を作り直して出し、
 * 公開日から 8 週の実売で型ごとに続ける・増やす・止めるを決める (収益化戦略 §3.4)。
 */
export const KDP_PORTFOLIO_POLICY = {
  mode: "active" as const,
  decisionStatus: "decided" as const,
  title: "KDP を型ごとに作り直して出す",
  reason: "型ごとに複数冊を出し、公開日から8週の販売数とKENPで型ごとに続ける・増やす・止めるを決める",
  resumeCondition: "1冊ずつのオーナーの明示承認",
  source: "docs/00_プロジェクト管理/02_収益化戦略.md §3.4",
};

/**
 * KDPの週次公開の機械契約 (weekly-review / weekly-plan / kdp-weekly-publish が読む)。
 *
 * 2026-11-14 に「週1冊・4週実測・パイロットを1冊ずつ順番に」から改めた。
 * - 前の本の売上を待たずに出してよい。週の冊数上限は置かない
 *   (KDP の未公開約10冊の作成数制限は kdp-publish の preflight が止める)
 * - 1冊ずつの明示承認と品質の決まり (編集設計・critic・Previewer・保全) は変えない
 * - 計測は各冊の公開日から 8 週。型ごとの判定はオーナーが行い、このコードは材料だけを出す
 */
export const KDP_PUBLICATION_PLAN = {
  /** 企画カタログの冊数 (book-catalog.ts の KINDLE_BOOKS と一致)。出版目標ではない */
  registeredCatalogCount: 38,
  /** 作り直しの前提として販売中であるべき S1 の冊数 */
  approvedS1Count: 12,
  /** 各冊の計測窓 (公開日から) */
  cohortMeasurementWeeks: 8,
  /** この日以降に提出・販売開始した S1 以外の本を作り直しの本として数える (それ以前の旧版は対象外) */
  expansionProgramStartsAt: "2026-11-14",
  /** 作り直す型。書籍 ID の接頭辞で本を型に振り分ける (KDP-EXPANSION-01 の ①〜③) */
  formats: [
    { id: "prefecture-guide", concept: "1県1章のガイド", bookIdPrefix: "K-S3-", replaces: "旧 S3 地域データブック" },
    { id: "surprising-first", concept: "意外な1位の県民性ストーリー", bookIdPrefix: "K-S4-", replaces: "旧 S4 ランキング大全" },
    { id: "topic-reader", concept: "分野別の読み物", bookIdPrefix: "K-S2-", replaces: "旧 S2 テーマ別データブック" },
  ],
  stopConditions: [
    "編集設計または全章critic PASSなし",
    "Previewer・暗号化archive・KDP read-backのいずれか未完了",
    "オーナーの当該1冊への明示承認なし",
  ],
  source: ".claude/todo/backlog.md KDP-EXPANSION-01",
} as const;
