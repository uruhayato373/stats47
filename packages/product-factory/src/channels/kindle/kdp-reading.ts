/**
 * KDP 日本語フォームが要求する**フリガナ / ローマ字**の SSOT。
 *
 * ★なぜ要るか (2026-08-12 に実フォームを probe して判明)
 *   日本語版 KDP (`kdp.amazon.co.jp/ja_JP`) の入稿フォームは、タイトル・サブタイトル・著者名の
 *   それぞれに `_pronunciation` (フリガナ) と `_romanized` (ローマ字) の欄を持つ:
 *     data[title_pronunciation] / data[title_romanized]
 *     data[subtitle_pronunciation] / data[subtitle_romanized]
 *     data[primary_author][pronunciation] / data[primary_author][name_romanized]
 *   英語版フォームには無いので、移植した実装は SSOT ごと持っていなかった。
 *
 * ★機械生成しない
 *   「47」を「ヨンジュウナナ」と読むか「シジュウナナ」と読むか、中黒をどう扱うかは
 *   自動変換では決まらない。**人が決めた読みをここに置き、コードは参照するだけ**にする。
 *   欠けている書籍は `validate` が error にする (空のまま出品フォームへ流さない)。
 *
 * 著者名は KDP が姓・名に分けて持つ。stats47 は屋号なので **姓に入れて名は空**にする
 * (doboku-note の実績と同じ扱い)。
 */

export interface KdpReading {
  /** タイトルのフリガナ (全角カタカナ)。 */
  readonly titleKana: string;
  /** タイトルのローマ字。 */
  readonly titleRomaji: string;
  /** サブタイトルのフリガナ (サブタイトルを持つ書籍のみ)。 */
  readonly subtitleKana?: string;
  /** サブタイトルのローマ字。 */
  readonly subtitleRomaji?: string;
}

/** 著者名 (全書籍共通)。KDP は姓・名を分けて持つ。 */
export const KDP_AUTHOR = {
  /** 屋号なので姓に入れる。 */
  lastName: "stats47",
  /** 名は空 (doboku-note と同じ扱い)。 */
  firstName: "",
  kana: "スタッツヨンジュウナナ",
  romaji: "stats47",
} as const;

/**
 * 書籍 ID → 読み。
 *
 * 表記の統一:
 *   - フリガナは全角カタカナ。`—` (ダッシュ) は読まないので空白に置き換える
 *   - 数字は読み下す (47 → ヨンジュウナナ / 2040 → ニセンヨンジュウ)
 *   - ローマ字は数字をそのまま残す (検索性のため)。`・` は空白にする
 */
export const KDP_READINGS: Readonly<Record<string, KdpReading>> = {
  // ── S1 論点読み物 ──────────────────────────────────────────────
  "K-S1-01": {
    titleKana: "ショトクトシシュツノチイキサ カケイトウケイヲヒカクスルマエニ",
    titleRomaji: "Shotoku to Shishutsu no Chiikisa - Kakei Tokei wo Hikaku Suru Mae ni",
    subtitleKana: "タイショウセタイ ネンジ ブンボカラヨミナオスチイキノスウジ",
    subtitleRomaji: "Taisho Setai Nenji Bunbo kara Yominaosu Chiiki no Suji",
  },
  "K-S1-02": {
    titleKana: "ショクタクノシシュツトコウニュウスウリョウ カケイチョウサノチイキサヲヨム",
    titleRomaji: "Shokutaku no Shishutsu to Konyu Suryo - Kakei Chosa no Chiikisa wo Yomu",
  },
  "K-S1-03": {
    titleKana: "ジンコウゲンショウトセタイノチズ ミコン タンシン トウキョウシュウチュウ",
    titleRomaji: "Jinko Gensho to Setai no Chizu - Mikon Tanshin Tokyo Shuchu",
  },
  "K-S1-04": {
    titleKana: "ケンコウトイリョウノチズ ジュミョウ ジサツ カイゴニセンヨンジュウ",
    titleRomaji: "Kenko to Iryo no Chizu - Jumyo Jisatsu Kaigo 2040",
  },
  "K-S1-05": {
    titleKana: "キョウイクトコソダテノチズ キョウイクヒ シンガクリツ タイキジドウ",
    titleRomaji: "Kyoiku to Kosodate no Chizu - Kyoikuhi Shingakuritsu Taiki Jido",
  },
  "K-S1-06": {
    titleKana: "ジチタイザイセイノチズ ザイセイリョク シャッキン ショウライフタン",
    titleRomaji: "Jichitai Zaisei no Chizu - Zaiseiryoku Shakkin Shorai Futan",
  },
  "K-S1-07": {
    titleKana: "カンコウトインバウンドノチズ シュクハク コクセキ カイフク",
    titleRomaji: "Kanko to Inbound no Chizu - Shukuhaku Kokuseki Kaifuku",
  },
  "K-S1-08": {
    titleKana: "エネルギートインフラノチズ デンリョク サイエネ ガス",
    titleRomaji: "Energy to Infra no Chizu - Denryoku Saiene Gas",
  },
  "K-S1-09": {
    titleKana: "サンギョウトチイキケイザイノチズ セイゾウ チュウショウ チカ",
    titleRomaji: "Sangyo to Chiiki Keizai no Chizu - Seizo Chusho Chika",
  },
  "K-S1-10": {
    titleKana: "アンゼントカンキョウノチズ ハンザイ ロウサイ コウガイ ボウサイ",
    titleRomaji: "Anzen to Kankyo no Chizu - Hanzai Rosai Kogai Bosai",
  },
  "K-S1-11": {
    titleKana: "ブンカ スポーツ ヨカノチズ",
    titleRomaji: "Bunka Sports Yoka no Chizu",
  },
  "K-S1-12": {
    titleKana: "デジタルセイカツノチズ ツウシン ピーシー テレワーク",
    titleRomaji: "Digital Seikatsu no Chizu - Tsushin PC Telework",
  },

  // ── S2 テーマ別データブック (共通: データデミルヨンジュウナナトドウフケン) ─────
  "K-S2-01": {
    titleKana: "データデミルヨンジュウナナトドウフケン ジンコウ セタイ",
    titleRomaji: "Data de Miru 47 Todofuken - Jinko Setai",
  },
  "K-S2-02": {
    titleKana: "データデミルヨンジュウナナトドウフケン ショトク チンギン サイヨウ",
    titleRomaji: "Data de Miru 47 Todofuken - Shotoku Chingin Saiyo",
  },
  "K-S2-03": {
    titleKana: "データデミルヨンジュウナナトドウフケン カンコウ シュクハク",
    titleRomaji: "Data de Miru 47 Todofuken - Kanko Shukuhaku",
  },
  "K-S2-04": {
    titleKana: "データデミルヨンジュウナナトドウフケン ジチタイザイセイ",
    titleRomaji: "Data de Miru 47 Todofuken - Jichitai Zaisei",
  },
  "K-S2-05": {
    titleKana: "データデミルヨンジュウナナトドウフケン イリョウ カイゴ",
    titleRomaji: "Data de Miru 47 Todofuken - Iryo Kaigo",
  },
  "K-S2-06": {
    titleKana: "データデミルヨンジュウナナトドウフケン キョウイク コソダテ",
    titleRomaji: "Data de Miru 47 Todofuken - Kyoiku Kosodate",
  },
  "K-S2-07": {
    titleKana: "データデミルヨンジュウナナトドウフケン イジュウ セイカツ",
    titleRomaji: "Data de Miru 47 Todofuken - Iju Seikatsu",
  },
  "K-S2-08": {
    titleKana: "データデミルヨンジュウナナトドウフケン シュッテン ショウケン",
    titleRomaji: "Data de Miru 47 Todofuken - Shutten Shoken",
  },
  "K-S2-09": {
    titleKana: "データデミルヨンジュウナナトドウフケン サンギョウ ケイザイ",
    titleRomaji: "Data de Miru 47 Todofuken - Sangyo Keizai",
  },
  "K-S2-10": {
    titleKana: "データデミルヨンジュウナナトドウフケン ボウサイ インフラ",
    titleRomaji: "Data de Miru 47 Todofuken - Bosai Infra",
  },
  "K-S2-11": {
    titleKana: "データデミルヨンジュウナナトドウフケン カケイ ショウヒ",
    titleRomaji: "Data de Miru 47 Todofuken - Kakei Shohi",
  },

  // ── S3 地域データブック (共通: データブック トウケイデヨムケンノヨコガオ) ────
  "K-S3-01": {
    titleKana: "ホッカイドウデータブック トウケイデヨムケンノヨコガオ",
    titleRomaji: "Hokkaido Databook - Tokei de Yomu Ken no Yokogao",
  },
  "K-S3-02": {
    titleKana: "トウホクデータブック トウケイデヨムケンノヨコガオ",
    titleRomaji: "Tohoku Databook - Tokei de Yomu Ken no Yokogao",
  },
  "K-S3-03": {
    titleKana: "カントウデータブック トウケイデヨムケンノヨコガオ",
    titleRomaji: "Kanto Databook - Tokei de Yomu Ken no Yokogao",
  },
  "K-S3-04": {
    titleKana: "チュウブデータブック トウケイデヨムケンノヨコガオ",
    titleRomaji: "Chubu Databook - Tokei de Yomu Ken no Yokogao",
  },
  "K-S3-05": {
    titleKana: "キンキデータブック トウケイデヨムケンノヨコガオ",
    titleRomaji: "Kinki Databook - Tokei de Yomu Ken no Yokogao",
  },
  "K-S3-06": {
    titleKana: "チュウゴクデータブック トウケイデヨムケンノヨコガオ",
    titleRomaji: "Chugoku Databook - Tokei de Yomu Ken no Yokogao",
  },
  "K-S3-07": {
    titleKana: "シコクデータブック トウケイデヨムケンノヨコガオ",
    titleRomaji: "Shikoku Databook - Tokei de Yomu Ken no Yokogao",
  },
  "K-S3-08": {
    titleKana: "キュウシュウ オキナワデータブック トウケイデヨムケンノヨコガオ",
    titleRomaji: "Kyushu Okinawa Databook - Tokei de Yomu Ken no Yokogao",
  },

  // ── S4 横断 ───────────────────────────────────────────────────
  "K-S4-01": {
    titleKana: "ヨンジュウナナトドウフケンランキングタイゼン イガイナイチイ サイカイ",
    titleRomaji: "47 Todofuken Ranking Taizen - Igaina 1-i Saikai",
  },
};
