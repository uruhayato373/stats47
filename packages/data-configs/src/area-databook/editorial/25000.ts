/**
 * 滋賀県 (25000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 近畿エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const SHIGA_EDITORIAL: AreaEditorial = {
  areaCode: "25000",
  symbols: {
    tree: "モミジ",
    flower: "シャクナゲ",
    bird: "カイツブリ",
    song: "滋賀県民の歌",
    sourceUrl: "https://www.pref.shiga.lg.jp/kensei/gaiyou/gaiyou/",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "biwamasu",
      name: "ビワマス",
      municipality: "琵琶湖",
      description:
        "琵琶湖にのみ生息する固有種で、2025年に独立種として正式に記載された。産卵期以外は湖内で生活し、刺身や塩焼きのほか、丸ごと炊き込んだ「あめのいおご飯」が郷土料理として親しまれている。",
      sourceUrl:
        "https://www.pref.shiga.lg.jp/kensei/koho/e-shinbun/oshirase/348132.html",
      accessedAt: "2026-08-29",
    },
    {
      slug: "nigorobuna",
      name: "ニゴロブナ",
      municipality: "琵琶湖",
      description:
        "琵琶湖固有の淡水魚で、県の伝統料理「鮒寿司」に最良とされる材料。ヨシ帯で産卵し2〜3年で成魚になるが、生息環境の悪化や外来魚の食害で漁獲量は往時の数十分の一まで減少している。",
      sourceUrl: "https://www.pref.shiga.lg.jp/biwako-system/study/step4/",
      accessedAt: "2026-08-29",
    },
    {
      slug: "seta-shijimi",
      name: "セタシジミ",
      municipality: "琵琶湖",
      description:
        "琵琶湖水系にのみ生息する固有種のシジミで、名は湖水の出口である瀬田川に由来する。みそ汁やしぐれ煮に古くから使われてきたが、砂地の減少などで漁獲量は最盛期から大きく落ち込んでいる。",
      sourceUrl: "https://www.pref.shiga.lg.jp/ippan/shigotosangyou/suisan/18671.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ibuki-daikon",
      name: "伊吹大根",
      municipality: "米原市",
      description:
        "伊吹山麓で育つ在来の大根で、丸みを帯びた根元と曲がった先端が特徴。並の青首大根の倍ともいわれる強い辛みを持ち、江戸時代から伊吹そばの薬味として重宝されてきた地域の伝統野菜。",
      sourceUrl: "https://shigaquo.jp/foods/4897.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "mandokoro-cha",
      name: "政所茶",
      municipality: "東近江市",
      description:
        "鈴鹿山脈のふもと・東近江市政所地区で育つ銘茶で、室町時代に永源寺の僧が茶作りを奨励したのが起源とされる。「宇治は茶所、茶は政所」と茶摘み歌に歌われた歴史を持つが、生産農家は年々減少している。",
      sourceUrl:
        "https://www.city.higashiomi.shiga.jp/kids/shigashiomittedonnamachi/1006849.html",
      accessedAt: "2026-08-29",
    },
    {
      slug: "hinona",
      name: "日野菜",
      municipality: "日野町",
      description:
        "室町時代に日野町で発見されたとされるカブの仲間で、葉側が紫、根の先端が白い細長い形が特徴。甘酢に漬けると鮮やかな桜色になる「桜漬け」が滋賀の食文化財として親しまれている。",
      sourceUrl: "https://www.biwako-visitors.jp/feature/detail/hinona-shiga/",
      accessedAt: "2026-07-18",
    },
  ],
};
