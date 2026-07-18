/**
 * 石川県 (17000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 北陸・甲信越エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const ISHIKAWA_EDITORIAL: AreaEditorial = {
  areaCode: "17000",
  symbols: {
    tree: "アテ",
    flower: "クロユリ",
    bird: "イヌワシ",
    song: "石川県民の歌",
    sourceUrl: "https://www.pref.ishikawa.lg.jp/",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "notoyasai-notetemari",
      name: "のとてまり",
      municipality: "輪島市、能登町、穴水町、珠洲市",
      description:
        "奥能登で栽培される原木しいたけの最高級ブランドで「山のアワビ」とも呼ばれる。傘8cm以上・肉厚3cm以上という厳しい規格を満たしたものだけが名乗れ、噛むほどに香りと旨味が広がる。",
      sourceUrl: "https://ishikawafood.com/foods/222/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "noto-dainagon-azuki",
      name: "能登大納言小豆",
      municipality: "穴水町、能登町、輪島市、珠洲市",
      description:
        "世界農業遺産に認定された能登の里山里海で古くから受け継がれる在来種の小豆。普通の小豆の2〜3倍という粒の大きさと、宝石のように鮮やかな赤色が特徴で、高級和菓子の材料として重宝される。",
      sourceUrl: "https://www.zennoh.or.jp/press/release/2025/105561.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ishimozuku",
      name: "イシモズク",
      municipality: "輪島市、志賀町ほか",
      description:
        "能登の海岸で夏に石などに付着して育つ海藻で、一般的なもずくより太く強い粘り気を持つ。シャキシャキとした独特の食感が特徴で、酢の物や味噌汁の具として地元で親しまれている。",
      sourceUrl: "https://www.noto-yasai.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "noto-torigai",
      name: "能登とり貝",
      municipality: "七尾市、穴水町",
      description:
        "石川県水産総合センターが5年をかけ稚貝の供給・育成技術を開発し、平成27年度から本格出荷を始めた養殖トリガイのブランド。身が大きく肉厚で上品な甘みがあり、春から初夏に旬を迎える。",
      sourceUrl: "https://ishikawafood.com/foods/152/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kinshiuri",
      name: "金糸瓜",
      municipality: "中能登町、七尾市",
      description:
        "見た目はカボチャだが実はペポカボチャの一種で「そうめんかぼちゃ」とも呼ばれる。輪切りにして茹でると果肉が金色の糸状にほぐれ、シャキシャキした食感を活かして酢の物などに使われる。",
      sourceUrl: "https://www.noto-yasai.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kaga-futokyuri",
      name: "加賀太きゅうり",
      municipality: "金沢市、かほく市",
      description:
        "加賀野菜の一つで、1果重が600gにもなる白いぼの大型きゅうり。昭和初期に金沢市街地で栽培が始まり地元品種と交雑を重ねて誕生した。果肉が厚くやわらかく日持ちが良いため煮物のあんかけにも向く。",
      sourceUrl: "https://kanazawa-kagayasai.com/knowledge/cucumber/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kinjiso",
      name: "金時草",
      municipality: "白山市、金沢市、かほく市",
      description:
        "和名スイゼンジナ、葉裏が金時芋のような鮮やかな赤紫色をしていることが名前の由来。金沢が全国有数の産地で、大正時代に導入され山間地の花園地区を中心に育てられてきた。茹でるとぬめりが出る独特の風味を持つ。",
      sourceUrl: "https://kanazawa-kagayasai.com/knowledge/kinjiso/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "sengokumame",
      name: "千石豆",
      municipality: "小松市、金沢市",
      description:
        "加賀野菜に認定されているフジマメ科の豆で、金沢では「つるまめ」とも呼ばれる。さやの長さは6〜7cmほどで、加賀太きゅうりや金時草と並ぶ地元伝統野菜として夏場に食卓へ上る。",
      sourceUrl: "https://kanazawa-kagayasai.com/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kaga-maruimo",
      name: "加賀丸いも",
      municipality: "小松市、能美市",
      description:
        "手取川扇状地で育つ黒皮種のやまいもで、ソフトボールのような丸い形が特徴。粘りの強さは長芋の約3倍とされ、すりおろすと20〜30cmも伸びる。昭和9年の手取川洪水で流入した砂質土壌が栽培に適した環境を生んだ。",
      sourceUrl: "https://ishikawafood.com/foods/233/",
      accessedAt: "2026-07-18",
    },
  ],
};
