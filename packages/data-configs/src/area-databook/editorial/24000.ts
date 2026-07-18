/**
 * 三重県 (24000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 中部エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const MIE_EDITORIAL: AreaEditorial = {
  areaCode: "24000",
  symbols: {
    tree: "神宮スギ",
    flower: "ハナショウブ",
    bird: "シロチドリ",
    fish: "伊勢えび",
    animal: "カモシカ",
    song: "三重県民歌",
    sourceUrl: "https://www.pref.mie.lg.jp/KOHO/HP/84175022632.htm",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "matsusaka-beef",
      name: "松阪牛",
      municipality: "松阪市",
      description:
        "日本三大和牛の一角を占め「肉の芸術品」とも称される黒毛和種のメス牛。兵庫県但馬地域生まれの子牛を松阪市周辺の生産区域で丹念に肥育し、きめ細かな霜降りととろける食感に仕上げる。",
      sourceUrl: "https://www.city.matsusaka.mie.jp/site/matsusakaushi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kuwana-hamaguri",
      name: "桑名のはまぐり",
      municipality: "桑名市",
      description:
        "木曽三川（木曽川・長良川・揖斐川）の河口域で育つ在来種ヤマトハマグリ。汽水域特有の環境で殻が薄く身がふっくらと育ち、江戸時代には東海道桑名宿の名物「焼き蛤」として旅人に親しまれた。",
      sourceUrl: "https://www.city.kuwana.lg.jp/kanko/tokushu/hamaguri.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "anori-fugu",
      name: "あのりふぐ",
      municipality: "志摩市",
      description:
        "遠州灘から熊野灘にかけての海域ではえ縄漁法で漁獲される体重700g以上の天然トラフグ。志摩市の安乗漁港に水揚げされ、旬は10月上旬から3月上旬。てっさやてっちりで冬の味覚として親しまれる。",
      sourceUrl: "https://www.kankomie.or.jp/season/article/194",
      accessedAt: "2026-07-18",
    },
    {
      slug: "matoya-oyster",
      name: "的矢かき",
      municipality: "志摩市",
      description:
        "志摩市の浦村地区周辺で養殖される牡蠣。リアス海岸の内湾で山からの栄養豊富な水と外海の潮が交わる環境で育ち、「海のミルク」と呼ばれるほど濃厚な旨みを持つ。冬場は食べ放題の店も多い。",
      sourceUrl: "https://www.kankomie.or.jp/season/article/194",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ise-cha",
      name: "伊勢茶",
      municipality: "北勢地域（鈴鹿市・四日市市・亀山市）・中南勢地域（松阪市・大台町）",
      description:
        "三重県の茶は栽培面積・荒茶生産量ともに静岡・鹿児島に次ぐ全国第3位。覆いをかけて栽培する「かぶせ茶」の生産量は全国第1位でシェア約6割を占め、美しい濃緑色とまろやかな味わいが特徴。",
      sourceUrl: "https://www.pref.mie.lg.jp/NOUSAN/HP/77019045892.htm",
      accessedAt: "2026-07-18",
    },
    {
      slug: "mie-nabana",
      name: "三重なばな",
      municipality: "桑名市（長島町）・木曽岬町",
      description:
        "菜の花のつぼみが咲く前の若葉と茎を食べる三重の伝統野菜。昭和30年代に桑名市長島町で出荷が始まり、1989年のブランド化協議会設立以降は指定種子で育てた株のみが「三重なばな」を名乗れる。",
      sourceUrl: "https://www.ja-mienaka.or.jp/agri/crops/nabana/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "takana-kumano",
      name: "たかな",
      municipality: "熊野市",
      description:
        "熊野市に伝わる伝統野菜の高菜。古代に朝廷が九州から大和へ都を移した際にもたらされたという伝承が残り、地域では古くから漬物などに加工され受け継がれてきた郷土の味。",
      sourceUrl: "https://www.pref.mie.lg.jp/common/content/000101326.pdf",
      accessedAt: "2026-07-18",
    },
  ],
};
