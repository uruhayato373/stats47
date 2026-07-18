/**
 * 高知県 (39000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 四国エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const KOCHI_EDITORIAL: AreaEditorial = {
  areaCode: "39000",
  symbols: {
    tree: "ヤナセスギ",
    flower: "ヤマモモ",
    bird: "ヤイロチョウ",
    fish: "カツオ",
    song: "高知県民の歌",
    sourceUrl: "https://www.pref.kochi.lg.jp/info/symbol.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "nira",
      name: "ニラ",
      municipality: "香南市・香美市・四万十町など",
      description:
        "高知県は生産量・出荷量ともに全国1位で、全国出荷の約4分の1のシェアを占める。温暖な気候を生かしハウスと露地栽培で周年生産し、肉厚でやわらかく香りが強いのが特長。",
      sourceUrl: "https://ja-kochi.or.jp/agriculture/products/vegetable/854/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shihouchiku",
      name: "四方竹",
      municipality: "高知市・南国市ほか",
      description:
        "明治10年頃に中国南部から伝わった常緑竹で、10月から11月上旬の秋にだけ採れる希少なタケノコ。断面が四角い形をしており、加熱処理とアク抜きを経てシャキシャキした食感で出荷される。",
      sourceUrl: "https://ja-kochi.or.jp/agriculture/products/vegetable/853/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tosa-buntan",
      name: "土佐文旦",
      municipality: "土佐市・宿毛市・香南市",
      description:
        "高知を代表する柑橘で、独特の爽やかな芳香とプリッとした食感が魅力。ハウス栽培は10月から12月、露地栽培は1月から4月に出荷され、秋から春まで長く青果店に並ぶ。",
      sourceUrl: "https://ja-kochi.or.jp/agriculture/products/fruit/868/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hasu-imo",
      name: "ハスイモ",
      municipality: "県内広域",
      description:
        "サトイモの仲間で茎の部分だけを食べる高知の伝統野菜。「リュウキュウ」とも呼ばれ、シャキシャキとした独特の食感を活かして田舎寿司や酢の物、サラダなど幅広い料理に使われる。",
      sourceUrl: "https://ja-kochi.or.jp/agriculture/products/vegetable/862/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tosa-hachikin-jidori",
      name: "土佐はちきん地鶏",
      municipality: "大川村ほか（室戸市・土佐清水市）",
      description:
        "高知県原産の土佐九斤と大シャモを交配し2005年度に完成させたブランド地鶏。総生産量の約8割を大川村で生産し、平飼いでストレスなく育てるため脂肪が少なく歯ごたえのある味わいに仕上がる。",
      sourceUrl: "https://www.pref.kochi.lg.jp/doc/hachikin/",
      accessedAt: "2026-07-18",
    },
  ],
};
