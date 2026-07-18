/**
 * 新潟県 (15000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 北陸・甲信越エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const NIIGATA_EDITORIAL: AreaEditorial = {
  areaCode: "15000",
  symbols: {
    tree: "ユキツバキ",
    flower: "チューリップ",
    bird: "トキ",
    fish: "錦鯉",
    song: "新潟県民歌",
    sourceUrl: "https://www.pref.niigata.lg.jp/sec/kouhou/6symbolniigata.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "shiobiki-sake",
      name: "塩引き鮭",
      municipality: "村上市",
      description:
        "村上は平安時代から鮭を朝廷へ献上してきた鮭の町。内臓を抜いて塩をすり込んだ鮭を、日本海からの冷たい季節風にさらして寒風干しにすることで旨味が凝縮し、独特の風味が生まれる大晦日の年取り魚。",
      sourceUrl: "https://www.uoya.co.jp/uoyasake/sakeshiobiki.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "okesa-gaki",
      name: "おけさ柿",
      municipality: "佐渡市",
      description:
        "佐渡の代表産地・羽茂地区で育つ種なし渋柿。渋抜き処理で水溶性の渋成分が変化し甘くとろける食感になる。種がないことから「越後の七不思議」に次ぐ「八珍柿」の別名を持つ新潟を代表する秋の味覚。",
      sourceUrl: "https://ja-niigata.or.jp/food/product/okesa-kaki.php",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kakinomoto",
      name: "かきのもと",
      municipality: "新潟市",
      description:
        "新潟の下越地方で「かきのもと」、中越地方では「おもいのほか」と呼ばれる食用菊。江戸時代から食べられてきた紅紫色の花びらはシャキシャキとした歯ごたえとほろ苦さが特徴で、おひたしや酢の物で楽しむ。",
      sourceUrl: "https://www.pref.niigata.lg.jp/sec/syokuhin/shun10-kakinomoto.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "niigata-chamame",
      name: "新潟茶豆",
      municipality: "新潟市西区ほか県内広域",
      description:
        "新潟市西区小平方が発祥とされる伝統品種の枝豆。薄皮が茶色いことから茶豆と呼ばれ、糖とアミノ酸が最も高まる八分実入りの時期に収穫するため、小ぶりながら独特の芳香と強い甘み・うまみを持つ。",
      sourceUrl: "https://www.pref.niigata.lg.jp/sec/syokuhin/shun08-edamame.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "komeko",
      name: "米粉",
      municipality: "県内広域",
      description:
        "コメの生産量日本一の新潟県が推進する「にいがた発R10プロジェクト」は、小麦粉消費の10%以上を国産米粉に置き換える取り組み。パンや菓子、麺類など幅広い加工食品に使われ食料自給率向上にもつながる。",
      sourceUrl: "https://www.pref.niigata.lg.jp/sec/syokuhin/1356835185542.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "violette-de-sollies",
      name: "ビオレ・ソリエス",
      municipality: "佐渡市（小木地区）",
      description:
        "フランス原産の黒い西洋イチジク。栽培の難しさと収穫量の少なさから「幻の黒いダイヤ」と呼ばれる。佐渡市小木地区の生産者が椿油を使った追熟技術で糖度20度を超える濃厚な甘さに仕上げ、高級店へ出荷する。",
      sourceUrl: "https://minamisadochikushokokai.com/feature/eat/541/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kamoko-kaki",
      name: "加茂湖の牡蠣",
      municipality: "佐渡市",
      description:
        "周囲約17キロの佐渡最大の汽水湖・加茂湖で約100年続くマガキ養殖。大佐渡山地からの真水と日本海の海水が交わる環境が餌となるプランクトンを育み、くせが少なくまろやかな味わいの牡蠣に育つ。",
      sourceUrl: "https://niigata-kankou.or.jp/blog/892",
      accessedAt: "2026-07-18",
    },
    {
      slug: "nanban-ebi",
      name: "南蛮エビ",
      municipality: "佐渡市・新潟市・糸魚川市ほか",
      description:
        "標準和名ホッコクアカエビ。新潟では鮮やかな赤色が赤唐辛子（南蛮）に似ることから南蛮エビと呼ばれる。冬に旬を迎え、佐渡ではエビ籠漁で漁獲され「はねっ娘」のブランド名でも出荷される甘みの強い一品。",
      sourceUrl: "https://www.pride-fish.jp/JPF/pref/detail.php?pk=1416269466",
      accessedAt: "2026-07-18",
    },
  ],
};
