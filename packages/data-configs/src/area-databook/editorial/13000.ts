/**
 * 東京都 (13000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 関東エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const TOKYO_EDITORIAL: AreaEditorial = {
  areaCode: "13000",
  symbols: {
    tree: "イチョウ",
    flower: "ソメイヨシノ",
    bird: "ユリカモメ",
    song: "東京都歌",
    sourceUrl: "https://www.metro.tokyo.lg.jp/tosei/tokyoto/profile/gaiyo/monsho",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "tokyo-x",
      name: "TOKYO X",
      municipality: "八王子市、青梅市、町田市ほか",
      description:
        "北京黒豚・バークシャー種・デュロック種の3品種を掛け合わせ、旧東京都畜産試験場が7年かけて改良した日本初の合成系統豚。平成9年に認定され、脂肪の質が良く臭みの少ない肉質が特徴。",
      sourceUrl: "https://www.tokyo-aff.or.jp/site/ome/1191.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hachioji-shoga",
      name: "八王子ショウガ",
      municipality: "八王子市",
      description:
        "加住町の生産者が昭和初期に譲り受けたのが始まりで、80年以上絶えず栽培されている。黄色味を帯び辛味が少なく筋っぽさがないのが特徴で、9月の例大祭「しょうが祭」に奉納され無病息災を願う風習が今も続く。",
      sourceUrl: "https://www.tokyo-ja.or.jp/farm/edo/41.php",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tokyo-koucha",
      name: "東京紅茶",
      municipality: "瑞穂町、東大和市",
      description:
        "埼玉県境の瑞穂町・東大和市などで作られる東京狭山茶の茶葉を発酵させて仕上げる国産紅茶。緑茶用の茶葉を使うため渋みが少なく甘みがあり、すっきりとした優しい味わいに仕上がるのが特徴。",
      sourceUrl: "https://www.town.mizuho.tokyo.jp/bunka/004/p001878.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tokyo-udo",
      name: "東京ウド",
      municipality: "立川市",
      description:
        "「室」と呼ばれる深さ約3.5mの暗い穴蔵で根株を30〜40日育てる軟白栽培により、光を当てずに真っ白なウドが育つ。崩れにくい関東ローム層の地質が室の維持に適し、立川で生産が盛んになった。",
      sourceUrl:
        "https://www.city.tachikawa.lg.jp/sangyoshinko/sangyo/nogyo/tokusanhin/tachikawaudo.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "takinogawa-gobou",
      name: "滝野川ゴボウ",
      municipality: "小平市",
      description:
        "元禄年間に現在の北区滝野川周辺で品種改良された細長くしなやかなゴボウで、国内で栽培されるゴボウの9割以上がこの系統の血を引くとされる。小平市の農家が近年その復活栽培に取り組んでいる。",
      sourceUrl: "https://www.tokyo-ja.or.jp/farm/edo/34.php",
      accessedAt: "2026-07-18",
    },
    {
      slug: "waseda-myoga",
      name: "早稲田ミョウガ",
      municipality: "新宿区、練馬区",
      description:
        "江戸から大正期にかけて早稲田周辺で盛んに作られ、大きく赤みを帯びた色と香りの良さで知られた。地名「茗荷谷」の由来ともいわれ、地中に残った地下茎から近年栽培が復活した。",
      sourceUrl: "https://www.tokyo-ja.or.jp/farm/edo/39.php",
      accessedAt: "2026-07-18",
    },
    {
      slug: "adachi-tsumamono",
      name: "足立のつまもの",
      municipality: "足立区",
      description:
        "穂ジソ・ツル菜・木の芽・鮎タデ・あさつきなどを指す、和食に季節感を添える名脇役の野菜群。三河島村周辺で始まった栽培が明治以降に足立区栗原・伊興地区へ広がり、狭い農地でも営める都市農業として今も続く。",
      sourceUrl: "https://www.tokyo-ja.or.jp/farm/edo/48.php",
      accessedAt: "2026-07-18",
    },
    {
      slug: "gozeki-komatsuna",
      name: "後関晩生小松菜",
      municipality: "江戸川区",
      description:
        "小松菜発祥の地・江戸川区で、種苗業者が晩生系統の集団淘汰選抜を重ねて固定・命名した伝統品種。葉柄が柔らかく筋っぽさが少ない一方、現代品種より病害虫や天候の影響を受けやすい性質がある。",
      sourceUrl: "https://www.tokyo-ja.or.jp/farm/edo/11.php",
      accessedAt: "2026-07-18",
    },
    {
      slug: "medai",
      name: "メダイ",
      municipality: "伊豆・小笠原諸島",
      description:
        "伊豆諸島で水揚げされる白身魚で、島唐辛子入り醤油に漬け込む郷土料理「べっこう」の主役の一つ。漬け身を甘めの酢飯と握った「べっこう鮨」として親しまれ、シャリの甘さと薬味の辛みの対比が持ち味。",
      sourceUrl: "https://sakanato.jp/1628/",
      accessedAt: "2026-07-18",
    },
  ],
};
