/**
 * 和歌山県 (30000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 近畿エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const WAKAYAMA_EDITORIAL: AreaEditorial = {
  areaCode: "30000",
  symbols: {
    tree: "ウバメガシ",
    flower: "ウメ",
    bird: "メジロ",
    song: "和歌山県民歌",
    sourceUrl: "https://www.pref.wakayama.lg.jp/prefg/000200/symbol.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "mikan",
      name: "みかん",
      municipality: "有田市ほか県内広域",
      description:
        "和歌山県は農業産出額1位を誇るみかんの一大産地。有田地域は江戸時代から続く伝統的な産地で、傾斜地の水はけの良さと日照量が糖度の高い果実を育て、全国出荷量トップクラスを維持している。",
      sourceUrl: "https://www.pref.wakayama.lg.jp/prefg/070100/syokuzai/index.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ume",
      name: "うめ（南高梅）",
      municipality: "みなべ町・田辺市",
      description:
        "紀南地方を中心に栽培される梅は農業産出額全国1位。みなべ町・田辺市は南高梅発祥の地で、山の斜面を活かした梅林が広がり、梅干しや梅酒など多彩な加工品として全国に出荷される。",
      sourceUrl: "https://www.pref.wakayama.lg.jp/prefg/070300/d00156944.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kue",
      name: "クエ",
      municipality: "日高地方ほか紀南沿岸",
      description:
        "群れを作らず岩陰に潜む性質から漁獲量が少なく「幻の高級魚」と呼ばれるハタ科の魚。日高地方が主産地で、脂の乗った白身とゼラチン質豊富な皮の食感が珍重され、秋から冬が旬とされる。",
      sourceUrl: "https://pr-wakayama.jp/press/wakayama-kue/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "sanboukan",
      name: "三宝柑",
      municipality: "湯浅町ほか",
      description:
        "江戸時代に紀州藩主へ献上されたことに由来する希少な柑橘。西牟婁地域を中心に栽培され、皮が厚く独特の甘みと香りを持ち、正月飾りや贈答品として古くから親しまれてきた地域の晩柑類。",
      sourceUrl: "https://www.pref.wakayama.lg.jp/prefg/130400/kannkou/tokusannhin.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kishu-hime-tachiuo",
      name: "紀州 紀ノ太刀（タチウオ）",
      municipality: "有田市ほか",
      description:
        "紀伊水道の定置網で漁獲されるタチウオのブランド名。傷が付きにくい漁法で水揚げされるため銀白色の体表が保たれ、一振りの太刀のような美しさから名付けられた地域を代表する高級魚。",
      sourceUrl: "https://oishii-wakayama.com/feature/fish/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kuromaguro",
      name: "クロマグロ",
      municipality: "那智勝浦町ほか",
      description:
        "県魚に指定されるクロマグロは紀南沿岸を代表する漁獲物。那智勝浦町はまぐろ延縄漁の一大基地として知られ、船上で活け締め処理された生マグロが水揚げされる全国屈指の産地となっている。",
      sourceUrl: "https://www.pref.wakayama.lg.jp/prefg/000200/symbol.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tendai-uyaku",
      name: "天台烏薬",
      municipality: "新宮市",
      description:
        "秦の始皇帝が不老不死の霊薬として求めたと伝わる薬木で、クスノキ科の常緑低木。新宮市の霊峰・神倉山周辺に自生し、根を乾燥させてお茶として飲用される、熊野の伝説にゆかりの深い特産物。",
      sourceUrl: "https://www.city.shingu.lg.jp/info/563",
      accessedAt: "2026-07-18",
    },
  ],
};
