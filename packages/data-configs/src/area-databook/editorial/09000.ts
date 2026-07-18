/**
 * 栃木県 (09000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 関東エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const TOCHIGI_EDITORIAL: AreaEditorial = {
  areaCode: "09000",
  symbols: {
    tree: "トチノキ",
    flower: "ヤシオツツジ",
    bird: "オオルリ",
    animal: "ニホンカモシカ",
    song: "県民の歌",
    sourceUrl: "https://www.pref.tochigi.lg.jp/c05/m/gate/symbol02.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "ichigo",
      name: "イチゴ",
      municipality: "県内広域",
      description:
        "栃木県は昭和43年から連続でいちご出荷量日本一を守り続ける「いちご王国」。首都圏に近い立地と冬場の豊富な日照量を生かし、家庭用の「とちあいか」やケーキ向けにも使われる「とちおとめ」など複数品種を育てている。",
      sourceUrl: "https://www.pref.tochigi.lg.jp/c05/kensei/aramashi/sangyou/nouringyou/ichigo.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "nira",
      name: "ニラ",
      municipality: "鹿沼市ほか県内広域",
      description:
        "昭和40年代初期に鹿沼地方で導入されて以降、県内全域の水田地帯に栽培が広がった。出荷量は全国トップクラスで、東京都中央卸売市場向けでは長年にわたり首位を維持してきた実績を持つ、1年を通じて出荷が続くスタミナ野菜。",
      sourceUrl: "https://tochigipower.com/?page=c-004nira",
      accessedAt: "2026-07-18",
    },
    {
      slug: "nikkori-nashi",
      name: "にっこり梨",
      municipality: "芳賀町ほか県内広域",
      description:
        "「新高」と「豊水」を交配して育成した栃木県オリジナルの梨品種で、重さ1kgを超える実もできる大玉が特徴。糖度が高くシャリっとした食感とジューシーな味わいがあり、9月下旬から11月上旬にかけて収穫される。",
      sourceUrl: "https://www.zennoh.or.jp/tc/product/fruit/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kanpyo",
      name: "カンピョウ",
      municipality: "県南部ほか",
      description:
        "ユウガオの果肉を薄く帯状に剥いて乾燥させる加工品で、全国生産量のほとんどを栃木県が占める県を代表する特産品。県南部の水はけの良い土壌と夏場の高温多湿な気候が、良質なユウガオの栽培に適している。",
      sourceUrl: "https://www.pref.tochigi.lg.jp/c05/intro/kids/page/sonohoka.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "nijo-omugi",
      name: "二条大麦",
      municipality: "栃木市、小山市ほか",
      description:
        "ビールや麦茶の原料として使われる大麦の一種で、栃木県は国内屈指の産地。なかでもビール大麦として使われる二条大麦の受渡量は全国一を誇り、県南部の畑作地帯で広く栽培されている。",
      sourceUrl: "https://www.pref.tochigi.lg.jp/c05/intro/kids/page/sonohoka.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "budou",
      name: "ブドウ",
      municipality: "栃木市ほか",
      description:
        "主力品種は「ぶどうの王様」とも呼ばれる巨峰で、県南部（旧岩舟町・旧大平町）が県内一の産地。露地栽培は8月から10月、ハウス栽培は5月から8月と収穫期をずらして長期出荷できる体制を整えている。",
      sourceUrl: "https://www.zennoh.or.jp/tc/product/fruit/",
      accessedAt: "2026-07-18",
    },
  ],
};
