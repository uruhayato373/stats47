/**
 * 熊本県 (43000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 九州・沖縄エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const KUMAMOTO_EDITORIAL: AreaEditorial = {
  areaCode: "43000",
  symbols: {
    tree: "クスノキ",
    flower: "リンドウ",
    bird: "ヒバリ",
    fish: "クルマエビ",
    song: "火の国旅情",
    sourceUrl: "https://www.pref.kumamoto.jp/soshiki/1/3871.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "majaku",
      name: "マジャク",
      municipality: "荒尾市",
      description:
        "アナジャコの仲間で、荒尾干潟に棲む地域名物。穴に筆を差し込み敵と勘違いして出てきたところを捕らえる珍しい「マジャク漁」で獲られ、フライなどで味わうご当地グルメとして親しまれている。",
      sourceUrl: "https://www.city.arao.lg.jp/0/4824.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "honey-rosa",
      name: "ハニーローザ",
      municipality: "玉東町",
      description:
        "すももの一種で、高い果汁糖度となめらかな肉質が特徴。玉東町は日本一の栽培面積と生産量を誇る産地だが、生果として出回るのは毎年6月上〜中旬のわずか10日間ほどしかない希少な果実。",
      sourceUrl: "https://gyokuto-select.com/abouthoney.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "aso-takana",
      name: "阿蘇高菜",
      municipality: "阿蘇市",
      description:
        "阿蘇の寒冷な気候と火山灰の大地が育む伝統野菜。9〜10世紀に中国から伝わったとされ、収穫直後に漬ける新漬けと半年かけて乳酸発酵させる古漬けがあり、高菜漬けの材料として郷土料理に欠かせない。",
      sourceUrl:
        "https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/aso_takana_zuke_kumamoto.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ashiaka-ebi",
      name: "アシアカエビ",
      municipality: "芦北町",
      description:
        "熊本の車海老と並ぶ代表的なエビ。「うたせ船」漁で水揚げされ、身の大きさと柔らかく甘みのある食味が特徴だが、漁獲量が少なくあまり市場に出回らない希少な地域の味覚となっている。",
      sourceUrl: "https://ashikita-kankou.com/introduce/%E3%82%A2%E3%82%B7%E3%82%A2%E3%82%AB%E3%82%A8%E3%83%93/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "yamae-guri",
      name: "やまえ栗",
      municipality: "山江村",
      description:
        "盆地特有の寒暖差と肥沃な赤土に恵まれた山江村で育つ極上の和栗。甘く大粒な実が詰まった栗として知られ、1977年（昭和52年）には昭和天皇に献上され全国的な注目を集めた歴史を持つ。",
      sourceUrl: "https://yamaeguri.jimdofree.com/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "konoshiro",
      name: "コノシロ",
      municipality: "沿岸部（八代海・天草灘・有明海）",
      description:
        "成長により呼び名が変わる出世魚で、幼魚はシンコ、コハダを経てコノシロと呼ばれる。背開きにして酢締めにし、すし飯を詰めた「姿寿司」は正月や祝い事に欠かせない江戸時代から続く郷土料理。",
      sourceUrl:
        "https://www.maff.go.jp/j/keikaku/syokubunka/k_ryouri/search_menu/menu/kono_shirono_sugata_zushi_kumamoto.html",
      accessedAt: "2026-07-18",
    },
  ],
};
