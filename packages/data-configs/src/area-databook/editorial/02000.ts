/**
 * 青森県 (02000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 北海道・東北エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const AOMORI_EDITORIAL: AreaEditorial = {
  areaCode: "02000",
  symbols: {
    tree: "ヒバ",
    flower: "リンゴの花",
    bird: "ハクチョウ",
    fish: "ヒラメ",
    song: "青森県民の歌（青い森のメッセージ）",
    sourceUrl: "https://www.pref.aomori.lg.jp/k-kensei/symbol.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "fuji-ringo",
      name: "ふじりんご",
      municipality: "藤崎町ほか県内広域",
      description:
        "1939年に藤崎町の農林省園芸試験場で「国光」に「デリシャス」を交配して生まれた品種。日本一の生産量を誇る青森りんごの主力で、名称は富士山と誕生の地「藤崎」から一字ずつ取られた。",
      sourceUrl: "https://www.town.fujisaki.lg.jp/index.cfm/6,0,13,226,html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hatsuyuki-take",
      name: "初雪たけ",
      municipality: "田子町、青森市、平川市",
      description:
        "ナメコの突然変異種として発見された青森県固有のきのこ。純白の傘が初雪を思わせる見た目から名付けられ、通常のナメコより歯ごたえがあり、鍋物や汁物で食感の良さが楽しめる特産品。",
      sourceUrl: "https://www.pref.aomori.lg.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "nukazuka-kyuri",
      name: "糠塚きゅうり",
      municipality: "八戸市",
      description:
        "八戸市糠塚地区で江戸時代から作り継がれてきた在来種のきゅうり。パリパリとした歯切れの良い食感とほのかな苦みが特徴で、味噌をつけてそのまま食べる素朴な郷土の味として親しまれている。",
      sourceUrl: "https://www.city.hachinohe.aomori.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "aomori-shamo-rock",
      name: "青森シャモロック",
      municipality: "五戸町、六戸町、大鰐町",
      description:
        "1990年にデビューした青森県オリジナルの地鶏。適度な弾力と豊かなうま味を持つ肉質が評価され、その品質の高さからひなが宮内庁御料牧場へ出荷される、県を代表するブランド地鶏となっている。",
      sourceUrl: "https://www.pref.aomori.lg.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "toge-kurigani",
      name: "トゲクリガニ",
      municipality: "外ヶ浜町、野辺地町、横浜町、むつ市",
      description:
        "陸奥湾で水揚げされる小ぶりなカニで、身の詰まりと濃厚な味わいは毛ガニに引けを取らない。太宰治が愛したとも伝えられ小説『津軽』にも登場するなど、地元で古くから食べ継がれてきた冬の味覚。",
      sourceUrl: "https://www.marugotoaomori.jp/blog/2015/04/4604.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "jimaki-hotate",
      name: "地まきホタテ",
      municipality: "野辺地町",
      description:
        "むつ湾の海底に稚貝を直接まいて育てる養殖方法で育つホタテ。垂下式の養殖とは異なり、海底で自然に近い環境でじっくり育つため身が締まり、養殖ホタテとは一味違う濃厚な甘みが特徴とされる。",
      sourceUrl: "https://www.pref.aomori.lg.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "fujitsubo",
      name: "フジツボ",
      municipality: "陸奥湾沿岸",
      description:
        "陸奥湾で古くから食されてきた魚介類で、地元で珍重される「七子八珍」の一つに数えられる。現在は漁獲量が減り希少な珍味となっており、貝のような濃厚な旨みを持つ身を茹でて食べるのが定番。",
      sourceUrl: "https://www.pref.aomori.lg.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shimizumori-nanba",
      name: "清水森ナンバ",
      municipality: "弘前市",
      description:
        "津軽地方に伝わる在来種のトウガラシで、辛味の中にまろやかな甘みと豊かな風味を持つのが特徴。弘前市が地域ブランドとして生産振興に取り組み、味噌や漬物など多彩な加工品にも使われている。",
      sourceUrl: "https://www.city.hirosaki.aomori.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "owani-onsen-moyashi",
      name: "大鰐温泉もやし",
      municipality: "大鰐町",
      description:
        "大鰐町の温泉熱で地温を高めた土耕栽培により350年以上前から続く秘伝の野菜。豆から30cm近くまで育てる独特の栽培法で作られ、シャキシャキとした食感と豆の甘みが凝縮された味わいが特徴。",
      sourceUrl: "https://www.town.owani.lg.jp/",
      accessedAt: "2026-07-18",
    },
  ],
};
