/**
 * 香川県 (37000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 四国エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const KAGAWA_EDITORIAL: AreaEditorial = {
  areaCode: "37000",
  symbols: {
    tree: "オリーブ",
    flower: "オリーブ",
    bird: "ホトトギス",
    fish: "ハマチ",
    song: "香川県民歌",
    sourceUrl: "https://www.pref.kagawa.lg.jp/kocho/shokai/profile/symbol.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "sanuki-no-yume",
      name: "さぬきの夢",
      municipality: "県内広域",
      description:
        "さぬきうどんを地元産小麦で作りたいという県民の思いから、香川県農業試験場が1992年から交配を重ね2000年に品種登録したうどん用小麦。コシの強いモチモチとした麺質が特長で、うどん以外に素麺や菓子にも使われる。",
      sourceUrl: "https://www.pref.kagawa.lg.jp/seiryu/sanukinoyume/menpaku/01_birth.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ibuki-iriko",
      name: "伊吹いりこ",
      municipality: "観音寺市",
      description:
        "観音寺港沖合の伊吹島近海で獲れるカタクチイワシを釜茹でし乾燥させた煮干し。うま味が強く濃厚な出汁が取れ、さぬきうどんのかけ汁に欠かせない存在として県内の多くのうどん店で使用されている。",
      sourceUrl: "https://www.yonden.co.jp/cnt_landl/2111/special.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ninniku",
      name: "ニンニク",
      municipality: "琴平町、善通寺市、観音寺市、さぬき市ほか",
      description:
        "香川県は全国有数のニンニク産地でありながら、大規模な機械化に頼らず手間ひまかけた栽培が続けられている。身がしっかり詰まり香りが豊かなことが評価され、瀬戸内の温暖な気候と肥沃な土壌が栽培を支えている。",
      sourceUrl: "https://www.pref.kagawa.lg.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kobara-beni-wase",
      name: "小原紅早生",
      municipality: "高松市、坂出市、観音寺市、三豊市",
      description:
        "香川県内で発見された果皮の濃い紅色が特徴のミカン品種。糖度が高く濃厚な甘みを持ち、色づきの良さから贈答用としても人気が高い、県産かんきつを代表するブランド品種のひとつとして栽培されている。",
      sourceUrl: "https://www.pref.kagawa.lg.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "sanuki-gold",
      name: "さぬきゴールド",
      municipality: "高松市、善通寺市、三豊市",
      description:
        "黄金色の果肉とみずみずしい果汁が特徴の香川県育成キウイフルーツ品種。メロンを思わせる独特の食感と甘みを持ち、温暖な瀬戸内気候を生かして栽培される県オリジナルの高付加価値果樹として知られる。",
      sourceUrl: "https://www.pref.kagawa.lg.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "sanuki-no-mezame",
      name: "さぬきのめざめ",
      municipality: "丸亀市、まんのう町ほか",
      description:
        "根元までやわらかく育つ香川県育成のアスパラガス品種。紫色の「ビオレッタ」という派生品種も生まれており、朝どりの新鮮さとやわらかな食感が評価され県内の直売所や飲食店で親しまれている。",
      sourceUrl: "https://www.pref.kagawa.lg.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ochi-parsley",
      name: "大内パセリ",
      municipality: "東かがわ市",
      description:
        "東かがわ市大内地区で昭和41年に種を取るために栽培を始めたのがきっかけで広まったパセリ。葉がやわらかく苦みが少ないため食べやすく、料理の彩りだけでなく主役級の食材として消費される地域特産品。",
      sourceUrl: "https://www.pref.kagawa.lg.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hiketa-buri",
      name: "ひけた鰤",
      municipality: "東かがわ市",
      description:
        "東かがわ市引田地区は昭和3年にハマチの海面養殖の事業化に成功した養殖発祥の地。豊かな海域環境で育てられた脂の乗った鰤は地域ブランドとして確立し、香川県の県魚ハマチのルーツを今に伝える存在となっている。",
      sourceUrl: "https://www.pref.kagawa.lg.jp/",
      accessedAt: "2026-07-18",
    },
  ],
};
