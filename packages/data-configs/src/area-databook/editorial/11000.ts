/**
 * 埼玉県 (11000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 関東エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const SAITAMA_EDITORIAL: AreaEditorial = {
  areaCode: "11000",
  symbols: {
    tree: "ケヤキ",
    flower: "サクラソウ",
    bird: "シラコバト",
    song: "埼玉県歌",
    sourceUrl: "https://www.pref.saitama.lg.jp/a0314/saitama-profile/saitama-symbol.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "sayama-tea",
      name: "狭山茶",
      municipality: "狭山丘陵地域(入間市、所沢市、狭山市ほか)、秩父地域",
      description:
        "鎌倉時代に伝わり江戸時代に生産が広がった、日本三大銘茶の一つ。茶産地としては経済的北限に位置し、「狭山火入れ」という仕上げ技術により甘く濃厚な味わいに仕上がる。",
      sourceUrl: "https://www.pref.saitama.lg.jp/saitama-wassyoi/know/recommend/item/tokusanhin03.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shakushina",
      name: "しゃくし菜",
      municipality: "秩父市、小鹿野町、皆野町ほか秩父地方",
      description:
        "明治初期に中国から伝来し秩父地方で栽培が続く伝統野菜。葉の形が杓子に似ることが名前の由来で、シャキシャキとした歯ごたえの漬物として親しまれ、まんじゅうのあんにも使われる。",
      sourceUrl: "https://www.pref.saitama.lg.jp/soshiki/b0904/nougyou/syakushina.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kuwai",
      name: "クワイ",
      municipality: "さいたま市、越谷市、草加市",
      description:
        "湿地帯が広がる県東部で古くから栽培されてきたオモダカ科の水生植物。大きな芽を出す姿から縁起物とされ、正月のおせち料理に欠かせない高級食材として12月に出荷される。",
      sourceUrl: "https://www.pref.saitama.lg.jp/b0901/sai-kuwai-dentou.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "namazu",
      name: "ナマズ",
      municipality: "吉川市ほか県東部",
      description:
        "江戸川と中川に挟まれた吉川市は川魚料理で知られ、1996年になまず養殖に成功し地下水で育てた良質な吉川産なまずを出荷。1995年からの町おこしで「なまずの里」として全国に知られるようになった。",
      sourceUrl: "https://www.city.yoshikawa.saitama.jp/index.cfm/27,18333,164,831,html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "marukei-yatsugashira",
      name: "丸系八つ頭",
      municipality: "深谷市、杉戸町ほか県央地域",
      description:
        "埼玉県農林総合研究センターが在来の八つ頭から大きく丸い親芋のみを選抜・固定した里芋の県オリジナル系統。ふっくらとした食感と皮のむきやすさが特徴で、深谷市が産地化の先駆けとなった。",
      sourceUrl: "https://www.pref.saitama.lg.jp/a0904/yasai/marukeiyatsugashira.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "saigyoku",
      name: "彩玉",
      municipality: "利根地域ほか県内広域",
      description:
        "埼玉県農林総合研究センターが「新高」と「豊水」を交配して育成した梨のオリジナル品種で2005年に品種登録。糖度が「幸水」を上回る甘さとみずみずしさを持つ大玉が特徴で、8月中旬から下旬に収穫される。",
      sourceUrl: "https://www.pref.saitama.lg.jp/b0901/sai-saigyokunodekirumade.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "norabouna",
      name: "のらぼう菜",
      municipality: "東松山市、滑川町、嵐山町ほか比企地域",
      description:
        "江戸時代から比企地域で栽培されてきた菜の花の一種で、かつて飢饉を救った野菜と伝わる伝統野菜。茎に甘みがありアクが少なく、2月下旬から5月上旬にかけて「比企のらぼう菜」として出荷される。",
      sourceUrl: "https://www.pref.saitama.lg.jp/saitama-wassyoi/know/recommend/item/yasai20.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "chichibu-yama-ruby",
      name: "ちちぶ山ルビー",
      municipality: "秩父地域",
      description:
        "欧州系「リザマート」と米国系「ピアレス」を交配したぶどうの品種で、2007年に商標登録された秩父地域限定のブランド。糖度17度以上、皮ごと食べられる楕円形の鮮紅色の粒が特徴。",
      sourceUrl:
        "https://www.ja-chichibu.jp/news/%E5%A4%A9%E5%80%99%E3%81%AB%E6%81%B5%E3%81%BE%E3%82%8C%E9%AB%98%E7%B3%96%E5%BA%A6%E3%80%8C%E3%81%A1%E3%81%A1%E3%81%B6%E5%B1%B1%E3%83%AB%E3%83%93%E3%83%BC%E3%80%8D%E8%B2%A9%E5%A3%B2.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "sainokuni-jidori-tamashamo",
      name: "彩の国地鶏タマシャモ",
      municipality: "坂戸市、深谷市、川越市、秩父市ほか",
      description:
        "1984年に埼玉県養鶏試験場が大和しゃもやニューハンプシャー種などを掛け合わせて開発した高品質肉用鶏。150日以上の長期飼育で味と歯ごたえ、コクを引き出し、保水性のあるジューシーな肉質に仕上げる。",
      sourceUrl: "https://www.pref.saitama.lg.jp/saitama-wassyoi/know/recommend/item/chikusan02.html",
      accessedAt: "2026-07-18",
    },
  ],
};
