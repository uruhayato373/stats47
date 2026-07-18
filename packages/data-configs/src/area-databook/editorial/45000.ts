/**
 * 宮崎県 (45000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 九州・沖縄エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const MIYAZAKI_EDITORIAL: AreaEditorial = {
  areaCode: "45000",
  symbols: {
    tree: "フェニックス（ヤマザクラ・オビスギも県木）",
    flower: "ハマユウ",
    bird: "コシジロヤマドリ",
    song: "宮崎県民歌",
    sourceUrl: "https://www.pref.miyazaki.lg.jp/kohosenryaku/kense/koho/symbol2.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "miyazaki-brand-pork",
      name: "宮崎ブランドポーク",
      municipality: "県内広域",
      description:
        "宮崎ブランドポーク普及促進協議会が定める衛生管理・肉質基準をクリアした県内生産者のみが名乗れる豚肉。指定食肉処理場で処理され、色つや・脂の質を計測した良質な豚肉だけが選ばれる。",
      sourceUrl: "https://www.m-pork.com/mbpork/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kinkan-tamatama",
      name: "キンカン（完熟きんかん「たまたま」）",
      municipality: "県内広域",
      description:
        "宮崎県は生産量が全国の6割を超えるキンカン日本一の産地。2010年からは開花結実210日以上・糖度16度以上などの基準を満たした完熟果だけを「たまたま」と呼び、皮ごと甘く食べられる高品質ブランドとして出荷している。",
      sourceUrl: "https://www.miyazakibrand.jp/brand-list/15-cumquat/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "miyazaki-vitamin-piiman",
      name: "みやざきビタミンピーマン",
      municipality: "県内広域",
      description:
        "全国トップクラスの日射量を生かして育てられ、ビタミンCが全国標準の約1.3倍含まれるピーマン。2017年にピーマンとして国内で初めて「栄養機能食品」の表示が認められた宮崎県のブランド野菜。",
      sourceUrl: "https://www.miyazakibrand.jp/health/greenpepper/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hebesu",
      name: "へべす",
      municipality: "日向市ほか",
      description:
        "江戸時代末期に日向市で発見された香酸かんきつ「へべす」。皮が薄く種が少ないため果汁が多く取れ、クエン酸やビタミンCも豊富。焼き魚や刺身にかけるなど宮崎の食卓で幅広く使われている。",
      sourceUrl: "https://www.himuka-farm.com/hebesu/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kyo-imo",
      name: "京いも（たけのこ芋）",
      municipality: "小林市ほか",
      description:
        "小林市を中心に栽培される大型のサトイモで、地上に伸びる姿から「たけのこ芋」とも呼ばれる。粉質で身が締まり煮崩れしにくく、小林市だけで全国出荷量の約8割を占める宮崎県特産の芋。",
      sourceUrl: "https://www.inseason.jp.net/producer/201901/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kurokawa-kabocha",
      name: "黒皮かぼちゃ（日向かぼちゃ）",
      municipality: "宮崎市・国富町ほか",
      description:
        "大正時代に千葉県から黒皮種を導入して定着した宮崎県の伝統野菜。西洋かぼちゃよりさっぱりとした甘みときめ細かな舌ざわりが特徴で、京都の日本料理店でも高級食材として使われている。",
      sourceUrl: "https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/hyuuga_kuro_kabocha_no_nimono_miyazaki.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "gokase-yamame",
      name: "五ヶ瀬やまめ",
      municipality: "五ヶ瀬町",
      description:
        "九州脊梁山地の五ヶ瀬川源流で育てられるヤマメ。湧水と谷水を配合し季節ごとに最適な水温を保つ養殖法で無投薬飼育を続け、2007年に宮崎県の水産ブランド品として淡水魚では初めて認証された。",
      sourceUrl: "https://www.town.gokase.miyazaki.jp/kanko/omiyagetokusanhin/tokusanomiyage/gokaseyamame.html",
      accessedAt: "2026-07-18",
    },
  ],
};
