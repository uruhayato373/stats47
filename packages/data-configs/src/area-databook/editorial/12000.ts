/**
 * 千葉県 (12000) の editorial コンテンツ (特産品・県シンボル)。
 *
 * 規約: `.claude/rules/area-databook-standards.md` §5
 * 出典: 書籍「2021都道府県DataBook 分冊版 関東エリア」(品名・産地の事実抽出のみ、解説文は独自書き起こし)
 */
import type { AreaEditorial } from "../types";

export const CHIBA_EDITORIAL: AreaEditorial = {
  areaCode: "12000",
  symbols: {
    tree: "マキ",
    flower: "菜の花",
    bird: "ホオジロ",
    fish: "タイ",
    song: "千葉県民歌",
    sourceUrl: "https://www.pref.chiba.lg.jp/kkbunka/b-shigen/500sen/tokusan.html",
    accessedAt: "2026-07-18",
  },
  specialties: [
    {
      slug: "rakkasei",
      name: "落花生",
      municipality: "県内広域(北総台地中心)",
      description:
        "明治9年に山武郡南郷村で試作が始まり、水はけの良い北総台地一帯へ栽培が広がった。国内生産量の7割以上を占める全国1位の産地で、煎り豆や落花生味噌など加工品も豊富に作られている。",
      sourceUrl: "https://www.pref.chiba.lg.jp/kkbunka/b-shigen/500sen/tokusan.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "boshu-biwa",
      name: "房州ビワ",
      municipality: "南房総市、館山市、鋸南町",
      description:
        "長崎の「茂木ビワ」と並ぶ全国屈指の産地で、房総半島南端の温暖な気候を活かして栽培される。大粒でみずみずしい実が特徴で、毎年皇室にも献上されるほか羊かんやジャムにも加工される。",
      sourceUrl: "https://www.pref.chiba.lg.jp/kkbunka/b-shigen/500sen/tokusan.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "chiba-shoyu",
      name: "醤油",
      municipality: "野田市、銚子市、東庄町",
      description:
        "利根川の水運を活かした醸造が江戸時代から発達し、全国消費量の3分の1を生産する国内最大の産地となった。野田と銚子が二大生産地で、東葛・北総地域を中心に60社以上の製造業者が集積する。",
      sourceUrl: "https://www.pref.chiba.lg.jp/kkbunka/b-shigen/500sen/tokusan.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tokyo-bay-nori",
      name: "海苔(東京湾ののり)",
      municipality: "内房地域(小糸川河口ほか)",
      description:
        "文政5年に小糸川河口で養殖に成功したのが東京湾海苔生産の始まりとされ、約200年の歴史を持つ。江戸前のりの生産量の約97%を占め、内房の遠浅の海で育つ風味の強い海苔として知られる。",
      sourceUrl: "https://www.pref.chiba.lg.jp/kkbunka/b-shigen/500sen/tokusan.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "shokuyo-nabana",
      name: "食用なばな",
      municipality: "安房・夷隅・君津地域",
      description:
        "菜の花の食用品種を栽培したもので、主に水田の裏作として冬場に育てられる。花蕾と葉茎をあわせて収穫し、「安房菜の花」として地域団体商標にも登録されるなど房総の冬を代表する野菜となっている。",
      sourceUrl: "https://www.pref.chiba.lg.jp/kkbunka/b-shigen/500sen/tokusan.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "chiba-satsumaimo",
      name: "サツマイモ",
      municipality: "北総台地ほか",
      description:
        "享保20年に栽培が始まったとされ、水はけの良い北総台地の畑作に適したことから県内有数の産地に育った。ベニアズマやべにはるかなどが栽培され、干し芋をはじめ多くの加工品に利用されている。",
      sourceUrl: "https://www.pref.chiba.lg.jp/kkbunka/b-shigen/500sen/tokusan.html",
      accessedAt: "2026-07-18",
    },
    {
      slug: "tomisato-suika",
      name: "富里スイカ",
      municipality: "富里市",
      description:
        "富里市は関東ローム層の水はけのよい土壌と昼夜の寒暖差を生かしたスイカの名産地。市は令和3年にすいか条例を制定し、生産者・市民一体で「富里スイカ」ブランドを守っている。",
      sourceUrl: "https://www.city.tomisato.lg.jp/0000012162.html",
      accessedAt: "2026-09-14",
    },
    {
      slug: "shiro-takenoko",
      name: "白たけのこ",
      municipality: "大多喜町",
      description:
        "大多喜町は県内有数のたけのこ産地で、酸性の白い土壌で育つ筍は色が白く苦みやえぐみが少ない。「幻の白たけのこ」と称され、都内の料亭からも求められる高級食材。",
      sourceUrl: "https://jaisumi.or.jp/agriculture-and-food/farm_crops/120.html",
      accessedAt: "2026-09-14",
    },
    {
      slug: "mineoka-gyunyu",
      name: "牛乳",
      municipality: "南房総市（嶺岡地域）ほか安房地域",
      description:
        "南房総市嶺岡は徳川吉宗が享保期にインド産の白牛を放ち「白牛酪」を作らせた、日本の酪農発祥の地とされる。千葉県史跡に指定され、酪農のさと資料館が歴史を伝える。",
      sourceUrl: "https://www.pref.chiba.lg.jp/kyouiku/bunkazai/bunkazai/p411-025.html",
      accessedAt: "2026-09-14",
    },
  ],
};
