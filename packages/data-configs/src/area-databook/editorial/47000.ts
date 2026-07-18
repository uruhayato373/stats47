/**
 * 沖縄県 (47000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 九州・沖縄エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const OKINAWA_EDITORIAL: AreaEditorial = {
  areaCode: "47000",
  symbols: {
    tree: "リュウキュウマツ",
    flower: "デイゴ",
    bird: "ノグチゲラ",
    fish: "タカサゴ（グルクン）",
    song: "沖縄県民の歌",
    sourceUrl: "https://www.pref.okinawa.lg.jp/kensei/kengaiyo/1014098.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "star-fruit",
      name: "スターフルーツ（美ら星）",
      municipality: "南風原町",
      description:
        "ゴレンシとも呼ばれる熱帯果実。町が育成したブランド品種「美ら星」は皮が薄く星形の断面が特徴で、甘みが強く食べやすいとして商標登録されている沖縄ならではの果物。",
      sourceUrl: "https://www.town.haebaru.lg.jp/site/kankou/2362.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shima-rakkyou",
      name: "島らっきょう",
      municipality: "伊江村",
      description:
        "沖縄在来のラッキョウで、伊江村が主産地。一般的なラッキョウより小ぶりで香りと辛みが強く、若採りされたものが塩漬けや天ぷらで居酒屋の定番として親しまれている。",
      sourceUrl: "https://www.ja-okinawa.or.jp/agriculture/detail.php?id=1127",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shibui",
      name: "シブイ",
      municipality: "宮古島市",
      description:
        "冬瓜の沖縄での呼び名で、宮古島市や伊江村が主産地。水分が多く低カロリーな夏野菜として、汁物や炒め物など沖縄の家庭料理に幅広く使われている代表的な島野菜。",
      sourceUrl: "https://www.ja-okinawa.or.jp/agriculture/detail.php?id=932",
      accessedAt: "2026-07-18",
    },
    {
      slug: "papaya",
      name: "パパイヤ（石垣珊瑚）",
      municipality: "石垣島",
      description:
        "石垣島で育成された種なし新品種「石垣珊瑚」が知られ、糖度13.8%前後と甘みが強い。未熟果は炒め物などの野菜として、熟果は果物として食される二面性を持つ島の果実。",
      sourceUrl: "https://foodslink.jp/syokuzaihyakka/syun/fruit/papaya-Ishigaki.htm",
      accessedAt: "2026-07-18",
    },
    {
      slug: "acerola",
      name: "アセロラ",
      municipality: "本部町",
      description:
        "紫外線の強い沖縄の気候を生かし本部町で露地栽培される。ビタミンCが豊富とされ、着色料を使わず栽培する県指定拠点産地として、シークヮーサーと並ぶ県産果実の一つに数えられる。",
      sourceUrl: "https://www.okinawaclip.com/post/motobu-acerola-fresh/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "handama",
      name: "ハンダマ",
      municipality: "八重瀬町",
      description:
        "葉の裏が紫色をした島野菜で、石川県などでは金時草と呼ばれる同種。八重瀬町や宜野座村が主産地で、鉄分やポリフェノールを含む健康野菜としておひたしや天ぷらに利用される。",
      sourceUrl: "https://kuwachii-okinawa.com/agricultural/2506/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "fuuchibaa",
      name: "フーチバー",
      municipality: "八重瀬町",
      description:
        "ニシヨモギとも呼ばれる島野菜で、本州のヨモギより苦みが穏やか。八重瀬町周辺で栽培され、山羊汁や炊き込みご飯、雑炊の香りづけに用いられる沖縄食文化に欠かせない薬味。",
      sourceUrl: "https://kuwachii-okinawa.com/agricultural/2510/",
      accessedAt: "2026-07-18",
    },
  ],
};
