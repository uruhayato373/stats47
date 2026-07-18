/**
 * 北海道 (01000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 北海道・東北エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const HOKKAIDO_EDITORIAL: AreaEditorial = {
  areaCode: "01000",
  symbols: {
    tree: "エゾマツ",
    flower: "ハマナス",
    bird: "タンチョウ",
    song: "光あふれて（道民のうた）",
    sourceUrl: "https://www.pref.hokkaido.lg.jp/ks/bns/symbol.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "yuri-ne",
      name: "ゆり根",
      municipality: "真狩村",
      description:
        "羊蹄山麓の真狩村は生産量・品質ともに日本一の食用ゆり根の産地。植え付けから収穫まで6年をかけ、土中でじっくり養分を蓄えさせる手間のかかる栽培法が上品な甘みとホクホクとした食感を生む。",
      sourceUrl: "https://www.vill.makkari.lg.jp/kanko/kau/yurine/oitachi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "beet",
      name: "てん菜（ビート）",
      municipality: "オホーツク地方ほか道内広域",
      description:
        "てん菜は北海道が国内生産のほぼ全量を担う砂糖の原料作物。オホーツク地方や十勝地方が主産地で、ハウス育苗した苗を畑に定植し、輪作体系を支える基幹作物としてJAが生産を支援する。",
      sourceUrl: "https://ja-okhotskabashiri.or.jp/farm/process_beet.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tsubutsubu-denpun",
      name: "つぶつぶでんぷん",
      municipality: "更別村",
      description:
        "十勝の畑作地帯・更別村で作られる、自然沈殿と低温長期乾燥による昔ながらの製法のじゃがいもでんぷん。粒子が大きく保水力に優れ、少量でとろみが付くため揚げ物や中華あんに向く特産加工品。",
      sourceUrl: "https://www.sarabetsu.jp/sightseeing/tokusanhin/denpun/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "yamagobou",
      name: "ヤマゴボウ（モリアザミ）",
      municipality: "厚沢部町",
      description:
        "道南・厚沢部町は平成元年からヤマゴボウ栽培に取り組み全国トップクラスの産地に成長。ごぼうとは別種のキク科モリアザミの根で、京都の料亭でも使われる高級食材として短い期間に出荷される。",
      sourceUrl: "https://www.town.assabu.lg.jp/modules/industry/content0020.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "natural-cheese",
      name: "ナチュラルチーズ",
      municipality: "十勝地方ほか",
      description:
        "広大な平野と乳牛飼育に適した気候に恵まれた十勝は「チーズ王国」と呼ばれ、30以上の工房が点在する。国内生産ナチュラルチーズの約7割を占め、地理的表示（GI）に登録された銘柄も生まれている。",
      sourceUrl: "https://www.tokachi.pref.hokkaido.lg.jp/ss/num/hokkaidotokachicheese.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "mukawa-shishamo",
      name: "鵡川ししゃも",
      municipality: "むかわ町",
      description:
        "ししゃもは北海道太平洋沿岸のみに生息する日本固有種で、川で生まれ海で育ち秋に遡上する魚。スーパーでよく見る子持ちししゃもの多くは輸入物の別種で、鵡川産は商標登録され本物として差別化される。",
      sourceUrl: "https://www.jf-mukawa.jp/mainmenu_1_4.php",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kirei-mame",
      name: "キレイマメ",
      municipality: "本別町",
      description:
        "「豆の町」本別町が誇る中生光黒大豆を使った黒豆ブランド。昼夜の寒暖差が甘みと粒の大きさを育み、町と加工事業者が連携して開発した納豆・味噌・きな粉などの多彩な商品群として展開される。",
      sourceUrl: "https://www.town.honbetsu.hokkaido.jp/web/industry/details/post_19.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shibetsu-suffolk-lamb",
      name: "士別サフォークラム",
      municipality: "士別市",
      description:
        "士別市はオーストラリアからサフォーク種の羊を導入し、市営牧場で飼育してきた「サフォークランド」。肉質に優れる品種として知られ、飼育頭数は日本一を誇り観光資源としても親しまれる。",
      sourceUrl: "https://www.kamikawa.pref.hokkaido.lg.jp/ss/srk/kamitabe/114_suffolklamb.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "haskap",
      name: "ハスカップ",
      municipality: "厚真町ほか",
      description:
        "厚真町と苫小牧市にまたがる勇払原野は北海道最大のハスカップ群生地で、厚真町は作付面積日本一。生食用が地元スーパーに並ぶのは全国でも珍しく、実を塩漬けにしておにぎりの具にする食べ方が家庭に根付く。",
      sourceUrl: "https://www.town.atsuma.lg.jp/page/1155.html",
      accessedAt: "2026-07-18",
    },
  ],
};
