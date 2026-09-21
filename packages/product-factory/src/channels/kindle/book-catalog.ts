/**
 * Kindle 書籍カタログ (SSOT)。4 シリーズ (S1 論点読み物 / S2 テーマ別データブック /
 * S3 地域別 / S4 ランキング大全) の企画を全登録する。
 *
 * status の意味:
 *   idea      = 企画のみ (章立て未確定・concept と keywords だけ)
 *   planned   = 章立て確定 (blogSlug 割当済・書き下ろし未着手)
 *   manuscript= 原稿収集済 (fresh 章のドラフトあり・EPUB 生成可)
 *   generated = EPUB 生成済 (Kindle Previewer 検証待ち)
 *   published = KDP 公開済 (asin/publishedAt)
 *
 * 実装フェーズでは K-S1-01 のみ manuscript まで具体化 (パイロット)。他は planned/idea で
 * 企画を確保し、需要実測に応じて 1 冊ずつ manuscript へ昇格する (需要ファースト)。
 * blogSlug はすべて R2 `app/blog/<slug>/article.md` が実在する公開済み記事のみを参照する。
 */
import type { KindleBook, BookChapter } from "./types";
import { PACK_RANKING_KEYS } from "../../catalog/pack-rankingkeys.generated";
import { BOOK_RANKING_KEYS } from "./book-ranking-keys";

/** 書き下ろし章の配置先 (S1 と同じ manuscripts/<bookId>/)。 */
const S2_M = (suffix: string): string => `src/channels/kindle/manuscripts/K-S2-${suffix}`;
const S3_M = (suffix: string): string => `src/channels/kindle/manuscripts/K-S3-${suffix}`;
const S4_M = "src/channels/kindle/manuscripts/K-S4-01";

const AUTHOR = "stats47";

/** パイロット K-S1-01 の書き下ろし章 (manuscripts/K-S1-01/*.md・article-writer 起草 → blog-critic レビュー)。 */
const M = "src/channels/kindle/manuscripts/K-S1-01";

/** S1 (論点読み物) — 既存公開ブログのテーマクラスタを束ねる。全 blogSlug は R2 実在。 */
const S1_BOOKS: readonly KindleBook[] = [
  {
    id: "K-S1-01",
    series: "S1-issues",
    title: "年収が高い県は、暮らしも豊かなのか",
    subtitle: "家賃と物価を引いて読み直す47都道府県の家計",
    concept:
      "県民所得、家計調査の所得・支出、貯蓄と地域財政を別の対象として読み、対象世帯・年次・分母の一致を確認します。地域の平均を個人の手取りや県民性へ置き換えず、比較の限界と確認手順を整理します。",
    // 共通事業方針「判断の問い」5 つ + STRUCTURE.md のタイトル 5 型 / 本文 9 型 (2026-09-19)。
    design: {
      readerProblem:
        "転職・就職・結婚を機に住む県を比べていて「年収ランキングで上位の県に住めば暮らしにゆとりが出るのか」が分からない。年収・県民所得・可処分所得・実質のどれを見れば自分の判断に使えるのかも分からない。",
      harm: ["M"],
      harmReason: "住む場所と家計 (収入・家賃・物価・貯蓄) の判断。転職の意思決定 (A) は扱わず、年収の高低だけで転職商品の購入意図とは見なさない",
      valueAndPayReason:
        "無料 (stats47.jp) では指標ごとのランキングが個別に見られる。本書は 9 つの家計・所得指標を『対象世帯・年次・分母が違う統計を混ぜない』という一つの読み方で通しで読み、順位が入れ替わる理由まで説明する。支払う理由は、複数ページを自分で突き合わせる時間と読み違い (名目と実質・世帯範囲) を避けられること。",
      demandEvidence:
        "未検証: 同じ論点の Kindle 個人出版『都道府県別平均年収ランキング…実質手取り』が販売中 (参考文献 vault、販売数は未計測)。本書 v1 は 2026-08-30 販売開始、KENP/販売数は KDP レポート未取込 (sales-ledger 空)。次の検証 = 2026-09-27 に 4 週売上を products:sales へ記録し、S1 他 11 冊と比較する。",
      titleCandidates: [
        { type: "問い・気づき", title: "年収が高い県は、暮らしも豊かなのか" },
        { type: "検索・選択", title: "都道府県の可処分所得の読み方｜県民所得・家計調査・貯蓄を比べる基準" },
      ],
      bodyPatterns: ["悩み直撃型", "勘違い破壊型", "比較型"],
    },
    author: AUTHOR,
    chapters: [
      { title: "はじめに — 年収の地図と、暮らしの地図は違う", source: "fresh", freshFile: `${M}/00-intro.md` },
      { title: "第0章 家計データの読み方 — 名目と実質、比率と実額", source: "fresh", freshFile: `${M}/10-how-to-read.md` },
      { title: "県民所得と家計調査の所得を分けて読む", source: "blog", blogSlug: "real-disposable-income-reversal" },
      { title: "電気・都市ガス・灯油の支出と所得指標", source: "blog", blogSlug: "heating-cost-vs-disposable-income" },
      { title: "1人当たり県民所得の格差を読む", source: "blog", blogSlug: "per-capita-income-gap" },
      { title: "貯蓄残高 — 平均と世帯構成を読む", source: "blog", blogSlug: "savings-balance-gap" },
      { title: "エンゲル係数 — 食費と消費支出の比率", source: "blog", blogSlug: "engel-coefficient-prefecture-ranking" },
      { title: "世帯支出の構造を県で比べる", source: "blog", blogSlug: "household-spending-prefecture-gap" },
      { title: "交通・通信費の構成比と通信契約数", source: "blog", blogSlug: "communication-cost-burden" },
      { title: "地域財政の支出 — 家計とは別の会計を読む", source: "blog", blogSlug: "expenditure-structure-comparison" },
      { title: "紅茶の支出・購入数量と所得の比較", source: "blog", blogSlug: "black-tea-income-gap" },
      { title: "終章 — 「安い県」でも「豊かな県」でもなく", source: "fresh", freshFile: `${M}/90-synthesis.md` },
      { title: "出典と再現について", source: "fresh", freshFile: `${M}/95-sources-method.md` },
    ],
    priceYen: 800,
    newContentNote:
      "はじめに・家計データの読み方・9章横断の確認手順・出典補章を書き下ろす。公開ブログ由来の章は入稿版で校訂し、所得と支出の対象世帯・期間・算式を区別する。改訂版全章の独立レビューを経るまで販売準備完了としない。",
    sourceIdeas: ["pdf-book-survey:実質手取り", "pdf-book-survey:寒冷地の隠れコスト", "pdf-book-survey:紅茶×所得"],
    keywords: ["都道府県", "家計", "所得", "可処分所得", "家計調査", "地域比較", "統計"],
    // 改訂候補。過去の公開記録やレビューを現行原稿の合格と解釈しない。
    status: "generated",
  },
  {
    id: "K-S1-02",
    series: "S1-issues",
    title: "食卓の支出と購入数量 — 家計調査の地域差を読む",
    concept: "家計調査の品目別支出と購入数量を区別し、調査対象世帯・地域・年を確かめながら食卓の違いを読みます。生産地や県民全体の消費を直接測る統計ではないことも整理します。",
    // 共通事業方針「判断の問い」5 つ + STRUCTURE.md のタイトル 5 型 / 本文 9 型 (2026-09-19)。
    design: {
      readerProblem: "「うちの県は○○の消費量が日本一」と聞いても、それが本当に食卓の習慣なのか、統計の取り方の癖なのかが分からない。地元の名物や食文化を数字で人に説明したい。",
      harm: [],
      harmReason: "食文化の地域差への好奇心が主で、健康・目標・関係・お金の悩みの解決を約束しない。無理に生活課題へ結び付けない (ペルソナ方針)",
      valueAndPayReason: "無料 (stats47.jp) では品目ごとの支出額・購入数量ランキングが見られる。本書は支出額と購入数量、県庁所在市と県全体、生産地と消費地を取り違えない読み方で 5 品目を通しで読み、順位が一人歩きする理由まで説明する。支払う理由は、複数ページの突き合わせと読み違いを避けられること。",
      demandEvidence: "未検証: 同ジャンルの出版物『統計から読み解く47都道府県ランキング 消費・子供・スポーツ編』(日東書院 2020) が参考文献 vault にある (販売数は未計測)。本書 v1 は 2026-08-30 販売開始、KENP/販売数は未取込。次の検証 = 2026-09-27 に 4 週売上を products:sales へ記録。",
      titleCandidates: [
        { type: "資料・手順", title: "食卓の支出と購入数量 — 家計調査の地域差を読む" },
        { type: "問い・気づき", title: "その県の名物は、本当によく食べられているのか" },
      ],
      bodyPatterns: ["勘違い破壊型", "比較型"],
    },
    author: AUTHOR,
    chapters: [
      { title: "麺類への支出を地域で比べる", source: "blog", blogSlug: "noodle-consumption-prefecture-character" },
      { title: "味噌の購入数量を読む", source: "blog", blogSlug: "miso-consumption-quantity-prefecture-gap" },
      { title: "砂糖への支出と購入数量", source: "blog", blogSlug: "sugar-consumption-prefecture-gap" },
      { title: "かに支出の日本一", source: "blog", blogSlug: "crab-expenditure-ranking" },
      { title: "さばの食卓 — 支出額の地域差", source: "blog", blogSlug: "mackerel-expenditure-ranking" },
    ],
    priceYen: 800,
    newContentNote: "はじめに・読み方・終章で支出額と購入数量、購入と消費、調査都市と県全体の違いを解説し、各章の家計調査を再構成する。",
    sourceIdeas: ["pdf-book-survey:消費地バトル", "blog-quality-standards:D2 型クラスタ"],
    keywords: ["都道府県", "食文化", "家計調査", "県民性", "消費量", "雑学"],
    status: "planned",
  },
  {
    id: "K-S1-03",
    series: "S1-issues",
    title: "人口減少と世帯の地図 — 未婚・単身・東京集中",
    concept: "未婚率・単身高齢・世帯構造の変化・東京一極集中を束ね、人口減少が暮らしの単位をどう変えたかを読みます。",
    // 共通事業方針「判断の問い」5 つ + STRUCTURE.md のタイトル 5 型 / 本文 9 型 (2026-09-19)。
    design: {
      readerProblem: "移住・親の介護・自分の老後の住まいを考えていて、未婚率や単身高齢世帯の増え方が県でどう違うのか、東京集中の裏で自分の県の暮らしの単位がどう変わっているのかを知りたい。",
      harm: ["R"],
      harmReason: "家族・世帯のかたち (未婚・単身・高齢者のいる世帯) の変化を扱う。個人の結婚や介護の判断を断定せず、地域の統計として読む",
      valueAndPayReason: "無料では未婚率・単身世帯・転入超過などのランキングが個別に見られる。本書は人口減少を『世帯の単位の変化』として 5 指標を通しで読み、分母 (総人口/世帯数/年齢階級) を取り違えない手順を付ける。",
      demandEvidence: "未検証: 本書 v1 は 2026-08-30 販売開始、KENP/販売数は未取込。次の検証 = 2026-09-27 に 4 週売上を記録し S1 内で比較。",
      titleCandidates: [
        { type: "資料・手順", title: "人口減少と世帯の地図 — 未婚・単身・東京集中" },
        { type: "問い・気づき", title: "未婚と単身が増えた県で、暮らしの単位はどう変わったか" },
      ],
      bodyPatterns: ["悩み直撃型", "比較型"],
    },
    author: AUTHOR,
    chapters: [
      { title: "年齢別の未婚者割合を読む", source: "blog", blogSlug: "unmarried-rate-40years-crisis" },
      { title: "単身高齢世帯の増加", source: "blog", blogSlug: "aging-solo-living-crisis" },
      { title: "世帯構造の変容", source: "blog", blogSlug: "household-structure-transformation" },
      { title: "東京の将来人口パラドックス", source: "blog", blogSlug: "future-population-tokyo-paradox" },
      { title: "東京への人口移動集中", source: "blog", blogSlug: "population-migration-tokyo-concentration" },
    ],
    priceYen: 800,
    newContentNote: "はじめに・おわりに (人口減少と世帯単位の変化の横断分析) を書き下ろし、各章を再構成。",
    sourceIdeas: ["blog-quality-standards:G 型移動フロー"],
    keywords: ["都道府県", "人口減少", "未婚率", "世帯", "東京一極集中", "統計"],
    status: "planned",
  },
  {
    id: "K-S1-04",
    series: "S1-issues",
    title: "健康と医療の地図 — 寿命・自殺・介護2040",
    concept: "寿命、自殺に関する指標、介護職員の必要数と病院の利用指標を比較し、医療資源の数と個人の健康状態を区別して読みます。掲載した化学工業の集計は医薬品・医療機器だけの生産額ではないことも整理します。",
    // 共通事業方針「判断の問い」5 つ + STRUCTURE.md のタイトル 5 型 / 本文 9 型 (2026-09-19)。
    design: {
      readerProblem: "自分や親の住む県の医療は足りているのか、寿命が長い県は医療が手厚いのかが分からない。介護職員の不足や病院の利用度を数字で確かめて、住む場所や備えを考えたい。",
      harm: ["H"],
      harmReason: "寿命・自殺に関する指標・介護職員の必要数・病院利用の地域差を扱う。個人の健康状態や受診判断を断定しない",
      valueAndPayReason: "無料では寿命・医療資源・介護の指標が個別に見られる。本書は医療資源の『数』と住民の『健康状態』を分けて読む手順で 5 指標を通しで読み、化学工業の集計を医薬品と取り違える等の落とし穴を明示する。",
      demandEvidence: "未検証: 本書 v1 は 2026-08-30 販売開始、KENP/販売数は未取込。次の検証 = 2026-09-27。",
      titleCandidates: [
        { type: "資料・手順", title: "健康と医療の地図 — 寿命・自殺・介護2040" },
        { type: "問い・気づき", title: "長寿の県は、医療が手厚い県なのか" },
      ],
      bodyPatterns: ["勘違い破壊型", "比較型"],
    },
    author: AUTHOR,
    chapters: [
      { title: "健康寿命の構造", source: "blog", blogSlug: "health-life-expectancy-structure" },
      { title: "自殺率と高齢化の連関", source: "blog", blogSlug: "suicide-rate-aging-nexus" },
      { title: "2040年の介護職員必要数を読む", source: "blog", blogSlug: "nursing-care-shortage-2040" },
      { title: "病床利用率の地図", source: "blog", blogSlug: "hospital-bed-utilization-map" },
      { title: "化学工業の集計と医療産業の区別", source: "blog", blogSlug: "pharma-medical-device-production-map" },
    ],
    priceYen: 800,
    newContentNote: "はじめに・おわりに (医療アクセスと高齢化の横断分析) を書き下ろし、各章を再構成。",
    keywords: ["都道府県", "健康寿命", "医療", "介護", "自殺率", "統計"],
    status: "planned",
  },
  {
    id: "K-S1-05",
    series: "S1-issues",
    title: "教育と子育ての地図 — 教育費・進学率・子育て指標",
    concept: "公費と家計の教育費、授業料、大学進学に関する指標、子育て関連の統計を比較します。支出額と教育成果、入学者数と定員、保育所等の利用率と入所希望の充足を区別して読みます。",
    // 共通事業方針「判断の問い」5 つ + STRUCTURE.md のタイトル 5 型 / 本文 9 型 (2026-09-19)。
    design: {
      readerProblem: "子どもの進学や引っ越しを考えていて、教育費をかける県ほど進学率が高いのか、待機児童や保育の入りやすさが県でどう違うのかを数字で確かめたい。",
      harm: ["A", "M"],
      harmReason: "進学 (A) と教育費・保育の家計負担 (M) を扱う。支出額と教育成果、定員と入学者、利用率と希望充足を区別し、地域の統計から個人の合否や家計を断定しない",
      valueAndPayReason: "無料では教育費・進学率・待機児童のランキングが個別に見られる。本書は公費と家計の教育費、入学者数と定員、保育利用率と希望充足を取り違えない読み方で 5 指標を通しで読む。",
      demandEvidence: "未検証: 本書 v1 は 2026-08-30 販売開始、KENP/販売数は未取込。次の検証 = 2026-09-27。",
      titleCandidates: [
        { type: "資料・手順", title: "教育と子育ての地図 — 教育費・進学率・子育て指標" },
        { type: "問い・気づき", title: "教育費をかける県ほど、進学率は高いのか" },
      ],
      bodyPatterns: ["悩み直撃型", "比較型"],
    },
    author: AUTHOR,
    chapters: [
      { title: "子ども1人当たり教育費", source: "blog", blogSlug: "education-cost-per-child" },
      { title: "教育費格差", source: "blog", blogSlug: "education-expenses-gap" },
      { title: "授業料支出のランキング", source: "blog", blogSlug: "tuition-expenditure-ranking" },
      { title: "大学進学の収容力", source: "blog", blogSlug: "university-advancement-capacity" },
      { title: "子育て関連7指標の合成ランキングとその限界", source: "blog", blogSlug: "childcare-friendly-prefecture-ranking" },
    ],
    priceYen: 800,
    newContentNote:
      "はじめに・第0章 (データの読み方)・終章を書き下ろし、公費と家計の教育費、進学率と収容力の分母、保育所等利用率と待機児童の定義を区別する読み方を横断的に整理した。公開ブログ由来の章は書籍版で校訂し、全章の独立レビューを経るまで販売準備完了としない。",
    sourceIdeas: ["pdf-book-survey:教育費の3モデル"],
    keywords: ["都道府県", "教育費", "進学率", "保育", "子育て", "統計"],
    status: "planned",
  },
  {
    id: "K-S1-06",
    series: "S1-issues",
    title: "自治体財政の地図 — 財政力・借金・将来負担",
    concept: "財政力指数、時系列、地方税、地方債務と将来負担比率を比較し、指標ごとの分母・控除・平均期間を確認します。家計の収支とは異なる地方財政の集計として読み、単一指標から健全性を断定しません。",
    // 共通事業方針「判断の問い」5 つ + STRUCTURE.md のタイトル 5 型 / 本文 9 型 (2026-09-19)。
    design: {
      readerProblem: "自分の県や移住先の自治体財政が健全なのか、借金が多い県で将来何が起きるのかが分からない。財政力指数や将来負担比率をニュースで見ても読み方が分からない。",
      harm: ["M"],
      harmReason: "住民負担・将来負担に関わる地方財政を扱う。家計の収支とは別の会計として読み、単一指標から健全性や不安を断定しない",
      valueAndPayReason: "無料では財政力指数・地方債・将来負担比率が個別に見られる。本書は各指標の分母・控除・平均期間を確認しながら 5 指標を通しで読み、家計の借金の感覚で自治体財政を読む誤りを防ぐ。",
      demandEvidence: "未検証: 本書 v1 は 2026-08-30 販売開始、KENP/販売数は未取込。次の検証 = 2026-09-27。",
      titleCandidates: [
        { type: "資料・手順", title: "自治体財政の地図 — 財政力・借金・将来負担" },
        { type: "問い・気づき", title: "財政力の低い県は、将来負担も重いのか" },
      ],
      bodyPatterns: ["勘違い破壊型", "チェックリスト型"],
    },
    author: AUTHOR,
    chapters: [
      { title: "財政力指数の格差", source: "blog", blogSlug: "fiscal-self-reliance-gap" },
      { title: "財政健全度の50年", source: "blog", blogSlug: "fiscal-health-50years-trend" },
      { title: "地方税収の格差", source: "blog", blogSlug: "local-tax-revenue-gap" },
      { title: "地方債務の負担", source: "blog", blogSlug: "local-government-debt-burden" },
      { title: "将来負担比率の両極", source: "blog", blogSlug: "future-burden-ratio-extreme-gap" },
    ],
    priceYen: 800,
    newContentNote: "はじめに・おわりに (財政指標の読み方と将来負担の横断分析) を書き下ろし、各章を再構成。",
    keywords: ["都道府県", "自治体財政", "財政力指数", "地方債", "将来負担", "統計"],
    status: "planned",
  },
  {
    id: "K-S1-07",
    series: "S1-issues",
    title: "観光とインバウンドの地図 — 宿泊・国籍・回復",
    concept: "延べ宿泊者数、国籍別の宿泊記録、対象施設の範囲、採用年の違いを確かめながら観光統計を読みます。宿泊人泊と旅行者の実人数、観測された宿泊先と個人の嗜好を区別します。",
    // 共通事業方針「判断の問い」5 つ + STRUCTURE.md のタイトル 5 型 / 本文 9 型 (2026-09-19)。
    design: {
      readerProblem: "観光や宿泊の仕事・企画に関わっていて、自分の県の宿泊者数や外国人比率が全国でどの位置か、回復の速さがどう違うかを根拠付きで説明したい。",
      harm: [],
      harmReason: "観光統計の地域比較で、健康・目標・関係・お金の個人の悩みを直接扱わない。事業者・自治体担当者の企画資料としての価値が主",
      valueAndPayReason: "無料では延べ宿泊者数・国籍別・回復率が個別に見られる。本書は人泊と実人数、対象施設の範囲、採用年の違いを確認しながら 5 指標を通しで読み、観測された宿泊先から嗜好を断定しない読み方を付ける。",
      demandEvidence: "未検証: 本書 v1 は 2026-08-30 販売開始、KENP/販売数は未取込。次の検証 = 2026-09-27。",
      titleCandidates: [
        { type: "資料・手順", title: "観光とインバウンドの地図 — 宿泊・国籍・回復" },
        { type: "問い・気づき", title: "外国人観光客が戻った県と、戻らない県はどこが違うのか" },
      ],
      bodyPatterns: ["比較型", "ケーススタディ型"],
    },
    author: AUTHOR,
    chapters: [
      { title: "宿泊の地域格差", source: "blog", blogSlug: "inbound-overnight-regional-gap" },
      { title: "国籍別の宿泊先を比較する", source: "blog", blogSlug: "inbound-by-nationality-regional-preference" },
      { title: "宿泊の集中", source: "blog", blogSlug: "inbound-overnight-stay-concentration" },
      { title: "宿泊客のインバウンド回復", source: "blog", blogSlug: "overnight-guests-inbound-recovery" },
      { title: "海外旅行の格差", source: "blog", blogSlug: "overseas-travel-gap" },
    ],
    priceYen: 800,
    newContentNote: "はじめに・おわりに (観光集中とインバウンド回復の横断分析) を書き下ろし、各章を再構成。",
    keywords: ["都道府県", "観光", "インバウンド", "宿泊", "旅行", "統計"],
    status: "idea",
  },
  {
    id: "K-S1-08",
    series: "S1-issues",
    title: "エネルギーとインフラの地図 — 電力・再エネ・ガス",
    concept: "エネルギー消費、再エネ設備、電力需要、ガス・電気、給油所の指標を読みます。設備容量・契約件数・供給区域・道路当たり密度を区別し、実際の送電経路や住民の移動距離を示す値とは扱いません。",
    // 共通事業方針「判断の問い」5 つ + STRUCTURE.md のタイトル 5 型 / 本文 9 型 (2026-09-19)。
    design: {
      readerProblem: "電気代やガス代が高い県と安い県の違い、再エネ設備が多い県で何が起きているのかを、光熱費の見直しや移住の材料として数字で確かめたい。",
      harm: ["M"],
      harmReason: "光熱費・エネルギー支出の地域差 (M) を扱う。設備容量・契約件数・供給区域の指標を家計の支出と取り違えず、個人の電気代を断定しない",
      valueAndPayReason: "無料ではエネルギー消費・再エネ・電力需要のランキングが個別に見られる。本書は設備容量・契約件数・供給区域・道路当たり密度を区別しながら 5 指標を通しで読む。",
      demandEvidence: "未検証: 本書 v1 は 2026-08-30 販売開始、KENP/販売数は未取込。次の検証 = 2026-09-27。",
      titleCandidates: [
        { type: "資料・手順", title: "エネルギーとインフラの地図 — 電力・再エネ・ガス" },
        { type: "問い・気づき", title: "電気代が高い県は、再エネが多い県なのか" },
      ],
      bodyPatterns: ["勘違い破壊型", "比較型"],
    },
    author: AUTHOR,
    chapters: [
      { title: "エネルギー消費構造の変化", source: "blog", blogSlug: "energy-consumption-structure-shift" },
      { title: "再生可能エネルギーの地域差", source: "blog", blogSlug: "renewable-energy-regional-gap" },
      { title: "電力需要の格差", source: "blog", blogSlug: "electricity-demand-gap" },
      { title: "ガス・電気インフラ", source: "blog", blogSlug: "energy-infrastructure-gas-electricity" },
      { title: "ガソリン車社会の地図", source: "blog", blogSlug: "gasoline-car-society-map" },
    ],
    priceYen: 800,
    newContentNote: "はじめに・おわりに (エネルギー転換とインフラ老朽化の横断分析) を書き下ろし、各章を再構成。",
    keywords: ["都道府県", "エネルギー", "再生可能エネルギー", "ガス", "インフラ", "統計"],
    status: "idea",
  },
  {
    id: "K-S1-09",
    series: "S1-issues",
    title: "産業と地域経済の地図 — 製造・中小・地価",
    concept: "製造業の集計、事業所規模、工業用水、商業地地価を比較します。出荷額と付加価値、従業者当たりと事業所当たり、企業と事業所、地価の金額と変動率を分けて読みます。",
    // 共通事業方針「判断の問い」5 つ + STRUCTURE.md のタイトル 5 型 / 本文 9 型 (2026-09-19)。
    design: {
      readerProblem: "転職や事業で県を選ぶときに、製造業の出荷額が大きい県は稼ぐ力も大きいのか、事業所の規模や地価がどう違うのかを数字で確かめたい。",
      harm: ["A"],
      harmReason: "就職・転職・事業の地域選びに関わる産業統計 (A) を扱う。出荷額と付加価値、従業者当たりと事業所当たり、企業と事業所を区別し、個人の年収を断定しない",
      valueAndPayReason: "無料では製造品出荷額・事業所規模・地価が個別に見られる。本書は出荷額と付加価値、従業者当たりと事業所当たり、金額と変動率を分けて 5 指標を通しで読む。",
      demandEvidence: "未検証: 本書 v1 は 2026-08-30 販売開始、KENP/販売数は未取込。次の検証 = 2026-09-27。",
      titleCandidates: [
        { type: "資料・手順", title: "産業と地域経済の地図 — 製造・中小・地価" },
        { type: "問い・気づき", title: "出荷額が大きい県ほど、稼ぐ力も大きいのか" },
      ],
      bodyPatterns: ["勘違い破壊型", "比較型"],
    },
    author: AUTHOR,
    chapters: [
      { title: "愛知の製造業支配", source: "blog", blogSlug: "manufacturing-aichi-dominance" },
      { title: "製造業の生産性", source: "blog", blogSlug: "manufacturing-productivity" },
      { title: "中小企業の地図", source: "blog", blogSlug: "small-business-dominance-map" },
      { title: "工業用水と製造業", source: "blog", blogSlug: "industrial-water-manufacturing-nexus" },
      { title: "商業地地価の推移", source: "blog", blogSlug: "commercial-land-price-trend" },
    ],
    priceYen: 800,
    newContentNote: "はじめに・おわりに (産業集積と一次産業衰退の横断分析) を書き下ろし、各章を再構成。",
    keywords: ["都道府県", "製造業", "地域経済", "中小企業", "地価", "統計"],
    status: "idea",
  },
  {
    id: "K-S1-10",
    series: "S1-issues",
    title: "安全と環境の地図 — 犯罪・労災・公害・防災",
    concept: "犯罪の認知・検挙、労働災害、公害苦情、廃棄物、火災・地震保険料支出を、各指標の対象と分母に沿って読みます。集計値から個人の被害確率や地域の安全性全般を断定しません。",
    // 共通事業方針「判断の問い」5 つ + STRUCTURE.md のタイトル 5 型 / 本文 9 型 (2026-09-19)。
    design: {
      readerProblem: "住む県の治安や災害への備えが気になるが、犯罪認知件数や労災、公害苦情の順位をどう読めば自分の暮らしの安全に結び付くのかが分からない。",
      harm: [],
      harmReason: "安全・防災の地域比較で、HARM の 4 軸に直接は当たらない。集計値から個人の被害確率や地域の安全性全般を断定せず、不安を煽らない",
      valueAndPayReason: "無料では犯罪・労災・公害・保険料支出が個別に見られる。本書は認知と検挙、対象と分母を確認しながら 5 指標を通しで読み、『件数が多い=危険』の短絡を避ける手順を付ける。",
      demandEvidence: "未検証: 本書 v1 は 2026-08-30 販売開始、KENP/販売数は未取込。次の検証 = 2026-09-27。",
      titleCandidates: [
        { type: "資料・手順", title: "安全と環境の地図 — 犯罪・労災・公害・防災" },
        { type: "問い・気づき", title: "犯罪が少ない県は、本当に安全な県なのか" },
      ],
      bodyPatterns: ["勘違い破壊型", "チェックリスト型"],
    },
    author: AUTHOR,
    chapters: [
      { title: "犯罪率の地域差", source: "blog", blogSlug: "crime-rate-regional-gap" },
      { title: "労働災害の地図", source: "blog", blogSlug: "workplace-accident-regional-map" },
      { title: "公害苦情の地図", source: "blog", blogSlug: "pollution-complaints-regional-map" },
      { title: "廃棄物とリサイクルの格差", source: "blog", blogSlug: "waste-management-recycling-gap" },
      { title: "火災・地震保険料支出を読む", source: "blog", blogSlug: "earthquake-insurance-prefecture-gap" },
    ],
    priceYen: 500,
    newContentNote: "はじめに・おわりに (安全・環境指標の読み方と防災の横断分析) を書き下ろし、各章を再構成。",
    keywords: ["都道府県", "犯罪率", "労働災害", "防災", "環境", "統計"],
    status: "idea",
  },
  {
    id: "K-S1-11",
    series: "S1-issues",
    title: "文化・スポーツ・余暇の地図",
    concept: "図書館・博物館・スポーツ施設、スポーツの行動者率、映画・演劇等への支出を比較します。施設数と利用、参加と頻度、市の家計と県全体を区別して読みます。",
    // 共通事業方針「判断の問い」5 つ + STRUCTURE.md のタイトル 5 型 / 本文 9 型 (2026-09-19)。
    design: {
      readerProblem: "図書館やスポーツ施設が多い県は文化的で活動的な県なのか、施設の数と住民の利用・参加がどれだけ結び付くのかを知りたい。",
      harm: [],
      harmReason: "文化・スポーツ・余暇の地域比較で、健康 (H) の周辺だが運動習慣の改善を約束しない。好奇心と地域理解が主",
      valueAndPayReason: "無料では施設数・行動者率・支出が個別に見られる。本書は施設数と利用、参加と頻度、市の家計と県全体を区別しながら 5 指標を通しで読む。",
      demandEvidence: "未検証: 本書 v1 は 2026-08-30 販売開始、KENP/販売数は未取込。次の検証 = 2026-09-27。",
      titleCandidates: [
        { type: "資料・手順", title: "文化・スポーツ・余暇の地図" },
        { type: "問い・気づき", title: "図書館が多い県は、本をよく読む県なのか" },
      ],
      bodyPatterns: ["勘違い破壊型", "比較型"],
    },
    author: AUTHOR,
    chapters: [
      { title: "図書館・博物館の文化資本", source: "blog", blogSlug: "library-museum-cultural-capital" },
      { title: "スポーツ施設の地域格差", source: "blog", blogSlug: "sports-facility-regional-divide" },
      { title: "スポーツ参加の地図", source: "blog", blogSlug: "sports-participation-map" },
      { title: "スポーツと都市のパラドックス", source: "blog", blogSlug: "sports-urban-paradox" },
      { title: "映画館支出", source: "blog", blogSlug: "movie-theater-expenditure-ranking" },
    ],
    priceYen: 500,
    newContentNote: "はじめに・おわりに (文化資本と余暇の横断分析) を書き下ろし、各章を再構成。",
    keywords: ["都道府県", "文化", "スポーツ", "図書館", "余暇", "統計"],
    status: "idea",
  },
  {
    id: "K-S1-12",
    series: "S1-issues",
    title: "デジタル生活の地図 — 通信・PC・テレワーク",
    concept: "テレビ・ラジオ・新聞・雑誌の利用時間、携帯契約件数、パソコン支出、テレワーク、コンビニ密度を比較します。契約件数と利用者数、支出額と保有率、有業者と雇用者の範囲を区別して読みます。",
    // 共通事業方針「判断の問い」5 つ + STRUCTURE.md のタイトル 5 型 / 本文 9 型 (2026-09-19)。
    design: {
      readerProblem: "テレワークやデジタル環境で住む場所を選びたいが、通信契約や PC 支出、テレワーク実施率が県でどう違うのか、数字の意味 (契約件数と利用者数の違い) が分からない。",
      harm: ["A"],
      harmReason: "働き方 (テレワーク) と住む場所の選択 (A) を扱う。契約件数と利用者数、支出額と保有率、有業者と雇用者を区別し、個人の働き方の可否を断定しない",
      valueAndPayReason: "無料では ICT 利用・携帯契約・PC 支出・テレワークが個別に見られる。本書は件数と人数、支出と保有、有業者と雇用者を区別しながら 5 指標を通しで読む。",
      demandEvidence: "未検証: 本書 v1 は 2026-08-30 販売開始、KENP/販売数は未取込。次の検証 = 2026-09-27。",
      titleCandidates: [
        { type: "資料・手順", title: "デジタル生活の地図 — 通信・PC・テレワーク" },
        { type: "問い・気づき", title: "テレワークが進む県は、どんな県なのか" },
      ],
      bodyPatterns: ["比較型", "ケーススタディ型"],
    },
    author: AUTHOR,
    chapters: [
      // 指標は放送メディア (テレビ・ラジオ・新聞・雑誌) の時間。旧題「ICTメディア消費の男女差」は指標と逆 (2026-09-19 K-S1-12 F04)
      { title: "テレビ・ラジオ・新聞・雑誌の時間の男女差", source: "blog", blogSlug: "ict-media-consumption-gender-gap" },
      { title: "人口を超える携帯契約", source: "blog", blogSlug: "mobile-contracts-over-population" },
      { title: "パソコン支出", source: "blog", blogSlug: "personal-computer-expenditure-ranking" },
      { title: "テレワーク格差 — 東京6倍", source: "blog", blogSlug: "telework-gap-tokyo-6x" },
      { title: "コンビニ密度の地図", source: "blog", blogSlug: "convenience-store-density-map" },
    ],
    priceYen: 500,
    newContentNote: "はじめに・おわりに (デジタル生活の地域差の横断分析) を書き下ろし、各章を再構成。",
    keywords: ["都道府県", "デジタル", "テレワーク", "通信", "ICT", "統計"],
    status: "idea",
  },
];

/** S2 (テーマ別データブック) — コナラ P-01〜P-14 の書籍版ダイジェスト。idea 止まり (需要実測後に章立て)。 */
const S2_THEMES: readonly { readonly suffix: string; readonly label: string; readonly pack: string }[] = [
  { suffix: "01", label: "人口・世帯", pack: "P-01" },
  { suffix: "02", label: "所得・賃金・採用", pack: "P-02" },
  { suffix: "03", label: "観光・宿泊", pack: "P-03" },
  { suffix: "04", label: "自治体財政", pack: "P-04" },
  { suffix: "05", label: "医療・介護", pack: "P-05" },
  { suffix: "06", label: "教育・子育て", pack: "P-06" },
  { suffix: "07", label: "移住・生活", pack: "P-07" },
  { suffix: "08", label: "出店・商圏", pack: "P-08" },
  { suffix: "09", label: "産業・経済", pack: "P-09" },
  { suffix: "10", label: "防災・インフラ", pack: "P-10" },
  { suffix: "11", label: "家計・消費", pack: "P-14" },
];

/** S2 データブックの導入 (書き下ろし・テーマ別に文面を差し替え)。 */
function s2IntroMd(label: string, pack: string): string {
  return `# はじめに — ${label}を、47都道府県のランキングで読む

本書は、${label}にまつわる主要な統計を、47都道府県のランキングとして一望できるデータブックです。各指標について、もっとも高い県と低い県の顔ぶれを上位五県・下位五県のかたちで示し、その差がどれくらい大きいのか、全国平均はどのあたりにあるのかを、一目でつかめるように整理しました。

数値はすべて e-Stat（政府統計の総合窓口）で公開されている政府統計から取得し、基準年をそろえて並べ直したものです。書籍のために数字を作ったり、独自に推計したりはしていません。ランキングの一つひとつには、1位と最下位の県名・数値、そして両者の格差と全国平均を添えていますので、気になった指標があれば、そのままご自身の県の位置を確かめる手がかりとして使うことができます。

本書は「読むためのダイジェスト」です。ここに載せた指標をさらに深く、全47都道府県の数値表やグラフ、県別の塗り分け地図として手元で加工したい方に向けては、同じ${label}テーマの全指標をおさめたデータ集（PowerPoint・Excel・CSV 一式）を、別途ご用意しています。まずは本書で全体像をつかみ、必要に応じてデータ集で細部を掘り下げる——そんな使い方を想定しています。

それでは、${label}の地図を、県ごとの数字から読み解いていきましょう。`;
}

const S2_BOOKS: readonly KindleBook[] = S2_THEMES.map((t) => ({
  id: `K-S2-${t.suffix}`,
  series: "S2-theme-databook" as const,
  title: `データで見る47都道府県 ${t.label}`,
  concept: `${t.label}に関わる主要な統計を、上位・下位の図と全県の数値表で確かめるデータブック。対象・分母・年次と比較の限界を、書き下ろし章で読み解きます。分布だけから原因を断定するものではありません。`,
  author: AUTHOR,
  chapters: [
    // 書き下ろし章 (manuscripts/<id>/*.md)。無い書籍はインラインの導入へ degrade する。
    { title: "はじめに", source: "fresh" as const, freshFile: `${S2_M(t.suffix)}/00-intro.md`, freshText: s2IntroMd(t.label, t.pack) },
    { title: "第1章 この分野の統計の読み方", source: "fresh" as const, freshFile: `${S2_M(t.suffix)}/10-how-to-read.md` },
    { title: "前半の指標群をつなぐ", source: "fresh" as const, freshFile: `${S2_M(t.suffix)}/20-bridge-a.md` },
    {
      title: `${t.label}の主要ランキング`,
      source: "ranking" as const,
      // 章に載せるキーは書籍ごとの SSOT で確定させる (pack 全件の先頭 24 件ではない)。
      rankingKeys: BOOK_RANKING_KEYS[`K-S2-${t.suffix}`] ?? PACK_RANKING_KEYS[t.pack] ?? [],
    },
    { title: t.suffix === "01" ? "振り返り — 結婚・出産・死亡と衛生基盤の指標" : "収録指標を振り返る", source: "fresh" as const, freshFile: `${S2_M(t.suffix)}/30-bridge-b.md` },
    { title: "章横断の合成分析", source: "fresh" as const, freshFile: `${S2_M(t.suffix)}/50-cross-analysis.md` },
    { title: "地方ブロックで見る", source: "fresh" as const, freshFile: `${S2_M(t.suffix)}/60-regional-view.md` },
    { title: "終章", source: "fresh" as const, freshFile: `${S2_M(t.suffix)}/90-synthesis.md` },
  ],
  priceYen: 500 as const,
  newContentNote: `テーマ解説・図表の見方・出典補章 (書き下ろし) + e-Stat 観測値から生成した主要ランキング (上位5+下位5・格差・全国平均)。全指標データは ${t.pack} で提供 (書籍は読む用ダイジェスト)。`,
  sourceIdeas: [`coconala:${t.pack}`],
  keywords: ["都道府県", t.label, "ランキング", "データブック", "統計"],
  status: "generated" as const,
}));

/** S3 (地域別) — 47 県を 8 地方ブロックで 1 冊。idea 止まり。 */
const S3_REGIONS: readonly { readonly suffix: string; readonly label: string }[] = [
  { suffix: "01", label: "北海道" },
  { suffix: "02", label: "東北" },
  { suffix: "03", label: "関東" },
  { suffix: "04", label: "中部" },
  { suffix: "05", label: "近畿" },
  { suffix: "06", label: "中国" },
  { suffix: "07", label: "四国" },
  { suffix: "08", label: "九州・沖縄" },
];

/** 8 地方ブロックの構成県 (5桁コード)。 */
/** S3 地域別の県コード (選定スクリプトも参照するので export する)。 */
export const S3_REGION_CODES: Readonly<Record<string, readonly string[]>> = {
  "01": ["01000"], // 北海道
  "02": ["02000", "03000", "04000", "05000", "06000", "07000"], // 東北
  "03": ["08000", "09000", "10000", "11000", "12000", "13000", "14000"], // 関東
  "04": ["15000", "16000", "17000", "18000", "19000", "20000", "21000", "22000", "23000"], // 中部
  "05": ["24000", "25000", "26000", "27000", "28000", "29000", "30000"], // 近畿
  "06": ["31000", "32000", "33000", "34000", "35000"], // 中国
  "07": ["36000", "37000", "38000", "39000"], // 四国
  "08": ["40000", "41000", "42000", "43000", "44000", "45000", "46000", "47000"], // 九州・沖縄
};

/**
 * ai-content の regionalAnalysis が使う地方ブロック見出し。
 * S3 の章で「該当ブロックの段落」だけを抜き出すのに使う (見出し語が一致しないと抽出できない)。
 */
const S3_REGION_BLOCK_LABEL: Readonly<Record<string, string>> = {
  "01": "北海道",
  "02": "北海道・東北",
  "03": "関東",
  "04": "中部",
  "05": "近畿",
  "06": "中国",
  "07": "四国",
  "08": "九州",
};

function s3IntroMd(label: string): string {
  return `# はじめに — ${label}を、統計の地図で読む

本書は、${label}の各県が、人口・経済・暮らし・産業・余暇といったさまざまな分野で、全国のなかでどのような位置にあるのかを、統計から読み解く一冊です。

私たちは、自分の住む県や隣の県について、なんとなくのイメージを持っています。「あの県は米どころだ」「この県は工業が盛んだ」といった具合です。そうしたイメージは、多くの場合それなりに当たっているものですが、数字で確かめてみると、思っていたのとは違う顔が見えてくることも少なくありません。イメージのなかでは目立たなかった県が、ある指標では全国上位に食い込んでいたり、逆に「豊かな県」と思っていたところが、暮らしのある側面では厳しい数字を抱えていたりします。

本書のねらいは、そうした「なんとなくのイメージ」を、公的統計という共通の物差しで確かめ直すことにあります。各分野の主要な指標について、まず全国の上位五県・下位五県のランキングを示し、そのうえで${label}の県のなかではどの県がもっとも上位にあるのかを添えました。全国という広い物差しと、${label}という地域のなかでの相対的な位置。この二つの視点を重ねると、それぞれの県の横顔が、より立体的に浮かび上がってきます。

## この本の読み方

各項目には、上位五県と下位五県を並べた図と、1位・最下位の県名と数値、両者の格差、そして全国平均を添えています。まず図で全国の落差の大きさをつかみ、次に${label}の県がそのなかでどのあたりに位置するかを確認する——この順番で読み進めると、地域の特徴がつかみやすくなります。

なお、ある指標で上位だからといって、それが単純に「良い」ことを意味するとは限りませんし、下位だから「悪い」わけでもありません。統計の数字は、その県に暮らす人々の生活や、地理・歴史・産業構造といった背景が重なった結果として現れるものです。順位の上下だけを追うのではなく、その裏側にある事情を想像しながら読んでいただければ幸いです。

数値はすべて e-Stat（政府統計の総合窓口）で公開されている政府統計から取得し、基準年をそろえて並べ直したものです。書籍のために数字を作ったり、独自に推計したりはしていません。それでは、${label}の県々を、数字の地図とともにめぐっていきましょう。`;
}

const S3_BOOKS: readonly KindleBook[] = S3_REGIONS.map((r) => ({
  id: `K-S3-${r.suffix}`,
  series: "S3-region" as const,
  title: `${r.label}データブック — 統計で読む県の横顔`,
  concept: `${r.label}の各県が、全国の主要ランキングのなかでどこに位置するかを一望する地域別データブック。全国順位と地域内順位の両面から県の横顔を描く。`,
  author: AUTHOR,
  chapters: [
    { title: "はじめに", source: "fresh" as const, freshFile: `${S3_M(r.suffix)}/00-intro.md`, freshText: s3IntroMd(r.label) },
    { title: "第1章 地域データの読み方", source: "fresh" as const, freshFile: `${S3_M(r.suffix)}/10-how-to-read.md` },
    {
      title: `${r.label}の県は全国でどこに位置するか`,
      source: "ranking" as const,
      // 地域ごとに**その地域が特徴的な指標**を選ぶ (全冊同一本文の再発防止)。
      rankingKeys: BOOK_RANKING_KEYS[`K-S3-${r.suffix}`] ?? PACK_RANKING_KEYS["P-12"] ?? [],
      highlightRegionLabel: r.label,
      highlightCodes: S3_REGION_CODES[r.suffix] ?? [],
      regionBlockLabel: S3_REGION_BLOCK_LABEL[r.suffix],
    },
    { title: "県別プロフィール（前半）", source: "fresh" as const, freshFile: `${S3_M(r.suffix)}/20-profile-a.md` },
    { title: "県別プロフィール（後半）", source: "fresh" as const, freshFile: `${S3_M(r.suffix)}/30-profile-b.md` },
    { title: "地域内の落差を読む", source: "fresh" as const, freshFile: `${S3_M(r.suffix)}/40-inside-gap.md` },
    { title: "全国の中でのこの地域", source: "fresh" as const, freshFile: `${S3_M(r.suffix)}/50-national-position.md` },
    { title: "終章", source: "fresh" as const, freshFile: `${S3_M(r.suffix)}/90-synthesis.md` },
  ],
  priceYen: 500 as const,
  newContentNote: `地域の概説・図表の見方・出典補章 (書き下ろし) + e-Stat 観測値から生成した幅広い分野のランキング (全国 上位5+下位5・格差・全国平均・地域内最上位県)。`,
  sourceIdeas: ["kindle:region-databook"],
  keywords: ["都道府県", r.label, "地域", "データブック", "統計"],
  status: "generated" as const,
}));

/** S4 (ランキング大全) — 競合最強ゾーン。最後発・優先度最低。 */
const S4_BOOKS: readonly KindleBook[] = [
  {
    id: "K-S4-01",
    series: "S4-ranking-compendium",
    title: "47都道府県ランキング大全 — 意外な1位・最下位",
    concept:
      "分野をまたいで集めた統計のなかから、思わず人に話したくなる「意外な1位・最下位」を選び抜いた一冊。人口の多い県が上位に来るとはかぎらない指標を並べ、その理由を産業や地理から読み解きます。",
    author: AUTHOR,
    chapters: [
      {
        title: "はじめに",
        source: "fresh",
        freshFile: `${S4_M}/00-intro.md`,
        freshText: `# はじめに — 47都道府県の「意外な1位・最下位」を数字で

日本には47の都道府県があり、それぞれに個性があります。本書は、人口や経済から、暮らし、産業、余暇まで、幅広い分野の統計を横断し、都道府県ごとの「もっとも高い県」と「もっとも低い県」を、上位五県・下位五県のランキングとして一望できる一冊です。

数値はすべて e-Stat（政府統計の総合窓口）で公開されている政府統計から取得し、基準年をそろえて並べ直したものです。書籍のために数字を作ったり、独自に推計したりはしていません。各ランキングには、1位と最下位の県名・数値に加えて、両者の格差と全国平均を添えていますので、「どれくらい差があるのか」「自分の県はどのあたりか」を、その場でつかむことができます。

分野を横断して眺めていくと、「豊かな県」「厳しい県」といった単純な図式では捉えきれない、都道府県それぞれの多面的な顔が見えてきます。ある指標で1位の県が、別の指標では最下位に沈む——そんな逆転の面白さも、本書の読みどころのひとつです。それでは、数字がつくる47都道府県の地図を、ページをめくりながら旅していきましょう。`,
      },
      {
        title: "分野を横断した都道府県ランキング",
        source: "ranking",
        // 「意外な1位」— 1 位が人口規模の大きい県でない × 格差が大きいキーを選ぶ。
        rankingKeys: BOOK_RANKING_KEYS["K-S4-01"] ?? PACK_RANKING_KEYS["P-12"] ?? [],
      },
      { title: "第1章 この分野の統計の読み方", source: "fresh", freshFile: `${S4_M}/10-how-to-read.md` },
      { title: "前半の指標群をつなぐ", source: "fresh", freshFile: `${S4_M}/20-bridge-a.md` },
      { title: "後半の指標群をつなぐ", source: "fresh", freshFile: `${S4_M}/30-bridge-b.md` },
      { title: "章横断の合成分析", source: "fresh", freshFile: `${S4_M}/50-cross-analysis.md` },
      { title: "地方ブロックで見る", source: "fresh", freshFile: `${S4_M}/60-regional-view.md` },
      { title: "終章", source: "fresh", freshFile: `${S4_M}/90-synthesis.md` },
    ],
    priceYen: 1000,
    newContentNote: "分野横断の導入・図表の見方・出典補章 (書き下ろし) + e-Stat 観測値から生成した幅広い分野のランキング (上位5+下位5・格差・全国平均)。競合との差別化は網羅性と一次データからの機械再現性に置く。",
    sourceIdeas: ["kindle-monetization:ランキング大全は競合先行・最後発"],
    keywords: ["都道府県", "ランキング", "雑学", "統計", "日本一"],
    status: "generated",
  },
];

/**
 * S1-02 以降は共通の書き下ろし構成 (はじめに + データの読み方を前置き、終章を後置き) を
 * manuscripts/<id>/ から注入する。K-S1-01 は個別構成 (出典章を含む) のためそのまま。
 * ブログ章はそのまま挟み込む。出典補章は build-book が自動付与する。
 */
function withS1Fresh(b: KindleBook): KindleBook {
  if (b.id === "K-S1-01") return b;
  const m = `src/channels/kindle/manuscripts/${b.id}`;
  const chapters: BookChapter[] = [
    { title: "はじめに", source: "fresh", freshFile: `${m}/00-intro.md` },
    { title: "第0章 データの読み方", source: "fresh", freshFile: `${m}/10-how-to-read.md` },
    ...b.chapters,
    { title: "終章", source: "fresh", freshFile: `${m}/90-synthesis.md` },
  ];
  // S1-02〜12 は書き下ろし完成 + EPUB 生成済み (2026-07-23)。Kindle Previewer 検証・公開は人間工程。
  return { ...b, chapters, status: "generated" };
}

/** 全書籍 (SSOT)。 */
export const KINDLE_BOOKS: readonly KindleBook[] = [
  ...S1_BOOKS.map(withS1Fresh),
  ...S2_BOOKS,
  ...S3_BOOKS,
  ...S4_BOOKS,
];

/** 期待シリーズ集合 (validator の二重チェック用)。 */
export const EXPECTED_SERIES: ReadonlySet<KindleBook["series"]> = new Set([
  "S1-issues",
  "S2-theme-databook",
  "S3-region",
  "S4-ranking-compendium",
]);

/** id → book。 */
export const BOOK_BY_ID: ReadonlyMap<string, KindleBook> = new Map(
  KINDLE_BOOKS.map((b) => [b.id, b]),
);
