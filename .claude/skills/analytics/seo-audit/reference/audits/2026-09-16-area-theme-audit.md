---
type: area-theme-audit
date: 2026-09-16
status: draft
tags: [audit, page-components, area, theme]
---

# area / theme 責務分離 棚卸し (2026-09-16)

判定基準: [`docs/01_技術設計/03_情報設計.md`](../../01_技術設計/03_情報設計.md)

## サマリ

| pageType | unique component数 | 総 assignment 数 |
|---|---|---|
| area | 6 | 282 |
| theme | 76 | 76 |
| area-category | 185 | 185 |
| city-category | 57 | 57 |

## 違反候補: pageType=area → theme へ移すべき (0 件)

該当なし。area に登録された全コンポーネントは県固有可視化と推定。

## レビュー必要: pageType=theme で疑わしい (0 件)

該当なし。

## 参考: pageType=area の全 unique component (6 件)

| componentKey | componentType | title | section | verdict |
|---|---|---|---|---|
| `area-ov-age-structure` | stacked-area | 年齢3区分人口の推移 | 人口・世帯 | KEEP_ON_AREA |
| `area-ov-aging-young` | line-chart | 高齢化率・年少人口割合の推移 | 人口・世帯 | KEEP_ON_AREA |
| `area-ov-elderly-household` | line-chart | 高齢者世帯の推移 | 人口・世帯 | KEEP_ON_AREA |
| `area-ov-prefectural-income` | line-chart | 1人当たり県民所得の推移 | 経済・雇用 | KEEP_ON_AREA |
| `area-ov-job-opening` | line-chart | 有効求人倍率の推移 | 経済・雇用 | KEEP_ON_AREA |
| `area-ov-traffic-accident` | line-chart | 交通事故 発生件数と負傷者数の推移 | 安全・くらし | KEEP_ON_AREA |

## 参考: pageType=theme の全 unique component (76 件)

| componentKey | componentType | title | section | page_keys |
|---|---|---|---|---|
| `theme-late-elderly-medical-expense-trend` | line-chart | 後期高齢者医療費（被保険者1人当たり）の推移 | elderly-care | aging-society |
| `theme-age-composition` | composition-chart | 年齢3区分人口構成の推移 | age-structure | aging-society |
| `theme-population-pyramid` | pyramid-chart | 人口ピラミッド | age-structure | aging-society |
| `md-aging-discussion` | markdown-section | 数値を比較するときの注意 | reading | aging-society |
| `cmp-pop-elderly-household` | line-chart | 高齢世帯の推移 | elderly-households | aging-society |
| `md-aging-faq` | markdown-section | よくある質問 | reading | aging-society |
| `theme-climate-temperature-extremes` | line-chart | 最高・最低気温の推移 | temperature | climate |
| `theme-cpi-profile` | cpi-profile | 物価プロファイル | expenses | consumer-prices |
| `theme-cpi-heatmap` | line-chart | 物価地域差指数（総合）の推移 | historical-change | consumer-prices |
| `md-cpi-discussion` | markdown-section | 数値を比較するときの注意 | reading | consumer-prices |
| `md-cpi-faq` | markdown-section | よくある質問 | reading | consumer-prices |
| `theme-edu-higher-education-trend` | line-chart | 大学入学者の県内入学割合の推移 | higher-education | education-culture |
| `theme-edu-higher-education-trend-attainment` | line-chart | 卒業者総数に占める大学・大学院卒割合 | higher-education | education-culture |
| `theme-fishery-catch-trend` | line-chart | 漁獲量と海面漁業漁獲量の推移 | catch | fishery-marine |
| `theme-fishery-aquaculture-mix` | mixed-chart | 海面・内水面養殖収獲量の推移 | aquaculture | fishery-marine |
| `theme-fishery-output-trend` | line-chart | 海面漁業・養殖業産出額の推移 | output-workers | fishery-marine |
| `theme-fishery-output-trend-marine` | line-chart | 海面漁業産出額の長期推移 | output-workers | fishery-marine |
| `theme-fishery-half-century` | line-chart | 漁業就業者数の推移 | output-workers | fishery-marine |
| `theme-foreign-total-trend` | line-chart | 外国人人口の推移（人口10万人当たり） | residents | foreign-residents |
| `theme-foreign-nationality-trend` | line-chart | 国籍別人口の推移（人口10万人当たり） | nationality | foreign-residents |
| `theme-health-supply-trend` | line-chart | 医療施設の医師数の推移（人口10万人当たり） | supply | healthcare |
| `theme-health-supply-trend-hospitals` | line-chart | 一般病院数の推移（人口10万人当たり） | supply | healthcare |
| `theme-health-expense-trend` | line-chart | 1人当たり医療費の比較 | medical-expense | healthcare |
| `md-healthcare-discussion` | markdown-section | 数値を比較するときの注意 | reading | healthcare |
| `md-healthcare-faq` | markdown-section | よくある質問 | reading | healthcare |
| `theme-health-death-causes-donut` | donut-chart | 主要5死因内の構成 | causes-of-death | healthcare |
| `labor-mobility-turnover-vs-jobchange` | line-chart | 離職率と転職率の比較 | turnover | labor-mobility |
| `md-labor-mobility-discussion` | markdown-section | 数値を比較するときの注意 | reading | labor-mobility |
| `md-labor-mobility-faq` | markdown-section | よくある質問 | reading | labor-mobility |
| `theme-lm-employment-mobility-trend` | line-chart | 就業異動率の推移 | employment-mobility | labor-mobility |
| `labor-wages-gender-gap` | line-chart | 男女賃金格差の比較 | wage-differences | labor-wages |
| `md-labor-wages-discussion` | markdown-section | 数値を比較するときの注意 | reading | labor-wages |
| `md-labor-wages-faq` | markdown-section | よくある質問 | reading | labor-wages |
| `vacancy-ownership-rate-trend` | line-chart | 空き家率と持ち家率の推移 | housing-stock | living-housing |
| `md-living-housing-discussion` | markdown-section | 数値を比較するときの注意 | reading | living-housing |
| `md-living-housing-faq` | markdown-section | よくある質問 | reading | living-housing |
| `lh-dwelling-floor-area-trend` | line-chart | 持ち家・借家の延べ面積（1住宅当たり） | dwelling-space | living-housing |
| `lh-household-structure-trend` | line-chart | 核家族世帯割合の推移 | households | living-housing |
| `lh-household-structure-trend-single` | line-chart | 単独世帯割合の比較 | households | living-housing |
| `theme-industry-structure` | line-chart | 産業別就業者比率の推移 | industry | local-economy |
| `md-local-economy-discussion` | markdown-section | 数値を比較するときの注意 | reading | local-economy |
| `md-local-economy-faq` | markdown-section | よくある質問 | reading | local-economy |
| `theme-le-establishments-trend` | line-chart | 全産業事業所数の推移 | establishments | local-economy |
| `manufacturing-establishments-employees-trend` | line-chart | 製造業の事業所数の推移 | sites-employment | manufacturing |
| `manufacturing-establishments-employees-trend-employees` | line-chart | 製造業の従業者数の推移 | sites-employment | manufacturing |
| `manufacturing-shipment-value-trend` | line-chart | 製造品出荷額と付加価値額の推移 | production | manufacturing |
| `theme-manufacturing-labor-productivity` | line-chart | 従業者1人当たり出荷額の推移 | shipment-per-worker | manufacturing |
| `theme-manufacturing-labor-productivity-establishment` | line-chart | 事業所当たり出荷額の推移 | location | manufacturing |
| `theme-occ-medical-trend` | line-chart | 医療・福祉職の年収比較 | medical-care | occupation-salary |
| `theme-occ-it-trend` | line-chart | IT・専門職の年収比較 | it-professional | occupation-salary |
| `theme-occ-edu-trend` | line-chart | 教育職の年収比較 | education | occupation-salary |
| `theme-occ-transport-trend` | line-chart | 運輸・建設職の年収比較 | transport-construction | occupation-salary |
| `theme-occ-service-trend` | line-chart | サービス職の年収比較 | services | occupation-salary |
| `birth-death-count-trend` | line-chart | 自然増減：出生数と死亡数 | natural-social-change | population-dynamics |
| `theme-pop-migration-trend` | line-chart | 外国人の人口移動：転入者数と転出者数 | natural-social-change | population-dynamics |
| `md-population-dynamics-discussion` | markdown-section | 数値を比較するときの注意 | reading | population-dynamics |
| `md-population-dynamics-faq` | markdown-section | よくある質問 | reading | population-dynamics |
| `ports-cargo-trend` | line-chart | 輸出入 海上貨物量の推移 | trade | ports |
| `railway-passenger-trend` | line-chart | 民鉄輸送人員の推移 | passengers | railway |
| `railway-passenger-trend-jr` | line-chart | JR輸送人員の比較 | passengers | railway |
| `railway-freight-trend` | line-chart | JR貨物発送量の推移 | freight | railway |
| `real-income-cpi-breakdown` | line-chart | 消費者物価地域差指数（総合）の推移 | prices | real-income |
| `real-income-cpi-breakdown-expenses` | line-chart | 住居・食料の物価地域差指数の比較 | prices | real-income |
| `theme-real-income-actual-vs-disposable` | line-chart | 実収入の比較（勤労者世帯・1世帯当たり月額） | household-income | real-income |
| `real-income-household-composition` | composition-chart | 消費支出10費目の構成 | candidate-77 | real-income |
| `roads-length-trend` | line-chart | 道路実延長・高速道路延長の比較 | road-stock | roads |
| `crime-count-arrest-rate-trend` | mixed-chart | 刑法犯認知件数（人口千人当たり）と検挙率の推移 | crime | safety |
| `traffic-accident-deaths-trend` | line-chart | 交通事故 発生件数と負傷者数の推移 | traffic | safety |
| `fire-emergency-trend` | line-chart | 救急出動件数（人口千人当たり）の推移 | fire-emergency | safety |
| `fire-emergency-trend-fire` | line-chart | 火災出火件数（人口10万人当たり）の比較 | fire-emergency | safety |
| `safety-crime-types-donut` | donut-chart | 罪種別 刑法犯認知件数の内訳（2023年） | crime | safety |
| `safety-fire-casualties-donut` | donut-chart | 火災による死傷者の内訳（2023年） | fire-emergency | safety |
| `single-parent-income-composition` | composition-chart | 母子世帯の年間所得階級別構成 | single-parent-households-overview | single-parent-households |
| `theme-tourism-stay-trend` | line-chart | 延べ宿泊者数の推移（総数・外国人） | stays | tourism |
| `theme-tourism-transport-trend` | line-chart | 航空旅客輸送量の比較 | transport | tourism |
| `theme-tourism-hotel-supply-trend` | line-chart | 宿泊施設数と客室数の推移 | accommodation | tourism |

## next action

1. 上記「違反候補」テーブルを目視確認し、本当に theme へ移すべきものを確定
2. 確定した component に対し `page_components` の `page_type` を `theme` に UPDATE (or 新規 INSERT + 旧 row DELETE)
3. ローカル D1 で反映後、`/sync-snapshots --only page-components` で R2 に push
4. 該当 area ページ・theme ページの表示を browser で確認
