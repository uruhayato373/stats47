/**
 * 山形県 (06000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 北海道・東北エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const YAMAGATA_EDITORIAL: AreaEditorial = {
  areaCode: "06000",
  symbols: {
    tree: "サクランボ",
    flower: "ベニバナ",
    bird: "オシドリ",
    fish: "サクラマス",
    song: "最上川（県民歌）",
    sourceUrl: "https://www.pref.yamagata.jp/020026/kensei/shoukai/yamagatamonogatari/sangyou/sakuranbo.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "onogawa-mamemoyashi",
      name: "小野川豆もやし",
      municipality: "米沢市（小野川温泉）",
      description:
        "米沢市小野川温泉で江戸時代から作られる伝統野菜。温泉熱を利用して栽培され、胚軸が約20cmまで伸びるのが特徴で、シャキシャキとした食感と豆の甘みが濃く残る冬の郷土食材。",
      sourceUrl: "https://tradveggie.or.jp/traditional-vegetables-prefecture/6-yamagata/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ukogi",
      name: "ウコギ",
      municipality: "米沢市・川西町",
      description:
        "上杉鷹山公が生垣として推奨し防犯や飢饉対策の非常食にも用いた落葉低木。若葉を刻んで炊き込む「ウコギご飯」は米沢の郷土料理で、ほのかな苦みと香りが特徴。",
      sourceUrl: "https://tradveggie.or.jp/traditional-vegetables-prefecture/6-yamagata/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hirata-akanegi",
      name: "平田赤ねぎ",
      municipality: "酒田市平田地区",
      description:
        "江戸時代末期に上方商人から種を譲り受けたと伝わる、葉鞘部が赤く染まる全国でも珍しいねぎ。枝分かれせず一本に真っ直ぐ育ち、生食は辛みが強いが加熱すると甘みが際立つ。",
      sourceUrl: "https://tradveggie.or.jp/traditional-vegetables-prefecture/6-yamagata/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "yamagata-akane-hourensou",
      name: "山形赤根ほうれんそう",
      municipality: "山形市・天童市・上山市",
      description:
        "根や葉の付け根まで赤みを帯びる村山地方の伝統品種。耐寒性が強く雪折れにも強いため冬場の露地栽培に向き、葉肉が厚く独特の甘みを持つ地物野菜として親しまれる。",
      sourceUrl: "https://tradveggie.or.jp/traditional-vegetables-prefecture/6-yamagata/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "okahijiki",
      name: "オカヒジキ",
      municipality: "山形市・南陽市",
      description:
        "江戸時代初期に最上川舟運を通じて内陸へ伝わり南陽市などで定着したアカザ科の一年草。海藻のヒジキに似た見た目と食感からその名がつき、シャキシャキとした歯ざわりが人気。",
      sourceUrl: "https://tradveggie.or.jp/traditional-vegetables-prefecture/6-yamagata/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "urushino-ingen",
      name: "漆野いんげん",
      municipality: "金山町",
      description:
        "金山町漆野地区に伝わる在来の伝統野菜。若さやのまま食べられるほか、さやごと乾燥させて保存し、戻して煮物にする冬の保存食としての利用法が受け継がれている。",
      sourceUrl: "https://tradveggie.or.jp/traditional-vegetables-prefecture/6-yamagata/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "akebi",
      name: "アケビ",
      municipality: "白鷹町・朝日町・天童市ほか",
      description:
        "全国の作付けの9割近くを山形県が占める県特産の果実的野菜。春の新芽は山菜として、秋には果皮を肉詰めなどに調理して食べ、つるはかご細工の素材にも利用される。",
      sourceUrl: "https://www.pref.yamagata.jp/140032/sangyo/nourinsuisangyou/nogyo/nousambutsu/sakurambo/sakuranbo.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "seiyounashi",
      name: "西洋なし（ラ・フランス）",
      municipality: "天童市ほか県内全域",
      description:
        "山形県は西洋なしの生産量で全国トップを誇り、中でも「ラ・フランス」は追熟によってとろけるような食感と芳醇な香りが引き出される秋冬の看板フルーツ。",
      sourceUrl: "https://www.pref.yamagata.jp/020026/kensei/shoukai/yamagatamonogatari/sangyou/sakuranbo.html",
      accessedAt: "2026-07-18",
    },
  ],
};
