/**
 * 佐賀県 (41000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 九州・沖縄エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const SAGA_EDITORIAL: AreaEditorial = {
  areaCode: "41000",
  symbols: {
    tree: "クスの木",
    flower: "クスの花",
    bird: "カササギ",
    song: "佐賀県民の歌",
    sourceUrl: "https://www.pref.saga.lg.jp/kiji0032157/index.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "yobuko-ika",
      name: "呼子のイカ",
      municipality: "唐津市",
      description:
        "唐津市呼子町は「イカの活造り」発祥の地とされる港町。玄界灘で水揚げされた新鮮なケンサキイカなどをその場でさばく透き通った身とコリコリした歯ごたえが名物で、朝市でも味わえる。",
      sourceUrl: "https://www.asobo-saga.jp/articles/detail/b2d97eae-3915-4ae9-b04f-25f35eba3beb",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shimizu-koi",
      name: "清水の鯉",
      municipality: "小城市",
      description:
        "小城市清水地区は名水百選にも選ばれた清流に恵まれ、鯉料理専門店が軒を連ねる珍しい地域。冬に脂がのる「寒鯉」は毎年2月の祭りで振る舞われ、刺身や洗いで提供される郷土の味覚。",
      sourceUrl: "https://ogi-kankou.com/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ice-plant",
      name: "アイスプラント",
      municipality: "県内広域",
      description:
        "葉の表面が氷の粒のように輝く多肉植物で、1985年に佐賀大学が有明海沿岸の塩害対策の研究から栽培を始めたことがきっかけとされる。ほのかな塩味とシャキシャキの食感が特徴のサラダ野菜。",
      sourceUrl: "https://www.pref.saga.lg.jp/list00641.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "saga-nori-ariake-ichiban",
      name: "佐賀海苔有明海一番",
      municipality: "有明海沿岸",
      description:
        "佐賀県は海苔の生産量・販売額で長年全国トップを誇り、その頂点に立つのが「有明海一番」。タンパク質量や香り、口どけなど7つの基準を満たした一番摘みのみが名乗れる、生産量のごく一部の最高級品。",
      sourceUrl: "https://www.pride-fish.jp/JPF/pref/detail.php?pk=1412933727",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shiroishi-renkon",
      name: "しろいしレンコン",
      municipality: "白石町",
      description:
        "白石町は有明海沿岸のミネラル豊富な重粘土質の土壌に恵まれ、レンコン栽培の一大産地となっている。糸を引くほどの粘りとやわらかな食感が特徴で、町を代表する農産物として観光協会も紹介する看板品目。",
      sourceUrl: "https://flat-shiroishi.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tamanegi-shiroishi",
      name: "タマネギ",
      municipality: "白石町ほか",
      description:
        "白石町を中心とした佐賀平野は春夏タマネギの一大産地で、出荷量は全国トップクラス。極早生品種は早い時期から店頭に並び、みずみずしく甘みが強いことからサラダなど生食にも向くと評判が高い。",
      sourceUrl: "https://flat-shiroishi.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "unshu-mikan",
      name: "温州ミカン",
      municipality: "天山山麓・多良岳山麓",
      description:
        "天山や多良岳のふもとに広がる「オレンジベルト」と呼ばれる山間部で栽培される温州ミカン。傾斜地でのマルチ被覆栽培により水分を抑えて糖度を高める工夫が凝らされ、農業産出額でも上位を占める県の主力果実。",
      sourceUrl: "https://sagapin.jp/sagapin2/product/",
      accessedAt: "2026-07-18",
    },
  ],
};
