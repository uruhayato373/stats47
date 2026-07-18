/**
 * 愛知県 (23000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 中部エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const AICHI_EDITORIAL: AreaEditorial = {
  areaCode: "23000",
  symbols: {
    tree: "ハナノキ",
    flower: "カキツバタ",
    bird: "コノハズク",
    fish: "クルマエビ",
    song: "われらが愛知",
    sourceUrl: "https://www.pref.aichi.jp/soshiki/koho/0000019120.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "kintawara-makuwauri",
      name: "金俵まくわうり",
      municipality: "江南市周辺、安城市",
      description:
        "俵のような形と、熟すと表皮が黄金色に輝いて見えることから名付けられた愛知原産のマクワウリ。明治から昭和にかけて江南市・安城市で広く栽培され、白い果肉は上品な甘みと懐かしい香りが特徴。",
      sourceUrl: "https://tradveggie.or.jp/traditional-vegetables-prefecture/23-aichi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ginnan-sobue",
      name: "ギンナン（祖父江ぎんなん）",
      municipality: "稲沢市（祖父江地区）",
      description:
        "稲沢市祖父江地区は全国トップクラスの出荷量を誇るギンナンの産地で、市内生産の9割以上をこの地区が占める。「祖父江ぎんなん」は地域団体商標に登録され、樹齢100年を超える大木が随所に残る産地でもある。",
      sourceUrl: "https://www.ja-aichinishi.or.jp/ginnan/about/produce.php",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ichijiku",
      name: "イチジク",
      municipality: "県内広域",
      description:
        "昭和40年代から愛知県各地で栽培が本格化し、現在では出荷量日本一を誇るイチジクの一大産地となった。温暖な気候を活かしたハウス栽培と露地栽培を組み合わせ、夏から秋にかけて長期間出荷される。",
      sourceUrl: "https://www.pref.aichi.jp/soshiki/engei/aichisan-kudamono.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "wase-karimori",
      name: "早生かりもり",
      municipality: "尾張地域、刈谷市、碧南市",
      description:
        "カタウリとも呼ばれる尾張地域在来の白瓜で、短い円筒形と白みがかった果肉が特徴。歯ごたえの良さから古くから漬物に加工され、地域の食卓に欠かせない伝統野菜として受け継がれている。",
      sourceUrl: "https://tradveggie.or.jp/traditional-vegetables-prefecture/23-aichi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "aichi-wase-fuki",
      name: "愛知早生ふき",
      municipality: "知多地域、稲沢市、愛西市",
      description:
        "愛知県で栽培されるフキの多くのルーツとなった品種で、知多半島を中心に明治時代から栽培され収穫量は日本一を誇る。葉柄の伸びが早く香りが強いのが特徴で、煮物や佃煮に加工され親しまれている。",
      sourceUrl: "https://tradveggie.or.jp/traditional-vegetables-prefecture/23-aichi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tengu-nasu",
      name: "天狗なす",
      municipality: "設楽町、東栄町、豊根村",
      description:
        "天狗の鼻のような奇形果ができやすいことからその名が付いた奥三河の伝統野菜。400〜700gにもなる大ぶりな実で果肉は柔らかくみずみずしく、加熱すると一層とろけるような食感になる。",
      sourceUrl: "https://tradveggie.or.jp/traditional-vegetables-prefecture/23-aichi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "moriguchi-daikon",
      name: "守口大根",
      municipality: "扶桑町",
      description:
        "直径2cm・長さ190cm余りにもなる世界一細長い大根としてギネス世界記録に認定された伝統野菜。収穫後すぐ塩漬けにし、酒粕に何度も漬け込んで2年以上熟成させる「守口漬け」が名産品として知られる。",
      sourceUrl: "https://tradveggie.or.jp/traditional-vegetables-prefecture/23-aichi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shirahana-sengoku",
      name: "白花千石",
      municipality: "あま市",
      description:
        "明治時代から栽培されてきたフジマメの一種で、サヤが千石船の帆の形に似ていることが名前の由来。つる性で淡い緑色のサヤをつけ、煮物や炒め物など地域の家庭料理に幅広く使われてきた。",
      sourceUrl: "https://tradveggie.or.jp/traditional-vegetables-prefecture/23-aichi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "uzura-tamago",
      name: "ウズラ卵",
      municipality: "豊橋市、豊川市、田原市",
      description:
        "愛知県はうずら産業発祥の地であり国内最大の産地で、東三河地域の豊橋市・豊川市・田原市に生産が集中する。ゆで卵や燻製など加工品として全国に流通し、飼養規模・出荷量ともに他県を大きく引き離す。",
      sourceUrl: "https://www.pref.aichi.jp/soshiki/chikusan/uzuraouen.html",
      accessedAt: "2026-07-18",
    },
  ],
};
