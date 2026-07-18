/**
 * 大阪府 (27000) の editorial コンテンツ (特産品・府シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 近畿エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const OSAKA_EDITORIAL: AreaEditorial = {
  areaCode: "27000",
  symbols: {
    tree: "イチョウ",
    flower: "ウメ、サクラソウ",
    bird: "モズ",
    sourceUrl: "https://www.pref.osaka.lg.jp/",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "suita-kuwai",
      name: "吹田慈姑",
      municipality: "吹田市",
      description:
        "江戸時代以前から吹田市に自生していたとされる小型のクワイ。流通量の多い大型の中国クワイとはえぐみの少なさで一線を画し、栗を思わせるほくほくとした甘さを持つ「なにわの伝統野菜」の一つ。",
      sourceUrl: "https://www.pref.osaka.lg.jp/o120090/nosei/naniwanonousanbutu/dentou.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "meshiso",
      name: "芽紫蘇",
      municipality: "大阪市",
      description:
        "明治初期、大阪市北区源八付近で芽物栽培が盛んだったことから「源八もの」と呼ばれた芽物野菜の一つ。青芽と赤芽があり、独特の香気と鮮やかな色合いを持つ薬味用のシソの若芽。",
      sourceUrl: "https://www.pref.osaka.lg.jp/o120090/nosei/naniwanonousanbutu/dentou.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "osaka-shirona",
      name: "大阪しろな",
      municipality: "大阪市",
      description:
        "「天満菜」とも呼ばれる江戸時代由来の伝統野菜で、早生・中生・晩生の各品種を通年で収穫できる。葉柄が鮮明な白色で平たい軸を持ち、大阪の食卓を支えてきたなにわの伝統野菜の代表格。",
      sourceUrl: "https://www.pref.osaka.lg.jp/o120090/nosei/naniwanonousanbutu/dentou.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "usui-endou",
      name: "碓井豌豆",
      municipality: "羽曳野市",
      description:
        "明治時代にアメリカから羽曳野市碓井地区へ導入され、改良を重ねられたむき実用のエンドウ豆。さやと豆の色合いは淡く小粒だが甘みが強く、春の豆ご飯や炊き込みご飯に欠かせない食材。",
      sourceUrl: "https://www.pref.osaka.lg.jp/o120090/nosei/naniwanonousanbutu/dentou.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shungiku",
      name: "しゅんぎく",
      municipality: "堺市、岸和田市、貝塚市",
      description:
        "泉州地域の堺市・岸和田市・貝塚市を主産地とする冬春野菜で、カルシウムやビタミンAを豊富に含む。葉を食べる菊の仲間であることから大阪では「菊菜」とも呼ばれ、鍋物や炒め物で親しまれる。",
      sourceUrl: "https://www.pref.osaka.lg.jp/o120090/nosei/naniwanonousanbutu/tokusanhin.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "senshu-tamanegi",
      name: "泉州たまねぎ",
      municipality: "泉佐野市、泉南市、阪南市",
      description:
        "日本のたまねぎ栽培発祥の地とされる泉州地域で育つブランドたまねぎ。水分を多く含みながら甘みがあってやわらかいのが特長で、初夏の露地収穫期には大阪の食卓を代表する定番野菜となる。",
      sourceUrl: "https://www.pref.osaka.lg.jp/o120090/nosei/naniwanonousanbutu/tokusanhin.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kintoki-ninjin",
      name: "金時人参",
      municipality: "大阪市",
      description:
        "江戸時代から昭和初期にかけて大阪市浪速区付近の特産だったことから「大阪人参」とも呼ばれた伝統野菜。根の長さ約30センチの深紅色が特徴で、肉質はやわらかく甘みと香りが強い正月料理の定番食材。",
      sourceUrl: "https://www.pref.osaka.lg.jp/o120090/nosei/naniwanonousanbutu/dentou.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "osaka-fuki",
      name: "大阪ふき",
      municipality: "泉佐野市、熊取町、泉南市、貝塚市",
      description:
        "泉州地域の露地栽培で育つ春の伝統野菜で、独特のほろ苦さが持ち味。愛知早生から選抜育成された品種「のびすぎでんねん」など地域で改良が重ねられ、煮物や佃煮として春の訪れを告げる。",
      sourceUrl: "https://www.pref.osaka.lg.jp/o120090/nosei/naniwanonousanbutu/tokusanhin.html",
      accessedAt: "2026-07-18",
    },
  ],
};
