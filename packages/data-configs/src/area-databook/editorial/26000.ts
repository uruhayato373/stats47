/**
 * 京都府 (26000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 近畿エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const KYOTO_EDITORIAL: AreaEditorial = {
  areaCode: "26000",
  symbols: {
    tree: "北山杉",
    flower: "しだれ桜（嵯峨ぎく・なでしこは府の草花）",
    bird: "オオミズナギドリ",
    song: "京都府の歌",
    sourceUrl: "https://www.pref.kyoto.jp/kodomo/20.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "tango-torigai",
      name: "丹後とり貝",
      municipality: "丹後地方",
      description:
        "海洋センターで生産した種苗を舞鶴湾・宮津湾など内湾のコンテナで約1年育てる養殖トリガイ。殻長8.5cm以上と一般流通品より大型で肉厚、初夏だけの味覚として2008年に水産物初の「京のブランド産品」に認証された。",
      sourceUrl: "https://www.pref.kyoto.jp/suiji/12400031.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "gyokuro",
      name: "玉露",
      municipality: "宇治市",
      description:
        "江戸時代に宇治で覆下栽培と宇治製法を組み合わせて生み出された世界最高級クラスの緑茶。日光を遮って育てることで渋みが抑えられ、甘みとコクの強い味わいになる。現在も宇治は玉露・てん茶・煎茶の名産地。",
      sourceUrl: "https://www.kyocha.or.jp/tamausagi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shogoin-kabu",
      name: "聖護院かぶ",
      municipality: "亀岡市",
      description:
        "享保年間に左京区聖護院の農家が近江かぶを持ち帰り栽培したのが起源とされる国内最大級のかぶ。重さ4〜5kgにもなり、京都三大漬物のひとつ千枚漬けの材料として知られる。現在は亀岡市篠町が最大の産地。",
      sourceUrl: "https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/semmaizuke_kyoto.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kyo-mibuna",
      name: "京壬生菜",
      municipality: "南丹市",
      description:
        "1800年代に京みず菜の自然交雑で生まれたとされる京の伝統野菜。細長くヘラのような葉が特徴で、辛味と香りが強く古漬けやからし和えに使われる。かつては中京区壬生周辺が産地だったが、現在は南丹市日吉町が府内主産地。",
      sourceUrl: "https://life.ja-group.jp/food/shun/detail?id=146",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hatake-shimeji",
      name: "ハタケシメジ（丹波しめじ）",
      municipality: "京丹波町ほか",
      description:
        "ホンシメジに近縁で歯ごたえの良いきのこ。名産地の京丹波町で生産されるものは「丹波しめじ」と呼ばれ、農林水産省統計では全国生産量の98%近くを京都府産が占める圧倒的な主産地となっている。",
      sourceUrl: "https://www.biocosmo.biz/page/hatakeshimeji",
      accessedAt: "2026-07-18",
    },
    {
      slug: "mulberry-ayabe",
      name: "マルベリー（桑の実）",
      municipality: "綾部市",
      description:
        "かつて養蚕が盛んだった綾部市は桑の木の一大産地。市内には桑園が整備され20種以上の品種が栽培されており、初夏には摘み取り体験も行われる。蚕都として栄えた歴史が今も桑畑という形で受け継がれている。",
      sourceUrl: "https://www.uminokyoto.jp/event/detail.php?eid=64",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kanadaru-iwashi",
      name: "金樽イワシ",
      municipality: "宮津市・与謝野町",
      description:
        "天橋立の内海・阿蘇海は外海の宮津湾に比べ海水の出入りが少なくプランクトンが豊富で、そこで獲れるマイワシは丸々と太り脂がのる。近年は漁獲量が激減し「幻の魚」となっており、通常のイワシの10倍近い価格がつくこともある。",
      sourceUrl: "https://www.city.miyazu.kyoto.jp/site/citypro/9213.html",
      accessedAt: "2026-07-18",
    },
  ],
};
