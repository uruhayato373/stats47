/**
 * 宮城県 (04000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 北海道・東北エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const MIYAGI_EDITORIAL: AreaEditorial = {
  areaCode: "04000",
  symbols: {
    tree: "ケヤキ",
    flower: "ミヤギノハギ",
    bird: "ガン",
    song: "輝く郷土（県民歌）",
    sourceUrl: "https://www.pref.miyagi.jp/site/profile/symbolj.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "sanma",
      name: "サンマ",
      municipality: "女川町・気仙沼市",
      description:
        "女川魚市場の水揚げ魚種の4分の1を占める看板の魚。三陸沖の好漁場に恵まれ、女川と気仙沼はともに全国有数のサンマ水揚げ港として知られる。",
      sourceUrl: "http://www.sankumi.com/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "mabo-ya",
      name: "マボヤ",
      municipality: "石巻市・女川町・南三陸町・気仙沼市",
      description:
        "三陸沿岸で盛んな養殖ホヤ。青森・岩手産の種苗をロープに付けて海に垂らし、3〜4年かけてじっくり育て夏に水揚げする。海のパイナップルとも呼ばれる珍味。",
      sourceUrl: "https://www.pride-fish.jp/JPF/pref/detail.php?pk=1433903024",
      accessedAt: "2026-07-18",
    },
    {
      slug: "paprika",
      name: "パプリカ",
      municipality: "栗原市・登米市ほか",
      description:
        "2006年に栗原市で始まった大規模ハウス栽培が発祥で、宮城県は国内パプリカ生産量トップクラス。大手工場の排熱を利用した施設園芸により、冬でも安定した出荷を実現している。",
      sourceUrl: "https://www.vegi.co.jp/farm/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "sendai-hakusai",
      name: "仙台白菜",
      municipality: "加美町・岩沼市ほか",
      description:
        "日清戦争後に持ち帰られた種を元に大正時代、松島湾の島で栽培・採種が成功し「松島白菜」として全国に広まった、現在の結球白菜の原型の一つ。やわらかく甘みがある。",
      sourceUrl: "https://yasacolle.jp/dentou/traditional-vegetables-miyagi-sendai-cabbage",
      accessedAt: "2026-07-18",
    },
    {
      slug: "sendai-magari-negi",
      name: "仙台曲がりねぎ",
      municipality: "仙台市・大和町ほか",
      description:
        "地下水位が高く根腐れしやすい仙台の土壌で明治〜大正期に生まれた「やとい」栽培法により誕生。斜めに植え直したねぎが上へ伸びようとして曲がり、やわらかく甘みが増す。",
      sourceUrl: "https://toretate-sendai.com/?p=3622",
      accessedAt: "2026-07-18",
    },
    {
      slug: "seri",
      name: "セリ",
      municipality: "名取市・石巻市",
      description:
        "宮城の在来野菜で生産量は全国トップクラス。冬に旬を迎える香り高い葉物で、根まで食べる「せり鍋」は宮城を代表する郷土料理として親しまれている。",
      sourceUrl: "https://www.hyponex.co.jp/yasai_daijiten/column/column-8870",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tsurumurasaki",
      name: "ツルムラサキ",
      municipality: "蔵王町・角田市・柴田町ほか",
      description:
        "東南アジア原産の栄養豊富な夏野菜で、1972年頃に蔵王町で栽培が始まった。つるを伸ばして育ち、ぬめりのある葉と茎はおひたしや炒め物で食べられる。",
      sourceUrl: "https://www.pref.miyagi.jp/site/nh-khsgsin-e/nousanbutsu.html",
      accessedAt: "2026-07-18",
    },
  ],
};
