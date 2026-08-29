/**
 * 徳島県 (36000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 四国エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const TOKUSHIMA_EDITORIAL: AreaEditorial = {
  areaCode: "36000",
  symbols: {
    tree: "ヤマモモ",
    flower: "すだちの花",
    bird: "シラサギ",
    song: "徳島県民の歌",
    sourceUrl: "https://www.pref.tokushima.lg.jp/en/japanese/about/symbol/",
    accessedAt: "2026-08-29",
  },
  specialties: [
    {
      slug: "naruto-rakkyo",
      name: "鳴門らっきょ",
      municipality: "鳴門市",
      description:
        "大鳴門橋周辺の海岸沿いに広がるミネラル豊富な「銀砂」と呼ばれる砂地で栽培される小粒で色白ならっきょう。2008年に地域団体商標に登録され、シャキシャキとした食感が持ち味の鳴門ブランド野菜の代表格。",
      sourceUrl:
        "https://www.pref.tokushima.lg.jp/japanese/specialty/Introduction/gourmet/fresh/",
      accessedAt: "2026-08-29",
    },
    {
      slug: "awa-wasanbon-sugar",
      name: "阿波和三盆糖",
      municipality: "上板町・阿波市",
      description:
        "阿讃山脈南麓の上板町と阿波市土成町だけで作られる希少な国産砂糖。「竹糖」という丈の低いサトウキビを原料に、押し舟による圧搾と「研ぎ」の手作業を繰り返す伝統製法で、上品な口どけを生み出す。",
      sourceUrl:
        "https://www.pref.tokushima.lg.jp/kenseijoho/tokushimakennitsuite/tokushimakennosangyo/dentosangyo/wasanbon/",
      accessedAt: "2026-08-29",
    },
    {
      slug: "cauliflower",
      name: "カリフラワー",
      municipality: "藍住町・上板町・徳島市",
      description:
        "徳島県は出荷量が全国トップクラスのカリフラワー産地で、川内町（徳島市）が主産地。冷涼な気候を活かした栽培で純白の花蕾が堅く締まって育ち、シャキっとした食感の高品質な野菜として市場で評価される。",
      sourceUrl: "https://www.zennoh.or.jp/tm/farm/ssi/vegetable/rakkyo.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "yamamomo",
      name: "ヤマモモ",
      municipality: "小松島市ほか",
      description:
        "徳島県の木にも選定されているヤマモモは、初夏を告げる県民の味覚。県下一の生産地は小松島市で、濃い赤紫色に熟した実は甘酸っぱく、生食のほかジャムやシロップ漬けにも加工され地域に親しまれている。",
      sourceUrl:
        "https://www.pref.tokushima.lg.jp/tafftsc/material/kyukajyuken/",
      accessedAt: "2026-08-29",
    },
    {
      slug: "hamo",
      name: "ハモ",
      municipality: "徳島市・小松島市・阿南市・牟岐町",
      description:
        "徳島県のハモ漁獲量は全国トップクラス。梅雨の時期に旨みが増すとされ「梅雨の水を飲んで旨くなる」と地元で語られる。夏場は湯引きにして梅肉や酢味噌で食べる郷土の味として食卓や料亭に並ぶ。",
      sourceUrl: "https://awa-food-tokushima.com/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "nama-shiitake",
      name: "生シイタケ",
      municipality: "徳島市・小松島市・神山町",
      description:
        "徳島県は全国に先駆けて菌床栽培を取り入れた産地で、生シイタケの生産量は全国1位。温暖な気候を活かした周年栽培により、肉厚で香り高いシイタケが年間を通じて安定して市場に出荷されている。",
      sourceUrl:
        "https://www.pref.tokushima.lg.jp/japanese/specialty/Introduction/gourmet/fresh/",
      accessedAt: "2026-08-29",
    },
    {
      slug: "awa-bancha",
      name: "阿波晩茶",
      municipality: "那賀町・上勝町ほか",
      description:
        "盛夏に摘んだ茶葉を大桶で乳酸発酵させ、天日に干して仕上げる独自製法の後発酵茶。中国雲南省の一部と並ぶ珍しい製法として知られ、酸味を帯びたまろやかな風味が那賀町・上勝町の山間部で受け継がれている。",
      sourceUrl:
        "https://www.pref.tokushima.lg.jp/japanese/specialty/Introduction/gourmet/tea_sake/",
      accessedAt: "2026-08-29",
    },
    {
      slug: "yuzu",
      name: "ユズ",
      municipality: "那賀町・上勝町",
      description:
        "ユズの一大産地として知られる那賀町のブランド「木頭ゆず」は、山間の寒暖差が生む鮮やかな色合いと豊潤な香りが特徴。果汁・果皮とも加工品に利用され、薬味から菓子まで幅広く県内外で親しまれている。",
      sourceUrl:
        "https://www.pref.tokushima.lg.jp/shien/anan/5010529",
      accessedAt: "2026-08-29",
    },
    {
      slug: "awabi",
      name: "アワビ類",
      municipality: "阿南市・美波町・牟岐町・海陽町",
      description:
        "県南部の阿南市から海陽町にかけての沿岸は、エサとなるアラメなどの海藻が豊富な好漁場。海女や海士が素潜りで一つひとつ手作業で獲るアワビ類は、外洋に面した豊かな磯を象徴する海の幸として知られる。",
      sourceUrl:
        "https://www.pref.tokushima.lg.jp/japanese/specialty/Introduction/gourmet/meet_fish/",
      accessedAt: "2026-08-29",
    },
  ],
};
