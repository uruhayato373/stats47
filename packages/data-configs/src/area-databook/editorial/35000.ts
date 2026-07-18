/**
 * 山口県 (35000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 中国エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const YAMAGUCHI_EDITORIAL: AreaEditorial = {
  areaCode: "35000",
  symbols: {
    tree: "アカマツ",
    flower: "夏みかんの花",
    bird: "ナベヅル",
    song: "山口県民の歌",
    sourceUrl: "https://www.pref.yamaguchi.lg.jp/soshiki/21/13717.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "iwakuni-renkon",
      name: "岩国れんこん",
      municipality: "岩国市",
      description:
        "約200年前に備中種の種バスが持ち込まれたのが起源とされる岩国市の特産品。一般的なれんこんは穴が8つだが、岩国産は9つあり、岩国藩主吉川家の家紋の形と一致することから殿様に喜ばれたと伝わる。",
      sourceUrl: "https://www.hironaka-f.co.jp/renkon/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "yamaguchi-no-amadai",
      name: "やまぐちのあまだい",
      municipality: "萩市見島沖ほか北浦地区",
      description:
        "延縄漁業または釣り漁業で漁獲され、1尾ずつ丁寧に締めて鮮度を保つ高級魚。ブランド認定基準は500g以上で、上品な甘みを堪能できる刺身が特におすすめとされる。",
      sourceUrl: "https://www.buchiuma-y.net/know/brand/s_amadai.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "sezuki-aji",
      name: "瀬つきあじ",
      municipality: "下関市沖～萩市沖",
      description:
        "回遊せず天然礁に定着して育つあじで、脂質10%以上のものだけがブランド認定される。やや黄色みを帯びた体色からキアジとも呼ばれ、脂がのってふっくらとした味わいが持ち味。",
      sourceUrl: "https://www.buchiuma-y.net/know/brand/s_aji.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "yamaguchi-kijihata",
      name: "山口県産きじはた",
      municipality: "萩市・長門市・下関市・周南市ほか県内沿岸",
      description:
        "一本釣り・延縄・建網で漁獲される全国的にも水揚げの少ない高級魚。冬のふぐに例えられるほど歯ごたえがあり、旨みが強く癖のない上品な白身が特徴で、全長30cm以上がブランド認定基準。",
      sourceUrl: "https://www.buchiuma-y.net/know/brand/s_kiji.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hagi-tamage-nasu",
      name: "萩たまげなす",
      municipality: "長門市田屋地区・萩市",
      description:
        "山口の方言「たまげる（驚く）」に由来する巨大ナスで、普通のナスの3～4倍のサイズに育つ。アク成分が少なく加熱するととろりとした食感と強い甘みが出るのが特長で、果重500g以上が出荷規格。",
      sourceUrl: "https://www.buchiuma-y.net/know/brand/n_tamage.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "mito-gobou",
      name: "美東ごぼう",
      municipality: "美祢市美東町赤郷地区",
      description:
        "秋吉台カルスト台地の石灰岩が長い年月をかけて溶け出し酸化してできた赤土で育つごぼう。柔らかいのに歯ごたえがあり、風味と香りの良さで知られ、地元ではごぼう尽くしの定食も人気を集める。",
      sourceUrl: "https://karusuto.com/journal/%E7%BE%8E%E6%9D%B1%E3%81%94%E3%81%BC%E3%81%86%E3%81%AE%E3%82%B7%E3%83%BC%E3%82%BA%E3%83%B3%E3%81%8C%E3%82%84%E3%81%A3%E3%81%A6%E3%81%BE%E3%81%84%E3%82%8A%E3%81%BE%E3%81%97%E3%81%9F%EF%BC%81/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "choshu-kuro-kashiwa",
      name: "長州黒かしわ",
      municipality: "深川養鶏（長門市）",
      description:
        "天然記念物の黒柏鶏と在来種を交配し在来種血液百分率75%以上で作出される地鶏。80日以上飼育し28日目以降は平飼いとする低密度飼育で育てられ、噛むほどに味の出るジューシーな肉質を持つ。",
      sourceUrl: "https://www.buchiuma-y.net/know/brand/c_kashiwa.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "yume-hoppe",
      name: "ゆめほっぺ",
      municipality: "周防大島町ほか県内6JA",
      description:
        "山口県オリジナル品種「せとみ」から生まれた柑橘で、温州みかんの倍近い180～200gの果実が特徴。非破壊センサーで糖度13.5度以上・酸度1.35%以内を全量検査してから出荷される、甘くはじける食感の柑橘。",
      sourceUrl: "https://www.buchiuma-y.net/know/brand/n_yume.html",
      accessedAt: "2026-07-18",
    },
  ],
};
