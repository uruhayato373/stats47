/**
 * 群馬県 (10000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 関東エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const GUNMA_EDITORIAL: AreaEditorial = {
  areaCode: "10000",
  symbols: {
    tree: "クロマツ",
    flower: "レンゲツツジ",
    bird: "ヤマドリ",
    fish: "アユ",
    song: "群馬県の歌",
    sourceUrl: "https://www.pref.gunma.jp/site/gunma-gaiyo/136052.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "ginhikari",
      name: "ギンヒカリ",
      municipality: "県内広域",
      description:
        "群馬県水産試験場が10年以上かけて選抜育種した体重1kg以上の大型ニジマスで、平成14年に商標登録された県のブランド魚。脂質が少なくさっぱりした味わいで、刺身にも向く高級食材として知られる。",
      sourceUrl: "https://www.pref.gunma.jp/page/207543.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tsumagoi-highland-cabbage",
      name: "嬬恋高原キャベツ",
      municipality: "嬬恋村、昭和村、長野原町",
      description:
        "標高800〜1,400mの高冷地で栽培される夏秋キャベツで、全国総出荷量の約半分を占める一大産地。昼夜の寒暖差と冷涼な気候により、葉が締まり甘みの強いキャベツに育つ。",
      sourceUrl: "https://jatsumagoi.jp/agriinfo_about.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "mura-bijin",
      name: "邑美人",
      municipality: "邑楽町、館林市",
      description:
        "JA邑楽館林が育成・出荷するブランド白菜。赤城山から吹き下ろす「赤城おろし」の寒風にさらされることで身が締まり、糖度が増して甘みの強い白菜に仕上がる。",
      sourceUrl: "https://www.tokyo-ja.or.jp/farm/edo/11.php",
      accessedAt: "2026-07-18",
    },
    {
      slug: "moroheiya",
      name: "モロヘイヤ",
      municipality: "太田市、渋川市、前橋市ほか",
      description:
        "群馬県が出荷量全国1位を誇る夏野菜で、なかでも太田市は県内作付面積の約3割を占める主産地。刻むと出る独特の粘りとカルシウム・ビタミンの豊富さから「野菜の王様」とも呼ばれる。",
      sourceUrl: "https://www.city.ota.gunma.jp/page/4591.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "gunma-nasu",
      name: "ナス",
      municipality: "県内広域",
      description:
        "「ナス紺」と呼ばれる濃い紫色の艶が特徴で、県内各地で長年作られてきた夏野菜。夏の日照時間の長さと寒暖差が色つやの良さを引き出し、漬物から炒め物まで幅広く食卓に上る。",
      sourceUrl: "https://www.city.ota.gunma.jp/page/4591.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "gunma-hourensou",
      name: "ホウレンソウ",
      municipality: "太田市（藪塚地区）ほか県内広域",
      description:
        "露地栽培と雨よけ施設を組み合わせることで年間を通じて出荷される群馬の主力野菜。「上州の空っ風」にさらされる冬どりは葉が肉厚になり、栄養価の高さでも知られる。",
      sourceUrl: "https://www.city.ota.gunma.jp/page/4591.html",
      accessedAt: "2026-07-18",
    },
  ],
};
