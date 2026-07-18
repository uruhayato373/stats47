/**
 * 岐阜県 (21000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 中部エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const GIFU_EDITORIAL: AreaEditorial = {
  areaCode: "21000",
  symbols: {
    tree: "イチイ",
    flower: "レンゲソウ",
    bird: "ライチョウ",
    fish: "アユ",
    song: "岐阜県民の歌",
    sourceUrl: "https://www.pref.gifu.lg.jp/page/111.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "suzuran-daikon",
      name: "すずらん大根",
      municipality: "高山市",
      description:
        "標高1,200mの高冷地・高山市で栽培される大根。昼夜の寒暖差が大きい気候を生かし、夏に収穫する。甘みがあり瑞々しい肉質でサラダ向きの品種として親しまれる。",
      sourceUrl: "https://www.city.takayama.lg.jp/shisei/1000067/1002615/1002634/1002635.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "takahara-sansho",
      name: "高原山椒",
      municipality: "高山市",
      description:
        "奥飛騨温泉郷周辺の標高約800m圏内でのみ栽培が許される希少な山椒。実は小ぶりだが柑橘系の芳香が際立ち、江戸時代には飛騨郡代が将軍に献上した記録も残る特産品。",
      sourceUrl: "https://hidasansyo.com/pages/takaharasansyo",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kobo-imo",
      name: "弘法いも",
      municipality: "本巣市",
      description:
        "本巣市根尾地域で古くから栽培される在来種のジャガイモ。小石混じりの水はけの良い赤土で育ち、皮ごと食べると栗とじゃがいもの中間のような、堅く粘質でホクホクとした食感が楽しめる。",
      sourceUrl: "https://seed-to-harvest.jp/report/20241205/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "sawa-azami",
      name: "沢あざみ",
      municipality: "揖斐川町",
      description:
        "伊吹山麓に自生していたアザミを家屋周辺で栽培するようになった飛騨・美濃伝統野菜。葉の中肋部分を食用にし、素朴な香りとシャキシャキとした食感が特徴。集落の祭りに欠かせない食材として受け継がれる。",
      sourceUrl: "https://slowfood-nippon.jp/ibigawa-sawa-azami/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kuwanoki-mame",
      name: "桑の木豆",
      municipality: "山県市",
      description:
        "山県市美山地域で育つインゲン豆の仲間。かつて養蚕が盛んだった地域で桑の木にツルをはわせて栽培したことが名の由来。寒さの厳しい土地でしか完熟時の赤いかすり模様が出ない、飛騨・美濃伝統野菜のひとつ。",
      sourceUrl: "https://www.kankou-gifuyamagata.jp/article/deatils/kuwanokimame",
      accessedAt: "2026-07-18",
    },
    {
      slug: "horado-kiwifruit",
      name: "キウイフルーツ",
      municipality: "関市",
      description:
        "関市洞戸地域で40年以上栽培が続くキウイフルーツ。板取川流域の土壌と昼夜の寒暖差を生かし、糖度が高くジューシーな味わいに仕上がる。加工品開発の取り組みが2021年度農林水産大臣賞を受賞した。",
      sourceUrl: "https://kobito-no-nouen.jp/horado-kiwifruit-summary/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tokuro-ginnan",
      name: "藤九郎ぎんなん",
      municipality: "羽島市・瑞穂市",
      description:
        "瑞穂市の原木に由来し羽島市域にも広がった大粒ぎんなんの品種。一般種のほぼ2倍の重さがありながら殻は薄く表面に光沢があるのが特徴で、貯蔵性の高さから市場評価も高い晩生種。",
      sourceUrl: "https://www.pref.gifu.lg.jp/page/4809.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "yamaoka-hosokanten",
      name: "細寒天",
      municipality: "恵那市",
      description:
        "恵那市山岡町で作られる糸状の寒天で全国シェア8割を超える生産量日本一の特産品。明け方氷点下・日中10℃前後という冬の寒暖差を生かし、天草を煮出した寒天液をよしずの上で乾燥させて仕上げる。",
      sourceUrl: "https://www.masugokanten.com/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ogaki-chamomile",
      name: "カモミール",
      municipality: "大垣市",
      description:
        "1984年の本格栽培開始以来、大垣市が生産量日本一を誇るハーブ。約2haの畑で無農薬・無化学肥料栽培され年間約7tを収穫。ハーブティーや入浴剤の原料として親しまれ、開花期の5月には一面に甘い香りが漂う。",
      sourceUrl: "https://news.yahoo.co.jp/articles/307791ce3b58a6cf5637beecadb907fe7013c560",
      accessedAt: "2026-07-18",
    },
  ],
};
