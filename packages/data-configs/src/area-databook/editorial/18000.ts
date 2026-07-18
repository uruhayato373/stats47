/**
 * 福井県 (18000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 北陸・甲信越エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const FUKUI_EDITORIAL: AreaEditorial = {
  areaCode: "18000",
  symbols: {
    tree: "松",
    flower: "水仙",
    bird: "つぐみ",
    fish: "越前がに",
    song: "福井県民歌",
    sourceUrl: "https://www.pref.fukui.lg.jp/doc/brandeigyou/shinfukuikenminka.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "echizen-uni",
      name: "越前うに（塩うに）",
      municipality: "坂井市三国町",
      description:
        "バフンウニの卵巣を塩漬けし熟成させた珍味で、三河のこのわた・肥前のからすみと並ぶ日本三大珍味の一つ。100個のウニから100gしか作れない希少品で、江戸時代の書物では「塩辛中の第一」と評された。",
      sourceUrl: "https://www.maff.go.jp/j/keikaku/syokubunka/traditional-foods/menu/etizensiouni.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "wakasa-garei",
      name: "若狭かれい（一夜干し）",
      municipality: "若狭湾沿岸地域",
      description:
        "若狭湾で水揚げされるヤナギムシガレイを一夜干しにした逸品。塩をして天日に干すことで身が締まり上品な甘みが増し、地元では「甘かれい」とも呼ばれる。1985年から毎年皇室へ献上されている。",
      sourceUrl: "https://www.maff.go.jp/j/keikaku/syokubunka/traditional-foods/menu/wakasagarei_no_itiyabosi.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "wakasa-guji",
      name: "若狭ぐじ",
      municipality: "若狭湾（嶺南地域）",
      description:
        "アカアマダイの福井ブランド名で、鮮やかな朱色の美しい魚体が特徴。500g以上・優れた鮮度・整った姿形を満たしたものだけが認定される。うろこを取らずに焼き上げる「若狭焼き」で古くから京料理に重用されてきた。",
      sourceUrl: "https://www.pref.fukui.lg.jp/doc/suisan/ryutsu/wakasaguji.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kumagawa-kuzu",
      name: "熊川葛",
      municipality: "若狭町熊川",
      description:
        "近江との国境に自生する葛の根から取った良質な葛澱粉を清流でさらし、寒風で天日乾燥させる伝統製法の本葛。江戸時代の儒学者・頼山陽が「熊川は吉野よりよほど上品」と評したほどの質の高さで知られる。",
      sourceUrl: "https://www.town.fukui-wakasa.lg.jp/soshiki/kankoumatizukurika/gyomuannai/1/3/3218.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "katsuyama-mizuna",
      name: "勝山水菜",
      municipality: "勝山市",
      description:
        "江戸末期から栽培される福井の伝統野菜で、水稲刈り取り後に種をまき雪の下で越冬させ、2月から4月に新芽を収穫する。茎が太くナバナに近い品種で、独特の甘みと苦みを持ち加熱するとやわらかくなる。",
      sourceUrl: "https://www.city.katsuyama.fukui.jp/soshiki/13/29719.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kona-wakame",
      name: "粉わかめ（もみわかめ）",
      municipality: "坂井市三国町",
      description:
        "海女が獲った天然ワカメの葉を天日干しし手で揉んでほぐした伝統食品。昭和初期に地元でしか食べられていなかったものを坂井市三国町の業者が商品化し、県内外にファンを広げた郷土の味。",
      sourceUrl: "https://www.city.fukui-sakai.lg.jp/kankou/kanko-bunka/kanko/shoku/momiwakame.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "fukui-ume",
      name: "福井梅（紅映）",
      municipality: "若狭町、小浜市、南越前町",
      description:
        "天保年間に誕生した「紅映」を主力品種とする福井生まれの梅。他品種より種が小さく果肉が厚いうえ酸味のもとになる有機酸が少なく旨み成分が多いため、まろやかな味の梅干しに仕上がる。栽培の75%以上が若狭町に集中する。",
      sourceUrl: "https://www.town.fukui-wakasa.lg.jp/chusankan/particular/1599.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shoryu-maitake",
      name: "昇竜まいたけ（九頭竜まいたけ）",
      municipality: "大野市",
      description:
        "標高1,000mの深山に自生していたマイタケを、大野市泉地区で1988年頃から人工栽培化した特産品。原木の管理から収穫・箱詰めまで手作業で丁寧に育てられ、天然物に匹敵する香りと歯ごたえに仕上げられている。",
      sourceUrl: "https://kuzuryu-maitake.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "koshi-no-risotto",
      name: "越のリゾット",
      municipality: "県内広域",
      description:
        "福井県農業試験場が開発したリゾット・パエリア専用米で、2020年に命名・発売された県産新品種。アミロース含有率が高く粘りが弱いため加熱しても煮崩れせず、ほんのり芯の残るアルデンテ感を保てるのが特長。",
      sourceUrl: "https://www.pref.fukui.lg.jp/doc/021037/shiken-kenkyu/koshinorizotto.html",
      accessedAt: "2026-07-18",
    },
  ],
};
