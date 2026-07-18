/**
 * 大分県 (44000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 九州・沖縄エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const OITA_EDITORIAL: AreaEditorial = {
  areaCode: "44000",
  symbols: {
    tree: "ブンゴウメ（豊後梅）",
    flower: "ブンゴウメ（豊後梅）",
    bird: "メジロ",
    fish: "関サバ",
    sourceUrl: "https://www.pref.oita.jp/soshiki/75008/symbol02.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "bungo-aigamo",
      name: "ぶんご合鴨",
      municipality: "豊後高田市・竹田市",
      description:
        "県農業技術センターがマガモと青首アヒルを交配し誕生させた県独自の合鴨。特産の白ネギとの相性を目指して開発され、コクとうま味のある肉質から鍋料理などで親しまれている。",
      sourceUrl: "https://www.pref.oita.jp/site/archive/201362.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "seki-saba",
      name: "関サバ",
      municipality: "大分市",
      description:
        "大分市佐賀関沖の「速吸の瀬戸」で漁師が一本釣りする真鯖。潮流が速い漁場で育つため身が引き締まっており、魚体へのダメージを抑える一本釣りでブランド価値を守っている。",
      sourceUrl: "https://www.pref.oita.jp/soshiki/10400/tokusanhin-sekiajisekisaba.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "saffron",
      name: "サフラン",
      municipality: "竹田市",
      description:
        "国内生産量の約8割を占める竹田市特産の香辛料。畑ではなく屋内で球根から花を咲かせて収穫する世界的にも珍しい方式で、約120年前から続く栽培の歴史を持つ。",
      sourceUrl: "https://edit.pref.oita.jp/series/food-culture/3115/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "suppon",
      name: "スッポン",
      municipality: "宇佐市（安心院）",
      description:
        "宇佐市安心院地区で約30度の温泉水を利用した冬期加温養殖が確立された名産のスッポン。冬眠させずに1〜1.5年かけて育てることで、清流と温暖な気候を生かした上質な身質を実現している。",
      sourceUrl: "https://www.pref.oita.jp/site/archive/200322.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kurome",
      name: "クロメ",
      municipality: "大分市（佐賀関）",
      description:
        "大分市佐賀関沖で1〜3月の限定期間に漁が解禁される粘りの強い海藻。潮流の速い高島周辺で育つため粘りが強くえぐみが少なく、味噌汁や和え物として地元で県民フードと呼ばれるほど親しまれている。",
      sourceUrl: "https://theoita.com/sanpinintro/1132/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "toyonohoshi",
      name: "トヨノホシ",
      municipality: "豊後大野市・佐伯市",
      description:
        "麦焼酎生産量トップの大分県で2018年に品種登録された焼酎専用の二条大麦。九州二条18号と西の星の掛け合わせから育成され、粒が大きく高いアルコール抽出力と豊かな香りを持つ。",
      sourceUrl: "https://www.pref.oita.jp/soshiki/15084/toyonohishi.html",
      accessedAt: "2026-07-18",
    },
  ],
};
