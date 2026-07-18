/**
 * 鳥取県 (31000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 中国エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const TOTTORI_EDITORIAL: AreaEditorial = {
  areaCode: "31000",
  symbols: {
    tree: "ダイセンキャラボク",
    flower: "二十世紀梨の花",
    bird: "オシドリ",
    fish: "ヒラメ",
    song: "わきあがる力（県民歌）",
    sourceUrl: "https://www.pref.tottori.lg.jp/271852.htm",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "princess-kaori",
      name: "プリンセスかおり",
      municipality: "県内広域",
      description:
        "鳥取県農業試験場が10年かけて開発した香り米で、2017年に品種登録。高級香り米バスマティ譲りのポップコーンのような香りと、コシヒカリ譲りの粘りを兼ね備え、カレー専用米として売り出されている。",
      sourceUrl: "https://www.pref.tottori.lg.jp/271852.htm",
      accessedAt: "2026-07-18",
    },
    {
      slug: "itsukiboshi",
      name: "五輝星（特選とっとり松葉がに）",
      municipality: "沿岸部（境港・賀露・網代・田後ほか）",
      description:
        "鳥取県産松葉ガニの最高級ブランドで、甲幅13.5cm以上・重さ1.2kg以上など5つの厳格な基準を満たしたものだけに与えられる。県内5漁港の目利き人が選定し、水揚げ全体の0.1%未満という希少なオスガニ。",
      sourceUrl: "https://www.pref.tottori.lg.jp/251719.htm",
      accessedAt: "2026-07-18",
    },
    {
      slug: "natsuki",
      name: "夏輝（天然岩ガキ）",
      municipality: "沿岸部（境港・網代港・賀露港ほか）",
      description:
        "山陰海岸で獲れる天然の岩ガキで、平成17年に命名。大山をはじめ中国山地から注ぐ栄養豊かな水を受けて育ち、産卵前で身が最も大きくなる6～8月が旬。大きな殻からは想像できない濃厚な味わいが特徴。",
      sourceUrl: "https://www.pride-fish.jp/JPF/pref/detail.php?pk=1409129433",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tottori-takeoh",
      name: "鳥取茸王",
      municipality: "県内山間部",
      description:
        "一般財団法人日本きのこセンターが開発した原木栽培シイタケのブランド。菌興115号の種菌を用いた生シイタケ「とっとり115」のうち、傘径・厚さの規格を満たした最高級品だけが鳥取茸王を名乗ることができる。",
      sourceUrl: "https://nishiinaba.jp/pages/49?detail=1&b_id=198&r_id=169",
      accessedAt: "2026-07-18",
    },
    {
      slug: "aka-garei",
      name: "アカガレイ",
      municipality: "境漁港・鳥取港・網代漁港",
      description:
        "地元では「マガレイ」とも呼ばれる冷水性のカレイで、底引き網で多く漁獲される。腹側が赤みを帯びることが名前の由来。鳥取では冬の家庭料理として親しまれ、卵を持ったメスは特に高値で取引される。",
      sourceUrl: "https://www.pride-fish.jp/JPF/pref/detail.php?pk=1417055606",
      accessedAt: "2026-07-18",
    },
    {
      slug: "babachan",
      name: "ばばちゃん（タナカゲンゲ）",
      municipality: "岩美町ほか（境港・賀露・網代の底引き網漁）",
      description:
        "松葉ガニの底引き網に一緒にかかる深海魚タナカゲンゲの鳥取県での呼び名。見た目の悪さから敬遠されていたが、淡白でクセのない白身が鍋や唐揚げに合うと分かり、今では岩美町の冬の名物として定着した。",
      sourceUrl: "https://mokuyouichi.com/sakana/sota/baba.htm",
      accessedAt: "2026-07-18",
    },
    {
      slug: "hanagosho-kaki",
      name: "花御所柿",
      municipality: "八頭町ほか（因幡地方）",
      description:
        "江戸時代に八頭町花の住人が大和国から持ち帰った御所柿を接ぎ木したのが起源とされる完全甘柿。因幡地方でしか栽培されない希少品種で、「日本一甘い柿」とも呼ばれ、11月下旬から12月上旬に出荷される。",
      sourceUrl: "https://yazukanko.jp/about/products/koogehanagosyo/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "daisen-broccoli",
      name: "大山ブロッコリー",
      municipality: "大山町ほか",
      description:
        "大山山麓の黒ぼく土壌で栽培されるブロッコリーで、葉と茎が付いたままの状態で日本で最初に販売されたブランド。栄養価が高く色鮮やかな野菜として、県内でも旬の時期は1～6月・10～12月に出荷される。",
      sourceUrl: "https://www.ja-tottorichuou.or.jp/tokusan/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "gokujitsu-suika",
      name: "極実すいか",
      municipality: "倉吉市ほか",
      description:
        "スイカ本来の味を追求して育てられたブランドすいかで、皮が薄くシャリ感とソフトな食感をあわせ持つのが特徴。大玉で皮際まで甘く、県内では6月から10月にかけて出荷されるさわやかな夏の味覚。",
      sourceUrl: "https://www.ja-tottorichuou.or.jp/tokusan/",
      accessedAt: "2026-07-18",
    },
  ],
};
