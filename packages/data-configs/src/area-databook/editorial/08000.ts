/**
 * 茨城県 (08000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 関東エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const IBARAKI_EDITORIAL: AreaEditorial = {
  areaCode: "08000",
  symbols: {
    tree: "ウメ",
    flower: "バラ",
    bird: "ヒバリ",
    fish: "ヒラメ",
    song: "茨城県民の歌",
    sourceUrl: "https://www.pref.ibaraki.jp/bugai/koho/kenmin/profile/symbol.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "ibaraki-sweet-potato",
      name: "べにはるか・ふくむらさき・シルクスイート",
      municipality: "県内広域(鉾田市・行方市ほか)",
      description:
        "茨城県はさつまいもの産出額で全国1位。濃厚な甘みの「べにはるか」を中心に、絹のような食感の「シルクスイート」、紫肉の「ふくむらさき」など複数品種が栽培され、いずれも高糖度の蜜イモとして人気が高い。",
      sourceUrl: "https://www.ibaraki-shokusai.net/brand/sweet-potato",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hitachi-oguro",
      name: "常陸大黒",
      municipality: "常陸太田市、大子町ほか県北中山間地域",
      description:
        "平成14年に茨城県が育成したベニバナインゲン(花豆)のオリジナル品種。花豆は白色や紫のまだら模様が一般的だが、常陸大黒は黒一色で光沢のある大粒が特徴で、他県では生産されていない。",
      sourceUrl: "https://www.pref.ibaraki.jp/nourinsuisan/nosose/cont/oguro.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ibaraki-tamago",
      name: "タマゴ",
      municipality: "県内広域(小美玉市ほか)",
      description:
        "茨城県は鶏卵の産出額・生産量ともに全国1位を長年維持する国内有数の養鶏県。大消費地の東京に近いことに加え、関東の飼料工場が県内に集中していることが競争力を支えている。",
      sourceUrl: "https://www.pref.ibaraki.jp/nourinsuisan/noseisaku/senryaku/5sonota/documents/h29hinnmokubetu.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "joban-hirame",
      name: "ヒラメ(常磐もの)",
      municipality: "日立市ほか茨城沖一帯",
      description:
        "黒潮と親潮がぶつかる茨城沿岸で獲れるヒラメは「常磐もの」と呼ばれるブランド魚。特に冬の「寒ビラメ」は餌を豊富に食べて肉厚になり、うま味成分イノシン酸が増して濃厚な味わいになる。",
      sourceUrl: "https://www.ibaraki-shokusai.net/brand/hirame",
      accessedAt: "2026-07-18",
    },
    {
      slug: "horo-nigauri",
      name: "惚ろにがうり",
      municipality: "古河市",
      description:
        "古河市で栽培される「えらぶ」という品種のニガウリ(ゴーヤ)のブランド名。光沢のある鮮やかな緑色と、ふっくらとしたボリューム感、まろやかな苦みが特徴で、2017年に商標登録された。",
      sourceUrl: "https://www.ibaraki-shokusai.net/brand/balsampear",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kasumigaura-renkon",
      name: "レンコン",
      municipality: "霞ヶ浦周辺",
      description:
        "茨城県はレンコンの作付面積・出荷量ともに全国1位で、全国出荷量の半分以上を占める。低湿地で野草が堆積した肥沃な土壌と、冬でも降雪の少ない温暖な気候が霞ヶ浦周辺での栽培に適している。",
      sourceUrl: "https://www.ibaraki-renkon.jp/number-one",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tenaga-ebi",
      name: "テナガエビ",
      municipality: "霞ヶ浦、北浦",
      description:
        "体長10cmほどの淡水エビで、地元では「川エビ」とも呼ばれる霞ヶ浦・北浦の重要な水産資源。殻ごと食べられ海産エビよりカルシウムが豊富で、夏に生まれ秋以降に獲れる若いエビは「ざざえび」と呼ばれる。",
      sourceUrl: "https://www.pref.ibaraki.jp/nourinsuisan/kasui/shinko/tenagaebi.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "natsu-mitsuba",
      name: "夏みつば",
      municipality: "つくばみらい市",
      description:
        "光を当てずに育てる軟白栽培による切りミツバで、優雅な香りとなめらかな喉ごしから高級料亭でも重宝される。根を取り除いた姿の美しさも特徴で、関東の雑煮に彩りを添える食材としても親しまれている。",
      sourceUrl: "https://www.ibaraki-shokusai.net/brand/cut-mitsuba",
      accessedAt: "2026-07-18",
    },
    {
      slug: "edosaki-kabocha",
      name: "江戸崎かぼちゃ",
      municipality: "稲敷市",
      description:
        "水はけの良い関東ローム層で栽培され、実がなってから55日以上待って完熟させてから収穫するのが特徴。一般的なかぼちゃは未熟な状態で収穫し貯蔵で追熟させるが、江戸崎かぼちゃはホクホクした食感と強い甘みを持つ。",
      sourceUrl: "https://www.city.inashiki.lg.jp/page/page000071.html",
      accessedAt: "2026-07-18",
    },
  ],
};
