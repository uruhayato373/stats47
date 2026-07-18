/**
 * 福岡県 (40000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 九州・沖縄エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const FUKUOKA_EDITORIAL: AreaEditorial = {
  areaCode: "40000",
  symbols: {
    tree: "ツツジ",
    flower: "ウメ",
    bird: "ウグイス",
    song: "希望の光",
    sourceUrl: "https://www.pref.fukuoka.lg.jp/contents/sinbol.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "toyomitsuhime",
      name: "とよみつひめ",
      municipality: "県内広域",
      description:
        "福岡県農林業総合試験場豊前分場が開発した福岡県オリジナルブランドのイチジク。ルビー色の鮮やかな果肉と厚みのある白い果肉を持ち、メロンのような甘い香りととろけるような食感が特徴。",
      sourceUrl: "https://www.crossroadfukuoka.jp/spot/16657",
      accessedAt: "2026-07-18",
    },
    {
      slug: "buzen-honigani",
      name: "豊前本ガニ",
      municipality: "豊前海沿岸",
      description:
        "豊前海北部で漁獲されるガザミ（ワタリガニ）の呼び名で、特に秋のものが美味とされる。絹のような滑らかな身質と濃厚な旨味のミソが特徴で、二杯酢や鍋、甲羅酒など幅広く楽しまれている。",
      sourceUrl: "https://www.city.kitakyushu.lg.jp/contents/924_10975.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ouma-takenoko",
      name: "合馬たけのこ",
      municipality: "北九州市小倉南区合馬地区",
      description:
        "北九州市小倉南区の合馬地区で栽培される孟宗竹の高級筍。粘土質の赤土がアクの少ない風味豊かな筍を育て、関西市場でも最高値で取引される。新鮮なものは刺身でも食されるほどの上質さを誇る。",
      sourceUrl: "https://www.city.kitakyushu.lg.jp/kokuraminami/file_0121.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "wakamatsu-shiokaze-cabbage",
      name: "若松潮風キャベツ",
      municipality: "北九州市若松区",
      description:
        "玄界灘に面した北九州市若松地区で昭和47年から栽培されるブランドキャベツ。ミネラルを含む潮風を絶えず受けて育つことで平均糖度9度以上の甘みが生まれ、生食でも加熱でもおいしく味わえる。",
      sourceUrl: "https://www.ja-kitakyu.or.jp/product/kyabetu",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hakata-tsubomina",
      name: "博多蕾菜",
      municipality: "県内広域",
      description:
        "福岡県で品種開発された大型のからし菜の仲間のわき芽を食べる野菜で、県外では栽培されていない独自品種。カラシナらしいスパイシーさとやさしい甘みを併せ持ち、コリコリした食感が楽しめる。",
      sourceUrl: "https://zennoh-fukuren.jp/consumer/vegetables/tubomina",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hakata-nabana-oishina",
      name: "博多な花おいしい菜",
      municipality: "東部・南部",
      description:
        "菜の花（なたね）の側枝を食用に品種改良した福岡発祥のオリジナル野菜で、全国的にも数少ない産地の一つ。アブラナ科特有のピリッとした風味を持ち、下ゆで不要で和え物や炒め物に幅広く使える。",
      sourceUrl: "https://zennoh-fukuren.jp/consumer/vegetables/nabana",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hakata-bannou-negi",
      name: "博多万能ねぎ",
      municipality: "朝倉市ほか",
      description:
        "朝倉市余名持地区発祥の青ねぎで、朝倉地域は福岡県の青ねぎ生産の約8割を占める。緑の葉部分に栄養が豊富で、生でも煮ても薬味にも合う万能さから「空飛ぶ野菜」として鮮度重視で空輸されている。",
      sourceUrl: "https://zennoh-fukuren.jp/consumer/vegetables/negi",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hakata-nasu",
      name: "博多なす",
      municipality: "福岡地域・筑後地域",
      description:
        "半世紀を超える栽培の歴史を持つ長なす「黒陽」の統一ブランドで、冬春なす産地として全国3位の出荷量を誇る。皮も果肉も柔らかくアクが少なく、煮ても焼いても揚げても異なる味わいが楽しめる。",
      sourceUrl: "https://zennoh-fukuren.jp/consumer/vegetables/nasu",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hakata-sugitake",
      name: "博多すぎたけ",
      municipality: "大木町ほか",
      description:
        "正式名称ヌメリスギタケという珍しいキノコの野生種から人工栽培に成功した希少品種で、国内では大木町の生産者のみが手がける。シャキシャキとした食感とぬめり、濃厚な旨味から「幻のキノコ」と呼ばれる。",
      sourceUrl: "https://hakatasugitake.com/",
      accessedAt: "2026-07-18",
    },
  ],
};
