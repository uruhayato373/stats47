/**
 * 島根県 (32000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 中国エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const SHIMANE_EDITORIAL: AreaEditorial = {
  areaCode: "32000",
  symbols: {
    tree: "クロマツ",
    flower: "ボタン",
    bird: "ハクチョウ",
    fish: "トビウオ",
    song: "薄紫の山脈（県民歌）",
    sourceUrl: "https://www.pref.shimane.lg.jp/admin/seisaku/koho/kodomo/profile.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "nita-mai",
      name: "仁多米",
      municipality: "奥出雲町",
      description:
        "たたら製鉄で砂鉄を採取した跡地を活用した棚田で育つブランド米。中国山地の雪解け水とミネラル分、昼夜の寒暖差が甘みと粘りを育み、米の食味分析鑑定コンクールで金賞を重ねてきた実力派。",
      sourceUrl: "https://www.nitamai.com/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "izumo-orochi-daikon",
      name: "出雲おろち大根",
      municipality: "奥出雲町、出雲市、雲南市、松江市ほか",
      description:
        "斐伊川流域に自生するハマダイコンを島根大学が2004年から品種改良し、2011年に登録品種「スサノオ」として誕生した辛味大根。ひげ根が広がる姿がヤマタノオロチを連想させることが名の由来。",
      sourceUrl: "https://www.shimane-u.ac.jp/docs/2021072600026/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "uppurui-nori",
      name: "十六島海苔",
      municipality: "出雲市",
      description:
        "出雲市十六島町の限られた岩場でのみ12月から2月に手摘みされる天然岩海苔。出雲国風土記にも記録が残り、奈良・平安の朝廷や江戸の将軍への献上品として珍重された、生産量年間1t未満の希少品。",
      sourceUrl: "https://www.maff.go.jp/j/keikaku/syokubunka/traditional-foods/menu/uruppui_nori.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "donchicchi-sangyo",
      name: "どんちっち三魚",
      municipality: "浜田市",
      description:
        "石見神楽の囃子を表す言葉「どんちっち」を冠した、浜田漁港水揚げのアジ・ノドグロ・カレイのブランド総称。脂質量やサイズなど厳格な基準を満たした個体だけがこの名で市場に出荷される。",
      sourceUrl: "https://www.city.hamada.shimane.jp/www/contents/1001000003192/index.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tsuwano-guri",
      name: "つわの栗",
      municipality: "津和野町",
      description:
        "津和野町で育つ栗のブランド名で、県内栗生産の大部分を占める。全国のパティシエやシェフの間でも品質の高さが知られ、収穫期には町内で栗まつりや栗拾い体験が開かれ観光資源にもなっている。",
      sourceUrl: "https://www.town.tsuwano.lg.jp/www/contents/1701138238898/index.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hiougi-gai",
      name: "ヒオウギ貝",
      municipality: "隠岐の島町",
      description:
        "隠岐諸島で養殖される二枚貝で、貝殻が赤・橙・紫など色とりどりに発色するのが特徴。ホタテの仲間で身は小ぶりだが甘みが強く、新鮮なものは刺身でも食べられる隠岐の海の贈り物。",
      sourceUrl: "https://www.e-oki.net/experience/7690/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "ita-wakame",
      name: "板わかめ",
      municipality: "県内沿岸部",
      description:
        "島根の海で採れたワカメを板状に薄く伸ばして乾燥させた特産加工品。「めのは」とも呼ばれ、あぶって手でもみ、温かいご飯にかけたり手巻きずしの海苔代わりに使う。",
      sourceUrl:
        "https://www.pref.shimane.lg.jp/admin/seisaku/koho/esque/2020/shimanesque115_2/8.html",
      accessedAt: "2026-09-14",
    },
    {
      slug: "shussai-shoga",
      name: "出西しょうが",
      municipality: "出雲市（斐川町出西地区）",
      description:
        "出雲市斐川町の出西地区でのみ栽培される希少なしょうが。約400年の栽培の歴史を持ち繊維が少なく柔らかで、江戸期には大名への献上品としても重宝された。",
      sourceUrl: "https://www.kankou-shimane.com/destination/21214",
      accessedAt: "2026-09-14",
    },
  ],
};
