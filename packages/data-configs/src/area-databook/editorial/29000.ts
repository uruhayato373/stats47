/**
 * 奈良県 (29000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 近畿エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const NARA_EDITORIAL: AreaEditorial = {
  areaCode: "29000",
  symbols: {
    tree: "スギ",
    flower: "ナラノヤエザクラ",
    bird: "コマドリ",
    song: "奈良県民の歌",
    sourceUrl: "https://www.pref.nara.lg.jp/",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "kotoka-strawberry",
      name: "古都華（いちご）",
      municipality: "平群町ほか",
      description:
        "奈良県が「いつ食べても美味しいイチゴ」を目指して独自に育成した品種。糖度と酸味がともに高く、濃厚な味わいとフルーティーな香りが特徴で、奈良県内でのみ栽培される希少なブランドいちご。",
      sourceUrl: "https://www.pref.nara.lg.jp/n116/58600.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "yamato-marunasu",
      name: "大和丸なす",
      municipality: "大和郡山市・奈良市ほか",
      description:
        "つやのある紫黒色の果皮とヘタの太いとげが特徴の大和野菜。肉質がよく締まり煮崩れしにくいため、焼いても炊いてもしっかりとした食感が楽しめる。大和郡山市・奈良市で古くから栽培されてきた伝統野菜。",
      sourceUrl: "https://www.pref.nara.lg.jp/n118/8050.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "yamato-mana",
      name: "大和まな",
      municipality: "大和高田市・宇陀市ほか県内広域",
      description:
        "大根葉に似た切れ込みを持つ濃緑色の菜で、肉質が柔らかく甘みに富む大和野菜。かつては油を採るために栽培されたが、現在は煮物・漬物・おひたしとして親しまれ、黄化しにくい改良品種も普及している。",
      sourceUrl: "https://www.pref.nara.lg.jp/n118/8035.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "yamato-touki-ha",
      name: "大和当帰葉",
      municipality: "五條市・宇陀市・吉野町ほか",
      description:
        "セリ科の薬用植物・当帰の葉を利用した大和野菜で、セロリのような爽やかな香りが特徴。根は古くから生薬として用いられ、奈良県は全国有数の当帰産地として栽培から加工・レシピ開発まで振興に力を入れている。",
      sourceUrl: "https://www.pref.nara.lg.jp/yamatotouki/index.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "nanpaku-zuiki",
      name: "軟白ずいき",
      municipality: "奈良市",
      description:
        "奈良市の狭川地区で栽培される赤茎系サトイモの芋茎（ずいき）を、草丈の低いうちに軟白栽培したもの。えぐみが少なく上品な味わいで、高級料亭で和え物などに用いられる希少な伝統野菜。",
      sourceUrl: "https://www.pref.nara.lg.jp/n118/2767.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "uda-kingobo",
      name: "宇陀金ごぼう",
      municipality: "宇陀市ほか宇陀地域",
      description:
        "雲母を多く含む宇陀地域の砂質土壌で育つゴボウ。掘り出すと表面に雲母が付着し金粉をまぶしたように輝いて見えることが名前の由来で、縁起物として正月料理に重宝される大和野菜のひとつ。",
      sourceUrl: "https://www.pref.nara.lg.jp/n118/2767.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hana-myoga",
      name: "花みょうが",
      municipality: "五條市・吉野郡ほか",
      description:
        "五條市や吉野郡で栽培される、ふっくらと大ぶりでしゃきしゃきとした食感の花みょうが。露地栽培の生産量では奈良県が全国有数を誇り、独特の香りを生かして薬味や漬物用の高級食材として扱われる。",
      sourceUrl: "https://www.pref.nara.lg.jp/n118/2767.html",
      accessedAt: "2026-07-18",
    },
  ],
};
