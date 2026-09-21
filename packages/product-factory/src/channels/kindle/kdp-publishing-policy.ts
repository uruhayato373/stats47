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
 *   AI が作っているのは表紙の背景 1 枚だけ。本文の図表はすべて実データから
 *   決定的に描いた SVG で、生成 AI は関与しない。背景にはタイトルを重ねているが、
 *   背景そのものへの手入れはしていないので「最小限」。
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
 * KDPポートフォリオの運用判断SSOT。
 *
 * 12冊公開後は一括量産を止め、売上/KENPの実測前に残りを公開しない。
 * 「未公開が何冊か」はkdp-listingsから毎回計算し、ここへ固定値を持たない。
 */
export const KDP_PORTFOLIO_POLICY = {
  mode: "paused" as const,
  decisionStatus: "pending" as const,
  title: "残りのKindleを継続出版するか判断",
  reason: "公開済み書籍の売上・KENPを実測し、需要があるシリーズだけを1冊ずつ再開する",
  resumeCondition: "オーナーの明示承認 + 売上またはKENPの需要証拠",
  source: ".claude/rules/coconala-product-standards.md §8",
};

/**
 * KDPの冊数と週次ペース。
 *
 * 32冊は企画カタログであって一括出版目標ではない。現在の販売対象はS1 12冊と、
 * 4週実測後に1冊ずつ試す3パイロットの計15冊。S2/S3/S4の旧設計20冊は未承認。
 */
export const KDP_PUBLICATION_PLAN = {
  registeredCatalogCount: 32,
  approvedS1Count: 12,
  evidenceGatedPilotCount: 3,
  activePublicationTargetCount: 15,
  maxNewPublicationsPerWeek: 1,
  cohortMeasurementWeeks: 4,
  currentGate: {
    status: "paused-until-measured",
    decisionDate: "2026-09-27",
    requirement: "S1 12冊の販売数またはKENPをproducts:salesへ記録し、オーナーが次の1冊を明示承認する",
  },
  weeklySequence: [
    { week: "2026-W38", action: "S1 12冊の審査・販売開始・旧版停止を完了。新規出版なし" },
    { week: "2026-W39", action: "S1の4週売上/KENPを取込み、継続・修正・停止を判断。新規出版なし" },
    { week: "2026-W40", action: "需要証拠がある第1パイロットを1冊だけ設計・全章レビュー・Previewer確認" },
    { week: "2026-W41", action: "全ゲートと個別承認を満たした場合だけ第1パイロットを最大1冊出版" },
    { week: "2026-W42-W44", action: "第1パイロットを計測。新規出版なし" },
    { week: "2026-W45", action: "4週実測で需要が確認できた場合だけ第2パイロットを最大1冊出版" },
    { week: "2026-W49", action: "第2パイロットの4週実測で需要が確認できた場合だけ第3パイロットを最大1冊出版" },
    { week: "2026-W50〜2027-W01", action: "第3パイロットを4週実測し、15冊ポートフォリオの継続・修正・停止を判断" },
  ],
  /**
   * weekly-review / weekly-plan が読む機械契約。weeklySequence は人間向け表示で、
   * 判定・上限・停止はこの値と sales-ledger / kdp-listings の実測から決める。
   */
  expansionProgramStartsAt: "2026-09-28",
  baselineCohort: {
    bookIds: Array.from({ length: 12 }, (_, index) => `K-S1-${String(index + 1).padStart(2, "0")}`),
    measurementStartsAt: "2026-08-30",
  },
  pilots: [
    {
      ordinal: 1,
      concept: "47県庁所在市の食卓・家計ガイド",
      format: "1県1章",
      plannedPreparationWeek: "2026-W40",
      earliestPublicationWeek: "2026-W41",
    },
    {
      ordinal: 2,
      concept: "意外な1位ストーリー集",
      format: "見出し駆動の県民性ストーリー",
      plannedPreparationWeek: "2026-W44",
      earliestPublicationWeek: "2026-W45",
    },
    {
      ordinal: 3,
      concept: "47都道府県 総合スコアブック",
      format: "指標横断の合成スコア",
      plannedPreparationWeek: "2026-W48",
      earliestPublicationWeek: "2026-W49",
    },
  ],
  stopConditions: [
    "売上/KENP未計測",
    "編集設計または全章critic PASSなし",
    "Previewer・暗号化archive・KDP read-backのいずれか未完了",
    "オーナーの当該1冊への明示承認なし",
  ],
  source: ".claude/todo/backlog.md KDP-EXPANSION-01",
} as const;
