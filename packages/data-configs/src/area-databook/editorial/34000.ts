/**
 * 広島県 (34000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 中国エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const HIROSHIMA_EDITORIAL: AreaEditorial = {
  areaCode: "34000",
  symbols: {
    tree: "モミジ",
    flower: "モミジ",
    bird: "アビ",
    fish: "カキ",
    sourceUrl: "https://www.pref.hiroshima.lg.jp/soshiki/19/kids-02.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "mebaru",
      name: "メバル",
      municipality: "瀬戸内海沿岸（広島湾ほか）",
      description:
        "旬が春先のため「春告げ魚」とも呼ばれる瀬戸内海の代表的な小魚。広島湾ではカキ筏の下が絶好のすみかで、筏に付着する餌生物を食べて育ったメバルは脂がのり評判が高い。",
      sourceUrl: "https://www.pref.hiroshima.lg.jp/site/setouchi-jizakana-biyori/sakana.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "anago",
      name: "アナゴ（瀬戸のアナゴ）",
      municipality: "廿日市市ほか",
      description:
        "廿日市市大野瀬戸は宮島との間の海峡で潮流が速く、ここで獲れるアナゴは身が締まり脂がのって「瀬戸のアナゴ」と呼ばれる。あなご飯など郷土料理の主役として親しまれる。",
      sourceUrl: "https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/42_30_hiroshima.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hassaku",
      name: "ハッサク",
      municipality: "尾道市（因島）",
      description:
        "万延年間（1860年頃）に尾道市因島の浄土寺境内で偶然芽生えた実生に由来する柑橘。旧暦8月1日（八朔）の頃から食べられたことが名前の由来とされ、因島が発祥地として知られる。",
      sourceUrl: "https://kanko-innoshima.jp/eating/hassaku",
      accessedAt: "2026-07-18",
    },
    {
      slug: "abe-hakuto",
      name: "阿部白桃",
      municipality: "三原市",
      description:
        "三原市の阿部農園が育成した独自品種の白桃。傷んだ桃を捨てた場所から偶然育った苗を調査したところ新品種と判明し、親品種の大久保にはある花粉を持たない特徴から品種登録された。",
      sourceUrl: "https://www.tsukuruhitoniainiiku.jp/tsukuru_story/story-95/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "homeishu",
      name: "保命酒",
      municipality: "福山市（鞆の浦）",
      description:
        "鞆の浦に約350年前の万治2年（1659年）から伝わる薬味酒。みりんをベースに桂皮など16種の生薬を漬け込んで造られ、江戸幕府にも備後の特産品として重用され全国に名を広めた。",
      sourceUrl: "https://www.city.fukuyama.hiroshima.jp/site/miryoku2023/288071.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hiroshima-na",
      name: "広島菜",
      municipality: "広島市（安佐南区川内地区ほか）",
      description:
        "高菜・野沢菜と並ぶ日本三大漬菜の一つ。肥沃で水はけの良い太田川中州の川内地区で古くから栽培され、1960年代に贈答用漬物として百貨店で扱われ、カキと並ぶ広島の冬の名物に発展した。",
      sourceUrl: "https://www.hgurume.jp/blogs/introduction_info/202209150001",
      accessedAt: "2026-07-18",
    },
    {
      slug: "sayori",
      name: "サヨリ",
      municipality: "福山市ほか",
      description:
        "瀬戸内海では冬から春にかけてが旬とされる細身の魚。刺身や干物として親しまれ、鞆の浦をはじめとする沿岸部では干物づくりが冬の風物詩として続けられている。",
      sourceUrl: "https://www.pref.hiroshima.lg.jp/site/setouchi-jizakana-biyori/sakana.html",
      accessedAt: "2026-07-18",
    },
  ],
};
