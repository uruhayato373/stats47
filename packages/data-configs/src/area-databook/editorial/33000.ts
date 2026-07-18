/**
 * 岡山県 (33000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 中国エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const OKAYAMA_EDITORIAL: AreaEditorial = {
  areaCode: "33000",
  symbols: {
    tree: "アカマツ",
    flower: "ももの花",
    bird: "キジ",
    song: "岡山県の歌",
    sourceUrl: "https://www.nga.gr.jp/pref_info/symbol/okayama.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "momotaro-budou",
      name: "桃太郎ぶどう",
      municipality: "岡山市・倉敷市・高梁市・井原市",
      description:
        "20年以上の歳月をかけて開発された品種「瀬戸ジャイアンツ」の大粒ぶどう。皮が薄くやわらかく種もないため皮ごと食べられ、パリッとした食感の後に濃厚な甘みが広がる岡山県産ブランド。",
      sourceUrl: "https://www.okayama-fruits.com/momotaro.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hiruzen-jersey",
      name: "蒜山ジャージー牛",
      municipality: "真庭市",
      description:
        "真庭市蒜山地域は昭和30年頃からジャージー牛の飼育に取り組み、全国約1万頭のうち約2千頭を占める日本最大規模の産地に成長。牧草の自給率が高い循環型酪農で育ち、濃厚な風味の「ゴールデンミルク」を生む。",
      sourceUrl: "https://www.hiruraku.com/hiruzen_jersey/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "niimi-caviar",
      name: "新見キャビア",
      municipality: "新見市",
      description:
        "カルスト地形特有の硬水を活かし、新見漁業協同組合が12年の試行錯誤を経てチョウザメ養殖と国産キャビア生産に成功。現在は約1万2千尾を養殖し、年間約100kgのフレッシュキャビアを生産する希少な特産品。",
      sourceUrl: "https://www.city.niimi.okayama.jp/kanko/souvenir/souvenir_detail/index/110.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shimotsui-tako",
      name: "下津井ダコ（干しダコ）",
      municipality: "倉敷市",
      description:
        "瀬戸内海の速い潮流に育まれ、足が短く太くやわらかい下津井の真だこ。秋から冬の「寒ダコ」を天日で1週間ほど干す干しダコは、漁師の保存食を起源に瀬戸大橋を背に足を広げてつるす冬の風物詩となっている。",
      sourceUrl: "https://setouchifinder.com/ja/detail/484",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ushimado-togan",
      name: "冬瓜（牛窓）",
      municipality: "瀬戸内市",
      description:
        "瀬戸内市牛窓町では1980年代から冬瓜栽培が始まり、温暖な気候と豊富な日照を活かしたトンネル栽培で6～10月の長期出荷を実現。生産量は全国トップクラスを誇り、夏場に日持ちする野菜として重宝される。",
      sourceUrl: "https://apron-web.jp/column/furusato/13025/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "mamakari",
      name: "ままかり",
      municipality: "瀬戸内海沿岸",
      description:
        "ニシン科の小魚サッパの岡山での呼び名。酢漬けにした味の良さから「ご飯（まま）を隣家に借りに行くほど美味しい」という逸話が名前の由来とされ、瀬戸内地域で親しまれてきた郷土の味覚。",
      sourceUrl: "https://www.okayama-kanko.jp/souvenir",
      accessedAt: "2026-07-18",
    },
  ],
};
