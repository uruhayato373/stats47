/**
 * 静岡県 (22000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 中部エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const SHIZUOKA_EDITORIAL: AreaEditorial = {
  areaCode: "22000",
  symbols: {
    tree: "キンモクセイ",
    flower: "ツツジ",
    bird: "サンコウチョウ",
    song: "しずおか賛歌〜富士よ夢よ友よ",
    sourceUrl: "https://www.pref.shizuoka.jp/kensei/information/kengaiyo/1007356.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "crown-melon",
      name: "クラウンメロン",
      municipality: "袋井市ほか",
      description:
        "独自に改良したアールスメロンを温室でじっくり育て、1本の木にたった1玉だけを実らせる最高級マスクメロン。袋井市を中心に磐田市・掛川市・森町で栽培され、厳しい品質基準を満たしたものだけが名乗れる。",
      sourceUrl: "https://www.city.fukuroi.shizuoka.jp/soshiki/syougyou/1/taberu/11029.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "takaashigani",
      name: "タカアシガニ",
      municipality: "沼津市",
      description:
        "駿河湾の深海に生息し、足を伸ばすと3メートル以上にもなる世界最大級のカニ。沼津市戸田地区で漁が盛んで、蒸すことで甘みと旨味が引き立つと大正時代から親しまれてきた郷土の味覚。",
      sourceUrl: "https://www.pref.shizuoka.jp/kensei/information/myshizuoka/1002255/1040934/1011258.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "izu-jikinme",
      name: "伊豆の地きんめ",
      municipality: "伊豆半島（下田市・東伊豆町ほか）",
      description:
        "伊豆周辺の好漁場で日の出とともに漁を始めその日のうちに水揚げする「立縄釣り」の金目鯛。下田港は水揚げ量日本一で、稲取キンメなど地域ブランドが確立し、他産地より高値が付くことも多い。",
      sourceUrl: "https://www.pride-fish.jp/JPF/pref/detail.php?pk=1412901551",
      accessedAt: "2026-07-18",
    },
    {
      slug: "enshunada-tiger-fugu",
      name: "遠州灘天然とらふぐ",
      municipality: "浜松市",
      description:
        "流通するとらふぐの9割が養殖という中、遠州灘は全国屈指の天然とらふぐ漁場。愛知県境から御前崎に至る沿岸で舞阪・新居の漁業者が底はえ縄漁を行い、地域団体商標にも認定された希少な味覚。",
      sourceUrl: "https://fujinokuni.shokunomiyako-shizuoka.pref.shizuoka.jp/buy-food/1954",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kuno-ha-shoga",
      name: "久能葉しょうが",
      municipality: "静岡市",
      description:
        "石垣いちごの産地としても知られる静岡市久能地区の特産品。茎の付け根に鮮やかな紅がのった若採りの葉しょうがで、ハウス施設で促成栽培され3月から8月にかけて出荷される「日本一の早出し」品種。",
      sourceUrl: "https://www.at-s.com/news/article/local/central/870453.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "petit-veil",
      name: "プチヴェール",
      municipality: "磐田市ほか",
      description:
        "ケールと芽キャベツをかけ合わせた世界初の非結球メキャベツ。1990年に磐田市の種苗会社で開発された静岡生まれの野菜で、糖度11〜16度と甘みが強くビタミンCやカロテンを豊富に含む。",
      sourceUrl: "https://www.alic.go.jp/koho/kikaku03_000985.html",
      accessedAt: "2026-07-18",
    },
  ],
};
