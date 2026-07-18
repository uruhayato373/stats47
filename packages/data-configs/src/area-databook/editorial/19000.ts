/**
 * 山梨県 (19000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 北陸・甲信越エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const YAMANASHI_EDITORIAL: AreaEditorial = {
  areaCode: "19000",
  symbols: {
    tree: "カエデ",
    flower: "フジザクラ",
    bird: "ウグイス",
    song: "山梨県の歌",
    sourceUrl: "https://www.pref.yamanashi.jp/",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "momo",
      name: "桃",
      municipality: "県内広域（笛吹市ほか）",
      description:
        "山梨県は栽培面積・収穫量ともに桃の生産量日本一を誇り、なかでも笛吹市は市区町村単位でも全国一の産地。笛吹川対岸の扇状地は桃源郷と呼ばれ、80種以上の品種が初夏から晩夏まで順に出回る。",
      sourceUrl: "https://www.pref.yamanashi.jp/oishii-mirai/nochikusanbutsu_ichiran.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "budo",
      name: "ブドウ",
      municipality: "県内広域",
      description:
        "山梨県は栽培面積・生産量ともに日本一のブドウ王国で、約1300年前から栽培が続く歴史を持つ。ワイン原料の甲州は山梨県発祥の品種で、近年はシャインマスカットが県内最多の生産量を誇る。",
      sourceUrl: "https://www.pref.yamanashi.jp/miryoku/shoku/budo/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kiyou",
      name: "貴陽",
      municipality: "南アルプス市ほか",
      description:
        "南アルプス市発祥のすももで、世界一重いプラムともいわれる大玉品種。棚栽培により日当たりと風通しを確保して栄養を実に集中させ、果皮の白い粉（ブルーム）が新鮮さの証となる高級果実。",
      sourceUrl:
        "https://www.pref.yamanashi.jp/oishii-mirai/contents/takumi/kiyou_asakawashi1.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "gold-rush",
      name: "ゴールドラッシュ",
      municipality: "中央市ほか",
      description:
        "生でも食べられるほど糖度が高いトウモロコシの品種で、糖度16〜18度と甘みの強さが特徴。中央市では毎年収穫祭が開かれ、長野県より一足早い初夏に収穫最盛期を迎える。",
      sourceUrl: "https://www.web-komachi.com/?p=160947",
      accessedAt: "2026-07-18",
    },
    {
      slug: "otsuka-ninjin",
      name: "大塚にんじん",
      municipality: "市川三郷町",
      description:
        "八ヶ岳噴火由来の火山灰土壌「のっぷい」で育つ長さ80〜120cmにも及ぶ長にんじん。カロチンは通常のにんじんの1.5倍、ビタミンCは2.3倍と栄養価が高く、炊き込みご飯やジュースに加工される。",
      sourceUrl: "https://www.town.ichikawamisato.yamanashi.jp/40administration/24norin/files/ninjinhimitsu.pdf",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hozumi-yuzu",
      name: "穂積の柚子",
      municipality: "富士川町",
      description:
        "富士川町穂積地区は南アルプス南麓の日照と気温差、水はけの良さに恵まれ、古くから香りの強い柚子の産地として知られる。果皮が厚く香気成分を豊かに蓄えるのが特徴で、11月上旬から出荷が始まる。",
      sourceUrl: "https://www.town.fujikawa.yamanashi.jp/kanko/docs_kanko/2023090700573/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "cresson",
      name: "クレソン",
      municipality: "道志村ほか",
      description:
        "道志村は道志川源流の清冽な水と冷涼な気候に恵まれ、8軒に満たない農家で日本トップクラスの出荷量を誇るクレソンの里。一年を通じて安定した水温を保てる湧水環境が茎の太さと爽やかな香りを育む。",
      sourceUrl: "https://www.mainichigrillbu.com/column/282",
      accessedAt: "2026-07-18",
    },
    {
      slug: "akebono-daizu",
      name: "大豆（あけぼの大豆）",
      municipality: "身延町",
      description:
        "身延町曙地区で採れた種のみを使い、同地区内でのみ栽培される希少な大豆。一般的な大豆より粒が大きく甘みが強いのが特徴で、10月には枝豆として、11月下旬から12月中旬には完熟大豆として出荷される。",
      sourceUrl: "https://www.pref.yamanashi.jp/oishii-mirai/nochikusanbutsu_ichiran.html",
      accessedAt: "2026-07-18",
    },
  ],
};
