/**
 * 富山県 (16000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 北陸・甲信越エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const TOYAMA_EDITORIAL: AreaEditorial = {
  areaCode: "16000",
  symbols: {
    tree: "タテヤマスギ",
    flower: "チューリップ",
    bird: "ライチョウ",
    fish: "ブリ・ホタルイカ・シロエビ",
    animal: "ニホンカモシカ",
    song: "富山県民の歌",
    sourceUrl: "https://www.pref.toyama.jp/1021/kensei/kenseiunei/kensei/gaiyou/profile/symbol.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "hotaruika",
      name: "ホタルイカ",
      municipality: "魚津市〜新湊（沿岸部）",
      description:
        "夏から冬は日本海の深層で暮らし、春先に産卵のため富山湾沿岸へ来遊するホタルイカ。魚津から新湊にかけて定置網で夜間に水揚げされ、発光器が暗闇でほの青白く輝く様は「富山湾の神秘」と呼ばれる。",
      sourceUrl: "https://www.pref.toyama.jp/1615/kurashi/seikatsu/shokuseikatsu/kj00021329.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shiro-ebi",
      name: "シロエビ",
      municipality: "富山市・射水市",
      description:
        "富山湾特有の海底谷（あいがめ）に群泳し、日本で唯一漁場を持つ富山湾でのみ専業漁獲されるシロエビ。生きた個体は透明で淡いピンク色をしており、刺身にするとムッチリとした食感とフルーツのような甘みが際立つ。",
      sourceUrl: "https://www.pref.toyama.jp/1615/kurashi/seikatsu/shokuseikatsu/kj00021329.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "himi-kanburi",
      name: "ひみ寒ぶり",
      municipality: "氷見市",
      description:
        "400年以上前に氷見でわら縄の定置網漁として始まった伝統漁法で獲れるブリ。荒波を越えて富山湾にやってくる11月〜1月の個体は特に脂乗りが格別で「富山湾の王者」と称され、刺身やぶり大根で親しまれる。",
      sourceUrl: "https://www.pref.toyama.jp/1615/kurashi/seikatsu/shokuseikatsu/kj00021329.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kureha-nashi",
      name: "呉羽梨",
      municipality: "富山市・射水市・魚津市・黒部市・南砺市",
      description:
        "県内梨産地で最大規模の呉羽丘陵一帯（約135ha）で栽培される梨。全体の約7割を占める幸水は酸味が少なく果汁が豊富でシャリシャリとした食感が特長。生産農家全員がエコファーマー認定を受け環境保全型の栽培を実践する。",
      sourceUrl: "https://shoku-toyama.jp/product/10313/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "satoimo",
      name: "サトイモ",
      municipality: "南砺市・上市町",
      description:
        "南砺市山野地区では萬治年間（1660年頃）の栽培記録が寺の農帳に残る歴史あるサトイモ産地。豊富な用水と水はけの良い土壌が育む粘りの強さと柔らかさが特長で、収穫後は天日干しにして水分と旨みを凝縮させる。",
      sourceUrl: "https://shoku-toyama.jp/product/10249/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "toyama-hoshigaki",
      name: "富山干柿",
      municipality: "南砺市（福光・城端）",
      description:
        "医王山のふもと南砺市福光地区で農家の冬仕事として作られてきた干柿。福光原産の渋柿・三社柿を竹に吊るし20〜25日かけて乾燥、柿を手で揉んで水分と甘みを均等に行き渡らせる。医王山から吹く「医王おろし」が独特の甘みを育む。",
      sourceUrl: "https://shoku-toyama.jp/product/10244/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "koshi-no-akagani",
      name: "高志の紅ガニ（ベニズワイガニ）",
      municipality: "沿岸部（滑川市ほか）",
      description:
        "身がやわらかくズワイガニより手頃な価格のベニズワイガニを、2016年に「高志の紅ガニ」としてブランド化。漁場から漁港までの距離が近く鮮度の良いまま水揚げされ、甘み成分グリシンと旨み成分グルタミン酸の含有量に優れる。",
      sourceUrl: "https://discoverjapan-web.com/article/81473",
      accessedAt: "2026-07-18",
    },
  ],
};
