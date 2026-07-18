/**
 * 長崎県 (42000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 九州・沖縄エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const NAGASAKI_EDITORIAL: AreaEditorial = {
  areaCode: "42000",
  symbols: {
    tree: "ヒノキ",
    flower: "ツバキ",
    bird: "オシドリ",
    fish: "タイ・イカ（春）、アワビ・サバ（夏）、ブリ・イワシ・フグ（冬）",
    song: "長崎県民歌「南の風」",
    sourceUrl: "https://www.pref.nagasaki.jp/pages/page-11978.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "nagasaki-torafugu",
      name: "長崎とらふぐ",
      municipality: "松浦地区、九十九島地区、長崎地区",
      description:
        "長崎県は養殖トラフグの一大産地で、生産量は全国の約5割を占めるとされる。認定業者による養殖が行われ、冬の味覚として県内各地の飲食店で刺身や鍋料理に用いられている。",
      sourceUrl: "https://www.pref.nagasaki.jp/bunrui/kanko-kyoiku-bunka/kanko-bussan/megumi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "iki-uni",
      name: "壱岐のうに",
      municipality: "壱岐市",
      description:
        "壱岐島周辺は素潜り漁によるウニ漁が盛んで、ムラサキウニ・ガゼウニ・赤ウニの3種が水揚げされる。豊かな藻場を持つ壱岐の海で育つウニは濃厚な味わいで知られ、島の代表的な海の幸となっている。",
      sourceUrl: "https://www.pref.nagasaki.jp/bunrui/kanko-kyoiku-bunka/kanko-bussan/megumi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tsushima-hachimitsu",
      name: "ツシマハチミツ",
      municipality: "対馬市",
      description:
        "対馬では丸太材をくり抜いた「蜂洞」と呼ばれる巣箱を使い、ニホンミツバチを伝統的な方法で養蜂する文化が受け継がれている。島の自然の花々から集められる希少なはちみつとして評価されている。",
      sourceUrl: "https://www.pref.nagasaki.jp/bunrui/kanko-kyoiku-bunka/kanko-bussan/megumi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "aka-matebai",
      name: "赤マテ貝",
      municipality: "佐世保市",
      description:
        "佐世保市では「マテ貝突き漁」と呼ばれる独特の漁法で赤マテ貝が水揚げされる。干潟や砂地に生息する二枚貝で、県外にはほとんど出回らず主に地元で消費される希少な味覚となっている。",
      sourceUrl: "https://www.pref.nagasaki.jp/bunrui/kanko-kyoiku-bunka/kanko-bussan/megumi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "nagasaki-biwa",
      name: "長崎びわ",
      municipality: "長崎市、西海市、南島原市、壱岐市",
      description:
        "江戸時代から栽培が続く長崎県を代表する果樹で、生産量は全国一を誇る。温暖な気候を生かして育てられ、初夏を告げる味覚として県内各地の直売所や贈答用にも重宝されている。",
      sourceUrl: "https://www.pref.nagasaki.jp/bunrui/kanko-kyoiku-bunka/kanko-bussan/megumi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "oshima-tomato",
      name: "大島トマト",
      municipality: "西海市",
      description:
        "トマトの原産地とされる南米アンデスの厳しい環境を再現した栽培方法で育てられる西海市大島地区のブランドトマト。水分を抑えることで凝縮した濃厚な甘みと酸味が特徴とされる。",
      sourceUrl: "https://www.pref.nagasaki.jp/bunrui/kanko-kyoiku-bunka/kanko-bussan/megumi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "mizuika",
      name: "ミズイカ",
      municipality: "五島市、長崎市ほか",
      description:
        "「イカの王様」とも呼ばれるアオリイカの地方名。五島列島周辺の海域で漁獲され、身が厚く弾力があり甘みが強いことから刺身での評価が高く、県内の食通の間で人気の高い魚介の一つ。",
      sourceUrl: "https://www.pref.nagasaki.jp/bunrui/kanko-kyoiku-bunka/kanko-bussan/megumi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kibinago",
      name: "キビナゴ",
      municipality: "五島市ほか",
      description:
        "メイワシ科の小魚で、五島列島周辺の海域を中心に主に刺網漁で漁獲される。長崎近海のキビナゴは他産地のものより大きく育つとされ、刺身や天ぷらなど郷土料理に幅広く用いられる。",
      sourceUrl: "https://www.pref.nagasaki.jp/bunrui/kanko-kyoiku-bunka/kanko-bussan/megumi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "jagaimo",
      name: "ジャガイモ",
      municipality: "諫早市、雲仙市、南島原市ほか",
      description:
        "1600年頃にオランダ人によって長崎に伝来したとされるジャガイモは、島原半島を中心に長崎県の重要な畑作物として定着した。現在も北海道に次ぐ全国有数の生産量を誇る産地となっている。",
      sourceUrl: "https://www.pref.nagasaki.jp/bunrui/kanko-kyoiku-bunka/kanko-bussan/megumi/",
      accessedAt: "2026-07-18",
    },
  ],
};
