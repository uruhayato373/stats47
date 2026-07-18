/**
 * 長野県 (20000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 北陸・甲信越エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const NAGANO_EDITORIAL: AreaEditorial = {
  areaCode: "20000",
  symbols: {
    tree: "シラカバ",
    flower: "リンドウ",
    bird: "ライチョウ",
    song: "信濃の国",
    sourceUrl: "https://www.pref.nagano.lg.jp/koho/kids/menu02/nougyo.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "shinano-lip",
      name: "シナノリップ",
      municipality: "県内広域",
      description:
        "長野県果樹試験場が「千秋」と「シナノレッド」を交配し2018年に品種登録した夏りんご。糖度14〜15%と高く、しっかりした果肉に強い甘みと程よい酸味が際立つ。県内でのみ栽培される希少品種。",
      sourceUrl: "https://www.agries-nagano.jp/original_breed/481.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shinshu-hisui-soba",
      name: "信州ひすいそば",
      municipality: "佐久地域ほか県内10地域",
      description:
        "翡翠を思わせる鮮やかな緑色と高い香りが特徴の長野県オリジナル品種「長野S11号」を用いたそば。倒伏しにくく栽培しやすい改良品種で、2013年に県の商標として登録され、産地・加工基準が定められている。",
      sourceUrl: "https://www.pref.nagano.lg.jp/nogi/soba/hisuisoba.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "yakuyou-ninjin",
      name: "薬用人参（信州人蔘）",
      municipality: "佐久市・東御市・上田市ほか東信地方",
      description:
        "1846年に佐久市志賀の神津孝太郎が種子を持ち帰り栽培に成功したオタネニンジン（高麗人参）。水はけがよく涼しい中山間地を好み、6年もの歳月をかけて栽培される。かつては全国シェア7割を占めた東信地方の伝統産業。",
      sourceUrl: "https://chokosha-ninjin.jp/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "reigyoku",
      name: "麗玉（シナノパール）",
      municipality: "北信・長野地域",
      description:
        "長野県果樹試験場が育成し2018年に品種登録した日本すももの新品種「シナノパール」のブランド名。9月下旬に成熟する晩生種で、200g前後の大玉、糖度18〜20%の濃厚な甘さを誇り、県内限定栽培の高級果実として流通する。",
      sourceUrl: "https://www.agries-nagano.jp/original_breed/492.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "nozawana",
      name: "野沢菜",
      municipality: "北信地域など",
      description:
        "1756年、野沢温泉村の健命寺住職が京都遊学の際に大阪・天王寺蕪の種子を持ち帰り境内で栽培したところ、土地の気候風土に合い葉と茎が大きく育ったのが起源とされる。今も同寺の畑が原種の採種地として守られている。",
      sourceUrl: "https://www.nozawana.co.jp/%E9%87%8E%E6%B2%A2%E8%8F%9C%E3%81%AE%E7%94%B1%E6%9D%A5/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "nezumi-daikon",
      name: "ねずみ大根",
      municipality: "坂城町",
      description:
        "下ぶくれの丸い形と尻尾のような細根がネズミを思わせる坂城町特産の辛味大根。強い辛味とまろやかな甘い後味（地元で「あまもっくら」）を併せ持ち、大根の絞り汁を味噌でといた郷土料理「おしぼりうどん」の主役を担う。",
      sourceUrl: "https://www.town.sakaki.nagano.jp/www/contents/1001000000523/index.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "anzu",
      name: "アンズ",
      municipality: "千曲市（森・倉科・更級地区）",
      description:
        "生食用あんずの生産量で全国一を誇る長野県の中でも、千曲市は県内栽培面積・収穫量の約5割を占める最大産地。森地区の花見には例年20万人近くが訪れ、6月下旬から収穫が始まる旬の短い果実として親しまれる。",
      sourceUrl: "https://www.city.chikuma.lg.jp/soshiki/norin/kanko/2/2131.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "otaki-kabu",
      name: "王滝蕪",
      municipality: "王滝村",
      description:
        "約300年前の古文書に尾張藩への年貢として記録が残る木曽の伝統野菜。根は赤紫色で肉質が柔らかく、葉は塩を使わず乳酸発酵させた「すんき漬け」に加工され、みそ汁やそばの具、おやきの具として親しまれる。",
      sourceUrl: "https://www.oishii-shinshu.net/library/heritage/vegetable/10924.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shinshu-salmon",
      name: "信州サーモン",
      municipality: "安曇野市ほか県下各地",
      description:
        "ニジマスとブラウントラウトを掛け合わせた県育成の食用魚で、県内44の養魚場のみで養殖される。良質な肉質と病気への強さを両親から受け継ぎ、卵を持たないため年間を通じて味が安定した赤身が特徴。",
      sourceUrl: "https://www.pref.nagano.lg.jp/nosei/sangyo/nogyo/shinshu/nosanbutsu.html",
      accessedAt: "2026-07-18",
    },
  ],
};
