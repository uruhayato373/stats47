/**
 * 神奈川県 (14000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 関東エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const KANAGAWA_EDITORIAL: AreaEditorial = {
  areaCode: "14000",
  symbols: {
    tree: "イチョウ",
    flower: "ヤマユリ",
    bird: "カモメ",
    song: "光あらたに",
    sourceUrl: "https://www.pref.kanagawa.jp/docs/ie2/cnt/f530001/p780105.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "soga-no-ume",
      name: "曽我の梅",
      municipality: "小田原市",
      description:
        "東海道の宿場町だった小田原で、旅人の保存食として梅干しの増産が図られたことに始まる特産品。曽我地区は関東有数の梅の産地として知られ、梅干し・梅酒など加工品も豊富に作られている。",
      sourceUrl: "https://www.city.odawara.kanagawa.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "wakasagi-hakone",
      name: "ワカサギ",
      municipality: "箱根町",
      description:
        "箱根・芦ノ湖で獲れるワカサギは100年近い歴史を持ち、かつて宮中三殿への献上品にもなった伝統食材。湖の冬の風物詩である穴釣り・氷上釣りでも親しまれ、天ぷらや佃煮で味わわれている。",
      sourceUrl: "https://www.hakone.or.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tsukui-zairai-daizu",
      name: "津久井在来大豆",
      municipality: "県内広域(相模原市津久井地域)",
      description:
        "相模原市津久井地域に古くから伝わる在来種の大豆で、大粒で強い甘みが持ち味。栽培量が少なく流通量も限られるため「幻の大豆」と呼ばれ、豆腐や味噌の原料として地域で大切に受け継がれている。",
      sourceUrl: "https://www.city.sagamihara.kanagawa.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "sagamigawa-no-ayu",
      name: "相模川の鮎",
      municipality: "厚木市",
      description:
        "相模川は「鮎河」とも呼ばれるほど天然鮎の名産地で、江戸時代には幕府への献上品としても扱われた歴史を持つ。清流で育つ鮎は香り高く、厚木市周辺では夏の風物詩として鮎漁や鮎料理が親しまれている。",
      sourceUrl: "https://www.city.atsugi.kanagawa.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shonan-red",
      name: "湘南レッド",
      municipality: "小田原市、大磯町、川崎市",
      description:
        "辛みや刺激臭が少なく甘みが強い紫タマネギの品種。水分を多く含みみずみずしいため生食に適し、サラダや酢漬けなど彩りを生かした食べ方で湘南地域を中心に親しまれている。",
      sourceUrl: "https://www.pref.kanagawa.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "sagami-no-retasu",
      name: "さがみのレタス",
      municipality: "藤沢市、綾瀬市",
      description:
        "終戦直後、進駐軍を率いたマッカーサーの指示で栽培が始まったとされ、日本のサラダ野菜発祥の地として伝えられる。温暖な湘南地域の気候を生かし、シャキシャキとした食感のレタスが周年出荷されている。",
      sourceUrl: "https://www.city.fujisawa.kanagawa.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "enoshima-kamasu",
      name: "江の島カマス",
      municipality: "藤沢市",
      description:
        "藤沢市沿岸で水揚げされるアカカマスで、好物のシラスを豊富に食べて丸々と太るのが特徴。10〜11月は特に脂がのり、干物や塩焼きにすると旨みが際立つことから地元で重宝されている。",
      sourceUrl: "https://www.city.fujisawa.kanagawa.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "salad-murasaki",
      name: "サラダ紫",
      municipality: "横須賀市、葉山町",
      description:
        "アクが少なくサラダでそのまま食べられるナスの品種で、「よこすか水なす」としてブランド化されている。みずみずしい果肉と鮮やかな紫色が特徴で、生食から浅漬けまで幅広く親しまれている。",
      sourceUrl: "https://www.city.yokosuka.kanagawa.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "soshun-cabbage",
      name: "早春キャベツ",
      municipality: "三浦市",
      description:
        "「夏まき冬どり」で育てる三浦キャベツの一種で、冬キャベツでありながら葉がやわらかく甘みが強いのが特徴。温暖な三浦半島の気候と潮風を受けて育ち、生食でも加熱調理でも美味しさを発揮する。",
      sourceUrl: "https://www.city.miura.kanagawa.jp/",
      accessedAt: "2026-07-18",
    },
  ],
};
