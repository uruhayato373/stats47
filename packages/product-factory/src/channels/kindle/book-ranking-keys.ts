/**
 * 書籍ごとに載せる ranking キーの SSOT。
 *
 * ★なぜ要るか (2026-08-12)
 *   以前は pack の全キー (最大 2,179) を渡して**先頭 24 件**を章にしていた。
 *   pack 内の並びは metric key の辞書順なので、(a) テーマと関係ない指標が並び
 *   (b) S3 8 冊 + S4 は同じ P-12 を見るので**全冊ほぼ同一の本**になっていた。
 *
 * 選定は `scripts/select-book-keys.mts` が実測して出した候補を確定させたもの。基準は:
 *   - 共通: 章コンポーザ (ai-content + 数値ゲート) で**本文 600 字以上を組めること**
 *   - S2: テーマ pack 内なのでどれも主題に沿う → 本文が厚い順
 *   - S3: **その地域が特徴的な指標**を優先 (地域の県が上位/下位に偏っているほど高スコア)。
 *         実測で 8 冊のキー重複は平均 3.1/30 まで下がった (旧 30/30)
 *   - S4: 「意外な1位」— 1 位が人口規模の大きい県でない × 格差が大きいものを優先
 *
 * 更新するときは `npx tsx packages/product-factory/scripts/select-book-keys.mts --book <id> --emit`
 * で候補を出し直し、人が採否を決めてここへ置く。**手で書き足すときも実在キーだけ**
 * (実在しないキーは章がスキップされ、静かに薄い本になる)。
 */

export const BOOK_RANKING_KEYS: Readonly<Record<string, readonly string[]>> = {
  "K-S2-01": [
    "total-fertility-rate", // 日本国勢図会 evidence — 合計特殊出生率 / 本文 1473字 / [insights,regionalAnalysis,faq]
    "deaths-hypertensive-diseases", // 高血圧性疾患による死亡者数 — 本文 2216字 / [insights,regionalAnalysis,faq]
    "marriages-per-total-population", // 婚姻率 — 本文 2011字 / [insights,regionalAnalysis,faq]
    "young-population-ratio", // 15歳未満人口割合 — 本文 2007字 / [insights,regionalAnalysis,faq]
    "moving-in-excess-rate-japanese", // 転入超過率 — 本文 1973字 / [insights,regionalAnalysis,faq]
    "inflow-population-ratio", // 流入人口比率 — 本文 1968字 / [insights,regionalAnalysis,faq]
    "average-persons-per-general-household", // 一般世帯の平均人員 — 本文 1915字 / [insights,regionalAnalysis,faq]
    "production-age-population-ratio", // 15～64歳人口割合 — 本文 1895字 / [insights,regionalAnalysis,faq]
    "densely-inhabited-district-population-ratio", // 人口集中地区人口比率 — 本文 1881字 / [insights,regionalAnalysis,faq]
    "divorces-per-total-population", // 離婚率 — 本文 1868字 / [insights,regionalAnalysis,faq]
    "sex-ratio-total", // 人口性比 — 本文 1851字 / [insights,regionalAnalysis,faq]
    "unmarried-ratio-male-40-44", // 未婚者割合 — 本文 1850字 / [insights,regionalAnalysis,faq]
    "night-soil-treatment-population-ratio", // し尿処理人口比率 — 本文 1838字 / [insights,regionalAnalysis,faq]
    "densely-populated-area-ratio", // 人口集中地区面積比率 — 本文 1835字 / [insights,regionalAnalysis,faq]
    "crude-birth-rate", // 粗出生率 — 本文 1830字 / [insights,regionalAnalysis,faq]
    "dependent-population-index", // 従属人口指数 — 本文 1806字 / [insights,regionalAnalysis,faq]
    "flush-toilet-population-ratio", // 水洗化人口比率 — 本文 1806字 / [insights,regionalAnalysis,faq]
    "deaths-lifestyle-diseases", // 生活習慣病による死亡者数 — 本文 1790字 / [insights,regionalAnalysis,faq]
    "ratio-never-married-15-plus", // 未婚者割合 — 本文 1782字 / [insights,regionalAnalysis,faq]
    "standardized-mortality-rate-per-1000", // 標準化死亡率 — 本文 1769字 / [insights,regionalAnalysis,faq]
    "ratio-65-plus", // 65歳以上人口割合 — 本文 1768字 / [insights,regionalAnalysis,faq]
    "social-increase", // 社会増減数 — 本文 1757字 / [insights,regionalAnalysis,faq]
    "standardized-mortality-japanese", // 標準化死亡率〔日本人〕 — 本文 1744字 / [insights,regionalAnalysis,faq]
    "liver-disease-death-rate", // 肝疾患による死亡者数 — 本文 1740字 / [insights,regionalAnalysis,faq]
    "deaths-diabetes", // 糖尿病による死亡者数 — 本文 1737字 / [insights,regionalAnalysis,faq]
    "population-growth-rate", // 人口増減率 — 本文 1730字 / [insights,regionalAnalysis,faq]
    "day-time-population-ratio", // 昼夜間人口比率 — 本文 1724字 / [insights,regionalAnalysis,faq]
    "unmarried-ratio-female-25-29", // 未婚者割合 — 本文 1719字 / [insights,regionalAnalysis,faq]
    "household-ratio-with-65plus", // 65歳以上の世帯員のいる世帯割合 — 本文 1709字 / [insights,regionalAnalysis,faq]
    "daytime-population-ratio", // 昼夜間人口比率 — 本文 1701字 / [insights,regionalAnalysis,faq]
    "maternal-mortality-rate-per-100k-births", // 妊娠等による死亡率 — 本文 1694字 / [insights,regionalAnalysis,faq]
  ],
  "K-S2-02": [
    "unemployment-rate", // 日本国勢図会 evidence — 完全失業率 / 本文 1510字 / [insights,regionalAnalysis,faq]
    "active-job-opening-ratio", // 日本国勢図会 evidence — 有効求人倍率 / 本文 1433字 / [insights,regionalAnalysis,faq]
    "minimum-wage-by-region", // 日本国勢図会 evidence — 地域別最低賃金 / 本文 1007字 / [regionalAnalysis,faq]
    "tertiary-industry-employees-per-establishment-census", // 第3次産業従業者数 — 本文 2185字 / [insights,regionalAnalysis,faq]
    "employed-people-ratio-tertiary", // 第3次産業就業者比率 — 本文 2157字 / [insights,regionalAnalysis,faq]
    "middle-aged-employment-rate-45plus", // 中高年齢者就職率 — 本文 2040字 / [insights,regionalAnalysis,faq]
    "secondary-industry-employees-per-establishment-census", // 第2次産業従業者数 — 本文 2026字 / [insights,regionalAnalysis,faq]
    "labor-expenses-prefecture", // 労働費 — 本文 1996字 / [insights,regionalAnalysis,faq]
    "employment-rate", // 就職率 — 本文 1937字 / [insights,regionalAnalysis,faq]
    "job-change-rate", // 転職率 — 本文 1882字 / [insights,regionalAnalysis,faq]
    "secondary-industry-employees-per-establishment", // 第2次産業従業者数 — 本文 1824字 / [insights,regionalAnalysis,faq]
    "employed-people-ratio-primary", // 第1次産業就業者比率 — 本文 1820字 / [insights,regionalAnalysis,faq]
    "fulfillment-rate", // 充足率 — 本文 1806字 / [insights,regionalAnalysis,faq]
    "gender-wage-gap", // 男女間賃金格差（女性/男性） — 本文 1805字 / [insights,regionalAnalysis,faq]
    "occupational-accident-frequency-rate", // 労働災害度数率 — 本文 1781字 / [insights,regionalAnalysis,faq]
    "spouse-income", // 配偶者の収入（勤労者世帯） — 本文 1778字 / [insights,regionalAnalysis,faq]
    "commuter-ratio-to-other-municipalities", // 他市区町村への通勤者比率 — 本文 1751字 / [insights,regionalAnalysis,faq]
    "commuter-ratio-from-other-municipalities", // 他市区町村からの通勤者比率 — 本文 1731字 / [insights,regionalAnalysis,faq]
    "elderly-general-worker-old-population-ratio-pre2019", // 高齢一般労働者割合 — 本文 1724字 / [insights,regionalAnalysis,faq]
    "monthly-average-actual-working-hours-female-pre2019", // 月間平均実労働時間数 — 本文 1721字 / [insights,regionalAnalysis,faq]
    "monthly-average-actual-working-hours-male-pre2019", // 月間平均実労働時間数 — 本文 1687字 / [insights,regionalAnalysis,faq]
    "monthly-average-actual-working-hours-female", // 月間平均実労働時間数 — 本文 1675字 / [insights,regionalAnalysis,faq]
    "employed-people-ratio-secondary", // 第2次産業就業者比率 — 本文 1659字 / [insights,regionalAnalysis,faq]
    "tertiary-industry-employees-per-establishment", // 第3次産業従業者数 — 本文 1649字 / [insights,regionalAnalysis,faq]
    "employment-mobility-rate", // 就業異動率 — 本文 1644字 / [insights,regionalAnalysis,faq]
    "in-prefecture-employed-people-ratio", // 県内就業者比率 — 本文 1639字 / [insights,regionalAnalysis,faq]
    "side-job-rate", // 副業率 — 本文 1621字 / [insights,regionalAnalysis,faq]
    "scheduled-salary-male", // 所定内給与額（男） — 本文 1620字 / [insights,regionalAnalysis,faq]
    "employed-people-ratio", // 就業者比率 — 本文 1611字 / [insights,regionalAnalysis,faq]
    "male-parttime-workers-upto2019", // 男性パートタイム労働者数 — 本文 1607字 / [insights,regionalAnalysis,faq]
    "husband-childcare-rate", // 夫の育児参加率 — 本文 1603字 / [insights,regionalAnalysis,faq]
  ],
  "K-S2-03": [
    "travel-participation-rate-day-trip", // 行楽（日帰り）の行動者率 — 本文 2040字 / [insights,regionalAnalysis,faq]
    "travel-participation-rate-overnight", // 旅行（1泊2日以上）の行動者率 — 本文 1946字 / [insights,regionalAnalysis,faq]
    "room-utilization-rate", // 客室稼働率 — 本文 1933字 / [insights,regionalAnalysis,faq]
    "commute-by-car", // 自宅外通勤・通学者数（自家用車） — 本文 1857字 / [insights,regionalAnalysis,faq]
    "number-of-freight-cars", // 貨物車数 — 本文 1770字 / [insights,regionalAnalysis,faq]
    "commute-by-motorcycle", // 自宅外通勤・通学者数（オートバイ） — 本文 1763字 / [insights,regionalAnalysis,faq]
    "commuters-total", // 自宅外通勤・通学者数 — 本文 1709字 / [insights,regionalAnalysis,faq]
    "travel-leisure-annual-participation-rate-10plus", // 旅行・行楽の年間行動者率 — 本文 1699字 / [insights,regionalAnalysis,faq]
    "travel-leisure-annual-participation-rate-15plus", // 旅行・行楽の年間行動者率 — 本文 1687字 / [insights,regionalAnalysis,faq]
    "private-railway-passenger-transport", // 民鉄輸送人員 — 本文 1683字 / [insights,regionalAnalysis,faq]
    "hire-taxi-operators", // ハイヤー・タクシー事業者 — 本文 1676字 / [insights,regionalAnalysis,faq]
    "travel-participation-rate-domestic-tourism", // 国内観光旅行の行動者率 — 本文 1613字 / [insights,regionalAnalysis,faq]
    "bus-operators", // バス事業者 — 本文 1534字 / [insights,regionalAnalysis,faq]
    "overseas-travel-annual-participation-rate-15plus", // 海外旅行の年間行動者率 — 本文 1508字 / [insights,regionalAnalysis,faq]
    "jr-passenger-transport", // ＪＲ輸送人員 — 本文 1503字 / [insights,regionalAnalysis,faq]
    "commute-by-bicycle", // 自宅外通勤・通学者数（自転車） — 本文 1498字 / [insights,regionalAnalysis,faq]
    "motorcycle-count", // 二輪の小型自動車台数 — 本文 1461字 / [insights,regionalAnalysis,faq]
    "overseas-travel-annual-participation-rate-10plus", // 海外旅行の年間行動者率 — 本文 1442字 / [insights,regionalAnalysis,faq]
    "total-overnight-guests", // 延べ宿泊者数 — 本文 1440字 / [insights,regionalAnalysis,faq]
    "commute-by-train", // 自宅外通勤・通学者数（鉄道・電車） — 本文 1419字 / [insights,regionalAnalysis,faq]
    "air-passenger-transport", // 航空輸送人員 — 本文 1410字 / [insights,regionalAnalysis,faq]
    "travel-participation-rate-overseas", // 海外観光旅行の行動者率 — 本文 1407字 / [insights,regionalAnalysis,faq]
    "roadside-station-count", // 道の駅数 — 本文 1377字 / [insights,regionalAnalysis,faq]
    "japanese-entries", // 日本人入国者数 — 本文 1326字 / [insights,regionalAnalysis,faq]
    "number-of-simple-lodging-facilities", // 簡易宿所営業施設数 — 本文 1180字 / [insights,regionalAnalysis,faq]
    "jr-freight-shipment", // ＪＲ貨物発送量 — 本文 1094字 / [regionalAnalysis,faq]
    "total-overnight-guests-foreign", // 外国人延べ宿泊者数 — 本文 1087字 / [insights,regionalAnalysis,faq]
    "travel-participation-rate-homecoming", // 帰省・訪問などの旅行の行動者率 — 本文 1079字 / [insights,regionalAnalysis,faq]
    "travel-participation-rate-domestic", // 国内旅行の行動者率 — 本文 1063字 / [insights,regionalAnalysis,faq]
  ],
  "K-S2-04": [
    "general-funds-prefecture", // 一般財源 — 本文 2139字 / [insights,regionalAnalysis,faq]
    "voter-turnout-house-proportional", // 衆議院議員選挙投票率（比例代表） — 本文 2014字 / [insights,regionalAnalysis,faq]
    "voter-turnout-council-proportional", // 参議院議員選挙投票率（比例代表） — 本文 1955字 / [insights,regionalAnalysis,faq]
    "retirement-allowance-admin-prefecture", // 一般行政職 定年退職者 平均退職手当 — 本文 1893字 / [insights,regionalAnalysis,faq]
    "voter-turnout-council-district", // 参議院議員選挙投票率（選挙区） — 本文 1787字 / [insights,regionalAnalysis,faq]
    "voter-turnout-house-single", // 衆議院議員選挙投票率（小選挙区） — 本文 1764字 / [insights,regionalAnalysis,faq]
    "welfare-expenditure-ratio-pref-finance", // 民生費割合 — 本文 1764字 / [insights,regionalAnalysis,faq]
    "total-revenue-prefecture", // 歳入決算総額 — 本文 1638字 / [insights,regionalAnalysis,faq]
    "local-tax-prefecture", // 地方税 — 本文 1605字 / [insights,regionalAnalysis,faq]
    "general-revenue-ratio-pref-finance", // 一般財源の割合 — 本文 1603字 / [insights,regionalAnalysis,faq]
    "per-capita-public-works-expenditure-pref-municipal", // 土木費 — 本文 1600字 / [insights,regionalAnalysis,faq]
    "independent-revenue-prefecture", // 自主財源額 — 本文 1580字 / [insights,regionalAnalysis,faq]
    "total-assessed-land-area-ratio-paddy", // 評価総地積割合 — 本文 1558字 / [insights,regionalAnalysis,faq]
    "local-tax-ratio-pref-finance", // 地方税割合 — 本文 1556字 / [insights,regionalAnalysis,faq]
    "investment-contributions-prefecture", // 投資及び出資金 — 本文 1527字 / [insights,regionalAnalysis,faq]
    "total-assessed-land-area-ratio-field", // 評価総地積割合 — 本文 1527字 / [insights,regionalAnalysis,faq]
    "total-public-enterprise-investment", // 公営企業総投資額 — 本文 1527字 / [insights,regionalAnalysis,faq]
    "governor-salary-prefecture", // 知事 給料月額 — 本文 1506字 / [insights,regionalAnalysis,faq]
    "health-center-expenses-prefecture", // 保健所費 — 本文 1502字 / [insights,regionalAnalysis,faq]
    "maintenance-repair-expenses-prefecture", // 維持補修費 — 本文 1499字 / [insights,regionalAnalysis,faq]
    "mental-health-expenses-prefecture", // 精神衛生費 — 本文 1492字 / [insights,regionalAnalysis,faq]
    "standard-fiscal-revenue-municipality", // 基準財政収入額 — 本文 1482字 / [insights,regionalAnalysis,faq]
    "national-treasury-disbursement-prefecture", // 国庫支出金 — 本文 1477字 / [insights,regionalAnalysis,faq]
    "total-assessed-land-area", // 評価総地積 — 本文 1477字 / [insights,regionalAnalysis,faq]
    "total-general-project-investment", // 一般事業総投資額 — 本文 1471字 / [insights,regionalAnalysis,faq]
    "local-special-grant-prefecture", // 地方特例交付金 — 本文 1468字 / [insights,regionalAnalysis,faq]
    "per-capita-total-expenditure-pref-municipal", // 歳出決算総額 — 本文 1468字 / [insights,regionalAnalysis,faq]
    "overtime-pay-admin-prefecture", // 一般行政職 時間外勤務手当 — 本文 1461字 / [insights,regionalAnalysis,faq]
    "national-treasury-disbursement-ratio-pref-finance", // 国庫支出金割合 — 本文 1460字 / [insights,regionalAnalysis,faq]
    "personnel-expenditure-ratio-pref-finance", // 人件費割合 — 本文 1452字 / [insights,regionalAnalysis,faq]
  ],
  "K-S2-05": [
    "infant-mortality-rate-per-1000-births", // 日本国勢図会 evidence — 乳児死亡率 / 本文 1510字 / [insights,regionalAnalysis,faq]
    "average-life-expectancy-male", // 日本国勢図会 evidence — 男性の平均余命 / 本文 1491字 / [insights,regionalAnalysis,faq]
    "average-life-expectancy-female-20", // 日本国勢図会 evidence — 20歳女性の平均余命 / 本文 1446字 / [insights,regionalAnalysis,faq]
    "infant-deaths", // 日本国勢図会 evidence — 乳児死亡数 / 本文 1153字 / [insights,regionalAnalysis,faq]
    "healthcare-expenditure-ratio-multi-person-households", // 保健医療費割合 — 本文 2261字 / [insights,regionalAnalysis,faq]
    "general-clinic-count", // 一般診療所数 — 本文 2160字 / [insights,regionalAnalysis,faq]
    "national-pension-enrollees-type3-per-1000-20-59", // 第3号国民年金被保険者数 — 本文 2083字 / [insights,regionalAnalysis,faq]
    "treatment-rate-arthrosis-inpatient", // 関節症の受療率（入院） — 本文 2052字 / [insights,regionalAnalysis,faq]
    "general-hospital-count-per-100km2", // 一般病院数 — 本文 2002字 / [insights,regionalAnalysis,faq]
    "welfare-facilities-count-per-100k-on-assistance", // 保護施設数 — 本文 1993字 / [insights,regionalAnalysis,faq]
    "treatment-rate-cancer-inpatient", // がん（悪性新生物）の受療率（入院） — 本文 1992字 / [insights,regionalAnalysis,faq]
    "treatment-rate-mental-disorder-outpatient", // 精神及び行動の障害の受療率（外来） — 本文 1992字 / [insights,regionalAnalysis,faq]
    "general-hospital-avg-length-of-stay", // 一般病院平均在院日数 — 本文 1980字 / [insights,regionalAnalysis,faq]
    "senior-recreation-home-count-per-100k-65plus", // 老人憩の家数 — 本文 1973字 / [insights,regionalAnalysis,faq]
    "treatment-rate-circulatory-outpatient", // 循環器系の疾患の受療率（外来） — 本文 1969字 / [insights,regionalAnalysis,faq]
    "dental-checkup-guidance-persons-per-1000", // 歯科健診・保健指導延人員 — 本文 1955字 / [insights,regionalAnalysis,faq]
    "dental-technician-rate", // 歯科技工士率（人口10万対） — 本文 1942字 / [insights,regionalAnalysis,faq]
    "nursing-welfare-facility-count-per-100k-65plus", // 介護老人福祉施設数 — 本文 1939字 / [insights,regionalAnalysis,faq]
    "dental-checkup-persons", // 歯科健診受診延人員 — 本文 1917字 / [insights,regionalAnalysis,faq]
    "social-welfare-expenditure-ratio-pref-finance", // 社会福祉費割合 — 本文 1882字 / [insights,regionalAnalysis,faq]
    "psychiatric-outpatients-per-fulltime-physician-per-day", // 精神科病院外来患者数 — 本文 1881字 / [insights,regionalAnalysis,faq]
    "psychiatric-inpatients-per-nurse-per-day", // 精神科病院在院患者数 — 本文 1874字 / [insights,regionalAnalysis,faq]
    "dental-checkup-persons-per-1000", // 歯科健診受診延人員 — 本文 1872字 / [insights,regionalAnalysis,faq]
    "public-general-hospital-ratio", // 公立一般病院数の割合 — 本文 1859字 / [insights,regionalAnalysis,faq]
    "national-health-insurance-visit-rate-per-1000", // 国民健康保険受診率 — 本文 1852字 / [insights,regionalAnalysis,faq]
    "psychiatric-bed-count-per-100k", // 精神病床数 — 本文 1832字 / [insights,regionalAnalysis,faq]
    "dentists-in-medical-facilities", // 歯科医師数 — 本文 1821字 / [insights,regionalAnalysis,faq]
    "senior-recreation-home-staff-per-100k-65plus", // 老人憩の家従事者数 — 本文 1818字 / [insights,regionalAnalysis,faq]
    "nursing-home-capacity-per-1000-65plus", // 老人ホーム定員数 — 本文 1814字 / [insights,regionalAnalysis,faq]
    "average-life-expectancy-female-65", // 平均余命 — 本文 1812字 / [insights,regionalAnalysis,faq]
    "japan-health-insurance-society-enrollees-per-1000", // 全国保険協会管掌健康保険加入者数 — 本文 1812字 / [insights,regionalAnalysis,faq]
    "annual-new-inpatients-general-hospital-per-100k", // 一般病院年間新入院患者数 — 本文 1801字 / [insights,regionalAnalysis,faq]
    "complainant-rate-per-1000", // 有訴者率 — 本文 1794字 / [insights,regionalAnalysis,faq]
  ],
  "K-S2-06": [
    "nursery-children-per-nursery-teacher", // 保育所等在所児数 — 本文 2099字 / [insights,regionalAnalysis,faq]
    "child-welfare-expenses-prefecture", // 児童福祉費 — 本文 2036字 / [insights,regionalAnalysis,faq]
    "hobby-participation-rate-music-listening", // CD・スマートフォンなどによる音楽鑑賞の行動者率 — 本文 2003字 / [insights,regionalAnalysis,faq]
    "public-university-student-ratio", // 公立大学学生数割合 — 本文 1985字 / [insights,regionalAnalysis,faq]
    "specialized-school-count-per-100k", // 専修学校数 — 本文 1964字 / [insights,regionalAnalysis,faq]
    "public-elementary-school-gym-installation-rate", // 公立小学校屋内運動場設置率 — 本文 1952字 / [insights,regionalAnalysis,faq]
    "sports-participation-rate-walking", // ウォーキング・軽い体操の行動者率 — 本文 1948字 / [insights,regionalAnalysis,faq]
    "public-gymnasium-count-per-million", // 体育館数 — 本文 1946字 / [insights,regionalAnalysis,faq]
    "public-junior-high-school-pool-installation-rate", // 公立中学校プール設置率 — 本文 1936字 / [insights,regionalAnalysis,faq]
    "private-university-student-ratio", // 私立大学学生数割合 — 本文 1924字 / [insights,regionalAnalysis,faq]
    "art-museum-count", // 美術博物館数 — 本文 1908字 / [insights,regionalAnalysis,faq]
    "final-education-junior-college-technical-college-ratio", // 最終学歴が短大・高専卒の者の割合 — 本文 1908字 / [insights,regionalAnalysis,faq]
    "education-expenditure-ratio-multi-person-households", // 教育費割合 — 本文 1890字 / [insights,regionalAnalysis,faq]
    "hobby-participation-rate-home-movie", // 映画館以外での映画鑑賞の行動者率 — 本文 1885字 / [insights,regionalAnalysis,faq]
    "study-participation-rate-english", // 英語学習の行動者率 — 本文 1879字 / [insights,regionalAnalysis,faq]
    "elementary-school-expenses-prefecture", // 小学校費 — 本文 1877字 / [insights,regionalAnalysis,faq]
    "final-education-university-graduate-school-ratio", // 最終学歴が大学・大学院卒の者の割合 — 本文 1876字 / [insights,regionalAnalysis,faq]
    "hobby-participation-rate-writing", // 詩・和歌・俳句・小説などの創作の行動者率 — 本文 1873字 / [insights,regionalAnalysis,faq]
    "sports-participation-rate-basketball", // バスケットボールの行動者率 — 本文 1866字 / [insights,regionalAnalysis,faq]
    "hobby-participation-rate-knitting", // 編み物・手芸の行動者率 — 本文 1851字 / [insights,regionalAnalysis,faq]
    "public-nursery-ratio", // 公営保育所等割合 — 本文 1850字 / [insights,regionalAnalysis,faq]
    "hobby-participation-rate-diy", // 日曜大工の行動者率 — 本文 1841字 / [insights,regionalAnalysis,faq]
    "study-participation-rate-business", // 商業実務・ビジネス関係の行動者率 — 本文 1836字 / [insights,regionalAnalysis,faq]
    "sports-participation-rate-softball", // ソフトボールの行動者率 — 本文 1835字 / [insights,regionalAnalysis,faq]
    "public-high-school-student-ratio", // 公立高等学校生徒比率 — 本文 1833字 / [insights,regionalAnalysis,faq]
    "average-height-primary-school-fifth-grade-female", // 平均身長 — 本文 1829字 / [insights,regionalAnalysis,faq]
    "high-school-new-graduates-job-opening-ratio", // 高等学校新規卒業者の求人倍率 — 本文 1827字 / [insights,regionalAnalysis,faq]
    "secondary-education-school-count-per-100k-12-17", // 中等教育学校数 — 本文 1827字 / [insights,regionalAnalysis,faq]
    "golf-course-public", // ゴルフ場数（公共） — 本文 1821字 / [insights,regionalAnalysis,faq]
    "public-hall-count", // 公民館数 — 本文 1817字 / [insights,regionalAnalysis,faq]
  ],
  "K-S2-07": [
    "households-on-public-assistance-per-1000", // 日本国勢図会 evidence — 生活保護世帯千対 / 本文 1682字 / [insights,regionalAnalysis,faq]
    "households-on-public-assistance", // 日本国勢図会 evidence — 生活保護実世帯数 / 本文 883字 / [insights,regionalAnalysis,faq]
    "cpi-change-rate-furniture", // 消費者物価指数変化率 — 本文 2097字 / [insights,regionalAnalysis,faq]
    "cpi-change-rate-transport-communication", // 消費者物価指数変化率 — 本文 2032字 / [insights,regionalAnalysis,faq]
    "nature-park-area-ratio", // 自然公園面積割合 — 本文 1954字 / [insights,regionalAnalysis,faq]
    "national-park-area", // 国立公園面積 — 本文 1932字 / [insights,regionalAnalysis,faq]
    "consumer-price-difference-index-clothing-footwear", // 消費者物価地域差指数 — 本文 1925字 / [insights,regionalAnalysis,faq]
    "consumer-price-difference-index-housing", // 消費者物価地域差指数 — 本文 1911字 / [insights,regionalAnalysis,faq]
    "consumer-price-difference-index-furniture-household", // 消費者物価地域差指数 — 本文 1910字 / [insights,regionalAnalysis,faq]
    "consumer-price-difference-index-miscellaneous", // 消費者物価地域差指数 — 本文 1910字 / [insights,regionalAnalysis,faq]
    "land-rent-consumption-expenditure", // 地代消費支出額 — 本文 1870字 / [insights,regionalAnalysis,faq]
    "maximum-snow-depth", // 最深積雪 — 本文 1828字 / [insights,regionalAnalysis,faq]
    "cpi-change-rate-housing", // 消費者物価指数変化率 — 本文 1827字 / [insights,regionalAnalysis,faq]
    "public-rent-consumption-expenditure", // 公営家賃消費支出額 — 本文 1816字 / [insights,regionalAnalysis,faq]
    "annual-precipitation", // 年間降水量 — 本文 1776字 / [insights,regionalAnalysis,faq]
    "lowest-temperature", // 最低気温 — 本文 1776字 / [insights,regionalAnalysis,faq]
    "cpi-change-rate-culture-recreation", // 消費者物価指数変化率 — 本文 1768字 / [insights,regionalAnalysis,faq]
    "average-temperature", // 年平均気温 — 本文 1763字 / [insights,regionalAnalysis,faq]
    "consumer-price-difference-index-education", // 消費者物価地域差指数 — 本文 1749字 / [insights,regionalAnalysis,faq]
    "habitable-area", // 可住地面積 — 本文 1745字 / [insights,regionalAnalysis,faq]
    "cpi-change-rate-education", // 消費者物価指数変化率 — 本文 1743字 / [insights,regionalAnalysis,faq]
    "total-assessed-land-area-ratio-residential", // 評価総地積割合 — 本文 1736字 / [insights,regionalAnalysis,faq]
    "consumer-price-difference-index-culture-recreation", // 消費者物価地域差指数 — 本文 1735字 / [insights,regionalAnalysis,faq]
    "urban-park-area-per-person", // 都市公園面積 — 本文 1730字 / [insights,regionalAnalysis,faq]
    "consumer-price-difference-index-transport-communication", // 消費者物価地域差指数 — 本文 1682字 / [insights,regionalAnalysis,faq]
    "habitable-area-ratio", // 可住地面積割合 — 本文 1669字 / [insights,regionalAnalysis,faq]
    "cpi-change-rate-miscellaneous", // 消費者物価指数変化率 — 本文 1658字 / [insights,regionalAnalysis,faq]
    "nature-park-area", // 自然公園面積 — 本文 1654字 / [insights,regionalAnalysis,faq]
    "residential-area-ratio", // 住居専用地域面積比率 — 本文 1652字 / [insights,regionalAnalysis,faq]
    "cpi-change-rate-total", // 消費者物価指数変化率 — 本文 1648字 / [insights,regionalAnalysis,faq]
    "cpi-change-rate-food", // 消費者物価指数変化率 — 本文 1645字 / [insights,regionalAnalysis,faq]
    "main-road-length-per-km2", // 主要道路実延長 — 本文 1645字 / [insights,regionalAnalysis,faq]
  ],
  "K-S2-08": [
    "commercial-and-neighborhood-commercial-area-ratio", // 商業・近隣商業地域面積比率 — 本文 2006字 / [insights,regionalAnalysis,faq]
    "large-retail-store-count-per-100k", // 大型小売店数 — 本文 1924字 / [insights,regionalAnalysis,faq]
    "restaurant-count-per-1000", // 飲食店数 — 本文 1796字 / [insights,regionalAnalysis,faq]
    "self-service-store-count-per-100k", // セルフサービス事業所数 — 本文 1789字 / [insights,regionalAnalysis,faq]
    "book-magazine-retail-annual-sales-per-capita", // 書籍・雑誌小売業年間商品販売額 — 本文 1783字 / [insights,regionalAnalysis,faq]
    "annual-sales-amount", // 商業年間商品販売額 — 本文 1774字 / [insights,regionalAnalysis,faq]
    "employee-ratio-1-4-employee-establishments-private", // 1〜4人事業所の従業者割合 — 本文 1771字 / [insights,regionalAnalysis,faq]
    "retail-store-count-per-1000", // 小売店数 — 本文 1765字 / [insights,regionalAnalysis,faq]
    "establishment-ratio-1-4-employees-private", // 従業者1～4人の事業所割合 — 本文 1754字 / [insights,regionalAnalysis,faq]
    "food-retail-store-count-per-1000", // 飲食料品小売店数 — 本文 1752字 / [insights,regionalAnalysis,faq]
    "standard-price-change-rate-commercial", // 標準価格対前年平均変動率 — 本文 1749字 / [insights,regionalAnalysis,faq]
    "public-bath-count-per-100k", // 公衆浴場数 — 本文 1743字 / [insights,regionalAnalysis,faq]
    "retail-establishments-by-prefecture", // 小売業事業所数（経済センサス活動調査） — 本文 1722字 / [insights,regionalAnalysis,faq]
    "employee-ratio-10-29-employee-establishments-private", // 10〜29人事業所の従業者割合 — 本文 1698字 / [insights,regionalAnalysis,faq]
    "self-service-store-count", // セルフサービス事業所数 — 本文 1658字 / [insights,regionalAnalysis,faq]
    "manufacturing-establishment-site-area", // 製造業事業所敷地面積 — 本文 1657字 / [insights,regionalAnalysis,faq]
    "establishment-ratio-5-9-employees-private", // 従業者5～9人の事業所割合 — 本文 1646字 / [insights,regionalAnalysis,faq]
    "convenience-store-count-per-100k", // コンビニエンスストア数 — 本文 1644字 / [insights,regionalAnalysis,faq]
    "public-bath-count", // 公衆浴場数 — 本文 1634字 / [insights,regionalAnalysis,faq]
    "establishment-ratio-10-29-employees-private", // 従業者10～29人の事業所割合 — 本文 1629字 / [insights,regionalAnalysis,faq]
    "department-supermarket-count-per-100k", // 百貨店、総合スーパー数 — 本文 1622字 / [insights,regionalAnalysis,faq]
    "secondary-industry-establishment-ratio-census", // 第2次産業事業所数構成比 — 本文 1611字 / [insights,regionalAnalysis,faq]
    "convenience-store-count", // コンビニエンスストア数 — 本文 1603字 / [insights,regionalAnalysis,faq]
    "establishment-ratio-300plus-employees-private", // 従業者300人以上の事業所割合 — 本文 1578字 / [insights,regionalAnalysis,faq]
    "retail-store-count-alt", // 小売店数 — 本文 1575字 / [insights,regionalAnalysis,faq]
    "passport-issuance-count-per-thousand", // 一般旅券発行件数 — 本文 1574字 / [insights,regionalAnalysis,faq]
    "employee-ratio-300plus-employee-establishments-private", // 300人以上事業所の従業者割合 — 本文 1569字 / [insights,regionalAnalysis,faq]
    "retail-sales-amount-by-prefecture", // 小売業年間商品販売額（経済センサス活動調査） — 本文 1523字 / [insights,regionalAnalysis,faq]
    "annual-sales-amount-per-establishment", // 商業年間商品販売額 — 本文 1513字 / [insights,regionalAnalysis,faq]
    "neighborhood-commercial-area-ratio", // 近隣商業地域面積比率 — 本文 1488字 / [insights,regionalAnalysis,faq]
  ],
  "K-S2-09": [
    "agricultural-output", // 日本国勢図会 evidence — 農業産出額 / 本文 1343字 / [insights,regionalAnalysis,faq]
    "other-consumption-expenditure-ratio-multi-person-households", // その他の消費支出割合 — 本文 2288字 / [insights,regionalAnalysis,faq]
    "per-capita-kenmin-shotoku-h17", // 1人当たり県民所得 — 本文 2233字 / [insights,regionalAnalysis,faq]
    "agriculture-forestry-fisheries-expenses-prefecture", // 農林水産業費 — 本文 1970字 / [insights,regionalAnalysis,faq]
    "forest-area-ratio", // 森林面積割合 — 本文 1957字 / [insights,regionalAnalysis,faq]
    "securities-balance", // 有価証券保有額 — 本文 1938字 / [insights,regionalAnalysis,faq]
    "non-agricultural-income-ratio", // 農外所得割合 — 本文 1930字 / [insights,regionalAnalysis,faq]
    "cpi-regional-difference-index-food-51cities100", // 消費者物価地域差指数 — 本文 1878字 / [insights,regionalAnalysis,faq]
    "gross-prefectural-income-growth-rate-real-h17", // 県民総所得対前年増加率 — 本文 1878字 / [insights,regionalAnalysis,faq]
    "gdp-growth-rate-pref-h17", // 県内総生産額対前年増加率 — 本文 1864字 / [insights,regionalAnalysis,faq]
    "prefectural-income-growth-rate-h17", // 県民所得対前年増加率 — 本文 1846字 / [insights,regionalAnalysis,faq]
    "furniture-household-goods-expenditure-ratio-multi-person-households", // 家具・家事用品費割合 — 本文 1836字 / [insights,regionalAnalysis,faq]
    "private-auto-insurance-penetration-rate-vehicle", // 任意自動車保険普及率 — 本文 1836字 / [insights,regionalAnalysis,faq]
    "financial-assets-balance-multi-person-households", // 貯蓄現在高 — 本文 1820字 / [insights,regionalAnalysis,faq]
    "private-life-insurance-contracts-per-1000", // 民間生命保険保有契約件数 — 本文 1819字 / [insights,regionalAnalysis,faq]
    "average-propensity-to-consume-of-farm-households", // 農家世帯の平均消費性向 — 本文 1803字 / [insights,regionalAnalysis,faq]
    "private-auto-insurance-penetration-rate-person", // 任意自動車保険普及率 — 本文 1799字 / [insights,regionalAnalysis,faq]
    "cultivated-area", // 耕地面積 — 本文 1786字 / [insights,regionalAnalysis,faq]
    "current-securities-balance-ratio-multi-person-households", // 有価証券現在高割合 — 本文 1780字 / [insights,regionalAnalysis,faq]
    "cpi-regional-difference-index-total-tokyo100", // 消費者物価地域差指数 — 本文 1753字 / [insights,regionalAnalysis,faq]
    "per-capita-national-tax-collected", // 国税徴収決定済額 — 本文 1752字 / [insights,regionalAnalysis,faq]
    "private-life-insurance-contracts", // 民間生命保険保有契約件数 — 本文 1749字 / [insights,regionalAnalysis,faq]
    "avg-savings-rate-worker-households", // 平均貯蓄率 — 本文 1748字 / [insights,regionalAnalysis,faq]
    "fish-catch", // 漁獲量 — 本文 1742字 / [insights,regionalAnalysis,faq]
    "marine-fishery-catch", // 海面漁業漁獲量 — 本文 1729字 / [insights,regionalAnalysis,faq]
    "per-capita-inhabitant-tax-pref-municipal", // 住民税 — 本文 1729字 / [insights,regionalAnalysis,faq]
    "agricultural-income-ratio", // 農業所得割合 — 本文 1723字 / [insights,regionalAnalysis,faq]
    "rice-yield-per-10a", // 水稲10a当たり収量 — 本文 1721字 / [insights,regionalAnalysis,faq]
    "total-farm-household-income", // 農家総所得 — 本文 1714字 / [insights,regionalAnalysis,faq]
    "household-head-income-worker-households-per-month", // 世帯主収入 — 本文 1707字 / [insights,regionalAnalysis,faq]
  ],
  "K-S2-10": [
    "tatami-per-person-rented", // 借家住宅の畳数 — 本文 2344字 / [insights,regionalAnalysis,faq]
    "suicide-rate-per-100k", // 自殺率 — 本文 2260字 / [insights,regionalAnalysis,faq]
    "solar-power-housing", // 太陽光を利用した発電機器のある住宅数 — 本文 2006字 / [insights,regionalAnalysis,faq]
    "subcontractor-completed-construction", // 下請完成工事高 — 本文 1982字 / [insights,regionalAnalysis,faq]
    "barrier-free-housing-rate", // バリアフリー化住宅率 — 本文 1968字 / [insights,regionalAnalysis,faq]
    "new-condo-starts", // 着工新設分譲住宅数 — 本文 1955字 / [insights,regionalAnalysis,faq]
    "gas-station-count-per-100km", // 給油所数 — 本文 1946字 / [insights,regionalAnalysis,faq]
    "residential-telephone-subscription-count-per-1000", // 住宅用電話加入数 — 本文 1932字 / [insights,regionalAnalysis,faq]
    "housing-land-liabilities-ratio-multi-person-households", // 住宅・土地のための負債割合 — 本文 1904字 / [insights,regionalAnalysis,faq]
    "cod-pollution-load", // COD汚濁負荷量 — 本文 1891字 / [insights,regionalAnalysis,faq]
    "average-broadcast-media-consumption-time-employed-man", // テレビ・ラジオ・新聞・雑誌の平均時間 — 本文 1881字 / [insights,regionalAnalysis,faq]
    "disaster-damage-amount-per-person", // 災害被害額 — 本文 1876字 / [insights,regionalAnalysis,faq]
    "theft-criminal-arrest-rate", // 窃盗犯検挙率 — 本文 1874字 / [insights,regionalAnalysis,faq]
    "site-area-per-dwelling", // 住宅の敷地面積 — 本文 1855字 / [insights,regionalAnalysis,faq]
    "detached-house-ratio", // 一戸建住宅比率 — 本文 1850字 / [insights,regionalAnalysis,faq]
    "urban-planning-area", // 都市計画区域指定面積 — 本文 1847字 / [insights,regionalAnalysis,faq]
    "building-fire-count-per-100-thousand-people", // 火災出火件数 — 本文 1843字 / [insights,regionalAnalysis,faq]
    "fire-department-water-count-per-100-thousand-people", // 消防水利数 — 本文 1836字 / [insights,regionalAnalysis,faq]
    "renovation-rate", // リフォーム工事実施率 — 本文 1832字 / [insights,regionalAnalysis,faq]
    "criminal-recognition-count", // 刑法犯認知件数 — 本文 1827字 / [insights,regionalAnalysis,faq]
    "room-aircon-ownership-multi-person-households-per-1000", // ルームエアコン所有数量 — 本文 1824字 / [insights,regionalAnalysis,faq]
    "final-energy-consumption-per-capita", // 1人当たり最終エネルギー消費量 — 本文 1806字 / [insights,regionalAnalysis,faq]
    "city-gas-meter-count", // 都市ガスメーター取付数 — 本文 1797字 / [insights,regionalAnalysis,faq]
    "rented-housing-ratio", // 借家比率 — 本文 1797字 / [insights,regionalAnalysis,faq]
    "housing-expenditure-ratio-multi-person-households", // 住居費割合 — 本文 1795字 / [insights,regionalAnalysis,faq]
    "floor-area-new-rented-dwelling", // 着工新設貸家住宅の床面積 — 本文 1792字 / [insights,regionalAnalysis,faq]
    "new-housing-floor-area", // 着工新設住宅床面積 — 本文 1782字 / [insights,regionalAnalysis,faq]
    "suicides-per-100k", // 自殺者数 — 本文 1767字 / [insights,regionalAnalysis,faq]
    "utilities-expenditure-ratio-multi-person-households", // 光熱・水道費割合 — 本文 1766字 / [insights,regionalAnalysis,faq]
  ],
  "K-S2-11": [
    "other-fresh-fish-consumption-expenditure", // 他の鮮魚消費支出額 — 本文 2502字 / [insights,regionalAnalysis,faq]
    "personal-computer-consumption-expenditure", // パソコン消費支出額 — 本文 2375字 / [insights,regionalAnalysis,faq]
    "womens-stockings-consumption-quantity", // 婦人用ストッキング消費量 — 本文 2131字 / [insights,regionalAnalysis,faq]
    "sausage-consumption-quantity", // ソーセージ消費量 — 本文 2107字 / [insights,regionalAnalysis,faq]
    "air-conditioner-consumption-expenditure", // エアコン消費支出額 — 本文 2095字 / [insights,regionalAnalysis,faq]
    "vacuum-cleaner-consumption-expenditure", // 電気掃除機消費支出額 — 本文 2054字 / [insights,regionalAnalysis,faq]
    "womens-dress-consumption-quantity", // 婦人服消費量 — 本文 2020字 / [insights,regionalAnalysis,faq]
    "persimmon-consumption-quantity", // 柿消費量 — 本文 2006字 / [insights,regionalAnalysis,faq]
    "salted-salmon-consumption-expenditure", // 塩さけ消費支出額 — 本文 1997字 / [insights,regionalAnalysis,faq]
    "other-broadcast-fee-consumption-expenditure", // 他の放送受信料消費支出額 — 本文 1993字 / [insights,regionalAnalysis,faq]
    "other-dairy-consumption-expenditure", // 他の乳製品消費支出額 — 本文 1991字 / [insights,regionalAnalysis,faq]
    "table-salt-consumption-expenditure", // 食塩消費支出額 — 本文 1978字 / [insights,regionalAnalysis,faq]
    "jam-consumption-quantity", // ジャム消費量 — 本文 1976字 / [insights,regionalAnalysis,faq]
    "notebooks-paper-consumption-expenditure", // ノート・紙製品消費支出額 — 本文 1960字 / [insights,regionalAnalysis,faq]
    "school-bag-consumption-expenditure", // 通学用かばん消費支出額 — 本文 1926字 / [insights,regionalAnalysis,faq]
    "microwave-consumption-quantity", // 電子レンジ消費量 — 本文 1917字 / [insights,regionalAnalysis,faq]
    "probiotic-drink-consumption-expenditure", // 乳酸菌飲料消費支出額 — 本文 1917字 / [insights,regionalAnalysis,faq]
    "savory-bread-consumption-expenditure", // 調理パン消費支出額 — 本文 1917字 / [insights,regionalAnalysis,faq]
    "newspaper-consumption-expenditure", // 新聞消費支出額 — 本文 1912字 / [insights,regionalAnalysis,faq]
    "ritual-goods-tombstone-consumption-expenditure", // 祭具・墓石消費支出額 — 本文 1896字 / [insights,regionalAnalysis,faq]
    "recorded-media-consumption-expenditure", // 音楽・映像収録済メディア消費支出額 — 本文 1885字 / [insights,regionalAnalysis,faq]
    "other-footwear-consumption-expenditure", // 他の履物消費支出額 — 本文 1878字 / [insights,regionalAnalysis,faq]
    "whisky-consumption-expenditure", // ウイスキー消費支出額 — 本文 1867字 / [insights,regionalAnalysis,faq]
    "shimeji-consumption-expenditure", // しめじ消費支出額 — 本文 1865字 / [insights,regionalAnalysis,faq]
    "study-desk-chair-consumption-expenditure", // 書斎・学習用机・椅子消費支出額 — 本文 1864字 / [insights,regionalAnalysis,faq]
    "sports-club-fee-consumption-expenditure", // スポーツクラブ使用料消費支出額 — 本文 1858字 / [insights,regionalAnalysis,faq]
    "washing-machine-consumption-quantity", // 電気洗濯機消費量 — 本文 1857字 / [insights,regionalAnalysis,faq]
    "ham-consumption-expenditure", // ハム消費支出額 — 本文 1854字 / [insights,regionalAnalysis,faq]
    "non-car-vehicle-maintenance-consumption-expenditure", // 自動車以外の輸送機器整備費消費支出額 — 本文 1853字 / [insights,regionalAnalysis,faq]
    "other-household-consumables-consumption-expenditure", // 他の家事用消耗品のその他消費支出額 — 本文 1852字 / [insights,regionalAnalysis,faq]
  ],
  "K-S3-01": [
    "national-park-area", // 国立公園面積 — 本文 1932字 / 地域特徴度 1.00
    "ritual-goods-tombstone-consumption-expenditure", // 祭具・墓石消費支出額 — 本文 1896字 / 地域特徴度 1.00
    "hobby-participation-rate-camping", // キャンプの行動者率 — 本文 1816字 / 地域特徴度 1.00
    "scarf-consumption-expenditure", // マフラー・スカーフ消費支出額 — 本文 2045字 / 地域特徴度 0.96
    "grilled-eel-consumption-expenditure", // うなぎのかば焼き消費支出額 — 本文 1778字 / 地域特徴度 1.00
    "other-health-service-consumption-expenditure", // 他の保健医療サービス消費支出額 — 本文 1758字 / 地域特徴度 1.00
    "average-persons-per-general-household", // 一般世帯の平均人員 — 本文 1915字 / 地域特徴度 0.96
    "paved-road-main-length", // 舗装道路実延長（主要道路） — 本文 1709字 / 地域特徴度 1.00
    "mens-coat-consumption-quantity", // 男子用コート消費量 — 本文 1698字 / 地域特徴度 1.00
    "smoke-emission-facility-count", // ばい煙発生施設数 — 本文 1628字 / 地域特徴度 1.00
    "general-clinic-count-per-100km2", // 一般診療所数 — 本文 1584字 / 地域特徴度 1.00
    "cultivated-land-area-per-household", // 耕地面積 — 本文 1571字 / 地域特徴度 1.00
    "other-shellfish-consumption-quantity", // 他の貝消費量 — 本文 1758字 / 地域特徴度 0.96
    "total-assessed-land-area-ratio-residential", // 評価総地積割合 — 本文 1736字 / 地域特徴度 0.96
    "fire-department-branch-count-per-100-km2", // 消防団・分団数 — 本文 1525字 / 地域特徴度 1.00
    "average-broadcast-media-consumption-time-employed-woman", // テレビ・ラジオ・新聞・雑誌の平均時間 — 本文 1524字 / 地域特徴度 1.00
    "high-school-count", // 高等学校数 — 本文 1718字 / 地域特徴度 0.96
    "junior-high-school-count-per-100km2-habitable", // 中学校数 — 本文 1501字 / 地域特徴度 1.00
    "marine-aquaculture-harvest", // 海面養殖業収獲量 — 本文 1498字 / 地域特徴度 1.00
    "private-life-insurance-contract-amount-per-household", // 民間生命保険保険金額 — 本文 1678字 / 地域特徴度 0.96
    "tennis-court-public", // テニスコート数（公共） — 本文 1472字 / 地域特徴度 1.00
    "overtime-pay-admin-prefecture", // 一般行政職 時間外勤務手当 — 本文 1461字 / 地域特徴度 1.00
    "current-deposit-balance-ratio-multi-person-households", // 預貯金現在高割合 — 本文 1654字 / 地域特徴度 0.96
    "non-car-vehicle-maintenance-consumption-expenditure", // 自動車以外の輸送機器整備費消費支出額 — 本文 1853字 / 地域特徴度 0.91
    "public-assistance-medical-beneficiaries-per-1000", // 生活保護医療扶助人員 — 本文 1645字 / 地域特徴度 0.96
    "company-housing-rent-consumption-quantity", // 給与住宅家賃消費量 — 本文 1415字 / 地域特徴度 1.00
    "infant-clothes-consumption-expenditure", // 乳児服消費支出額 — 本文 1592字 / 地域特徴度 0.96
    "natural-environment-conservation-area", // 自然環境保全地域面積 — 本文 1587字 / 地域特徴度 0.96
    "roadside-station-count", // 道の駅数 — 本文 1377字 / 地域特徴度 1.00
    "road-national-route-length", // 道路実延長（一般国道） — 本文 1376字 / 地域特徴度 1.00
  ],
  "K-S3-02": [
    "final-education-junior-college-technical-college-ratio", // 最終学歴が短大・高専卒の者の割合 — 本文 1908字 / 地域特徴度 0.83
    "scarf-consumption-expenditure", // マフラー・スカーフ消費支出額 — 本文 2045字 / 地域特徴度 0.80
    "burdock-consumption-quantity", // ごぼう消費量 — 本文 1930字 / 地域特徴度 0.80
    "marriages-per-total-population", // 婚姻率 — 本文 2011字 / 地域特徴度 0.77
    "passport-issuance-count-per-thousand", // 一般旅券発行件数 — 本文 1574字 / 地域特徴度 0.86
    "study-participation-rate-business", // 商業実務・ビジネス関係の行動者率 — 本文 1836字 / 地域特徴度 0.78
    "cup-noodles-consumption-expenditure", // カップ麺消費支出額 — 本文 1465字 / 地域特徴度 0.86
    "outpatient-rate-per-1000", // 通院者率 — 本文 1606字 / 地域特徴度 0.80
    "ramen-dining-consumption-expenditure", // 中華そば消費支出額 — 本文 1971字 / 地域特徴度 0.72
    "hobby-participation-rate-music-listening", // CD・スマートフォンなどによる音楽鑑賞の行動者率 — 本文 2003字 / 地域特徴度 0.70
    "tissue-paper-consumption-expenditure", // ティッシュペーパー消費支出額 — 本文 1425字 / 地域特徴度 0.82
    "cable-tv-fee-consumption-expenditure", // ケーブルテレビ放送受信料消費支出額 — 本文 1843字 / 地域特徴度 0.72
    "residential-telephone-subscription-count-per-1000", // 住宅用電話加入数 — 本文 1932字 / 地域特徴度 0.70
    "kerosene-consumption-quantity", // 灯油消費量 — 本文 1483字 / 地域特徴度 0.80
    "junior-high-school-count-per-100km2-habitable", // 中学校数 — 本文 1501字 / 地域特徴度 0.79
    "sports-participation-rate-yoga", // ヨガの行動者率 — 本文 1702字 / 地域特徴度 0.75
    "deaths-diabetes-per-100k", // 糖尿病による死亡者数 — 本文 1390字 / 地域特徴度 0.80
    "fulfillment-rate", // 充足率 — 本文 1806字 / 地域特徴度 0.71
    "gdp-growth-rate-pref-h17", // 県内総生産額対前年増加率 — 本文 1864字 / 地域特徴度 0.70
    "other-salted-dried-fish-consumption-expenditure", // 他の塩干魚介消費支出額 — 本文 1421字 / 地域特徴度 0.79
    "general-clinic-count-per-100km2", // 一般診療所数 — 本文 1584字 / 地域特徴度 0.75
    "dried-udon-soba-consumption-quantity", // 乾うどん・そば消費量 — 本文 1491字 / 地域特徴度 0.77
    "elementary-school-long-absence-ratio-nonattendance-over-30days-per-1000", // 不登校による小学校長期欠席児童比率 — 本文 1447字 / 地域特徴度 0.78
    "chocolate-consumption-expenditure", // チョコレート消費支出額 — 本文 1587字 / 地域特徴度 0.74
    "other-mushroom-consumption-quantity", // 他のきのこ消費量 — 本文 1485字 / 地域特徴度 0.76
    "urban-park-count-per-100km2", // 都市公園数 — 本文 1719字 / 地域特徴度 0.71
    "municipal-road-paving-rate", // 市町村道舗装率 — 本文 1540字 / 地域特徴度 0.75
    "cultivated-land-area-per-household", // 耕地面積 — 本文 1571字 / 地域特徴度 0.74
    "non-car-vehicle-maintenance-consumption-expenditure", // 自動車以外の輸送機器整備費消費支出額 — 本文 1853字 / 地域特徴度 0.67
    "wakame-consumption-expenditure", // わかめ消費支出額 — 本文 1565字 / 地域特徴度 0.72
  ],
  "K-S3-03": [
    "consumer-price-difference-index-overall", // 消費者物価地域差指数 — 本文 1505字 / 地域特徴度 0.86
    "transport-communication-expenditure-ratio-multi-person-households", // 交通・通信費割合 — 本文 1643字 / 地域特徴度 0.81
    "governor-salary-prefecture", // 知事 給料月額 — 本文 1506字 / 地域特徴度 0.83
    "car-insurance-mandatory-consumption-expenditure", // 自動車保険料(自賠責)消費支出額 — 本文 1541字 / 地域特徴度 0.81
    "sports-participation-rate-cycling", // サイクリングの行動者率 — 本文 1663字 / 地域特徴度 0.78
    "other-health-service-consumption-expenditure", // 他の保健医療サービス消費支出額 — 本文 1758字 / 地域特徴度 0.75
    "treatment-rate-arthrosis-inpatient", // 関節症の受療率（入院） — 本文 2052字 / 地域特徴度 0.69
    "criminal-recognition-count", // 刑法犯認知件数 — 本文 1827字 / 地域特徴度 0.72
    "middle-aged-job-ratio-45plus", // 就職者に占める中高年齢者の比率 — 本文 1444字 / 地域特徴度 0.80
    "total-assessed-land-area-ratio-residential", // 評価総地積割合 — 本文 1736字 / 地域特徴度 0.73
    "other-personal-items-consumption-expenditure", // 他の身の回り用品消費支出額 — 本文 1758字 / 地域特徴度 0.73
    "dependent-population-index", // 従属人口指数 — 本文 1806字 / 地域特徴度 0.70
    "welfare-commissioner-count-per-100k", // 民生委員数 — 本文 1680字 / 地域特徴度 0.73
    "sports-participation-rate-jogging", // ジョギング・マラソンの行動者率 — 本文 1707字 / 地域特徴度 0.72
    "study-participation-rate-business", // 商業実務・ビジネス関係の行動者率 — 本文 1836字 / 地域特徴度 0.69
    "physical-disability-rehabilitation-facility-capacity-per-100k", // 身体障害者更生援護施設定員数 — 本文 1440字 / 地域特徴度 0.77
    "per-student-public-junior-high-school-expenditure-pref-municipal", // 公立中学校費 — 本文 1612字 / 地域特徴度 0.73
    "moving-in-excess-rate", // 転入超過率 — 本文 1681字 / 地域特徴度 0.71
    "tableware-consumption-expenditure", // 茶わん・皿・鉢消費支出額 — 本文 1790字 / 地域特徴度 0.69
    "womens-sweater-consumption-expenditure", // 婦人用セーター消費支出額 — 本文 1962字 / 地域特徴度 0.65
    "other-household-goods-consumption-expenditure", // 他の家事雑貨消費支出額 — 本文 1699字 / 地域特徴度 0.71
    "cpi-change-rate-culture-recreation", // 消費者物価指数変化率 — 本文 1768字 / 地域特徴度 0.69
    "strawberry-consumption-expenditure", // いちご消費支出額 — 本文 1294字 / 地域特徴度 0.79
    "hobby-participation-rate-music-listening", // CD・スマートフォンなどによる音楽鑑賞の行動者率 — 本文 2003字 / 地域特徴度 0.63
    "public-university-consumption-expenditure", // 国公立大学消費支出額 — 本文 1791字 / 地域特徴度 0.68
    "specialized-school-count-per-100k", // 専修学校数 — 本文 1964字 / 地域特徴度 0.63
    "financial-debt-balance", // 金融負債残高 — 本文 1529字 / 地域特徴度 0.72
    "per-capita-inhabitant-tax-pref-municipal", // 住民税 — 本文 1729字 / 地域特徴度 0.68
    "in-prefecture-employed-people-ratio", // 県内就業者比率 — 本文 1639字 / 地域特徴度 0.70
    "fire-department-pump-car-count-per-100-thousand-people", // 消防ポンプ自動車等現有数 — 本文 1718字 / 地域特徴度 0.68
  ],
  "K-S3-04": [
    "secondary-industry-employees-per-establishment-census", // 第2次産業従業者数 — 本文 2026字 / 地域特徴度 0.68
    "game-console-consumption-expenditure", // ゲーム機消費支出額 — 本文 1749字 / 地域特徴度 0.73
    "public-assistance-medical-beneficiaries-per-1000", // 生活保護医療扶助人員 — 本文 1645字 / 地域特徴度 0.74
    "paved-road-main-length", // 舗装道路実延長（主要道路） — 本文 1709字 / 地域特徴度 0.69
    "vacuum-cleaner-consumption-expenditure", // 電気掃除機消費支出額 — 本文 2054字 / 地域特徴度 0.62
    "supplement-consumption-expenditure", // 栄養剤消費支出額 — 本文 1683字 / 地域特徴度 0.68
    "employed-people-ratio-secondary", // 第2次産業就業者比率 — 本文 1659字 / 地域特徴度 0.69
    "annual-sunshine-duration", // 年間日照時間 — 本文 1522字 / 地域特徴度 0.71
    "private-auto-insurance-penetration-rate-vehicle", // 任意自動車保険普及率 — 本文 1836字 / 地域特徴度 0.64
    "mens-coat-consumption-quantity", // 男子用コート消費量 — 本文 1698字 / 地域特徴度 0.67
    "refrigerator-consumption-quantity", // 電気冷蔵庫消費量 — 本文 1685字 / 地域特徴度 0.66
    "national-park-area", // 国立公園面積 — 本文 1932字 / 地域特徴度 0.61
    "senior-recreation-home-staff-per-100k-65plus", // 老人憩の家従事者数 — 本文 1818字 / 地域特徴度 0.63
    "non-car-vehicle-maintenance-consumption-expenditure", // 自動車以外の輸送機器整備費消費支出額 — 本文 1853字 / 地域特徴度 0.62
    "water-pollution-control-law-facility-count", // 水質汚濁防止法上の特定事業場数 — 本文 1539字 / 地域特徴度 0.69
    "annual-precipitation", // 年間降水量 — 本文 1776字 / 地域特徴度 0.63
    "road-national-route-length", // 道路実延長（一般国道） — 本文 1376字 / 地域特徴度 0.71
    "tatami-per-person-owner", // 持ち家住宅の畳数 — 本文 1687字 / 地域特徴度 0.63
    "cable-tv-fee-consumption-expenditure", // ケーブルテレビ放送受信料消費支出額 — 本文 1843字 / 地域特徴度 0.60
    "dried-mackerel-consumption-quantity", // 干しあじ消費量 — 本文 1662字 / 地域特徴度 0.64
    "dental-checkup-guidance-persons-per-1000", // 歯科健診・保健指導延人員 — 本文 1955字 / 地域特徴度 0.57
    "treatment-rate-arthrosis-inpatient", // 関節症の受療率（入院） — 本文 2052字 / 地域特徴度 0.56
    "other-construction-consumption-expenditure", // 他の工事費消費支出額 — 本文 1473字 / 地域特徴度 0.67
    "university-capacity-index", // 大学収容力指数 — 本文 1810字 / 地域特徴度 0.60
    "pharmaceutical-sales-count-per-100k", // 医薬品販売業数 — 本文 1608字 / 地域特徴度 0.63
    "cultivated-land-area-per-household", // 耕地面積 — 本文 1571字 / 地域特徴度 0.64
    "postage-consumption-expenditure", // 郵便料消費支出額 — 本文 1818字 / 地域特徴度 0.58
    "consumer-price-difference-index-food", // 消費者物価地域差指数 — 本文 1418字 / 地域特徴度 0.67
    "voter-turnout-council-proportional", // 参議院議員選挙投票率（比例代表） — 本文 1955字 / 地域特徴度 0.55
    "mandarin-consumption-quantity", // みかん消費量 — 本文 1682字 / 地域特徴度 0.60
  ],
  "K-S3-05": [
    "labor-expenses-prefecture", // 労働費 — 本文 1996字 / 地域特徴度 0.76
    "secondary-industry-employees-per-establishment-census", // 第2次産業従業者数 — 本文 2026字 / 地域特徴度 0.70
    "probiotic-drink-consumption-expenditure", // 乳酸菌飲料消費支出額 — 本文 1917字 / 地域特徴度 0.71
    "university-capacity-index", // 大学収容力指数 — 本文 1810字 / 地域特徴度 0.73
    "annual-emergency-dispatches-per-1000", // 年間救急出動件数 — 本文 1602字 / 地域特徴度 0.76
    "mobile-phone-bill-consumption-expenditure", // 携帯電話通信料消費支出額 — 本文 1684字 / 地域特徴度 0.73
    "tableware-consumption-expenditure", // 茶わん・皿・鉢消費支出額 — 本文 1790字 / 地域特徴度 0.71
    "study-participation-rate-business", // 商業実務・ビジネス関係の行動者率 — 本文 1836字 / 地域特徴度 0.70
    "postage-consumption-expenditure", // 郵便料消費支出額 — 本文 1818字 / 地域特徴度 0.70
    "sewerage-coverage-rate", // 下水道処理人口普及率 — 本文 1483字 / 地域特徴度 0.76
    "white-bread-consumption-quantity", // 食パン消費量 — 本文 1550字 / 地域特徴度 0.74
    "psychiatric-hospital-count-per-100k", // 精神科病院数 — 本文 1682字 / 地域特徴度 0.71
    "flush-toilet-population-ratio", // 水洗化人口比率 — 本文 1806字 / 地域特徴度 0.68
    "plastic-bags-wrap-consumption-expenditure", // ポリ袋・ラップ消費支出額 — 本文 1824字 / 地域特徴度 0.67
    "rented-housing-ratio", // 借家比率 — 本文 1797字 / 地域特徴度 0.67
    "cold-medicine-consumption-expenditure", // 感冒薬消費支出額 — 本文 1417字 / 地域特徴度 0.75
    "study-participation-rate-home-economics", // 家政・家事の行動者率 — 本文 1636字 / 地域特徴度 0.70
    "gdp-growth-rate-pref-h17", // 県内総生産額対前年増加率 — 本文 1864字 / 地域特徴度 0.65
    "bamboo-shoot-consumption-quantity", // たけのこ消費量 — 本文 1645字 / 地域特徴度 0.69
    "prefectural-income-growth-rate-h17", // 県民所得対前年増加率 — 本文 1846字 / 地域特徴度 0.65
    "gas-cooking-appliance-consumption-expenditure", // 炊事用ガス器具消費支出額 — 本文 1910字 / 地域特徴度 0.63
    "nhk-fee-consumption-expenditure", // NHK放送受信料消費支出額 — 本文 1621字 / 地域特徴度 0.68
    "densely-inhabited-district-population-density", // 人口集中地区人口密度 — 本文 1586字 / 地域特徴度 0.68
    "residential-telephone-subscription-count-per-1000", // 住宅用電話加入数 — 本文 1932字 / 地域特徴度 0.61
    "in-prefecture-employed-people-ratio", // 県内就業者比率 — 本文 1639字 / 地域特徴度 0.67
    "dress-shirt-consumption-expenditure", // ワイシャツ消費支出額 — 本文 1621字 / 地域特徴度 0.66
    "senior-recreation-home-staff-per-100k-65plus", // 老人憩の家従事者数 — 本文 1818字 / 地域特徴度 0.61
    "floor-area-per-dwelling-rented", // 借家住宅の延べ面積 — 本文 1556字 / 地域特徴度 0.67
    "light-bulbs-consumption-expenditure", // 電球・ランプ消費支出額 — 本文 1608字 / 地域特徴度 0.66
    "ritual-goods-tombstone-consumption-expenditure", // 祭具・墓石消費支出額 — 本文 1896字 / 地域特徴度 0.60
  ],
  "K-S3-06": [
    "public-assistance-expenditure-ratio-pref-finance", // 生活保護費割合 — 本文 1643字 / 地域特徴度 0.83
    "prefectural-income-growth-rate-h17", // 県民所得対前年増加率 — 本文 1846字 / 地域特徴度 0.77
    "gdp-growth-rate-pref-h17", // 県内総生産額対前年増加率 — 本文 1864字 / 地域特徴度 0.76
    "voter-turnout-council-proportional", // 参議院議員選挙投票率（比例代表） — 本文 1955字 / 地域特徴度 0.71
    "ritual-goods-tombstone-consumption-expenditure", // 祭具・墓石消費支出額 — 本文 1896字 / 地域特徴度 0.72
    "air-conditioner-consumption-expenditure", // エアコン消費支出額 — 本文 2095字 / 地域特徴度 0.70
    "flood-damage-total", // 水害被害額合計 — 本文 1648字 / 地域特徴度 0.77
    "refrigerator-consumption-quantity", // 電気冷蔵庫消費量 — 本文 1685字 / 地域特徴度 0.75
    "sports-participation-rate-softball", // ソフトボールの行動者率 — 本文 1835字 / 地域特徴度 0.71
    "age-specific-death-rate-0-4-per-1000", // 年齢別死亡率 — 本文 1525字 / 地域特徴度 0.77
    "sashimi-platter-consumption-quantity", // さしみ盛合わせ消費量 — 本文 1550字 / 地域特徴度 0.77
    "bamboo-shoot-consumption-quantity", // たけのこ消費量 — 本文 1645字 / 地域特徴度 0.73
    "secondary-industry-employees-per-establishment-census", // 第2次産業従業者数 — 本文 2026字 / 地域特徴度 0.65
    "real-balance-ratio", // 実質収支比率 — 本文 1296字 / 地域特徴度 0.78
    "unmarried-ratio-female-25-29", // 未婚者割合 — 本文 1719字 / 地域特徴度 0.69
    "hobby-participation-rate-camping", // キャンプの行動者率 — 本文 1816字 / 地域特徴度 0.66
    "gloves-consumption-quantity", // 手袋消費量 — 本文 1546字 / 地域特徴度 0.70
    "cable-tv-fee-consumption-expenditure", // ケーブルテレビ放送受信料消費支出額 — 本文 1843字 / 地域特徴度 0.63
    "other-topical-medicine-consumption-expenditure", // 他の外用薬消費支出額 — 本文 1683字 / 地域特徴度 0.66
    "natural-environment-conservation-area", // 自然環境保全地域面積 — 本文 1587字 / 地域特徴度 0.68
    "criminal-recognition-count", // 刑法犯認知件数 — 本文 1827字 / 地域特徴度 0.63
    "gas-cooking-appliance-consumption-expenditure", // 炊事用ガス器具消費支出額 — 本文 1910字 / 地域特徴度 0.60
    "peach-consumption-quantity", // 桃消費量 — 本文 1328字 / 地域特徴度 0.71
    "chest-consumption-quantity", // たんす消費量 — 本文 1441字 / 地域特徴度 0.69
    "scarf-consumption-expenditure", // マフラー・スカーフ消費支出額 — 本文 2045字 / 地域特徴度 0.57
    "inpatients-per-nurse-per-day", // 一般病院在院患者数 — 本文 1544字 / 地域特徴度 0.66
    "long-term-care-medical-facility-count-per-100k-65plus", // 介護療養型医療施設数 — 本文 1733字 / 地域特徴度 0.62
    "total-inpatients", // 在院患者延数 — 本文 1747字 / 地域特徴度 0.61
    "other-bread-consumption-expenditure", // 他のパン消費支出額 — 本文 1664字 / 地域特徴度 0.63
    "other-publications-consumption-expenditure", // 他の印刷物消費支出額 — 本文 1562字 / 地域特徴度 0.64
  ],
  "K-S3-07": [
    "treatment-rate-arthrosis-inpatient", // 関節症の受療率（入院） — 本文 2052字 / 地域特徴度 0.91
    "long-term-care-medical-facility-count-per-100k-65plus", // 介護療養型医療施設数 — 本文 1733字 / 地域特徴度 0.88
    "refrigerator-consumption-quantity", // 電気冷蔵庫消費量 — 本文 1685字 / 地域特徴度 0.86
    "burdock-consumption-quantity", // ごぼう消費量 — 本文 1930字 / 地域特徴度 0.78
    "land-rent-consumption-expenditure", // 地代消費支出額 — 本文 1870字 / 地域特徴度 0.76
    "sewerage-coverage-rate", // 下水道処理人口普及率 — 本文 1483字 / 地域特徴度 0.84
    "cod-roe-consumption-quantity", // たらこ消費量 — 本文 1473字 / 地域特徴度 0.84
    "elderly-general-worker-old-population-ratio", // 高齢一般労働者割合 — 本文 1452字 / 地域特徴度 0.83
    "deaths-diabetes-per-100k", // 糖尿病による死亡者数 — 本文 1390字 / 地域特徴度 0.84
    "sports-participation-rate-softball", // ソフトボールの行動者率 — 本文 1835字 / 地域特徴度 0.74
    "postage-consumption-expenditure", // 郵便料消費支出額 — 本文 1818字 / 地域特徴度 0.74
    "other-dried-vegetables-seaweed-consumption-expenditure", // 他の乾物・海藻消費支出額 — 本文 1564字 / 地域特徴度 0.79
    "sports-participation-rate-yoga", // ヨガの行動者率 — 本文 1702字 / 地域特徴度 0.76
    "inpatients-per-nurse-per-day", // 一般病院在院患者数 — 本文 1544字 / 地域特徴度 0.79
    "hobby-participation-rate-japanese-dance", // 邦舞・おどりの行動者率 — 本文 1683字 / 地域特徴度 0.76
    "theater-music-hall", // 劇場・音楽堂等数 — 本文 1617字 / 地域特徴度 0.77
    "air-conditioner-consumption-expenditure", // エアコン消費支出額 — 本文 2095字 / 地域特徴度 0.68
    "maternal-mortality-rate-per-100k-births", // 妊娠等による死亡率 — 本文 1694字 / 地域特徴度 0.74
    "mandarin-consumption-quantity", // みかん消費量 — 本文 1682字 / 地域特徴度 0.74
    "ramen-dining-consumption-expenditure", // 中華そば消費支出額 — 本文 1971字 / 地域特徴度 0.67
    "other-personal-items-consumption-expenditure", // 他の身の回り用品消費支出額 — 本文 1758字 / 地域特徴度 0.72
    "yakiniku-consumption-expenditure", // 焼肉消費支出額 — 本文 1643字 / 地域特徴度 0.74
    "moving-in-excess-rate", // 転入超過率 — 本文 1681字 / 地域特徴度 0.73
    "travel-participation-rate-domestic", // 国内旅行の行動者率 — 本文 1063字 / 地域特徴度 0.86
    "other-mens-clothing-consumption-expenditure", // 他の男子用洋服消費支出額 — 本文 1615字 / 地域特徴度 0.74
    "hobby-participation-rate-camping", // キャンプの行動者率 — 本文 1816字 / 地域特徴度 0.70
    "vacuum-cleaner-consumption-expenditure", // 電気掃除機消費支出額 — 本文 2054字 / 地域特徴度 0.65
    "total-assessed-land-area-ratio-residential", // 評価総地積割合 — 本文 1736字 / 地域特徴度 0.71
    "hamburg-steak-consumption-expenditure", // ハンバーグ消費支出額 — 本文 1464字 / 地域特徴度 0.75
    "residential-and-mixed-area-ratio", // 住居専用・住居地域面積比率 — 本文 1534字 / 地域特徴度 0.73
  ],
  "K-S3-08": [
    "maternal-mortality-rate-per-100k-births", // 妊娠等による死亡率 — 本文 1694字 / 地域特徴度 0.85
    "womens-sweater-consumption-expenditure", // 婦人用セーター消費支出額 — 本文 1962字 / 地域特徴度 0.76
    "land-rent-consumption-expenditure", // 地代消費支出額 — 本文 1870字 / 地域特徴度 0.74
    "new-graduate-starting-salary-university-male", // 新規学卒者初任給 — 本文 1798字 / 地域特徴度 0.70
    "nursing-home-count-per-100k-65plus", // 老人ホーム数 — 本文 1533字 / 地域特徴度 0.75
    "burdock-consumption-quantity", // ごぼう消費量 — 本文 1930字 / 地域特徴度 0.66
    "private-auto-insurance-penetration-rate-vehicle", // 任意自動車保険普及率 — 本文 1836字 / 地域特徴度 0.66
    "healthcare-expenditure-ratio-multi-person-households", // 保健医療費割合 — 本文 2261字 / 地域特徴度 0.63
    "konbu-tsukudani-consumption-expenditure", // こんぶつくだ煮消費支出額 — 本文 1664字 / 地域特徴度 0.69
    "cpi-regional-difference-index-total-51cities100", // 消費者物価地域差指数 — 本文 1547字 / 地域特徴度 0.71
    "other-mushroom-consumption-quantity", // 他のきのこ消費量 — 本文 1485字 / 地域特徴度 0.72
    "pumpkin-consumption-expenditure", // かぼちゃ消費支出額 — 本文 1530字 / 地域特徴度 0.70
    "current-deposit-balance-ratio-multi-person-households", // 預貯金現在高割合 — 本文 1654字 / 地域特徴度 0.67
    "fulfillment-rate", // 充足率 — 本文 1806字 / 地域特徴度 0.64
    "soy-sauce-consumption-quantity", // しょう油消費量 — 本文 1628字 / 地域特徴度 0.68
    "avg-savings-rate-worker-households", // 平均貯蓄率 — 本文 1748字 / 地域特徴度 0.65
    "cpi-change-rate-culture-recreation", // 消費者物価指数変化率 — 本文 1768字 / 地域特徴度 0.64
    "psychiatric-hospital-count-per-100k", // 精神科病院数 — 本文 1682字 / 地域特徴度 0.66
    "dependent-population-index", // 従属人口指数 — 本文 1806字 / 地域特徴度 0.63
    "row-house-ratio", // 長屋建住宅比率 — 本文 1739字 / 地域特徴度 0.64
    "horse-mackerel-consumption-quantity", // あじ消費量 — 本文 1383字 / 地域特徴度 0.71
    "other-topical-medicine-consumption-expenditure", // 他の外用薬消費支出額 — 本文 1683字 / 地域特徴度 0.65
    "per-capita-inhabitant-tax-pref-municipal", // 住民税 — 本文 1729字 / 地域特徴度 0.64
    "specialized-school-count-per-100k", // 専修学校数 — 本文 1964字 / 地域特徴度 0.58
    "futon-consumption-expenditure", // 布団消費支出額 — 本文 1678字 / 地域特徴度 0.64
    "high-school-graduates-job-ratio", // 高等学校卒業者に占める就職者の割合 — 本文 1475字 / 地域特徴度 0.68
    "paid-nursing-home-capacity-per-1000-65plus", // 有料老人ホーム定員数 — 本文 1494字 / 地域特徴度 0.67
  ],
  "K-S4-01": [
    "air-conditioner-consumption-expenditure", // エアコン消費支出額 — 本文 2095字 / 意外性 1.00
    "ritual-goods-tombstone-consumption-expenditure", // 祭具・墓石消費支出額 — 本文 1896字 / 意外性 1.00
    "disaster-damage-amount-per-person", // 災害被害額 — 本文 1876字 / 意外性 1.00
    "non-car-vehicle-maintenance-consumption-expenditure", // 自動車以外の輸送機器整備費消費支出額 — 本文 1853字 / 意外性 1.00
    "cable-tv-fee-consumption-expenditure", // ケーブルテレビ放送受信料消費支出額 — 本文 1843字 / 意外性 1.00
    "womens-sweater-consumption-expenditure", // 婦人用セーター消費支出額 — 本文 1962字 / 意外性 0.95
    "paved-road-main-length", // 舗装道路実延長（主要道路） — 本文 1709字 / 意外性 1.00
    "dried-mackerel-consumption-quantity", // 干しあじ消費量 — 本文 1662字 / 意外性 1.00
    "flood-damage-total", // 水害被害額合計 — 本文 1648字 / 意外性 1.00
    "bamboo-shoot-consumption-quantity", // たけのこ消費量 — 本文 1645字 / 意外性 1.00
    "public-assistance-expenditure-ratio-pref-finance", // 生活保護費割合 — 本文 1643字 / 意外性 1.00
    "smoke-emission-facility-count", // ばい煙発生施設数 — 本文 1628字 / 意外性 1.00
    "fire-department-pump-car-count-per-100-thousand-people", // 消防ポンプ自動車等現有数 — 本文 1718字 / 意外性 0.98
    "infant-clothes-consumption-expenditure", // 乳児服消費支出額 — 本文 1592字 / 意外性 1.00
    "cultivated-land-area-per-household", // 耕地面積 — 本文 1571字 / 意外性 1.00
    "vacuum-cleaner-consumption-expenditure", // 電気掃除機消費支出額 — 本文 2054字 / 意外性 0.91
    "agricultural-land-conversion-area", // 農地の転用面積 — 本文 1548字 / 意外性 1.00
    "psychiatric-hospital-count-per-100k", // 精神科病院数 — 本文 1682字 / 意外性 0.97
    "ramen-dining-consumption-expenditure", // 中華そば消費支出額 — 本文 1971字 / 意外性 0.90
    "certified-childcare-center-count-per-100k-0-5", // 認定こども園数 — 本文 1507字 / 意外性 1.00
    "mental-health-expenses-prefecture", // 精神衛生費 — 本文 1492字 / 意外性 1.00
    "kerosene-consumption-quantity", // 灯油消費量 — 本文 1483字 / 意外性 1.00
    "other-construction-consumption-expenditure", // 他の工事費消費支出額 — 本文 1473字 / 意外性 1.00
    "tennis-court-public", // テニスコート数（公共） — 本文 1472字 / 意外性 1.00
    "other-admission-game-consumption-expenditure", // 他の入場・ゲーム代消費支出額 — 本文 1729字 / 意外性 0.94
    "cod-roe-consumption-quantity", // たらこ消費量 — 本文 1473字 / 意外性 0.99
    "flood-affected-rivers", // 水害被災河川・海岸数（一般資産等） — 本文 1402字 / 意外性 1.00
    "treatment-rate-arthrosis-inpatient", // 関節症の受療率（入院） — 本文 2052字 / 意外性 0.87
    "abandoned-cultivated-land-area", // 耕地放棄面積 — 本文 1384字 / 意外性 1.00
    "horse-mackerel-consumption-quantity", // あじ消費量 — 本文 1383字 / 意外性 1.00
  ],
};

/**
 * 『日本国勢図会』の論点を Kindle へ接続した結果。
 * 書籍の本文・数値・図版は使わず、一次資料から取得した既存 metric と、数値監査を通った
 * R2 ai-content だけを S2 データブックへ載せる。除外も理由付きで固定し、全件を無理に出版しない。
 */
export const JAPAN_ZUE_KINDLE_COVERAGE = {
  included: {
    "K-S2-01": ["total-fertility-rate"],
    "K-S2-02": ["unemployment-rate", "active-job-opening-ratio", "minimum-wage-by-region"],
    "K-S2-03": ["room-utilization-rate", "total-overnight-guests"],
    "K-S2-05": [
      "infant-mortality-rate-per-1000-births",
      "average-life-expectancy-male",
      "average-life-expectancy-female-20",
      "infant-deaths",
      "average-life-expectancy-female-65",
    ],
    "K-S2-07": ["households-on-public-assistance-per-1000", "households-on-public-assistance"],
    "K-S2-09": ["agricultural-output"],
  },
  excluded: {
    "general-hospital-bed-count-per-100k": "数値監査後の本文が180字で、600字ゲート未達",
    "students-requiring-japanese-instruction": "isActive:false・公開R2未投入",
  },
} as const;
