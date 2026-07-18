/**
 * 愛媛県 (38000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 四国エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const EHIME_EDITORIAL: AreaEditorial = {
  areaCode: "38000",
  symbols: {
    tree: "マツ",
    flower: "みかんの花",
    bird: "コマドリ",
    fish: "マダイ",
    song: "愛媛の歌",
    sourceUrl: "https://www.pref.ehime.jp/h12200/shokai/sinboru.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "kanpei",
      name: "甘平",
      municipality: "県内全域（栽培は愛媛県内限定）",
      description:
        "西之香にポンカンを交配した愛媛県オリジナルのタンゴール。外皮とじょうのう膜が薄くむきやすい上に果汁が豊富で、糖度が高く酸抜けも早い。栽培は県内に限られる登録品種として保護されている。",
      sourceUrl: "https://www.pref.ehime.jp/page/1385.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "beni-madonna",
      name: "紅まどんな",
      municipality: "松山市・今治市",
      description:
        "県が育成したかんきつで、皮も袋（じょうのう）もやわらかく、ゼリーのようにとろける食感が特徴。雨に弱く施設栽培が中心で、11〜12月に出荷される大玉・濃紅色の贈答用品種として人気が高い。",
      sourceUrl: "https://www.zennoh.or.jp/eh/food/Introduction/ssi/fruits/benimadonna.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "matsuyama-naganasu",
      name: "松山長なす",
      municipality: "松山市",
      description:
        "40cmを超える細長いなすで、肉質がやわらかくきめ細かく種が少ないのが特長。どこを輪切りにしても同じ太さになる均一さが料理人に好まれ、平成20年にまつやま農林水産物ブランドに認定された。",
      sourceUrl: "http://g-foods.info/zukan/product/product_1060.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "iyodai",
      name: "愛鯛（養殖マダイ）",
      municipality: "宇和海沿岸",
      description:
        "愛媛県は1990年以降、養殖マダイの生産量で日本一を維持し、2006年以降は全国生産量の半分以上を占める。宇和海の穏やかな海況を生かした養殖が盛んで、マダイは県魚にも指定されている。",
      sourceUrl: "https://www.pref.ehime.jp/h37100/suisan_okoku_ehime/fish_madai.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hayahori-bareisho",
      name: "早堀りばれいしょ",
      municipality: "宇和島市",
      description:
        "段畑が広がる遊子水ヶ浦地区など宇和海沿岸の温暖な気候を生かし、冬に植え付けて通常より早い4〜5月に収穫する男爵イモ。皮が薄く水分が多い春の新じゃがとして親しまれる。",
      sourceUrl: "https://www.zennoh.or.jp/eh/food/Introduction/ssi/vegetable/bareisho.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "iyo-no-himetakami",
      name: "伊予の媛貴海",
      municipality: "愛南町ほか宇和海沿岸",
      description:
        "希少な高級魚スマを養殖した「媛スマ」の最高品質ブランド。魚体2.5kg以上・脂質含有率25%以上などの基準を満たし、船上活〆と血抜きを徹底した全身トロの味わいが特徴。",
      sourceUrl: "https://www.pref.ehime.jp/h37100/suisan_okoku_ehime/fish_suma.html",
      accessedAt: "2026-07-18",
    },
  ],
};
