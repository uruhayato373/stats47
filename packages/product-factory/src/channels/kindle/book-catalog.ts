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
    title: "実質手取りの地図 — 住む県で変わる、暮らしのお金",
    subtitle: "年収ランキングでは見えない47都道府県の家計",
    concept:
      "名目年収と、家賃・物価を差し引いた実質手取りの逆転を軸に、県民所得・貯蓄・エンゲル係数・消費のクセを一冊で見渡す家計の地図。",
    author: AUTHOR,
    chapters: [
      { title: "はじめに — 年収の地図と、暮らしの地図は違う", source: "fresh", freshFile: `${M}/00-intro.md` },
      { title: "第0章 家計データの読み方 — 名目と実質、比率と実額", source: "fresh", freshFile: `${M}/10-how-to-read.md` },
      { title: "年収1位の東京が、家賃を引くと転落する", source: "blog", blogSlug: "real-disposable-income-reversal" },
      { title: "寒冷地の隠れコスト — 暖房費と可処分所得", source: "blog", blogSlug: "heating-cost-vs-disposable-income" },
      { title: "1人当たり県民所得の格差を読む", source: "blog", blogSlug: "per-capita-income-gap" },
      { title: "貯蓄残高の地図 — 堅実な県、宵越しの金を持たない県", source: "blog", blogSlug: "savings-balance-gap" },
      { title: "エンゲル係数の落とし穴 — 食を楽しむ県か、食費に追われる県か", source: "blog", blogSlug: "engel-coefficient-prefecture-ranking" },
      { title: "世帯支出の構造を県で比べる", source: "blog", blogSlug: "household-spending-prefecture-gap" },
      { title: "通信費という固定費の県差", source: "blog", blogSlug: "communication-cost-burden" },
      { title: "支出構造の比較 — お金は何に消えているか", source: "blog", blogSlug: "expenditure-structure-comparison" },
      { title: "所得と消費のクセ — 紅茶は高所得世帯に売れるか", source: "blog", blogSlug: "black-tea-income-gap" },
      { title: "終章 — 「安い県」でも「豊かな県」でもなく", source: "fresh", freshFile: `${M}/90-synthesis.md` },
      { title: "出典と再現について", source: "fresh", freshFile: `${M}/95-sources-method.md` },
    ],
    priceYen: 800,
    newContentNote:
      "はじめに・第0章(家計データの読み方)・終章(9章横断の合成分析)・出典補章を書き下ろし(約1.5万字)、各章は公開ブログを書籍向けに再構成。書籍限定の方法論と横断的枠組み(名目↔実質の逆転・比率と実額の使い分け・所得×地理×消費)を新たに加えた。",
    sourceIdeas: ["pdf-book-survey:実質手取り", "pdf-book-survey:寒冷地の隠れコスト", "pdf-book-survey:紅茶×所得"],
    keywords: ["都道府県", "家計", "年収", "可処分所得", "家計調査", "県民性", "統計"],
    // EPUB 生成済 + blog-critic PASS (2026-07-23)。Kindle Previewer 検証・KDP 公開は人間工程。
    status: "generated",
  },
  {
    id: "K-S1-02",
    series: "S1-issues",
    title: "消費量日本一の食卓 — 家計調査で読む47都道府県の食",
    concept: "家計調査の品目別支出から「消費量日本一」の県を追い、食文化・気候・産地との結びつきを読む雑学読み物。",
    author: AUTHOR,
    chapters: [
      { title: "麺類消費の県民性", source: "blog", blogSlug: "noodle-consumption-prefecture-character" },
      { title: "味噌消費量の地図", source: "blog", blogSlug: "miso-consumption-quantity-prefecture-gap" },
      { title: "砂糖消費の東北・九州", source: "blog", blogSlug: "sugar-consumption-prefecture-gap" },
      { title: "かに支出の日本一", source: "blog", blogSlug: "crab-expenditure-ranking" },
      { title: "さばと真あじ — 青魚の食卓", source: "blog", blogSlug: "mackerel-expenditure-ranking" },
    ],
    priceYen: 800,
    newContentNote: "はじめに・おわりに (食文化×気候×産地の横断分析) を書き下ろし、各章の消費量ランキングを再構成。",
    sourceIdeas: ["pdf-book-survey:消費地バトル", "blog-quality-standards:D2 型クラスタ"],
    keywords: ["都道府県", "食文化", "家計調査", "県民性", "消費量", "雑学"],
    status: "planned",
  },
  {
    id: "K-S1-03",
    series: "S1-issues",
    title: "人口減少と世帯の地図 — 未婚・単身・東京集中",
    concept: "未婚率・単身高齢・世帯構造の変化・東京一極集中を束ね、人口減少が暮らしの単位をどう変えたかを読む。",
    author: AUTHOR,
    chapters: [
      { title: "40代未婚率の危機", source: "blog", blogSlug: "unmarried-rate-40years-crisis" },
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
    concept: "健康寿命・自殺率・2040年の介護不足・病床利用を束ね、医療アクセスの地域差を読む。",
    author: AUTHOR,
    chapters: [
      { title: "健康寿命の構造", source: "blog", blogSlug: "health-life-expectancy-structure" },
      { title: "自殺率と高齢化の連関", source: "blog", blogSlug: "suicide-rate-aging-nexus" },
      { title: "2040年の介護不足", source: "blog", blogSlug: "nursing-care-shortage-2040" },
      { title: "病床利用率の地図", source: "blog", blogSlug: "hospital-bed-utilization-map" },
      { title: "医薬品・医療機器生産の地図", source: "blog", blogSlug: "pharma-medical-device-production-map" },
    ],
    priceYen: 800,
    newContentNote: "はじめに・おわりに (医療アクセスと高齢化の横断分析) を書き下ろし、各章を再構成。",
    keywords: ["都道府県", "健康寿命", "医療", "介護", "自殺率", "統計"],
    status: "planned",
  },
  {
    id: "K-S1-05",
    series: "S1-issues",
    title: "教育と子育ての地図 — 教育費・進学率・待機児童",
    concept: "教育費・進学率・不登校・待機児童・子育て支援を束ね、子どもを取り巻く環境の地域差を読む。",
    author: AUTHOR,
    chapters: [
      { title: "子ども1人当たり教育費", source: "blog", blogSlug: "education-cost-per-child" },
      { title: "教育費格差", source: "blog", blogSlug: "education-expenses-gap" },
      { title: "授業料支出のランキング", source: "blog", blogSlug: "tuition-expenditure-ranking" },
      { title: "大学進学の収容力", source: "blog", blogSlug: "university-advancement-capacity" },
      { title: "子育てしやすい県", source: "blog", blogSlug: "childcare-friendly-prefecture-ranking" },
    ],
    priceYen: 800,
    newContentNote: "はじめに・おわりに (教育投資と進学の横断分析・秋田/奈良/東京の3モデル) を書き下ろし、各章を再構成。",
    sourceIdeas: ["pdf-book-survey:教育費の3モデル"],
    keywords: ["都道府県", "教育費", "進学率", "待機児童", "子育て", "統計"],
    status: "planned",
  },
  {
    id: "K-S1-06",
    series: "S1-issues",
    title: "自治体財政の地図 — 財政力・借金・将来負担",
    concept: "財政力指数・50年の推移・地方税収・債務・将来負担比率を束ね、自治体の家計の健全性を読む。",
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
    concept: "宿泊数・国籍別の嗜好・集中・回復・海外旅行を束ね、観光の地域差とインバウンドの実像を読む。",
    author: AUTHOR,
    chapters: [
      { title: "宿泊の地域格差", source: "blog", blogSlug: "inbound-overnight-regional-gap" },
      { title: "国籍別の地域嗜好", source: "blog", blogSlug: "inbound-by-nationality-regional-preference" },
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
    title: "エネルギーとインフラの地図 — 電力・再エネ・水道",
    concept: "エネルギー消費構造・再エネ・電力需要・ガソリン社会・道路・水道インフラを束ねる。",
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
    keywords: ["都道府県", "エネルギー", "再生可能エネルギー", "水道", "インフラ", "統計"],
    status: "idea",
  },
  {
    id: "K-S1-09",
    series: "S1-issues",
    title: "産業と地域経済の地図 — 製造・中小・農林",
    concept: "製造業の集積・生産性・中小企業・工業用水・地価・林業・農地を束ね、地域経済の骨格を読む。",
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
    keywords: ["都道府県", "製造業", "地域経済", "中小企業", "農業", "統計"],
    status: "idea",
  },
  {
    id: "K-S1-10",
    series: "S1-issues",
    title: "安全と環境の地図 — 犯罪・労災・公害・防災",
    concept: "犯罪率・労働災害・公害苦情・廃棄物リサイクル・地震保険を束ね、安全と環境の地域差を読む。",
    author: AUTHOR,
    chapters: [
      { title: "犯罪率の地域差", source: "blog", blogSlug: "crime-rate-regional-gap" },
      { title: "労働災害の地図", source: "blog", blogSlug: "workplace-accident-regional-map" },
      { title: "公害苦情の地図", source: "blog", blogSlug: "pollution-complaints-regional-map" },
      { title: "廃棄物とリサイクルの格差", source: "blog", blogSlug: "waste-management-recycling-gap" },
      { title: "地震保険の県差", source: "blog", blogSlug: "earthquake-insurance-prefecture-gap" },
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
    concept: "図書館・博物館・スポーツ施設・スポーツ参加・映画・都市公園を束ね、余暇と文化資本の地域差を読む。",
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
    concept: "ICTメディア消費・携帯契約・PC支出・テレワーク・通信費・コンビニ密度を束ね、デジタル生活の地域差を読む。",
    author: AUTHOR,
    chapters: [
      { title: "ICTメディア消費の男女差", source: "blog", blogSlug: "ict-media-consumption-gender-gap" },
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
  concept: `${t.label}に関わる主要な統計を、県ごとの上位・下位が一目で分かる図とともに読み解くデータブック。指標ごとに「なぜその分布になるのか」を産業構造や地理から解説します。`,
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
    { title: "後半の指標群をつなぐ", source: "fresh" as const, freshFile: `${S2_M(t.suffix)}/30-bridge-b.md` },
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
