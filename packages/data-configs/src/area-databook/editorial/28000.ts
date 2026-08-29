/**
 * 兵庫県 (28000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 近畿エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const HYOGO_EDITORIAL: AreaEditorial = {
  areaCode: "28000",
  symbols: {
    tree: "クスノキ",
    flower: "ノジギク",
    bird: "コウノトリ",
    song: "兵庫県民歌",
    sourceUrl: "https://web.pref.hyogo.lg.jp/ac02/symbol.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "nada-sake",
      name: "日本酒（灘五郷）",
      municipality: "神戸市・西宮市ほか",
      description:
        "神戸市から西宮市にかけて広がる灘五郷は「灘の生一本」で知られる日本一の酒どころ。丹波杜氏の技と六甲山系の名水「宮水」に恵まれ、兵庫県は全国の清酒生産量の約3割を占める清酒生産量全国1位の産地。",
      sourceUrl: "https://www.nadagogo.ne.jp/climate/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "yamada-nishiki",
      name: "山田錦",
      municipality: "三木市・加東市ほか",
      description:
        "兵庫県で育成された酒米の最高峰品種。三木市・加東市の粘土質の土壌と山間の気候が大粒で心白の鮮明な酒米を育て、兵庫県は全国出荷量の5割超を占める日本一の山田錦産地として知られる。",
      sourceUrl: "https://www.city.miki.lg.jp/soshiki/34/3060.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tamba-guri",
      name: "丹波栗",
      municipality: "丹波市ほか丹波地域",
      description:
        "平安時代の「延喜式」にも貢進の記録が残る歴史ある栗の産地。江戸時代に尼崎の商人が売り歩いたことで全国にその名が広まり、盆地特有の昼夜の寒暖差が実の甘みを引き立てる丹波地域の代表銘柄。",
      sourceUrl: "https://web.pref.hyogo.lg.jp/tnk07/oishitanba.html",
      accessedAt: "2026-08-29",
    },
    {
      slug: "tamba-kuro-edamame",
      name: "丹波黒枝豆",
      municipality: "丹波篠山市",
      description:
        "正月の煮豆に使う丹波黒大豆が完熟する前の、10月の2〜3週間だけ味わえる「幻の枝豆」。大粒でこくと甘みが強く、丹波篠山市は日本一の黒大豆の生産量と品質を誇る特産地として知られる。",
      sourceUrl: "https://www.city.tambasasayama.lg.jp/soshikikarasagasu/nomiyakoseisakuka/tokusan/edamame/index.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ako-shio",
      name: "塩（赤穂の塩）",
      municipality: "赤穂市",
      description:
        "江戸時代に入浜式塩田で開拓された「日本第一」と評された塩の産地。防潮堤と水路で海水を調整する独自の製塩技術は瀬戸内海沿岸に広まり、赤穂の塩づくりは2019年に日本遺産として認定された。",
      sourceUrl: "https://japan-heritage.bunka.go.jp/ja/stories/story077/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tajima-gyu",
      name: "但馬牛",
      municipality: "美方郡ほか但馬地域",
      description:
        "黒毛和牛のルーツとされる兵庫県産の和牛で、江戸時代から但馬地域で優れた雌牛の血統集団が育まれてきた。但馬牛のうち厳しい条件を満たしたものだけが「神戸ビーフ」として国内外で流通する。",
      sourceUrl: "https://tajimagyu.co.jp/pages/about-tajimagyu",
      accessedAt: "2026-07-18",
    },
    {
      slug: "sansho",
      name: "山椒（朝倉さんしょ）",
      municipality: "養父市八鹿町朝倉",
      description:
        "地名「朝倉」に由来する但馬生まれの山椒で、江戸時代に徳川家康へ献上された記録も残る400年以上の栽培史を持つ。柑橘のようなリモネンの香りが強く、昼夜の寒暖差が大粒で色艶の良い実を育てる。",
      sourceUrl: "https://www.ja-tajima.or.jp/tokusan/yasai/sansho.html",
      accessedAt: "2026-07-18",
    },
  ],
};
