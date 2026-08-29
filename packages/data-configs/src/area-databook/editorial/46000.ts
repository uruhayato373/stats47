/**
 * 鹿児島県 (46000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 九州・沖縄エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const KAGOSHIMA_EDITORIAL: AreaEditorial = {
  areaCode: "46000",
  symbols: {
    tree: "カイコウズ・クスノキ",
    flower: "ミヤマキリシマ",
    bird: "ルリカケス",
    song: "鹿児島県民の歌",
    sourceUrl: "https://www.pref.kagoshima.jp/pr/gaiyou/symbol/index.html",
    accessedAt: "2026-08-29",
  },
  specialties: [
    {
      slug: "daimasaki",
      name: "大将季",
      municipality: "南さつま市ほか",
      description:
        "不知火から選抜されたオリジナル品種で、平成18年に登録された柑橘。糖度が高く皮がむきやすいうえ種が少なく、果皮・果肉の色が濃いのが特徴で、12月から3月にかけて出荷される。",
      sourceUrl: "https://www.karen-ja.or.jp/agri/daimasaki/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "soramame",
      name: "ソラマメ",
      municipality: "指宿市・出水市ほか",
      description:
        "生産量日本一を誇る鹿児島県の代表的な野菜。指宿地区と出水地区が主産地で、大粒で甘みが強く、12月から5月まで他県に例のない長期間にわたり出荷が続く。",
      sourceUrl: "https://www.karen-ja.or.jp/agri/soramame/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "unagi",
      name: "ウナギ",
      municipality: "大隅地区ほか",
      description:
        "養殖うなぎの生産量で全国の4割強を占める日本一の産地。シラス台地でろ過された良質な地下水と一年を通じて安定した温暖な気候を生かし、志布志市や大崎町など大隅地区で盛んに養殖される。",
      sourceUrl: "https://unagisato.jp/blogs/sato-diary/kagoshima-the-land-of-eels",
      accessedAt: "2026-07-18",
    },
    {
      slug: "mango",
      name: "マンゴー",
      municipality: "県内広域",
      description:
        "生産量・栽培面積ともに全国3位。本土や種子島・屋久島では加温栽培、奄美群島では無加温栽培と地域で方式を使い分け、濃厚な食味と美しい外観が高く評価され4月から8月に出荷される。",
      sourceUrl: "https://www.karen-ja.or.jp/agri/mango/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "rakkyo",
      name: "ラッキョウ",
      municipality: "南さつま市ほか",
      description:
        "吹上浜沿岸を中心とする南薩・北薩地域が主産地で、国内生産量の約3分の1を占める日本一の産地。独特の香味とカリカリとした食感が特徴で、4月から6月にかけて出荷される。",
      sourceUrl: "https://www.karen-ja.or.jp/agri/rakkyou/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "okra",
      name: "オクラ",
      municipality: "指宿市ほか",
      description:
        "生産量全国1位を誇り、指宿地区が主産地。濃緑で肉厚な莢は独特の食感とねばりが強く、温暖な気候を生かしハウス栽培から露地栽培へと切り替えながら4月から10月まで長期出荷される。",
      sourceUrl: "https://www.karen-ja.or.jp/agri/okura/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tobiuo",
      name: "トビウオ",
      municipality: "屋久島・種子島ほか",
      description:
        "漁獲量が全国1位で、年間約1,500トンにのぼる。屋久島や種子島では「トッピー」と呼ばれ、昭和30年頃に考案されたロープ曳き漁で水揚げされた大型のものは刺身にすると弾力のある歯ごたえが楽しめる。",
      sourceUrl: "http://kagoshima-sakana.com/kagoshima-sakana/details/interview/80-08/151-001.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "passion-fruit",
      name: "パッションフルーツ",
      municipality: "大島地域ほか",
      description:
        "生産量・栽培面積ともに全国1位。本土は加温栽培、奄美・種子島や屋久島は無加温栽培で育てられ、収穫後に果皮がしわしわになるほど酸味が和らぎ甘みが際立つ、6月から8月が旬の果実。",
      sourceUrl: "https://www.karen-ja.or.jp/agri/passion-fruit/",
      accessedAt: "2026-07-18",
    },
    {
      slug: "kokuto",
      name: "黒糖",
      municipality: "奄美大島",
      description:
        "江戸時代初期の1600年代に製法が伝わり奄美大島で製造が始まった伝統食品。サトウキビの搾り汁をそのまま煮詰めて作られ、糖分に加えカルシウムや鉄分などのミネラルを豊富に含む。",
      sourceUrl: "https://www.maff.go.jp/j/keikaku/syokubunka/traditional-foods/menu/kokutou.html",
      accessedAt: "2026-07-18",
    },
  ],
};
