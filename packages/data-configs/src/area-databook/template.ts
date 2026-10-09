/**
 * AREA_DATABOOK_TEMPLATE — 47 県共通の県データブック構成 (単一 SSOT)。
 *
 * 規約: `.claude/rules/area-databook-standards.md`
 *
 * - chart ブロックは generator で `apps/web/scripts/data/page-components/area/<code>.json`
 *   に出力される (手編集禁止・byte 一致)。既存 6 チャートを各セクションに温存し、
 *   listTemplateCharts の収集順 (人口→経済→安全) を保つことで golden diff をゼロに保つ。
 * - ranked-kpi-grid / gender-paired-kpi / agri-top10 は R2 `app/areas/<code>/databook.json`
 *   (exporter が values.json から値+全国順位を焼き込み) を app が読んで描画する。
 * - specialty-list / symbol-card は editorial/<code>.ts を app が直接 import して描画する。
 *
 * 書籍「2021 都道府県 Data Book」(日本食糧新聞社) の章立てを設計図に、県軸・回遊面の
 * 責務内 (自県の値+全国順位) で encode する。47 県横並び可視化は置かない (theme の責務)。
 * selection (provenance) は Phase 3 で area-databook-designer が各指標に補記する
 * (現状は未記入=validator warn、非ブロック)。
 */
import type { AreaDatabookTemplate } from "./types";

const BOOK = "都道府県 Data Book (日本食糧新聞社)";
const GUIDE = "47都道府県 県庁所在地ガイド";
const GUIDE_SURVEYED = "2026-10-08";
const LIVESTOCK_SELECTION = (rationale: string) => ({
  proposedBy: "農林水産省「畜産統計」確報 (乳用牛と並ぶ畜産の県別規模)",
  sourceUrl: "https://www.maff.go.jp/j/tokei/kouhyou/tikusan/",
  surveyedAt: GUIDE_SURVEYED,
  rationale,
});

const BATCH_PROPOSED_BY = "参考文献由来の公開中指標 (県ページ採用判断)";
const BATCH_SURVEYED = "2026-10-09";
const BATCH_SELECTION = (sourceUrl: string, rationale: string) => ({
  proposedBy: BATCH_PROPOSED_BY,
  sourceUrl,
  surveyedAt: BATCH_SURVEYED,
  rationale,
});
const SSDS_URL = "https://www.stat.go.jp/data/ssds/index.htm";
const VITAL_URL = "https://www.mhlw.go.jp/toukei/list/81-1.html";

export const AREA_DATABOOK_TEMPLATE: AreaDatabookTemplate = {
  sections: [
    /* ① 県シンボル ---------------------------------------------------- */
    {
      sectionKey: "symbols",
      kind: "symbols",
      title: "県のシンボル",
      sortOrder: 150,
      blocks: [{ blockType: "symbol-card", blockKey: "symbols-card" }],
    },
    /* ① 特産品 -------------------------------------------------------- */
    {
      sectionKey: "specialties",
      kind: "specialties",
      title: "特産品",
      description: "県を代表する農水産物・加工品",
      sortOrder: 160,
      blocks: [{ blockType: "specialty-list", blockKey: "specialties-list" }],
    },
    /* ② 農業生産 ------------------------------------------------------ */
    {
      sectionKey: "agriculture",
      kind: "agriculture",
      title: "農業生産",
      sortOrder: 120,
      blocks: [
        { blockType: "agri-top10", blockKey: "agri-top10" },
        {
          blockType: "ranked-kpi-grid",
          blockKey: "agri-kpi",
          columns: 3,
          metrics: [
            {
              rankingKey: "agricultural-output",
              shortLabel: "農業産出額",
              selection: {
                proposedBy: BOOK,
                surveyedAt: "2026-07-18",
                rationale: "県の農業規模を示すヘッドライン指標",
              },
            },
            { rankingKey: "cultivated-land-area-ratio", shortLabel: "耕地面積率" },
          ],
        },
      ],
    },
    /* ③ 県の食 -------------------------------------------------------- */
    {
      sectionKey: "food",
      kind: "food",
      title: "県の食",
      sortOrder: 130,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "food-kpi",
          columns: 3,
          metrics: [
            { rankingKey: "rice-harvest-volume", shortLabel: "コメ収穫量" },
            { rankingKey: "marine-fishery-catch", shortLabel: "海面漁業漁獲量" },
            { rankingKey: "marine-aquaculture-harvest", shortLabel: "海面養殖収穫量" },
            {
              rankingKey: "food-self-sufficiency-rate-calorie",
              shortLabel: "食料自給率",
            },
            {
              rankingKey: "engel-coefficient",
              shortLabel: "エンゲル係数",
              capitalCityValue: true,
            },
            { rankingKey: "dairy-cattle-count", shortLabel: "乳用牛飼育頭数" },
            {
              rankingKey: "beef-cattle-count",
              shortLabel: "肉用牛飼養頭数",
              selection: LIVESTOCK_SELECTION("肉用牛の飼養規模。北海道・九州の畜産地帯と他県の差を読む"),
            },
            {
              rankingKey: "pig-count",
              shortLabel: "豚飼養頭数",
              selection: LIVESTOCK_SELECTION("豚の飼養規模。南九州・関東の養豚地帯を読む"),
            },
            {
              rankingKey: "layer-hen-count",
              shortLabel: "採卵鶏飼養羽数",
              selection: LIVESTOCK_SELECTION("採卵鶏(成鶏めす)の飼養規模。鶏卵の産地を読む"),
            },
          ],
        },
      ],
    },
    /* ④ 県民力: 人口 (＋既存の人口チャート) ---------------------------- */
    {
      sectionKey: "civic-population",
      kind: "civic-population",
      title: "人口・世帯",
      sortOrder: 10,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "population-kpi",
          columns: 4,
          metrics: [
            {
              // 総人口 (外国人を含む)。日本人人口だと東京都が 1,346 万人になり、人口動態ページの
              // 1,418 万人と食い違って見えた (2026-09-27)
              rankingKey: "total-population",
              shortLabel: "人口",
              selection: {
                proposedBy: BOOK,
                surveyedAt: "2026-07-18",
                rationale: "県規模の基準指標",
              },
            },
            {
              rankingKey: "population-density-per-km2-total-area",
              shortLabel: "人口密度(1km²当たり)",
            },
            {
              rankingKey: "future-population-change-rate-2050",
              shortLabel: "2050年人口変化率",
            },
            { rankingKey: "crude-birth-rate", shortLabel: "出生率" },
            { rankingKey: "crude-death-rate", shortLabel: "死亡率" },
            {
              rankingKey: "foreign-resident-count-per-100k",
              shortLabel: "外国人(10万人比)",
            },
            {
              rankingKey: "total-fertility-rate",
              shortLabel: "合計特殊出生率",
              selection: BATCH_SELECTION(VITAL_URL, "一人の女性が生涯に産む子どもの数の県差。出生率と別に少子化の水準を読む"),
            },
            {
              rankingKey: "natural-increase-rate",
              shortLabel: "自然増減率",
              selection: BATCH_SELECTION(VITAL_URL, "出生と死亡の差し引きによる人口の増減の勢い。社会増減を除いた県の自然な人口動態を読む"),
            },
            {
              rankingKey: "infant-mortality-rate-per-1000-births",
              shortLabel: "乳児死亡率",
              selection: BATCH_SELECTION(VITAL_URL, "出生千人当たりの率で県規模に左右されず、周産期・小児医療の県差を読む"),
            },
            {
              rankingKey: "suicide-rate-per-100k",
              shortLabel: "自殺者数(10万人比)",
            },
            {
              rankingKey: "traffic-accident-count",
              shortLabel: "交通事故発生件数",
            },
          ],
        },
        {
          blockType: "chart",
          chart: {
            componentKey: "area-ov-age-structure",
            componentType: "stacked-area",
            title: "年齢3区分人口の推移",
            componentProps: {
              estatParams: [
                { statsDataId: "0000010101", cdCat01: "A1301" },
                { statsDataId: "0000010101", cdCat01: "A1302" },
                { statsDataId: "0000010101", cdCat01: "A1303" },
              ],
              labels: ["15歳未満", "15〜64歳", "65歳以上"],
              rankingLinks: [
                {
                  label: "年少人口割合ランキング",
                  url: "/ranking/young-population-ratio",
                },
                { label: "高齢化率ランキング", url: "/ranking/ratio-65-plus" },
              ],
            },
            relatedRankingKeys: ["young-population-ratio", "ratio-65-plus"],
            sourceName: "社会・人口統計体系",
            gridColumnSpan: 12,
            sortOrder: 10,
          },
        },
        {
          blockType: "chart",
          chart: {
            componentKey: "area-ov-aging-young",
            componentType: "line-chart",
            title: "高齢化率・年少人口割合の推移",
            componentProps: {
              estatParams: [
                { statsDataId: "0000010201", cdCat01: "#A03503" },
                { statsDataId: "0000010201", cdCat01: "#A03501" },
              ],
              labels: ["高齢化率（65歳以上）", "年少人口割合（15歳未満）"],
              rankingLinks: [
                { label: "高齢化率ランキング", url: "/ranking/ratio-65-plus" },
                {
                  label: "年少人口割合ランキング",
                  url: "/ranking/young-population-ratio",
                },
              ],
            },
            relatedRankingKeys: ["ratio-65-plus", "young-population-ratio"],
            sourceName: "社会・人口統計体系",
            gridColumnSpan: 6,
            sortOrder: 20,
          },
        },
        {
          blockType: "chart",
          chart: {
            componentKey: "area-ov-elderly-household",
            componentType: "line-chart",
            title: "高齢者世帯の推移",
            componentProps: {
              estatParams: [
                { statsDataId: "0000010201", cdCat01: "#A06301" },
                { statsDataId: "0000010201", cdCat01: "#A06304" },
                { statsDataId: "0000010201", cdCat01: "#A06302" },
              ],
              labels: [
                "65歳以上世帯員のいる世帯",
                "65歳以上単独世帯",
                "高齢夫婦のみ世帯",
              ],
              rankingLinks: [
                {
                  label: "65歳以上単独世帯割合ランキング",
                  url: "/ranking/single-person-household-old-population-ratio",
                },
              ],
            },
            relatedRankingKeys: ["single-person-household-old-population-ratio"],
            sourceName: "社会・人口統計体系",
            gridColumnSpan: 6,
            sortOrder: 30,
          },
        },
      ],
    },
    /* ④ 県民力: 暮らし ------------------------------------------------ */
    {
      sectionKey: "civic-living",
      kind: "civic-living",
      title: "暮らし",
      sortOrder: 30,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "living-kpi",
          columns: 3,
          metrics: [
            {
              rankingKey: "current-savings-balance-multi-person-households",
              shortLabel: "貯蓄現在高",
              capitalCityValue: true,
            },
            {
              rankingKey: "financial-debt-balance",
              shortLabel: "負債現在高",
              capitalCityValue: true,
            },
            {
              rankingKey: "owner-occupied-housing-ratio",
              shortLabel: "持ち家率",
            },
            { rankingKey: "floor-area-per-dwelling-owner", shortLabel: "持ち家の延べ床面積" },
            {
              rankingKey: "penal-code-offenses-recognized-per-1000",
              shortLabel: "犯罪認知件数(千人比)",
            },
            { rankingKey: "sewage-treatment-coverage-rate", shortLabel: "汚水処理人口普及率" },
            { rankingKey: "barber-beauty-salon-count-per-100k", shortLabel: "理容・美容所数(10万人当たり)" },
            { rankingKey: "cleaning-shop-count-per-100k", shortLabel: "クリーニング所数(10万人当たり)" },
            { rankingKey: "post-office-count-per-100km2", shortLabel: "郵便局数(100km²当たり)" },
            { rankingKey: "gas-station-count-per-100km", shortLabel: "給油所数(道路100km当たり)" },
            { rankingKey: "water-supply-population-ratio-2012on", shortLabel: "上水道給水人口比率" },
            {
              rankingKey: "annual-income-per-household",
              shortLabel: "世帯の年間収入",
              selection: BATCH_SELECTION(SSDS_URL, "1世帯当たりの収入水準。県民所得 (1人当たり) と別に家計の収入の県差を読む"),
            },
            {
              rankingKey: "private-rental-housing-rent-per-3-3m2",
              shortLabel: "民営家賃(3.3m²月額)",
              selection: BATCH_SELECTION(SSDS_URL, "住まいの費用の県差。持ち家比率・延べ床面積と合わせて住居事情を読む"),
            },
            {
              rankingKey: "consumer-price-difference-index-overall",
              shortLabel: "物価地域差指数(総合)",
              compareNationalAvg: true,
              selection: BATCH_SELECTION(SSDS_URL, "全国=100とした物価水準。暮らしの費用が全国より高いか低いかを読む"),
            },
            {
              rankingKey: "consumer-price-difference-index-housing",
              shortLabel: "物価地域差指数(住居)",
              compareNationalAvg: true,
              selection: BATCH_SELECTION(SSDS_URL, "総合物価の差を最も大きく動かす住居費の水準を全国=100で読む"),
            },
          ],
        },
      ],
    },
    /* ④ 県民力: 経済・労働 (＋既存の経済チャート) ---------------------- */
    {
      sectionKey: "civic-economy",
      kind: "civic-economy",
      title: "経済・雇用",
      sortOrder: 20,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "economy-kpi",
          columns: 3,
          metrics: [
            {
              rankingKey: "per-capita-prefectural-income-h27",
              shortLabel: "1人当たり県民所得",
              compareNationalAvg: true,
              selection: {
                proposedBy: BOOK,
                surveyedAt: "2026-07-18",
                rationale: "全国平均対比で県の所得水準を示す主指標",
              },
            },
            {
              rankingKey: "active-job-opening-ratio",
              shortLabel: "有効求人倍率",
              compareNationalAvg: true,
            },
            {
              rankingKey: "total-production-in-the-prefecture",
              shortLabel: "県内総生産",
              selection: {
                proposedBy: GUIDE,
                surveyedAt: GUIDE_SURVEYED,
                rationale: "県の経済規模の総額。1人当たり県民所得では見えない規模を補う",
              },
            },
            { rankingKey: "unemployment-rate", shortLabel: "失業率" },
            {
              rankingKey: "minimum-wage-by-region",
              shortLabel: "地域別最低賃金",
              selection: BATCH_SELECTION(SSDS_URL, "働く人の賃金の下限の県差。給与水準・求人倍率と合わせて雇用環境を読む"),
            },
            { rankingKey: "self-financing-ratio", shortLabel: "自主財源の割合" },
            { rankingKey: "taxpayer-ratio-per-pref-resident", shortLabel: "納税義務者割合" },
          ],
        },
        {
          blockType: "chart",
          chart: {
            componentKey: "area-ov-prefectural-income",
            componentType: "line-chart",
            title: "1人当たり県民所得の推移",
            componentProps: {
              estatParams: [{ statsDataId: "0000010203", cdCat01: "#C01321" }],
              labels: ["1人当たり県民所得"],
            },
            relatedRankingKeys: ["per-capita-prefectural-income-h27"],
            sourceName: "社会・人口統計体系",
            rankingLink: "/ranking/per-capita-prefectural-income-h27",
            gridColumnSpan: 6,
            sortOrder: 40,
          },
        },
        {
          blockType: "chart",
          chart: {
            componentKey: "area-ov-job-opening",
            componentType: "line-chart",
            title: "有効求人倍率の推移",
            componentProps: {
              estatParams: [{ statsDataId: "0000010206", cdCat01: "#F03103" }],
              labels: ["有効求人倍率"],
            },
            relatedRankingKeys: ["active-job-opening-ratio"],
            sourceName: "社会・人口統計体系",
            rankingLink: "/ranking/active-job-opening-ratio",
            gridColumnSpan: 6,
            sortOrder: 50,
          },
        },
      ],
    },
    /* ④ 県民力: 産業 -------------------------------------------------- */
    {
      sectionKey: "civic-industry",
      kind: "civic-industry",
      title: "産業",
      sortOrder: 50,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "industry-kpi",
          columns: 2,
          metrics: [
            {
              rankingKey: "manufacturing-establishments",
              shortLabel: "製造業事業所数",
            },
            {
              rankingKey: "manufacturing-shipment-amount",
              shortLabel: "製造品出荷額",
            },
            {
              rankingKey: "manufacturing-industry-added-value",
              shortLabel: "製造業付加価値額",
              selection: {
                proposedBy: GUIDE,
                surveyedAt: GUIDE_SURVEYED,
                rationale: "出荷額から原材料費等を除いた、製造業が県内で生み出した価値",
              },
            },
            {
              rankingKey: "manufacturing-shipment-amount-per-employee",
              shortLabel: "従業者1人当たり出荷額",
              selection: {
                proposedBy: GUIDE,
                surveyedAt: GUIDE_SURVEYED,
                rationale: "出荷額の総額では見えない、従業者1人が生む出荷額の県差",
              },
            },
            { rankingKey: "final-energy-consumption-per-capita", shortLabel: "1人当たり最終エネルギー消費量" },
            { rankingKey: "employee-ratio-10-29-employee-establishments-private", shortLabel: "10〜29人事業所の従業者割合" },
          ],
        },
      ],
    },
    /* ⑤ 世帯 ---------------------------------------------------------- */
    {
      sectionKey: "household",
      kind: "household",
      title: "世帯",
      sortOrder: 60,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "household-kpi",
          columns: 3,
          metrics: [
            { rankingKey: "households", shortLabel: "世帯数" },
            {
              rankingKey: "single-person-household-ratio",
              shortLabel: "単身世帯率",
            },
            {
              rankingKey: "elderly-couple-only-household-ratio",
              shortLabel: "高齢夫婦のみ世帯率",
            },
            {
              rankingKey: "households-on-public-assistance-per-1000",
              shortLabel: "生活保護世帯(千世帯比)",
            },
          ],
        },
      ],
    },
    /* ⑤ 気候 ---------------------------------------------------------- */
    {
      sectionKey: "climate",
      kind: "climate",
      title: "気候",
      sortOrder: 80,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "climate-kpi",
          columns: 4,
          metrics: [
            { rankingKey: "average-temperature", shortLabel: "平均気温" },
            { rankingKey: "annual-sunshine-duration", shortLabel: "日照時間" },
            { rankingKey: "annual-precipitation", shortLabel: "降水量" },
            {
              rankingKey: "average-relative-humidity",
              shortLabel: "平均相対湿度",
            },
          ],
        },
      ],
    },
    /* 自然・土地利用 (県庁所在地ガイドの論点台帳から追加) -------------- */
    {
      sectionKey: "land-nature",
      kind: "climate",
      title: "自然・土地利用",
      description: "県土の広さと、森林・自然公園が占める割合",
      sortOrder: 85,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "land-nature-kpi",
          columns: 3,
          metrics: [
            {
              rankingKey: "total-area-excluding-northern-territories-and-takeshima",
              shortLabel: "総面積",
              selection: {
                proposedBy: GUIDE,
                surveyedAt: GUIDE_SURVEYED,
                rationale: "県の広さ。人口密度の分母として、北海道の大きさと香川の小ささを読む",
              },
            },
            {
              rankingKey: "forest-area-ratio",
              shortLabel: "森林面積割合",
              selection: {
                proposedBy: GUIDE,
                surveyedAt: GUIDE_SURVEYED,
                rationale: "県土の森林の多さ。山がちな県と平野の県の違いを読む",
              },
            },
            {
              rankingKey: "nature-park-area-ratio",
              shortLabel: "自然公園面積割合",
              selection: {
                proposedBy: GUIDE,
                surveyedAt: GUIDE_SURVEYED,
                rationale: "国立・国定・都道府県立の自然公園が県土に占める割合",
              },
            },
          ],
        },
      ],
    },
    /* ⑤ 男女 ---------------------------------------------------------- */
    {
      sectionKey: "gender",
      kind: "gender",
      title: "男女",
      description: "男女で対比する指標",
      sortOrder: 90,
      blocks: [
        {
          blockType: "gender-paired-kpi",
          blockKey: "gender-pairs",
          pairs: [
            {
              label: "初婚年齢",
              maleKey: "average-age-of-first-marriage-husband",
              femaleKey: "average-age-of-first-marriage-wife",
            },
            {
              label: "平均寿命",
              maleKey: "life-expectancy-0-male",
              femaleKey: "life-expectancy-0-female",
            },
            {
              label: "月額給与",
              maleKey: "male-scheduled-earnings",
              femaleKey: "female-scheduled-earnings",
            },
            {
              label: "身長(高2)",
              maleKey: "avg-height-high-school-2nd-male",
              femaleKey: "average-height-high-school-second-grade-female",
            },
            {
              label: "体重(高2)",
              maleKey: "average-weight-high-school-second-grade-male",
              femaleKey: "average-weight-high-school-second-grade-female",
            },
            {
              label: "健康寿命",
              maleKey: "healthy-life-expectancy-male",
              femaleKey: "healthy-life-expectancy-female",
            },
            {
              label: "食塩摂取量(年齢調整)",
              maleKey: "salt-intake-male-age-adjusted",
              femaleKey: "salt-intake-female-age-adjusted",
            },
            {
              label: "野菜摂取量(年齢調整)",
              maleKey: "vegetable-intake-male-age-adjusted",
              femaleKey: "vegetable-intake-female-age-adjusted",
            },
          ],
        },
        {
          blockType: "ranked-kpi-grid",
          blockKey: "gender-kpi",
          columns: 2,
          metrics: [
            {
              rankingKey: "sex-ratio-total",
              shortLabel: "人口性比(女=100)",
              selection: BATCH_SELECTION(SSDS_URL, "女性100人に対する男性の数。男女の人口構成の県差を読む"),
            },
          ],
        },
      ],
    },
    /* ⑤ 地価 ---------------------------------------------------------- */
    {
      sectionKey: "land-price",
      kind: "land-price",
      title: "地価",
      sortOrder: 100,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "land-price-kpi",
          columns: 2,
          metrics: [
            {
              rankingKey: "residential-land-price-change-rate",
              shortLabel: "住宅地価変動率",
            },
          ],
        },
      ],
    },
    /* ⑤ 旅行者 -------------------------------------------------------- */
    {
      sectionKey: "tourism",
      kind: "tourism",
      title: "旅行者",
      sortOrder: 110,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "tourism-kpi",
          columns: 2,
          metrics: [
            {
              rankingKey: "total-overnight-guests",
              shortLabel: "延べ宿泊者数",
            },
            {
              rankingKey: "total-overnight-guests-foreign",
              shortLabel: "外国人延べ宿泊者数",
              selection: {
                proposedBy: GUIDE,
                surveyedAt: GUIDE_SURVEYED,
                rationale: "延べ宿泊者数のうち外国人の規模。訪日客の行き先の県差を読む",
              },
            },
            {
              rankingKey: "room-utilization-rate",
              shortLabel: "客室稼働率",
              selection: BATCH_SELECTION(SSDS_URL, "宿泊者数の規模ではなく客室の埋まり具合。観光の需給の混み方を読む"),
            },
          ],
        },
      ],
    },
    /* ⑤ 学校・施設 ---------------------------------------------------- */
    {
      sectionKey: "education-facility",
      kind: "education-facility",
      title: "学校・施設",
      description: "人口当たりの医師数・病床数・施設数と救急搬送の所要時間",
      sortOrder: 70,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "facility-kpi",
          columns: 3,
          metrics: [
            {
              rankingKey: "physicians-in-medical-facilities-per-100k",
              shortLabel: "医師数(10万人比)",
            },
            {
              rankingKey: "general-hospital-count-per-100k",
              shortLabel: "一般病院数(10万人比)",
            },
            {
              rankingKey: "general-clinic-count-per-100k",
              shortLabel: "一般診療所数(10万人比)",
            },
            {
              rankingKey: "library-count-per-million",
              shortLabel: "図書館数(100万人比)",
            },
            {
              rankingKey: "museum-count-per-million",
              shortLabel: "博物館数(100万人比)",
            },
            {
              rankingKey: "certified-childcare-center-count-per-100k-0-5",
              shortLabel: "認定こども園数(0-5歳10万人比)",
            },
            { rankingKey: "kindergarten-count-per-100k-3-5", shortLabel: "幼稚園数(3〜5歳10万人当たり)" },
            {
              rankingKey: "general-hospital-bed-count-per-100k",
              shortLabel: "一般病院病床数(10万人比)",
              selection: BATCH_SELECTION(SSDS_URL, "医師数・病院数に並ぶ入院医療の受け皿。病院の数でなく規模の県差を読む"),
            },
            {
              rankingKey: "ambulance-hospital-arrival-time",
              shortLabel: "救急搬送の病院収容所要時間",
              selection: BATCH_SELECTION("https://www.fdma.go.jp/publication/rescue/post-7.html", "119番から病院に収容されるまでの時間。施設数では見えない救急医療へのアクセスの県差を読む"),
            },
          ],
        },
      ],
    },
    /* ⑥ 消費 (家計調査・県庁所在市) ----------------------------------- */
    {
      sectionKey: "consumption",
      kind: "consumption",
      title: "消費",
      description: "県庁所在市の二人以上世帯。消費支出は 1 か月当たり、ほかは消費支出に占める割合",
      sortOrder: 140,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "consumption-kpi",
          columns: 3,
          metrics: [
            {
              rankingKey:
                "consumption-expenditure-multi-person-households-per-month",
              shortLabel: "消費支出(月額)",
              capitalCityValue: true,
              selection: {
                proposedBy: BOOK,
                surveyedAt: "2026-07-18",
                rationale: "県庁所在市の家計消費の総額",
              },
            },
            {
              rankingKey: "food-expenditure-ratio-multi-person-households",
              shortLabel: "食料費割合",
              capitalCityValue: true,
            },
            {
              rankingKey:
                "culture-recreation-expenditure-ratio-multi-person-households",
              shortLabel: "教養娯楽費割合",
              capitalCityValue: true,
            },
            {
              rankingKey:
                "transport-communication-expenditure-ratio-multi-person-households",
              shortLabel: "交通・通信費割合",
              capitalCityValue: true,
            },
            {
              rankingKey:
                "education-expenditure-ratio-multi-person-households",
              shortLabel: "教育費割合",
              capitalCityValue: true,
            },
          ],
        },
      ],
    },
    /* ⑥ 消費: 品目別 (家計調査・県庁所在市の年間) ---------------------- */
    {
      sectionKey: "consumption-items",
      kind: "consumption",
      title: "食の消費(品目別)",
      description: "県庁所在市の二人以上世帯が 1 年間に買った量・支出額。牛肉は購入量、ほかは支出額",
      sortOrder: 145,
      blocks: [
        {
          blockType: "ranked-kpi-grid",
          blockKey: "consumption-items-kpi",
          columns: 3,
          metrics: [
            {
              rankingKey: "beef-consumption-quantity",
              shortLabel: "牛肉の購入量",
              capitalCityValue: true,
              selection: {
                proposedBy: GUIDE,
                surveyedAt: GUIDE_SURVEYED,
                rationale: "肉の好みの東西差を読む代表品目",
              },
            },
            {
              rankingKey: "chicken-consumption-expenditure",
              shortLabel: "鶏肉の支出額",
              capitalCityValue: true,
              selection: {
                proposedBy: GUIDE,
                surveyedAt: GUIDE_SURVEYED,
                rationale: "牛肉と並べて肉の好みの県差を読む",
              },
            },
            {
              rankingKey: "fresh-udon-soba-consumption-expenditure",
              shortLabel: "生うどん・そばの支出額",
              capitalCityValue: true,
              selection: {
                proposedBy: GUIDE,
                surveyedAt: GUIDE_SURVEYED,
                rationale: "麺の食文化(香川・長野など)の県差",
              },
            },
            {
              rankingKey: "chinese-noodles-consumption-expenditure",
              shortLabel: "中華麺の支出額",
              capitalCityValue: true,
              selection: {
                proposedBy: GUIDE,
                surveyedAt: GUIDE_SURVEYED,
                rationale: "うどん・そばと並べて麺の好みの県差を読む",
              },
            },
            {
              rankingKey: "green-tea-consumption-expenditure",
              shortLabel: "緑茶の支出額",
              capitalCityValue: true,
              selection: {
                proposedBy: GUIDE,
                surveyedAt: GUIDE_SURVEYED,
                rationale: "茶どころ静岡をはじめ飲み物の好みの県差",
              },
            },
            {
              rankingKey: "sake-consumption-expenditure",
              shortLabel: "清酒の支出額",
              capitalCityValue: true,
              selection: {
                proposedBy: GUIDE,
                surveyedAt: GUIDE_SURVEYED,
                rationale: "酒どころの県差を家庭の支出から読む",
              },
            },
          ],
        },
      ],
    },
    /* 安全・くらし (既存の交通事故チャートを温存) --------------------- */
    {
      sectionKey: "safety-living",
      kind: "civic-living",
      title: "安全・くらし",
      sortOrder: 40,
      blocks: [
        {
          // 2026-09-27 AREA-HIGHLIGHTS-SSOT-01: 県の「特徴」候補の分野 (安全) を広げる
          blockType: "ranked-kpi-grid",
          blockKey: "safety-kpi",
          metrics: [
            { rankingKey: "criminal-arrest-rate", shortLabel: "刑法犯検挙率" },
            { rankingKey: "police-officer-count-per-population", shortLabel: "警察官数(人口当たり)" },
            { rankingKey: "disaster-damage-amount-per-person", shortLabel: "1人当たり災害被害額" },
          ],
        },
        {
          blockType: "chart",
          chart: {
            componentKey: "area-ov-traffic-accident",
            componentType: "line-chart",
            title: "交通事故 発生件数と負傷者数の推移",
            componentProps: {
              estatParams: [
                { statsDataId: "0000010111", cdCat01: "K3101" },
                { statsDataId: "0000010111", cdCat01: "K3104" },
              ],
              labels: ["事故発生件数", "負傷者数"],
            },
            relatedRankingKeys: ["traffic-accident-count"],
            sourceName: "社会・人口統計体系",
            rankingLink: "/ranking/traffic-accident-count",
            gridColumnSpan: 6,
            sortOrder: 60,
          },
        },
      ],
    },
  ],
};
