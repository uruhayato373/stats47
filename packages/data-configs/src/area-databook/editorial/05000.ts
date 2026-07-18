/**
 * 秋田県 (05000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 北海道・東北エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const AKITA_EDITORIAL: AreaEditorial = {
  areaCode: "05000",
  symbols: {
    tree: "秋田杉",
    flower: "フキノトウ",
    bird: "ヤマドリ",
    fish: "ハタハタ",
    song: "秋田県民歌・県民の歌",
    sourceUrl: "https://www.pref.akita.lg.jp/pages/archive/25804",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "tonburi",
      name: "とんぶり",
      municipality: "大館市",
      description:
        "ホウキギの実を茹でて乾燥・脱皮した加工品で「畑のキャビア」とも呼ばれる。加工の難しさから生産地は大館市に限られ、地理的表示（GI）にも登録された全国唯一の特産品。",
      sourceUrl: "https://www.city.odate.lg.jp/city/soshiki/hinaishinkou/p970",
      accessedAt: "2026-07-18",
    },
    {
      slug: "mitsuseki-seri",
      name: "三関せり",
      municipality: "湯沢市",
      description:
        "湯沢市三関地区で約300年育まれてきた伝統野菜。白く長く伸びた根まで食べられるのが特徴で、きりたんぽ鍋の具材として根ごと用いられ、東京の百貨店にも並ぶ高品質ぶりで知られる。",
      sourceUrl: "https://www.city-yuzawa.jp/site/yuzawatrip/1960.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "karatori-imo",
      name: "からとり芋",
      municipality: "由利本荘市・にかほ市",
      description:
        "葉柄と親芋の両方を食用にするサトイモの一種。乾燥に弱いため水苗代で栽培され、葉柄は乾燥させて保存食にする知恵が息づく、由利地域に伝わる伝統野菜。",
      sourceUrl: "https://www.city.yurihonjo.lg.jp/1002187/1005494/1005510/1007276.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shobonai-takenoko",
      name: "生保内たけのこ",
      municipality: "仙北市",
      description:
        "駒ヶ岳山麓に自生する根曲がり竹（チシマザサ）の若芽。仙北市生保内地区の山中で春から初夏にかけて採れ、みそ汁や煮物で楽しむ、東北の山の恵みを代表する山菜の一つ。",
      sourceUrl: "https://www.a-iju.jp/c-akita/senbokucity",
      accessedAt: "2026-07-18",
    },
    {
      slug: "chorogi",
      name: "チョロギ",
      municipality: "湯沢市",
      description:
        "中国原産のシソ科の宿根草で、湯沢市皆瀬地区で農家所得向上策として作付けが受け継がれてきた。梅酢に漬けた赤い実はコリコリとした歯応えがあり、おせち料理の黒豆に添える縁起物として親しまれる。",
      sourceUrl: "https://www.e-komachi.jp/notebook/yuzawa-ogachi/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "makodai",
      name: "真鯛",
      municipality: "男鹿市",
      description:
        "産卵のため5〜6月ごろに男鹿沖を回遊する天然の真鯛。日本海側でありながら好漁場に恵まれ、旬を祝う「男鹿の鯛まつり」が毎年開催されるなど、地域の食文化に根付いた海の幸。",
      sourceUrl: "https://oganavi.com/tai/",
      accessedAt: "2026-07-18",
    },
  ],
};
