-- ランキンググループとアイテムの関連付けseed
-- 生成日: 2025-01-28
-- データソース: data/prefectures.csv
-- グループ数: 764
-- 更新項目数: 764

-- ========================================
-- ランキンググループの作成（バッチ処理）
-- ========================================
-- バッチ 1 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-financial-power-index', 'finance', '財政力指数（都道府県財政）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-real-balance-ratio', 'finance', '実質収支比率（都道府県財政）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-self-financing-ratio', 'finance', '自主財源の割合（都道府県財政）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-local-debt-current-ratio', 'finance', '地方債現在高の割合（都道府県財政）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-current-balance-ratio', 'finance', '経常収支比率（都道府県財政）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-investment-expenditure-ratio-pref-finance', 'finance', '投資的経費の割合（都道府県財政）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-general-revenue-ratio-pref-finance', 'finance', '一般財源の割合（都道府県財政）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-local-tax-ratio-pref-finance', 'finance', '地方税割合（都道府県財政）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-local-allocation-tax-ratio-pref-finance', 'finance', '地方交付税割合（都道府県財政）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-national-treasury-disbursement-ratio-pref-finance', 'finance', '国庫支出金割合（都道府県財政）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-inhabitant-tax-pref-municipal', 'finance', '人口1人当たり住民税（都道府県・市町村財政合計）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-fixed-asset-tax-pref-municipal', 'finance', '人口1人当たり固定資産税（都道府県・市町村財政合計）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-national-tax-collected', 'finance', '国税徴収決定済額（人口1人当たり）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-taxpayer-taxable-income', 'finance', '課税対象所得（納税義務者1人当たり）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-taxpayer-ratio-per-pref-resident', 'finance', '納税義務者割合（都道府県民1人当たり）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-welfare-expenditure-ratio-pref-finance', 'finance', '民生費割合（都道府県財政）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-social-welfare-expenditure-ratio-pref-finance', 'finance', '社会福祉費割合（都道府県財政）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elderly-welfare-expenditure-ratio-pref-finance', 'finance', '老人福祉費割合（都道府県財政）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-child-welfare-expenditure-ratio-pref-finance', 'finance', '児童福祉費割合（都道府県財政）', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-assistance-expenditure-ratio-pref-finance', 'finance', '生活保護費割合（都道府県財政）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-sanitation-expenditure-ratio-pref-finance', 'finance', '衛生費割合（都道府県財政）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-labor-expenditure-ratio-pref-finance', 'finance', '労働費割合（都道府県財政）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-agriculture-forestry-fisheries-expenditure-ratio-pref-finance', 'finance', '農林水産業費割合（都道府県財政）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-commerce-industry-expenditure-ratio-pref-finance', 'finance', '商工費割合（都道府県財政）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-works-expenditure-ratio-pref-finance', 'finance', '土木費割合（都道府県財政）', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-police-expenditure-ratio-pref-finance', 'finance', '警察費割合（都道府県財政）', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-firefighting-expenditure-ratio-pref-municipal', 'finance', '消防費割合（都・市町村財政合計）', NULL, NULL, 26, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-education-expenditure-ratio-pref-finance', 'finance', '教育費割合（都道府県財政）', NULL, NULL, 27, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-disaster-recovery-expenditure-ratio-pref-finance', 'finance', '災害復旧費割合（都道府県財政）', NULL, NULL, 28, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-personnel-expenditure-ratio-pref-finance', 'finance', '人件費割合（都道府県財政）', NULL, NULL, 29, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-assistance-expenditure-ratio-pref-finance', 'finance', '扶助費割合（都道府県財政）', NULL, NULL, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-ordinary-construction-expenditure-ratio-pref-finance', 'finance', '普通建設事業費割合（都道府県財政）', NULL, NULL, 31, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-total-expenditure-pref-municipal', 'finance', '人口1人当たり歳出決算総額（都道府県・市町村財政合計）', NULL, NULL, 32, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-welfare-expenditure-pref-municipal', 'finance', '人口1人当たり民生費（都道府県・市町村財政合計）', NULL, NULL, 33, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-social-welfare-expenditure-pref-municipal', 'finance', '人口1人当たり社会福祉費（都道府県・市町村財政合計）', NULL, NULL, 34, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-elderly-welfare-expenditure-65plus-pref-municipal', 'finance', '65歳以上人口1人当たり老人福祉費（都道府県・市町村財政合計）', NULL, NULL, 35, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-child-welfare-expenditure-under17-pref-municipal', 'finance', '17歳以下人口1人当たり児童福祉費（都道府県・市町村財政合計）', NULL, NULL, 36, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-public-assistance-expenditure-protected-pref-municipal', 'finance', '被保護実人員1人当たり生活保護費（都道府県・市町村財政合計）', NULL, NULL, 37, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-sanitation-expenditure-pref-municipal', 'finance', '人口1人当たり衛生費（都道府県・市町村財政合計）', NULL, NULL, 38, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-public-works-expenditure-pref-municipal', 'finance', '人口1人当たり土木費（都道府県・市町村財政合計）', NULL, NULL, 39, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-police-expenditure-pref-municipal', 'finance', '人口1人当たり警察費（都道府県財政）', NULL, NULL, 40, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-firefighting-expenditure-tokyo-municipal', 'finance', '人口1人当たり消防費（東京都・市町村財政合計）', NULL, NULL, 41, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-education-expenditure-pref-municipal', 'finance', '人口1人当たり教育費（都道府県・市町村財政合計）', NULL, NULL, 42, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-child-public-elementary-school-expenditure-pref-municipal', 'finance', '児童1人当たり公立小学校費（都道府県・市町村財政合計）', NULL, NULL, 43, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-student-public-junior-high-school-expenditure-pref-municipal', 'finance', '生徒1人当たり公立中学校費（都道府県・市町村財政合計）', NULL, NULL, 44, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-student-public-high-school-expenditure-pref-municipal', 'finance', '生徒1人当たり公立高等学校費（都道府県・市町村財政合計）', NULL, NULL, 45, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-child-student-special-support-school-expenditure-pref-municipal', 'finance', '児童・生徒1人当たり特別支援学校費（都道府県・市町村財政合計）', NULL, NULL, 46, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-child-kindergarten-expenditure-pref-municipal', 'finance', '児童1人当たり幼稚園費（都道府県・市町村財政合計）', NULL, NULL, 47, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-social-education-expenditure-pref-municipal', 'finance', '人口1人当たり社会教育費（都道府県・市町村財政合計）', NULL, NULL, 48, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-disaster-recovery-expenditure-pref-municipal', 'finance', '人口1人当たり災害復旧費（都道府県・市町村財政合計）', NULL, NULL, 49, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 2 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-households-on-public-assistance-per-1000', 'welfare', '生活保護被保護実世帯数（月平均一般世帯千世帯当たり）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-persons-on-public-assistance-per-1000', 'welfare', '生活保護被保護実人員（月平均人口千人当たり）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-assistance-education-beneficiaries-per-1000', 'welfare', '生活保護教育扶助人員（月平均人口千人当たり）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-assistance-medical-beneficiaries-per-1000', 'welfare', '生活保護医療扶助人員（月平均人口千人当たり）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-assistance-housing-beneficiaries-per-1000', 'welfare', '生活保護住宅扶助人員（月平均人口千人当たり）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-assistance-nursing-beneficiaries-per-1000', 'welfare', '生活保護介護扶助人員（月平均人口千人当たり）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elderly-on-public-assistance-per-1000-65plus', 'welfare', '生活保護被保護高齢者数（月平均65歳以上人口千人当たり）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-physical-disability-certificates-issued-per-1000', 'welfare', '身体障害者手帳交付数（人口千人当たり）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-welfare-facilities-count-per-100k-on-assistance', 'welfare', '保護施設数（生活保護被保護実人員10万人当たり）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-nursing-home-count-per-100k-65plus', 'welfare', '老人ホーム数（65歳以上人口10万人当たり）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-senior-welfare-center-count-per-100k-65plus', 'welfare', '老人福祉センター数（65歳以上人口10万人当たり）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-senior-recreation-home-count-per-100k-65plus', 'welfare', '老人憩の家数（65歳以上人口10万人当たり）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-paid-nursing-home-count-per-100k-65plus', 'welfare', '有料老人ホーム数（65歳以上人口10万人当たり）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-nursing-welfare-facility-count-per-100k-65plus', 'welfare', '介護老人福祉施設数（65歳以上人口10万人当たり）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-physical-disability-rehabilitation-facility-count-per-1m', 'welfare', '身体障害者更生援護施設数（人口100万人当たり）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-intellectual-disability-support-facility-count-per-1m', 'welfare', '知的障害者援護施設数（人口100万人当たり）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-child-welfare-facility-count-per-100k', 'welfare', '児童福祉施設等数（人口10万人当たり）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-welfare-facility-staff-per-1000-on-assistance', 'welfare', '保護施設従事者数（生活保護被保護実人員千人当たり）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-nursing-home-staff-per-100k-65plus', 'welfare', '老人ホーム従事者数（65歳以上人口10万人当たり）', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-senior-welfare-center-staff-per-100k-65plus', 'welfare', '老人福祉センター従事者数（65歳以上人口10万人当たり）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-senior-recreation-home-staff-per-100k-65plus', 'welfare', '老人憩の家従事者数（65歳以上人口10万人当たり）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-physical-disability-rehabilitation-facility-staff-per-100k', 'welfare', '身体障害者更生援護施設従事者数（人口10万人当たり）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-intellectual-disability-support-facility-staff-per-100k', 'welfare', '知的障害者援護施設従事者数（人口10万人当たり）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-child-welfare-facility-staff-per-100k', 'welfare', '児童福祉施設等従事者数（人口10万人当たり）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-assistance-facility-capacity-per-1000', 'welfare', '生活保護施設定員数（被保護実人員千人当たり）', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-assistance-facility-residents-per-1000', 'welfare', '生活保護施設在所者数（被保護実人員千人当たり）', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-nursing-home-capacity-per-1000-65plus', 'welfare', '老人ホーム定員数（65歳以上人口千人当たり）', NULL, NULL, 26, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-nursing-home-residents-per-1000-65plus', 'welfare', '老人ホーム在所者数（65歳以上人口千人当たり）', NULL, NULL, 27, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-paid-nursing-home-capacity-per-1000-65plus', 'welfare', '有料老人ホーム定員数（65歳以上人口千人当たり）', NULL, NULL, 28, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-paid-nursing-home-residents-per-1000-65plus', 'welfare', '有料老人ホーム在所者数（65歳以上人口千人当たり）', NULL, NULL, 29, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-physical-disability-rehabilitation-facility-capacity-per-100k', 'welfare', '身体障害者更生援護施設定員数（人口10万人当たり）', NULL, NULL, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-physical-disability-rehabilitation-facility-residents-per-100k', 'welfare', '身体障害者更生援護施設在所者数（人口10万人当たり）', NULL, NULL, 31, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-intellectual-disability-support-facility-capacity-per-100k', 'welfare', '知的障害者援護施設定員数（人口10万人当たり）', NULL, NULL, 32, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-intellectual-disability-support-facility-residents-per-100k', 'welfare', '知的障害者援護施設在所者数（人口10万人当たり）', NULL, NULL, 33, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-welfare-commissioner-count-per-100k', 'welfare', '民生委員（児童委員）数（人口10万人当たり）', NULL, NULL, 34, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-home-helper-count-per-100k', 'welfare', '訪問介護員（ホームヘルパー）数（人口10万人当たり）', NULL, NULL, 35, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-home-helper-users-per-office', 'welfare', '訪問介護利用者数（訪問介護1事業所当たり）', NULL, NULL, 36, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-welfare-commissioner-consultations-per-person', 'welfare', '民生委員（児童委員）1人当たり相談・支援件数', NULL, NULL, 37, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-welfare-office-public-assistance-applications-per-1000-households', 'welfare', '福祉事務所生活保護申請件数（被保護世帯千世帯当たり）', NULL, NULL, 38, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-physical-disability-rehabilitation-cases-per-1000', 'welfare', '身体障害者更生援護取扱実人員（人口千人当たり）', NULL, NULL, 39, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-welfare-office-intellectual-disability-consultations-per-100k', 'welfare', '福祉事務所知的障害者相談実人員（人口10万人当たり）', NULL, NULL, 40, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-physical-disability-rehabilitation-center-cases-per-1000', 'welfare', '身体障害者更生相談所取扱実人員（人口千人当たり）', NULL, NULL, 41, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-intellectual-disability-rehabilitation-center-cases-per-100k', 'welfare', '知的障害者更生相談所取扱実人員（人口10万人当たり）', NULL, NULL, 42, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-late-elderly-medical-expense-per-insured', 'welfare', '後期高齢者医療費（被保険者1人当たり）', NULL, NULL, 43, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-municipal-intellectual-disability-consultations-per-100k', 'welfare', '市町村における知的障害者相談実人員（人口10万人当たり）', NULL, NULL, 44, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-child-consultation-center-cases-per-1000', 'welfare', '児童相談所受付件数（人口千人当たり）', NULL, NULL, 45, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-national-pension-enrollees-type1-per-1000-20-59', 'welfare', '国民年金被保険者数（第1号）（20～59歳人口千人当たり）', NULL, NULL, 46, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-national-pension-enrollees-type3-per-1000-20-59', 'welfare', '国民年金被保険者数（第3号）（20～59歳人口千人当たり）', NULL, NULL, 47, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-department-count-per-100-km2', 'safety', '消防署数（可住地面積100km2当たり）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-department-branch-count-per-100-km2', 'safety', '消防団・分団数（可住地面積100km2当たり）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 3 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-fire-department-pump-car-count-per-100-thousand-people', 'safety', '消防ポンプ自動車等現有数（人口10万人当たり）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-department-water-count-per-100-thousand-people', 'safety', '消防水利数（人口10万人当たり）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-related-personnel-count-per-100k', 'safety', '消防関係人員数（人口10万人当たり）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-department-member-count-per-100-thousand-people', 'safety', '消防吏員数（人口10万人当たり）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-department-dispatch-count-per-100-thousand-people', 'safety', '消防機関出動回数（人口10万人当たり）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-dispatch-for-building-fire-count-per-100k', 'safety', '火災のための消防機関出動回数（人口10万人当たり）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-building-fire-count-per-100-thousand-people', 'safety', '火災出火件数（人口10万人当たり）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-building-fire-count-per-100k', 'safety', '建物火災出火件数（人口10万人当たり）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-damage-casualties-per-population', 'safety', '火災死傷者数（人口10万人当たり）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-building-fire-damage-amount-per-person', 'safety', '建物火災損害額（人口1人当たり）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-damage-household-count-per-100-building-fires', 'safety', '火災り災世帯数（建物火災100件当たり）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-damage-casualties-per-accident', 'safety', '火災死傷者数（建物火災100件当たり）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-building-fire-damage-amount-per-building-fire', 'safety', '建物火災損害額（建物火災1件当たり）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-grade-separated-pedestrian-crossings-per-1000-km', 'safety', '立体横断施設数（道路実延長千km当たり）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-traffic-accident-count-per-population', 'safety', '交通事故発生件数（人口10万人当たり）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-traffic-accident-count-per-1000-km', 'safety', '交通事故発生件数（道路実延長千km当たり）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-traffic-accident-casualties-per-population', 'safety', '交通事故死傷者数（人口10万人当たり）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-traffic-accident-deaths-per-100k', 'safety', '交通事故死者数（人口10万人当たり）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-traffic-accident-injuries-per-100k', 'safety', '交通事故負傷者数（人口10万人当たり）', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-traffic-accident-casualties-per-100-accidents', 'safety', '交通事故死傷者数（交通事故100件当たり）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-traffic-accident-deaths-per-100-accidents', 'safety', '交通事故死者数（交通事故100件当たり）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-road-traffic-law-violation-arrest-count-per-population', 'safety', '道路交通法違反検挙件数（人口千人当たり）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-police-officer-count-per-population', 'safety', '警察官数（人口千人当たり）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-penal-code-offenses-recognized-per-1000', 'safety', '刑法犯認知件数（人口千人当たり）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-theft-offenses-recognized-per-1000', 'safety', '窃盗犯認知件数（人口千人当たり）', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-criminal-arrest-rate', 'safety', '刑法犯検挙率', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-theft-criminal-arrest-rate', 'safety', '窃盗犯検挙率', NULL, NULL, 26, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-juvenile-criminal-arrest-person-per-population', 'safety', '少年刑法犯検挙人員（14～19歳人口千人当たり）', NULL, NULL, 27, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-juvenile-theft-offender-arrests-per-1000-14-19', 'safety', '少年窃盗犯検挙人員（14～19歳人口千人当たり）', NULL, NULL, 28, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-criminal-recognition-count-of-serious-crime-rate', 'safety', '刑法犯認知件数に占める凶悪犯の割合', NULL, NULL, 29, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-criminal-recognition-count-of-violent-crime-rate', 'safety', '刑法犯認知件数に占める粗暴犯の割合', NULL, NULL, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-criminal-recognition-count-of-theft-crime-rate', 'safety', '刑法犯認知件数に占める窃盗犯の割合', NULL, NULL, 31, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-criminal-recognition-count-of-prostitution-crime-rate', 'safety', '刑法犯認知件数に占める風俗犯の割合', NULL, NULL, 32, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-special-law-criminal-arrest-count-per-population', 'safety', '特別法犯検挙件数（人口10万人当たり）', NULL, NULL, 33, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-drug-enforcement-arrest-count-per-population', 'safety', '覚醒剤取締検挙件数（人口10万人当たり）', NULL, NULL, 34, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-disaster-damage-amount-per-person', 'safety', '災害被害額（人口1人当たり）', NULL, NULL, 35, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-accidental-deaths-per-100k', 'safety', '不慮の事故による死亡者数（人口10万人当たり）', NULL, NULL, 36, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-pollution-complaints-received-per-100k', 'safety', '公害苦情受付件数（人口10万人当たり）', NULL, NULL, 37, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-smoke-emitting-facility-count', 'safety', 'ばい煙発生施設数', NULL, NULL, 38, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-general-dust-emitting-facility-count', 'safety', '一般粉じん発生施設数', NULL, NULL, 39, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-specific-business-sites-under-water-pollution-control-act', 'safety', '水質汚濁防止法上の特定事業場数', NULL, NULL, 40, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-private-life-insurance-contracts-per-1000', 'safety', '民間生命保険保有契約件数（人口千人当たり）', NULL, NULL, 41, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-private-life-insurance-amount-per-contract', 'safety', '民間生命保険保険金額（保有契約1件当たり）', NULL, NULL, 42, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-private-life-insurance-contract-amount-per-household', 'safety', '民間生命保険保険金額（1世帯当たり）', NULL, NULL, 43, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-simple-life-insurance-contract-count-per-population', 'safety', '簡易生命保険保有契約件数（人口千人当たり）', NULL, NULL, 44, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-simple-life-insurance-contract-amount-per-contract', 'safety', '簡易生命保険保有契約保険金額（保有契約1件当たり）', NULL, NULL, 45, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-insurance-new-contracts-per-1000-households', 'safety', '火災保険住宅物件・一般物件新契約件数（1年）（一般世帯千世帯当たり）', NULL, NULL, 46, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-insurance-claims-received-per-1000-households', 'safety', '火災保険住宅物件・一般物件保険金受取件数（1年）（一般世帯千世帯当たり）', NULL, NULL, 47, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-insurance-amount-received-per-contract', 'safety', '火災保険住宅物件・一般物件受取保険金額（1年）（保有契約1件当たり）', NULL, NULL, 48, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-insurance-new-contracts-per-1000-households-alt', 'safety', '火災保険住宅物件・一般物件新契約件数（一般世帯千世帯当たり）', NULL, NULL, 49, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 4 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-fire-insurance-claims-received-per-1000-households-alt', 'safety', '火災保険住宅物件・一般物件保険金受取件数（一般世帯千世帯当たり）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-insurance-amount-received-per-contract-alt', 'safety', '火災保険住宅物件・一般物件受取保険金額（保有契約1件当たり）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-auto-liability-insurance-amount-received-per-payment', 'safety', '自動車損害賠償責任保険受取保険金額（支払件数1件当たり）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-private-auto-insurance-penetration-rate-vehicle', 'safety', '任意自動車保険普及率（車両）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-voluntary-auto-insurance-penetration-personal', 'safety', '任意自動車保険普及率（対人）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-voluntary-auto-insurance-penetration-property', 'safety', '任意自動車保険普及率（対物）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elementary-school-count-per-100k-6-11', 'education', '小学校数（6～11歳人口10万人当たり）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-junior-high-school-count-per-100k-12-14', 'education', '中学校数（12～14歳人口10万人当たり）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-high-school-count-per-100k-15-17', 'education', '高等学校数（15～17歳人口10万人当たり）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-kindergarten-count-per-100k-3-5', 'education', '幼稚園数（3～5歳人口10万人当たり）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-nursery-count-per-100k-0-5', 'education', '保育所等数（0～5歳人口10万人当たり）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-certified-childcare-center-count-per-100k-0-5', 'education', '認定こども園数（0～5歳人口10万人当たり）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-compulsory-education-school-count-per-100k-6-14', 'education', '義務教育学校数（6～14歳人口10万人当たり）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-secondary-education-school-count-per-100k-12-17', 'education', '中等教育学校数（12～17歳人口10万人当たり）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elementary-school-count-per-100km2-habitable', 'education', '小学校数（可住地面積100km2当たり）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-junior-high-school-count-per-100km2-habitable', 'education', '中学校数（可住地面積100km2当たり）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-high-school-count-per-100km2-habitable', 'education', '高等学校数（可住地面積100km2当たり）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-high-school-ratio', 'education', '公立高等学校割合', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-kindergarten-ratio', 'education', '公立幼稚園割合', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-nursery-ratio', 'education', '公営保育所等割合', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-elementary-school-gym-installation-rate', 'education', '公立小学校屋内運動場設置率', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-junior-high-school-gym-installation-rate', 'education', '公立中学校屋内運動場設置率', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-elementary-school-pool-installation-rate', 'education', '公立小学校プール設置率', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-junior-high-school-pool-installation-rate', 'education', '公立中学校プール設置率', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-high-school-pool-installation-rate', 'education', '公立高等学校プール設置率', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elementary-school-teacher-ratio-male', 'education', '小学校教員割合（男）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-junior-high-school-teacher-ratio-male', 'education', '中学校教員割合（男）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elementary-school-students-per-class', 'education', '小学校児童数（1学級当たり）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-junior-high-school-students-per-class', 'education', '中学校生徒数（1学級当たり）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elementary-school-students-per-teacher', 'education', '小学校児童数（教員1人当たり）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-junior-high-school-students-per-teacher', 'education', '中学校生徒数（教員1人当たり）', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-high-school-students-per-teacher', 'education', '高等学校生徒数（教員1人当たり）', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-kindergarten-students-per-teacher', 'education', '幼稚園在園者数（教員1人当たり）', NULL, NULL, 26, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-nursery-children-per-nursery-teacher', 'education', '保育所等在所児数（保育士1人当たり）', NULL, NULL, 27, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-high-school-student-ratio', 'education', '公立高等学校生徒比率', NULL, NULL, 28, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-kindergarten-student-ratio', 'education', '公立幼稚園在園者比率', NULL, NULL, 29, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-nursery-student-ratio', 'education', '公営保育所等在所児比率', NULL, NULL, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-junior-college-count-per-100k', 'education', '短期大学数（人口10万人当たり）', NULL, NULL, 31, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-university-count-per-100k', 'education', '大学数（人口10万人当たり）', NULL, NULL, 32, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-junior-college-capacity-index', 'education', '短期大学収容力指数', NULL, NULL, 33, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-university-capacity-index', 'education', '大学収容力指数', NULL, NULL, 34, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-national-university-student-ratio', 'education', '国立大学学生数割合', NULL, NULL, 35, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-university-student-ratio', 'education', '公立大学学生数割合', NULL, NULL, 36, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-private-university-student-ratio', 'education', '私立大学学生数割合', NULL, NULL, 37, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-specialized-school-count-per-100k', 'education', '専修学校数（人口10万人当たり）', NULL, NULL, 38, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-miscellaneous-school-count-per-100k', 'education', '各種学校数（人口10万人当たり）', NULL, NULL, 39, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-specialized-school-students-per-1000', 'education', '専修学校生徒数（人口千人当たり）', NULL, NULL, 40, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-miscellaneous-school-students-per-1000', 'education', '各種学校生徒数（人口千人当たり）', NULL, NULL, 41, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-kindergarten-education-diffusion-rate', 'education', '教育普及度（幼稚園）', NULL, NULL, 42, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-nursery-education-diffusion-rate', 'education', '教育普及度（保育所等）', NULL, NULL, 43, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 5 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-nursery-utilization-rate', 'education', '保育所等利用率', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elementary-school-long-absence-ratio-over-30days-per-1000', 'education', '小学校長期欠席児童比率（年度間30日以上）（児童千人当たり）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-junior-high-school-long-absence-ratio-over-30days-per-1000', 'education', '中学校長期欠席生徒比率（年度間30日以上）（生徒千人当たり）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elementary-school-long-absence-ratio-nonattendance-over-30days-per-1000', 'education', '不登校による小学校長期欠席児童比率（年度間30日以上）（児童千人当たり）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-junior-high-school-long-absence-ratio-nonattendance-over-30days-per-1000', 'education', '不登校による中学校長期欠席生徒比率（年度間30日以上）（生徒千人当たり）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-junior-high-school-graduates-advancement-rate', 'education', '中学校卒業者の進学率', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-high-school-graduates-advancement-rate', 'education', '高等学校卒業者の進学率', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-in-pref-university-entrance-ratio-by-highschool-origin', 'education', '出身高校所在地県の県内大学への入学者割合（対大学入学者数）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-final-education-elementary-junior-high-ratio', 'education', '最終学歴が小学・中学卒の者の割合', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-final-education-highschool-old-junior-high-ratio', 'education', '最終学歴が高校・旧中卒の者の割合', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-final-education-junior-college-technical-college-ratio', 'education', '最終学歴が短大・高専卒の者の割合', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-final-education-university-graduate-school-ratio', 'education', '最終学歴が大学・大学院卒の者の割合', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-kindergarten-education-cost-per-student', 'education', '幼稚園教育費（在園者1人当たり）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elementary-school-education-cost-per-student', 'education', '小学校教育費（児童1人当たり）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-junior-high-school-education-cost-per-student', 'education', '中学校教育費（生徒1人当たり）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-high-school-education-cost-fulltime-per-student', 'education', '高等学校教育費（全日制）（生徒1人当たり）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-certified-childcare-center-education-cost-per-student', 'education', '幼保連携型認定こども園教育費（在園者1人当たり）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-primary-activity-avg-time-male', 'lifestyle', '1次活動の平均時間（男）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-primary-activity-avg-time-female', 'lifestyle', '1次活動の平均時間（女）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-secondary-activity-avg-time-employed-male', 'lifestyle', '2次活動の平均時間（有業者・男）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-secondary-activity-avg-time-unemployed-male', 'lifestyle', '2次活動の平均時間（無業者・男）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-secondary-activity-avg-time-employed-female', 'lifestyle', '2次活動の平均時間（有業者・女）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-secondary-activity-avg-time-unemployed-female', 'lifestyle', '2次活動の平均時間（無業者・女）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tertiary-activity-avg-time-employed-male', 'lifestyle', '3次活動の平均時間（有業者・男）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tertiary-activity-avg-time-unemployed-male', 'lifestyle', '3次活動の平均時間（無業者・男）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tertiary-activity-avg-time-employed-female', 'lifestyle', '3次活動の平均時間（有業者・女）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tertiary-activity-avg-time-unemployed-female', 'lifestyle', '3次活動の平均時間（無業者・女）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-work-avg-time-employed-male', 'lifestyle', '仕事の平均時間（有業者・男）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-work-avg-time-employed-female', 'lifestyle', '仕事の平均時間（有業者・女）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-hobby-leisure-avg-time-employed-male', 'lifestyle', '趣味・娯楽の平均時間（有業者・男）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-hobby-leisure-avg-time-unemployed-male', 'lifestyle', '趣味・娯楽の平均時間（無業者・男）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-hobby-leisure-avg-time-employed-female', 'lifestyle', '趣味・娯楽の平均時間（有業者・女）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-hobby-leisure-avg-time-unemployed-female', 'lifestyle', '趣味・娯楽の平均時間（無業者・女）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-broadcast-media-consumption-time-employed-man', 'lifestyle', 'テレビ・ラジオ・新聞・雑誌の平均時間（有業者・男）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-media-avg-time-unemployed-male', 'lifestyle', 'テレビ・ラジオ・新聞・雑誌の平均時間（無業者・男）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-maverage-broadcast-media-consumption-time-employed-woman', 'lifestyle', 'テレビ・ラジオ・新聞・雑誌の平均時間（有業者・女）', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-media-avg-time-unemployed-female', 'lifestyle', 'テレビ・ラジオ・新聞・雑誌の平均時間（無業者・女）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-hall-count-per-million', 'culture', '公民館数（人口100万人当たり）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-library-count-per-million', 'culture', '図書館数（人口100万人当たり）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-museum-count-per-million', 'culture', '博物館数（人口100万人当たり）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-youth-education-facility-count-per-million', 'culture', '青少年教育施設数（人口100万人当たり）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-community-sports-facility-count-per-million', 'culture', '社会体育施設数（人口100万人当たり）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-multipurpose-sports-ground-count-per-million', 'culture', '多目的運動広場数（公共）（人口100万人当たり）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-gymnasium-count-per-million', 'culture', '体育館数（公共）（人口100万人当たり）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-swimming-pool-count-per-million', 'culture', '水泳プール数（屋内，屋外）（公共）（人口100万人当たり）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-youth-class-lecture-count-per-million', 'culture', '青少年学級・講座数（人口100万人当たり）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-adult-class-lecture-count-per-million', 'culture', '成人一般学級・講座数（人口100万人当たり）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-female-class-lecture-count-per-million-female', 'culture', '女性学級・講座数（女性人口100万人当たり）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elderly-class-lecture-count-per-million', 'culture', '高齢者学級・講座数（人口100万人当たり）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-volunteer-activity-annual-participation-rate-15plus', 'culture', 'ボランティア活動の年間行動者率（15歳以上）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 6 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-volunteer-activity-annual-participation-rate-10plus', 'culture', 'ボランティア活動の年間行動者率（10歳以上）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-sports-annual-participation-rate-10plus', 'culture', 'スポーツの年間行動者率（10歳以上）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-passport-issuance-count-per-thousand', 'culture', '一般旅券発行件数（人口千人当たり）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-travel-leisure-annual-participation-rate-15plus', 'culture', '旅行・行楽の年間行動者率（15歳以上）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-travel-leisure-annual-participation-rate-10plus', 'culture', '旅行・行楽の年間行動者率（10歳以上）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-overseas-travel-annual-participation-rate-15plus', 'culture', '海外旅行の年間行動者率（15歳以上）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-overseas-travel-annual-participation-rate-10plus', 'culture', '海外旅行の年間行動者率（10歳以上）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-room-occupancy-rate', 'culture', '客室稼働率', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-book-magazine-retail-annual-sales-per-capita', 'culture', '書籍・雑誌小売業年間商品販売額（人口1人当たり）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-labor-force-population-ratio-man', 'labor', '労働力人口比率（男）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-labor-force-population-ratio-woman', 'labor', '労働力人口比率（女）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employed-people-ratio', 'labor', '就業者比率', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employed-people-ratio-primary', 'labor', '第1次産業就業者比率', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employed-people-ratio-secondary', 'labor', '第2次産業就業者比率', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employed-people-ratio-tertiary', 'labor', '第3次産業就業者比率', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-secondary-employed-people-ratio-tertiary', 'labor', '第2次産業及び第3次産業就業者比率（対就業者）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unemployment-rate', 'labor', '完全失業率', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unemployment-rate-man', 'labor', '完全失業率（男）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unemployment-rate-woman', 'labor', '完全失業率（女）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-dual-income-household-ratio', 'labor', '共働き世帯割合', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employee-ratio', 'labor', '雇用者比率', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-in-prefecture-employed-people-ratio', 'labor', '県内就業者比率', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-migrant-worker-ratio-sales-farm', 'labor', '出稼者比率（販売農家）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-commuter-ratio-to-other-municipalities', 'labor', '他市区町村への通勤者比率', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-commuter-ratio-from-other-municipalities', 'labor', '他市区町村からの通勤者比率', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employment-rate', 'labor', '就職率', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employed-outside-the-prefecture-pre2018', 'labor', '県外就職者比率（～2018）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employed-outside-the-prefecture', 'labor', '県外就職者比率', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-active-job-opening-ratio', 'labor', '有効求人倍率', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fulfillment-rate', 'labor', '充足率', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-part-time-employment-rate-regular', 'labor', 'パートタイム就職率（常用）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-female-part-time-workers-pre2019', 'labor', '女性パートタイム労働者数（～2019）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-male-part-time-workers-pre2019', 'labor', '男性パートタイム労働者数（～2019）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-female-part-time-workers', 'labor', '女性パートタイム労働者数', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-male-part-time-workers', 'labor', '男性パートタイム労働者数', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-high-school-new-graduates-employment-rate', 'labor', '高等学校新規卒業者の就職率', NULL, NULL, 26, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-high-school-graduates-out-of-prefecture-job-ratio', 'labor', '高等学校卒業者に占める県外就職者の割合', NULL, NULL, 27, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-high-school-graduates-job-ratio', 'labor', '高等学校卒業者に占める就職者の割合', NULL, NULL, 28, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-high-school-new-graduates-job-opening-ratio', 'labor', '高等学校新規卒業者の求人倍率', NULL, NULL, 29, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-junior-college-new-graduates-unemployment-rate', 'labor', '短大新規卒業者の無業者率', NULL, NULL, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-university-new-graduates-unemployment-rate', 'labor', '大学新規卒業者の無業者率', NULL, NULL, 31, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-university-graduates-job-ratio', 'labor', '大学卒業者に占める就職者の割合', NULL, NULL, 32, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-middle-aged-employment-rate-45plus', 'labor', '中高年齢者就職率（45歳以上）', NULL, NULL, 33, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-middle-aged-job-ratio-45plus', 'labor', '就職者に占める中高年齢者の比率（45歳以上）', NULL, NULL, 34, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elderly-workers-ratio', 'labor', '高齢就業者割合（65歳以上）', NULL, NULL, 35, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elderly-general-worker-old-population-ratio-pre2019', 'labor', '高齢一般労働者割合（65歳以上）（～2019）', NULL, NULL, 36, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elderly-general-worker-old-population-ratio', 'labor', '高齢一般労働者割合（65歳以上）', NULL, NULL, 37, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-disabled-job-ratio-per-1000', 'labor', '就職者に占める身体障害者の比率（就職件数千件当たり）', NULL, NULL, 38, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-disabled-employment-rate', 'labor', '障害者就職率', NULL, NULL, 39, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-job-change-rate', 'labor', '転職率', NULL, NULL, 40, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 7 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-turnover-rate', 'labor', '離職率', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-employment-rate', 'labor', '新規就業率', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employment-mobility-rate', 'labor', '就業異動率', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-monthly-average-actual-working-hours-male-pre2019', 'labor', '月間平均実労働時間数（男）（～2019）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-monthly-average-actual-working-hours-female-pre2019', 'labor', '月間平均実労働時間数（女）（～2019）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-monthly-average-actual-working-hours-male', 'labor', '月間平均実労働時間数（男）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-monthly-average-actual-working-hours-female', 'labor', '月間平均実労働時間数（女）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-regular-cash-salary-male-pre2019', 'labor', 'きまって支給する現金給与月額（男）（～2019）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-regular-cash-salary-female-pre2019', 'labor', 'きまって支給する現金給与月額（女）（～2019）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-regular-cash-salary-male', 'labor', 'きまって支給する現金給与月額（男）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-regular-cash-salary-female', 'labor', 'きまって支給する現金給与月額（女）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-graduate-starting-salary-highschool-male', 'labor', '新規学卒者初任給（高校）（男）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-graduate-starting-salary-highschool-female', 'labor', '新規学卒者初任給（高校）（女）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-graduate-starting-salary-university-male', 'labor', '新規学卒者初任給（大学）（男）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-graduate-starting-salary-technical-juniorcollege-female', 'labor', '新規学卒者初任給（高専・短大）（女）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-graduate-starting-salary-university-female', 'labor', '新規学卒者初任給（大学）（女）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-graduate-starting-salary-technical-juniorcollege-male', 'labor', '新規学卒者初任給（高専・短大）（男）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-graduate-regular-salary-highschool-male', 'labor', '新規学卒者所定内給与額（高校）（男）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-graduate-regular-salary-highschool-female', 'labor', '新規学卒者所定内給与額（高校）（女）', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-graduate-regular-salary-technical-juniorcollege-male', 'labor', '新規学卒者所定内給与額（高専・短大）（男）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-graduate-regular-salary-technical-juniorcollege-female', 'labor', '新規学卒者所定内給与額（高専・短大）（女）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-graduate-regular-salary-university-male', 'labor', '新規学卒者所定内給与額（大学）（男）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-graduate-regular-salary-university-female', 'labor', '新規学卒者所定内給与額（大学）（女）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-female-part-time-hourly-wage-pre2019', 'labor', '女性パートタイムの給与（1時間当たり）（～2019）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-male-part-time-hourly-wage-pre2019', 'labor', '男性パートタイムの給与（1時間当たり）（～2019）', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-female-part-time-hourly-wage', 'labor', '女性パートタイムの給与（1時間当たり）', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-male-part-time-hourly-wage', 'labor', '男性パートタイムの給与（1時間当たり）', NULL, NULL, 26, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employment-insurance-receipt-rate', 'labor', '雇用保険受給率', NULL, NULL, 27, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employment-insurance-basic-benefit-average', 'labor', '雇用保険基本手当平均支給額', NULL, NULL, 28, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employment-insurance-daily-receipt-rate', 'labor', '雇用保険（日雇）受給率', NULL, NULL, 29, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employment-insurance-daily-basic-benefit-average', 'labor', '雇用保険（日雇）基本手当平均支給額', NULL, NULL, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-workers-compensation-insurance-benefits-rate', 'labor', '労働者災害補償保険給付率', NULL, NULL, 31, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-payment-amount-of-workers-compensation-insurance-benefits', 'labor', '労働者災害補償保険給付平均支給額', NULL, NULL, 32, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-frequency-of-occupational-accidents', 'labor', '労働災害発生の頻度', NULL, NULL, 33, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-work-accident-severity', 'labor', '労働災害の重さの程度', NULL, NULL, 34, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-female-part-time-workers-post2019 ', 'labor', '#F03231_女性パートタイム労働者数（2019～）', NULL, NULL, 35, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-total-farm-household-income', 'economy', '農家総所得', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-agricultural-income-ratio', 'economy', '農業所得割合', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-non-agricultural-income-ratio', 'economy', '農外所得割合', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-actual-income-worker-households-per-month', 'economy', '実収入（二人以上の世帯のうち勤労者世帯）（1世帯当たり1か月間）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-household-head-income-worker-households-per-month', 'economy', '世帯主収入（二人以上の世帯のうち勤労者世帯）（1世帯当たり1か月間）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-farm-household-expenditure-per-month', 'economy', '農家世帯の家計費（1世帯当たり1か月間）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-consumption-expenditure-multi-person-households-per-month', 'economy', '消費支出（二人以上の世帯）（1世帯当たり1か月間）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-food-expenditure-ratio-multi-person-households', 'economy', '食料費割合（二人以上の世帯）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-housing-expenditure-ratio-multi-person-households', 'economy', '住居費割合（二人以上の世帯）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-utilities-expenditure-ratio-multi-person-households', 'economy', '光熱・水道費割合（二人以上の世帯）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-furniture-household-goods-expenditure-ratio-multi-person-households', 'economy', '家具・家事用品費割合（二人以上の世帯）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-clothing-footwear-expenditure-ratio-multi-person-households', 'economy', '被服及び履物費割合（二人以上の世帯）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-healthcare-expenditure-ratio-multi-person-households', 'economy', '保健医療費割合（二人以上の世帯）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-transport-communication-expenditure-ratio-multi-person-households', 'economy', '交通・通信費割合（二人以上の世帯）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 8 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-education-expenditure-ratio-multi-person-households', 'economy', '教育費割合（二人以上の世帯）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-culture-recreation-expenditure-ratio-multi-person-households', 'economy', '教養娯楽費割合（二人以上の世帯）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-other-consumption-expenditure-ratio-multi-person-households', 'economy', 'その他の消費支出割合（二人以上の世帯）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-propensity-to-consume-of-farm-households', 'economy', '農家世帯の平均消費性向', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-avg-propensity-to-consume-worker-households', 'economy', '平均消費性向（二人以上の世帯のうち勤労者世帯）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-avg-savings-rate-worker-households', 'economy', '平均貯蓄率（二人以上の世帯のうち勤労者世帯）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-net-increase-rate-deposits-worker-households', 'economy', '預貯金純増率（二人以上の世帯のうち勤労者世帯）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-net-decrease-rate-land-house-loans-worker-households', 'economy', '土地家屋借金純減率（二人以上の世帯のうち勤労者世帯）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-current-savings-balance-multi-person-households', 'economy', '貯蓄現在高（二人以上の世帯）（1世帯当たり）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-current-deposit-balance-ratio-multi-person-households', 'economy', '預貯金現在高割合（二人以上の世帯）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-current-life-insurance-balance-ratio-multi-person-households', 'economy', '生命保険現在高割合（二人以上の世帯）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-current-securities-balance-ratio-multi-person-households', 'economy', '有価証券現在高割合（二人以上の世帯）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-current-liabilities-balance-multi-person-households', 'economy', '負債現在高（二人以上の世帯）（1世帯当たり）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-housing-land-liabilities-ratio-multi-person-households', 'economy', '住宅・土地のための負債割合（二人以上の世帯）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-microwave-ownership-multi-person-households-per-1000', 'economy', '電子レンジ（電子オーブンレンジを含む）所有数量（二人以上の世帯）（千世帯当たり）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-room-aircon-ownership-multi-person-households-per-1000', 'economy', 'ルームエアコン所有数量（二人以上の世帯）（千世帯当たり）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-piano-ownership-multi-person-households-per-1000', 'economy', 'ピアノ・電子ピアノ所有数量（二人以上の世帯）（千世帯当たり）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-car-ownership-multi-person-households-per-1000', 'economy', '自動車所有数量（二人以上の世帯）（千世帯当たり）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-stereo-cd-md-radio-ownership-multi-person-households-per-1000', 'economy', 'ステレオセットまたはＣＤ・ＭＤラジオカセット所有数量（二人以上の世帯）（千世帯当たり）', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-mobile-phone-ownership-multi-person-households-per-1000', 'economy', '携帯電話（ＰＨＳを含む）所有数量（二人以上の世帯）（千世帯当たり）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-pc-ownership-multi-person-households-per-1000', 'economy', 'パソコン所有数量（二人以上の世帯）（千世帯当たり）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tablet-ownership-multi-person-households-per-1000', 'economy', 'タブレット端末所有数量（二人以上の世帯）（千世帯当たり）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-smartphone-ownership-multi-person-households-per-1000', 'economy', 'スマートフォン所有数量（二人以上の世帯）（千世帯当たり）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-total', 'economy', '消費者物価指数対前年変化率（総合）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-excl-owner-rent', 'economy', '消費者物価指数対前年変化率（持ち家の帰属家賃を除く総合）', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-excl-fresh-food', 'economy', '消費者物価指数対前年変化率（生鮮食品を除く総合）', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-food', 'economy', '消費者物価指数対前年変化率（食料）', NULL, NULL, 26, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-housing', 'economy', '消費者物価指数対前年変化率（住居）', NULL, NULL, 27, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-utilities', 'economy', '消費者物価指数対前年変化率（光熱・水道）', NULL, NULL, 28, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-furniture', 'economy', '消費者物価指数対前年変化率（家具・家事用品）', NULL, NULL, 29, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-clothing', 'economy', '消費者物価指数対前年変化率（被服及び履物）', NULL, NULL, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-healthcare', 'economy', '消費者物価指数対前年変化率（保健医療）', NULL, NULL, 31, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-transport-communication', 'economy', '消費者物価指数対前年変化率（交通・通信）', NULL, NULL, 32, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-education', 'economy', '消費者物価指数対前年変化率（教育）', NULL, NULL, 33, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-culture-recreation', 'economy', '消費者物価指数対前年変化率（教養娯楽）', NULL, NULL, 34, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-miscellaneous', 'economy', '消費者物価指数対前年変化率（諸雑費）', NULL, NULL, 35, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-excl-food-energy', 'economy', '消費者物価指数対前年変化率（食料（酒類を除く）及びエネルギーを除く総合）', NULL, NULL, 36, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-change-rate-excl-fresh-food-energy', 'economy', '消費者物価指数対前年変化率（生鮮食品及びエネルギーを除く総合）', NULL, NULL, 37, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-total-tokyo100', 'economy', '消費者物価地域差指数（総合：東京都区部＝100）', NULL, NULL, 38, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-total-51cities100', 'economy', '消費者物価地域差指数（総合）（51市平均＝100）', NULL, NULL, 39, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-food-tokyo100', 'economy', '消費者物価地域差指数（食料：東京都区部＝100）', NULL, NULL, 40, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-food-51cities100', 'economy', '消費者物価地域差指数（食料）（51市平均＝100）', NULL, NULL, 41, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-standard-price-change-rate-residential', 'economy', '標準価格対前年平均変動率（住宅地）', NULL, NULL, 42, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-standard-price-change-rate-commercial', 'economy', '標準価格対前年平均変動率（商業地）', NULL, NULL, 43, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-standard-price-change-rate-industrial', 'economy', '標準価格対前年平均変動率（工業地）', NULL, NULL, 44, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-total', 'economy', '消費者物価地域差指数（総合）', NULL, NULL, 45, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-excl-rent', 'economy', '消費者物価地域差指数（家賃を除く総合）', NULL, NULL, 46, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-food', 'economy', '消費者物価地域差指数（食料）', NULL, NULL, 47, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-housing', 'economy', '消費者物価地域差指数（住居）', NULL, NULL, 48, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-utilities', 'economy', '消費者物価地域差指数（光熱・水道）', NULL, NULL, 49, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 9 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-cpi-regional-difference-index-furniture', 'economy', '消費者物価地域差指数（家具・家事用品）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-clothing', 'economy', '消費者物価地域差指数（被服及び履物）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-healthcare', 'economy', '消費者物価地域差指数（保健医療）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-transport-communication', 'economy', '消費者物価地域差指数（交通・通信）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-education', 'economy', '消費者物価地域差指数（教育）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-culture-recreation', 'economy', '消費者物価地域差指数（教養娯楽）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cpi-regional-difference-index-miscellaneous', 'economy', '消費者物価地域差指数（諸雑費）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-financial-assets-balance-multi-person-households', 'economy', '金融資産残高（貯蓄現在高）（二人以上の世帯）（1世帯当たり）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-deposit-balance-ratio-multi-person-households', 'economy', '預貯金現在高割合（二人以上の世帯）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-life-insurance-balance-ratio-multi-person-households', 'economy', '生命保険現在高割合（二人以上の世帯）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-securities-balance-ratio-multi-person-households', 'economy', '有価証券現在高割合（二人以上の世帯）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-liabilities-balance-multi-person-households', 'economy', '負債現在高（二人以上の世帯）（1世帯当たり）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-housing-land-liabilities-ratio-multi-person-households', 'economy', '住宅・土地のための負債割合（二人以上の世帯）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-annual-income-per-household', 'economy', '年間収入（1世帯当たり）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-household-head-annual-income-per-household', 'economy', '世帯主収入（年間収入）（1世帯当たり）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-total-area-including-northern-territories-and-takeshima', 'environment', '総面積（北方地域及び竹島を含む）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-area-ratio-of-total', 'environment', '面積割合（全国面積に占める割合）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-forest-area-ratio', 'environment', '森林面積割合', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-nature-park-area-ratio', 'environment', '自然公園面積割合', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-habitable-area-ratio', 'environment', '可住地面積割合', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-total-assessed-land-area-ratio', 'environment', '評価総地積割合（課税対象土地）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-total-assessed-land-area-ratio-paddy', 'environment', '評価総地積割合（田）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-total-assessed-land-area-ratio-field', 'environment', '評価総地積割合（畑）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-total-assessed-land-area-ratio-residential', 'environment', '評価総地積割合（宅地）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-temperature', 'environment', '年平均気温', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-maximum-temperature', 'environment', '最高気温（日最高気温の月平均の最高値）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-lowest-temperature', 'environment', '最低気温（日最低気温の月平均の最低値）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-relative-humidity', 'environment', '年平均相対湿度', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-annual-clear-days', 'environment', '快晴日数（年間）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-annual-precipitation-days', 'environment', '降水日数（年間）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-annual-snow-days', 'environment', '雪日数（年間）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-annual-sunshine-duration', 'environment', '日照時間（年間）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-annual-precipitation', 'environment', '降水量（年間）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-gdp-growth-rate-pref-h17', 'economy', '県内総生産額対前年増加率（平成17年基準）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-prefectural-income-growth-rate-h17', 'economy', '県民所得対前年増加率（平成17年基準）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-gross-prefectural-income-growth-rate-nominal-h17', 'economy', '県民総所得対前年増加率（名目）（平成17年基準）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-gross-prefectural-income-growth-rate-real-h17', 'economy', '県民総所得対前年増加率（実質）（平成17年基準）', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-gdp-growth-rate-pref-h23', 'economy', '県内総生産額対前年増加率（平成23年基準）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-prefectural-income-growth-rate-h23', 'economy', '県民所得対前年増加率（平成23年基準）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-gross-prefectural-income-growth-rate-nominal-h23', 'economy', '県民総所得対前年増加率（名目）（平成23年基準）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-gdp-growth-rate-pref-h27', 'economy', '県内総生産額対前年増加率（平成27年基準）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-prefectural-income-growth-rate-h27', 'economy', '県民所得対前年増加率（平成27年基準）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-gross-prefectural-income-growth-rate-nominal-h27', 'economy', '県民総所得対前年増加率（名目）（平成27年基準）', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-prefectural-income-h17', 'economy', '1人当たり県民所得（平成17年基準）', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-prefectural-income-h23', 'economy', '1人当たり県民所得（平成23年基準）', NULL, NULL, 26, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-per-capita-prefectural-income-h27', 'economy', '1人当たり県民所得（平成27年基準）', NULL, NULL, 27, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-secondary-industry-establishment-ratio-census', 'economy', '第2次産業事業所数構成比（事業所・企業統計調査結果）', NULL, NULL, 28, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tertiary-industry-establishment-ratio-census', 'economy', '第3次産業事業所数構成比（事業所・企業統計調査結果）', NULL, NULL, 29, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-secondary-industry-establishment-ratio', 'economy', '第2次産業事業所数構成比', NULL, NULL, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tertiary-industry-establishment-ratio', 'economy', '第3次産業事業所数構成比', NULL, NULL, 31, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 10 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-establishment-ratio-1-4-employees-private', 'economy', '従業者1～4人の事業所割合（民営）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-establishment-ratio-5-9-employees-private', 'economy', '従業者5～9人の事業所割合（民営）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-establishment-ratio-10-29-employees-private', 'economy', '従業者10～29人の事業所割合（民営）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-establishment-ratio-100-299-employees-private', 'economy', '従業者100～299人の事業所割合（民営）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-establishment-ratio-300plus-employees-private', 'economy', '従業者300人以上の事業所割合（民営）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employee-ratio-1-4-employee-establishments-private', 'economy', '従業者1～4人の事業所の従業者割合（民営）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employee-ratio-5-9-employee-establishments-private', 'economy', '従業者5～9人の事業所の従業者割合（民営）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employee-ratio-10-29-employee-establishments-private', 'economy', '従業者10～29人の事業所の従業者割合（民営）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employee-ratio-100-299-employee-establishments-private', 'economy', '従業者100～299人の事業所の従業者割合（民営）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-employee-ratio-300plus-employee-establishments-private', 'economy', '従業者300人以上の事業所の従業者割合（民営）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-secondary-industry-employees-per-establishment-census', 'economy', '第2次産業従業者数（1事業所当たり）（事業所・企業統計調査結果）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tertiary-industry-employees-per-establishment-census', 'economy', '第3次産業従業者数（1事業所当たり）（事業所・企業統計調査結果）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-secondary-industry-employees-per-establishment', 'economy', '第2次産業従業者数（1事業所当たり）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tertiary-industry-employees-per-establishment', 'economy', '第3次産業従業者数（1事業所当たり）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-agricultural-output-per-employed-person', 'economy', '就業者1人当たり農業産出額（販売農家）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-agricultural-output-per-worker-individual-farm', 'economy', '就業者1人当たり農業産出額（個人経営体）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cultivated-land-area-ratio', 'economy', '耕地面積比率', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-land-productivity-per-ha', 'economy', '土地生産性（耕地面積1ヘクタール当たり）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cultivated-land-area-per-household', 'economy', '耕地面積（農家1戸当たり）', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-manufacturing-shipment-amount-per-employee', 'economy', '製造品出荷額等（従業者1人当たり）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-manufacturing-shipment-amount-per-establishment', 'economy', '製造品出荷額等（1事業所当たり）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-annual-sales-amount-per-employee', 'economy', '商業年間商品販売額（卸売業＋小売業）（従業者1人当たり）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-annual-sales-amount-per-establishment', 'economy', '商業年間商品販売額（卸売業＋小売業）（1事業所当たり）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-deposit-balance-per-person', 'economy', '預貯金残高（人口1人当たり）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-postal-savings-balance-per-capita', 'economy', '郵便貯金残高（人口1人当たり）', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-bank-deposit-balance-per-person', 'economy', '国内銀行預金残高（人口1人当たり）', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-total-population', 'population', '総人口', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-total-population-male', 'population', '総人口（男）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-total-population-female', 'population', '総人口（女）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-population-ratio-to-national-total', 'population', '全国総人口に占める人口割合', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-population-density-per-km2-total-area', 'population', '総面積１km2当たり人口密度', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-population-density-per-km2-inhabitable-area', 'population', '可住地面積１km2当たり人口密度', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-day-time-population-ratio', 'population', '昼夜間人口比率', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-densely-inhabited-district-population-ratio', 'population', '人口集中地区人口比率', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-densely-populated-area-ratio', 'population', '人口集中地区面積比率', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-densely-inhabited-district-population-density', 'population', '人口集中地区人口密度（人口集中地区面積１km2当たり）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-densely-populated-area-change-rate', 'population', '人口集中地区面積の変化率', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-foreign-resident-count-per-100k', 'population', '外国人人口（人口10万人当たり）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-foreign-resident-count-korea-per-100k', 'population', '外国人人口（韓国、朝鮮）（人口10万人当たり）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-foreign-resident-count-china-per-100k', 'population', '外国人人口（中国）（人口10万人当たり）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-foreign-resident-count-usa-per-100k', 'population', '外国人人口（アメリカ）（人口10万人当たり）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-future-population-2020', 'population', '将来推計人口（2020年）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-future-population-2025', 'population', '将来推計人口（2025年）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-future-population-2030', 'population', '将来推計人口（2030年）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-future-population-2035', 'population', '将来推計人口（2035年）', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-future-population-2040', 'population', '将来推計人口（2040年）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-future-population-2045', 'population', '将来推計人口（2045年）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-future-population-2050', 'population', '将来推計人口（2050年）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-sex-ratio-total', 'population', '人口性比（総数）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-sex-young-population-ratio', 'population', '人口性比（15歳未満人口）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 11 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-sex-production-age-population-ratio', 'population', '人口性比（15～64歳人口）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-sex-old-population-ratio', 'population', '人口性比（65歳以上人口）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-young-population-index', 'population', '年少人口指数', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-old-population-index', 'population', '老年人口指数', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-dependent-population-index', 'population', '従属人口指数', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-aging-index', 'population', '老年化指数', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-young-population-ratio', 'population', '15歳未満人口割合', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-production-age-population-ratio', 'population', '15～64歳人口割合', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-old-population-ratio', 'population', '65歳以上人口割合', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unmarried-ratio-male-20-24', 'population', '未婚者割合（20～24歳・男）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unmarried-ratio-female-20-24', 'population', '未婚者割合（20～24歳・女）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unmarried-ratio-male-25-29', 'population', '未婚者割合（25～29歳・男）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unmarried-ratio-female-25-29', 'population', '未婚者割合（25～29歳・女）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unmarried-ratio-male-30-34', 'population', '未婚者割合（30～34歳・男）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unmarried-ratio-female-30-34', 'population', '未婚者割合（30～34歳・女）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unmarried-ratio-male-35-39', 'population', '未婚者割合（35～39歳・男）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unmarried-ratio-female-35-39', 'population', '未婚者割合（35～39歳・女）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unmarried-ratio-male-40-44', 'population', '未婚者割合（40～44歳・男）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unmarried-ratio-female-40-44', 'population', '未婚者割合（40～44歳・女）', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unmarried-ratio-male-45-49', 'population', '未婚者割合（45～49歳・男）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unmarried-ratio-female-45-49', 'population', '未婚者割合（45～49歳・女）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-unmarried-ratio-15plus', 'population', '未婚者割合（15歳以上人口）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-widowed-ratio-male-60plus', 'population', '死別者割合（60歳以上・男）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-widowed-ratio-female-60plus', 'population', '死別者割合（60歳以上・女）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-divorced-ratio-male-40-49', 'population', '離別者割合（40～49歳・男）', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-divorced-ratio-female-40-49', 'population', '離別者割合（40～49歳・女）', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-divorced-ratio-male-50-59', 'population', '離別者割合（50～59歳・男）', NULL, NULL, 26, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-divorced-ratio-female-50-59', 'population', '離別者割合（50～59歳・女）', NULL, NULL, 27, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-population-growth-rate', 'population', '人口増減率', NULL, NULL, 28, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-natural-increase-rate', 'population', '自然増減率', NULL, NULL, 29, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-crude-birth-rate', 'population', '粗出生率（人口千人当たり）', NULL, NULL, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-total-fertility-rate', 'population', '合計特殊出生率', NULL, NULL, 31, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-crude-death-rate', 'population', '粗死亡率（人口千人当たり）', NULL, NULL, 32, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-crude-death-rate-male', 'population', '粗死亡率（男）（人口千人当たり）', NULL, NULL, 33, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-crude-death-rate-female', 'population', '粗死亡率（女）（人口千人当たり）', NULL, NULL, 34, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-age-specific-death-rate-0-4-per-1000', 'population', '年齢別死亡率（0～4歳）（人口千人当たり）', NULL, NULL, 35, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-age-adjusted-mortality-rate-old', 'population', '年齢別死亡率（65歳以上）（人口千人当たり）', NULL, NULL, 36, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-age-adjusted-death-rate-male-s60-per-1000', 'population', '年齢調整死亡率（男）(昭和60年モデル人口)（人口千人当たり）', NULL, NULL, 37, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-age-adjusted-death-rate-female-s60-per-1000', 'population', '年齢調整死亡率（女）(昭和60年モデル人口)（人口千人当たり）', NULL, NULL, 38, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-age-adjusted-death-rate-male-h27-per-1000', 'population', '年齢調整死亡率（男）(平成27年モデル人口)（人口千人当たり）', NULL, NULL, 39, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-age-adjusted-death-rate-female-h27-per-1000', 'population', '年齢調整死亡率（女）(平成27年モデル人口)（人口千人当たり）', NULL, NULL, 40, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-moving-in-excess-rate-japanese', 'population', '転入超過率（日本人移動者）', NULL, NULL, 41, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-moving-in-rate-japanese', 'population', '転入率（日本人移動者）', NULL, NULL, 42, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-moving-out-rate-japanese', 'population', '転出率（日本人移動者）', NULL, NULL, 43, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-inflow-population-ratio', 'population', '流入人口比率', NULL, NULL, 44, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-outflow-population-ratio', 'population', '流出人口比率', NULL, NULL, 45, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-social-increase-rate', 'population', '社会増減率', NULL, NULL, 46, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-moving-in-excess-rate', 'population', '転入超過率', NULL, NULL, 47, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-moving-in-rate', 'population', '転入率', NULL, NULL, 48, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-moving-out-rate', 'population', '転出率', NULL, NULL, 49, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 12 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-ratio-of-general-households-to-national', 'population', '全国一般世帯に占める一般世帯割合', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-persons-per-general-household', 'population', '一般世帯の平均人員', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-general-households', 'population', '一般世帯数', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-nuclear-family-households-ratio', 'population', '核家族世帯割合', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-single-person-household-ratio', 'population', '単独世帯割合', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-household-ratio-with-65plus', 'population', '65歳以上の世帯員のいる世帯割合', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-elderly-couple-only-household-ratio', 'population', '夫65歳以上、妻60歳以上の夫婦のみの世帯の割合', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-single-person-household-old-population-ratio', 'population', '65歳以上世帯員の単独世帯の割合', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-marriages-per-total-population', 'population', '婚姻率（人口千人当たり）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-divorces-per-total-population', 'population', '離婚率（人口千人当たり）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-housing-construction-ratio', 'lifestyle', '着工新設住宅比率', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-owner-occupied-housing-ratio', 'lifestyle', '持ち家比率', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-rented-housing-ratio', 'lifestyle', '借家比率', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-private-rented-housing-ratio', 'lifestyle', '民営借家比率', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-detached-house-ratio', 'lifestyle', '一戸建住宅比率', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-row-house-ratio', 'lifestyle', '長屋建住宅比率', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-apartment-ratio', 'lifestyle', '共同住宅比率', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-vacant-housing-ratio', 'lifestyle', '空き家比率', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-owner-occupied-housing-ratio', 'lifestyle', '着工新設持ち家比率', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-new-rented-housing-ratio', 'lifestyle', '着工新設貸家比率', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-rooms-per-dwelling', 'lifestyle', '居住室数（1住宅当たり）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-rooms-per-dwelling-owner', 'lifestyle', '居住室数（1住宅当たり）（持ち家）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-rooms-per-dwelling-rented', 'lifestyle', '居住室数（1住宅当たり）（借家）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tatami-per-dwelling-owner', 'lifestyle', '持ち家住宅の居住室の畳数（1住宅当たり）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tatami-per-dwelling-rented', 'lifestyle', '借家住宅の居住室の畳数（1住宅当たり）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-floor-area-per-dwelling-owner', 'lifestyle', '持ち家住宅の延べ面積（1住宅当たり）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-floor-area-per-dwelling-rented', 'lifestyle', '借家住宅の延べ面積（1住宅当たり）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-site-area-per-dwelling', 'lifestyle', '住宅の敷地面積（1住宅当たり）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-floor-area-new-owner-dwelling', 'lifestyle', '着工新設持ち家住宅の床面積（1住宅当たり）', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-floor-area-new-rented-dwelling', 'lifestyle', '着工新設貸家住宅の床面積（1住宅当たり）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-floor-area-new-owner-rented-dwelling', 'lifestyle', '着工新設持ち家・貸家住宅の床面積（1住宅当たり）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-site-area-per-person', 'lifestyle', '住宅の敷地面積（1人当たり）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tatami-per-person', 'lifestyle', '居住室の畳数（1人当たり）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-floor-area-per-person', 'lifestyle', '延べ面積（1人当たり）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tatami-per-person-owner', 'lifestyle', '持ち家住宅の畳数（1人当たり）', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-tatami-per-person-rented', 'lifestyle', '借家住宅の畳数（1人当たり）', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-site-area-per-person-alt', 'lifestyle', '住宅の敷地面積（1人当たり）', NULL, NULL, 26, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-flush-toilet-housing-count-per-1000', 'lifestyle', '水洗トイレのある住宅数（人口千人当たり）', NULL, NULL, 27, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-flush-toilet-housing-ratio', 'lifestyle', '水洗トイレのある住宅比率', NULL, NULL, 28, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-bathroom-housing-ratio', 'lifestyle', '浴室のある住宅比率', NULL, NULL, 29, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-bathroom-housing-count-per-1000', 'lifestyle', '浴室のある住宅数（人口千人当たり）', NULL, NULL, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-household-ratio-above-minimum-housing-area', 'lifestyle', '最低居住面積水準以上世帯割合', NULL, NULL, 31, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-household-ratio-main-earner-employee-commute-90min', 'lifestyle', '家計を主に支える者が雇用者である普通世帯比率（通勤時間90分以上）（普通世帯千世帯当たり）', NULL, NULL, 32, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-main-household-ratio-main-earner-employee-commute-90min', 'lifestyle', '家計を主に支える者が雇用者である主世帯比率（通勤時間1時間30分以上）（主世帯千世帯当たり）', NULL, NULL, 33, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-rental-housing-rent-per-3-3m2', 'lifestyle', '公営賃貸住宅の家賃（1か月3.3m2当たり）', NULL, NULL, 34, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-private-rental-housing-rent-per-3-3m2', 'lifestyle', '民営賃貸住宅の家賃（1か月3.3m2当たり）', NULL, NULL, 35, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-housing-site-value-per-3-3m2', 'lifestyle', '住宅敷地価額（公庫貸付分、3.3m2当たり）', NULL, NULL, 36, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-planned-construction-cost-per-m2', 'lifestyle', '着工居住用建築物工事費予定額（床面積1m2当たり）', NULL, NULL, 37, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-city-gas-supply-area-household-ratio', 'lifestyle', '都市ガス供給区域内世帯比率', NULL, NULL, 38, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-city-gas-sales-volume', 'lifestyle', '都市ガス販売量', NULL, NULL, 39, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 13 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-gasoline-sales-volume', 'lifestyle', 'ガソリン販売量', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-electricity-generation-capacity', 'lifestyle', '発電電力量', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-power-demand-amount', 'lifestyle', '電力需要量', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-water-supply-population-ratio-pre2011', 'lifestyle', '上水道給水人口比率（－2011）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-water-supply-population-ratio-2012on', 'lifestyle', '上水道給水人口比率（2012－）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-sewerage-penetration-rate-pre2011', 'lifestyle', '下水道普及率（－2011）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-sewerage-penetration-rate-2012on', 'lifestyle', '下水道普及率（2012－）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-flush-toilet-population-ratio', 'lifestyle', '水洗化人口比率', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-night-soil-treatment-population-ratio-pre2011', 'lifestyle', 'し尿処理人口比率（－2011）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-night-soil-treatment-population-ratio-2012on', 'lifestyle', 'し尿処理人口比率（2012－）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-garbage-recycling-rate', 'lifestyle', 'ごみのリサイクル率', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-garbage-landfill-rate', 'lifestyle', 'ごみ埋立率', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-final-disposal-site-remaining-capacity', 'lifestyle', '最終処分場残余容量', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-retail-store-count-per-1000', 'lifestyle', '小売店数(事業所・企業統計調査結果）（人口千人当たり）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-apparel-retail-store-count-per-1000', 'lifestyle', '織物・衣服・身の回り品小売店数(事業所・企業統計調査結果）（人口千人当たり）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-food-retail-store-count-per-1000', 'lifestyle', '飲食料品小売店数(事業所・企業統計調査結果）（人口千人当たり）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-restaurant-count-per-1000', 'lifestyle', '飲食店数(事業所・企業統計調査結果）（人口千人当たり）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-large-retail-store-count-per-100k', 'lifestyle', '大型小売店数(事業所・企業統計調査結果）（人口10万人当たり）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-department-store-count-per-100k', 'lifestyle', '百貨店数(事業所・企業統計調査結果）（人口10万人当たり）', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-self-service-store-count-per-100k', 'lifestyle', 'セルフサービス事業所数（人口10万人当たり）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-convenience-store-count-per-100k', 'lifestyle', 'コンビニエンスストア数（人口10万人当たり）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-barber-beauty-salon-count-per-100k', 'lifestyle', '理容・美容所数（人口10万人当たり）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-cleaning-shop-count-per-100k', 'lifestyle', 'クリーニング所数（人口10万人当たり）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-bath-count-per-100k', 'lifestyle', '公衆浴場数（人口10万人当たり）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-gas-station-count-per-100km', 'lifestyle', '給油所数（道路実延長100km当たり）', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-retail-store-count-per-1000-alt', 'lifestyle', '小売店数（人口千人当たり）', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-apparel-retail-store-count-per-1000-alt', 'lifestyle', '織物・衣服・身の回り品小売店数（人口千人当たり）', NULL, NULL, 26, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-food-retail-store-count-per-1000-alt', 'lifestyle', '飲食料品小売店数（人口千人当たり）', NULL, NULL, 27, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-restaurant-count-per-1000-alt', 'lifestyle', '飲食店数（人口千人当たり）', NULL, NULL, 28, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-large-retail-store-count-per-100k-alt', 'lifestyle', '大型小売店数（人口10万人当たり）', NULL, NULL, 29, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-department-supermarket-count-per-100k', 'lifestyle', '百貨店、総合スーパー数（人口10万人当たり）', NULL, NULL, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-post-office-count-per-100km2', 'lifestyle', '郵便局数（可住地面積100km2当たり）', NULL, NULL, 31, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-telephone-subscription-count-per-1000', 'lifestyle', '電話加入数（人口千人当たり）', NULL, NULL, 32, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-residential-telephone-subscription-count-per-1000', 'lifestyle', '住宅用電話加入数（人口千人当たり）', NULL, NULL, 33, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-phone-count-per-1000', 'lifestyle', '公衆電話設置台数（人口千人当たり）', NULL, NULL, 34, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-mail-acceptance-count', 'lifestyle', '郵便物引受数', NULL, NULL, 35, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-mobile-phone-contract-count-per-1000', 'lifestyle', '携帯電話契約数（人口千人当たり）', NULL, NULL, 36, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-road-length-per-km2', 'lifestyle', '道路実延長（総面積1km2当たり）', NULL, NULL, 37, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-main-road-length-per-km2', 'lifestyle', '主要道路実延長（総面積1km2当たり）', NULL, NULL, 38, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-main-road-paving-rate', 'lifestyle', '主要道路舗装率', NULL, NULL, 39, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-municipal-road-paving-rate', 'lifestyle', '市町村道舗装率', NULL, NULL, 40, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-vehicle-kilometers-traveled', 'lifestyle', '自動車走行台キロ', NULL, NULL, 41, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-road-traffic', 'lifestyle', '道路平均交通量', NULL, NULL, 42, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-urbanization-control-area-ratio', 'lifestyle', '市街化調整区域面積比率', NULL, NULL, 43, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-residential-area-ratio', 'lifestyle', '住居専用地域面積比率', NULL, NULL, 44, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-residential-and-mixed-area-ratio', 'lifestyle', '住居専用・住居地域面積比率', NULL, NULL, 45, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-neighborhood-commercial-area-ratio', 'lifestyle', '近隣商業地域面積比率', NULL, NULL, 46, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-commercial-and-neighborhood-commercial-area-ratio', 'lifestyle', '商業・近隣商業地域面積比率', NULL, NULL, 47, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-industrial-and-semi-industrial-area-ratio', 'lifestyle', '工業・準工業地域面積比率', NULL, NULL, 48, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-industrial-exclusive-area-ratio', 'lifestyle', '工業専用地域面積比率', NULL, NULL, 49, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 14 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-urban-park-area-per-person', 'lifestyle', '都市公園面積（人口1人当たり）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-urban-park-count-per-100km2', 'lifestyle', '都市公園数（可住地面積100km2当たり）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-block-park-count-per-100km2', 'lifestyle', '街区公園数（可住地面積100km2当たり）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-neighborhood-park-count-per-100km2', 'lifestyle', '近隣公園数（可住地面積100km2当たり）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-sports-park-count-per-100km2', 'lifestyle', '運動公園数（可住地面積100km2当たり）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-height-primary-school-fifth-grade-male', 'health', '平均身長（小学5年・男）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-height-primary-school-fifth-grade-female', 'health', '平均身長（小学5年・女）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-height-middle-school-second-grade-male', 'health', '平均身長（中学2年・男）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-height-middle-school-second-grade-female', 'health', '平均身長（中学2年・女）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-avg-height-high-school-2nd-male', 'health', '平均身長（高校2年・男）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-height-high-school-second-grade-female', 'health', '平均身長（高校2年・女）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-weight-primary-school-fifth-grade-male', 'health', '平均体重（小学5年・男）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-weight-primary-school-fifth-grade-female', 'health', '平均体重（小学5年・女）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-weight-middle-school-second-grade-male', 'health', '平均体重（中学2年・男）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-height-middle-school-second-grade-female', 'health', '平均体重（中学2年・女）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-weight-high-school-second-grade-male', 'health', '平均体重（高校2年・男）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-weight-high-school-second-grade-female', 'health', '平均体重（高校2年・女）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-annual-new-inpatients-general-hospital-per-1000', 'health', '一般病院年間新入院患者数（人口千人当たり）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-annual-new-inpatients-general-hospital-per-100k', 'health', '一般病院年間新入院患者数（人口10万人当たり）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-annual-new-inpatients-psychiatric-hospital-per-100k', 'health', '精神科病院年間新入院患者数（人口10万人当たり）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-outpatient-rate-per-1000', 'health', '通院者率（人口千人当たり）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-complainant-rate-per-1000', 'health', '有訴者率（人口千人当たり）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-outpatient-rate-per-100k', 'health', '通院者率（人口10万人当たり）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-complainant-rate-per-100k', 'health', '有訴者率（人口10万人当たり）', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-avg-daily-outpatients-general-hospital-per-1000', 'health', '一般病院の1日平均外来患者数（人口千人当たり）', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-avg-daily-outpatients-general-hospital-per-100k', 'health', '一般病院の1日平均外来患者数（人口10万人当たり）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-avg-daily-outpatients-psychiatric-hospital-per-100k', 'health', '精神科病院の1日平均外来患者数（人口10万人当たり）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-avg-daily-inpatients-general-hospital-per-1000', 'health', '一般病院の1日平均在院患者数（人口千人当たり）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-avg-daily-inpatients-general-hospital-per-100k', 'health', '一般病院の1日平均在院患者数（人口10万人当たり）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-avg-daily-inpatients-psychiatric-hospital-per-100k', 'health', '精神科病院の1日平均在院患者数（人口10万人当たり）', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-avg-daily-inpatients-psychiatric-hospital-per-1000', 'health', '精神科病院の1日平均在院患者数（人口千人当たり）', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-standardized-mortality-rate-per-1000', 'health', '標準化死亡率（基準人口＝昭和5年）（人口千人当たり）', NULL, NULL, 26, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-standardized-mortality-rate-per-100k', 'health', '標準化死亡率（基準人口＝昭和5年）（人口10万人当たり）', NULL, NULL, 27, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-life-expectancy-0-male', 'health', '平均余命（0歳・男）', NULL, NULL, 28, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-life-expectancy-0-female', 'health', '平均余命（0歳・女）', NULL, NULL, 29, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-life-expectancy-male', 'health', '平均余命（20歳・男）', NULL, NULL, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-life-expectancy-female ', 'health', '平均余命（20歳・女）', NULL, NULL, 31, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-life-expectancy-65-male', 'health', '平均余命（65歳・男）', NULL, NULL, 32, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-average-life-expectancy-female-65', 'health', '平均余命（65歳・女）', NULL, NULL, 33, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-deaths-lifestyle-diseases-per-100k', 'health', '生活習慣病による死亡者数（人口10万人当たり）', NULL, NULL, 34, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-deaths-malignant-neoplasms-per-100k', 'health', '悪性新生物（腫瘍）による死亡者数（人口10万人当たり）', NULL, NULL, 35, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-deaths-diabetes-per-100k', 'health', '糖尿病による死亡者数（人口10万人当たり）', NULL, NULL, 36, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-deaths-hypertensive-diseases-per-100k', 'health', '高血圧性疾患による死亡者数（人口10万人当たり）', NULL, NULL, 37, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-deaths-heart-disease-excl-hypertensive-per-100k', 'health', '心疾患（高血圧性を除く）による死亡者数（人口10万人当たり）', NULL, NULL, 38, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-deaths-cerebrovascular-disease-per-100k', 'health', '脳血管疾患による死亡者数（人口10万人当たり）', NULL, NULL, 39, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-suicides-per-100k', 'health', '自殺者数（人口10万人当たり）', NULL, NULL, 40, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-stillbirth-rate', 'health', '死産率（出産数千当たり）', NULL, NULL, 41, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-neonatal-mortality-rate-per-1000-births', 'health', '新生児死亡率（出生数千当たり）', NULL, NULL, 42, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-infant-mortality-rate-per-1000-births', 'health', '乳児死亡率（出生数千当たり）', NULL, NULL, 43, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-maternal-mortality-rate-per-100k-births', 'health', '妊娠、分娩及び産じょくによる死亡率（出産数10万当たり）', NULL, NULL, 44, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 15 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-perinatal-mortality-rate-per-1000-births', 'health', '周産期死亡率（出生数千当たり）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-low-birthweight-rate-per-1000-births', 'health', '2500g未満の出生率（出生数千当たり）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-long-absence-primary-school-illness-per-1000', 'health', '病気による小学校長期欠席児童比率（年度間30日以上）（児童千人当たり）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-long-absence-middle-school-illness-per-1000', 'health', '病気による中学校長期欠席生徒比率（年度間30日以上）（生徒千人当たり）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-general-hospital-count-per-100k', 'health', '一般病院数（人口10万人当たり）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-general-clinic-count-per-100k', 'health', '一般診療所数（人口10万人当たり）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-dental-clinic-count-per-100k', 'health', '歯科診療所数（人口10万人当たり）', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-psychiatric-hospital-count-per-100k', 'health', '精神科病院数（人口10万人当たり）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-general-hospital-bed-count-per-100k', 'health', '一般病院病床数（人口10万人当たり）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-psychiatric-bed-count-per-100k', 'health', '精神病床数（人口10万人当たり）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-long-term-care-medical-facility-count-per-100k-65plus', 'health', '介護療養型医療施設数（65歳以上人口10万人当たり）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-physicians-in-medical-facilities-per-100k', 'health', '医療施設に従事する医師数（人口10万人当たり）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-dentists-in-medical-facilities-per-100k', 'health', '医療施設に従事する歯科医師数（人口10万人当たり）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-nurses-in-medical-facilities-per-100k', 'health', '医療施設に従事する看護師・准看護師数（人口10万人当たり）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fulltime-physicians-general-hospital-per-100beds-report', 'health', '一般病院常勤医師数（100病床当たり）（病院報告）', NULL, NULL, 14, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fulltime-physicians-general-hospital-per-100beds', 'health', '一般病院常勤医師数（100病床当たり）', NULL, NULL, 15, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-nurses-general-hospital-per-100beds-report', 'health', '一般病院看護師・准看護師数（100病床当たり）（病院報告）', NULL, NULL, 16, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-nurses-general-hospital-per-100beds', 'health', '一般病院看護師・准看護師数（100病床当たり）', NULL, NULL, 17, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-general-hospital-ratio', 'health', '公立一般病院数の割合', NULL, NULL, 18, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-general-hospital-bed-ratio', 'health', '公立一般病院病床数の割合', NULL, NULL, 19, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-general-hospital-count-per-100km2', 'health', '一般病院数（可住地面積100km2当たり）', NULL, NULL, 20, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-general-clinic-count-per-100km2', 'health', '一般診療所数（可住地面積100km2当たり）', NULL, NULL, 21, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-dental-clinic-count-per-100km2', 'health', '歯科診療所数（可住地面積100km2当たり）', NULL, NULL, 22, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-outpatients-per-fulltime-physician-per-day-report', 'health', '一般病院外来患者数（常勤医師1人1日当たり）（病院報告）', NULL, NULL, 23, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-inpatients-per-fulltime-physician-per-day-report', 'health', '一般病院在院患者数（常勤医師1人1日当たり）（病院報告）', NULL, NULL, 24, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-inpatients-per-nurse-per-day-report', 'health', '一般病院在院患者数（看護師・准看護師1人1日当たり）（病院報告）', NULL, NULL, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-general-hospital-bed-occupancy-rate', 'health', '一般病院病床利用率', NULL, NULL, 26, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-general-hospital-avg-length-of-stay', 'health', '一般病院平均在院日数', NULL, NULL, 27, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-outpatients-per-fulltime-physician-per-day', 'health', '一般病院外来患者数（常勤医師1人1日当たり）', NULL, NULL, 28, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-inpatients-per-fulltime-physician-per-day', 'health', '一般病院在院患者数（常勤医師1人1日当たり）', NULL, NULL, 29, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-inpatients-per-nurse-per-day', 'health', '一般病院在院患者数（看護師・准看護師1人1日当たり）', NULL, NULL, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-psychiatric-outpatients-per-fulltime-physician-per-day-report', 'health', '精神科病院外来患者数（常勤医師1人1日当たり）（病院報告）', NULL, NULL, 31, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-psychiatric-inpatients-per-fulltime-physician-per-day-report', 'health', '精神科病院在院患者数（常勤医師1人1日当たり）（病院報告）', NULL, NULL, 32, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-psychiatric-inpatients-per-nurse-per-day-report', 'health', '精神科病院在院患者数（看護師・准看護師1人1日当たり）（病院報告）', NULL, NULL, 33, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-psychiatric-hospital-bed-occupancy-rate', 'health', '精神科病院病床利用率', NULL, NULL, 34, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-psychiatric-hospital-avg-length-of-stay', 'health', '精神科病院平均在院日数', NULL, NULL, 35, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-psychiatric-outpatients-per-fulltime-physician-per-day', 'health', '精神科病院外来患者数（常勤医師1人1日当たり）', NULL, NULL, 36, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-psychiatric-inpatients-per-fulltime-physician-per-day', 'health', '精神科病院在院患者数（常勤医師1人1日当たり）', NULL, NULL, 37, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-psychiatric-inpatients-per-nurse-per-day', 'health', '精神科病院在院患者数（看護師・准看護師1人1日当たり）', NULL, NULL, 38, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-emergency-hospital-general-clinic-count-per-100k', 'health', '救急告示病院・一般診療所数（人口10万人当たり）', NULL, NULL, 39, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-fire-department-emergency-car-count-per-100k', 'health', '救急自動車数（人口10万人当たり）', NULL, NULL, 40, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-annual-emergency-dispatches-per-1000', 'health', '年間救急出動件数（人口千人当たり）', NULL, NULL, 41, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-public-health-nurse-count-per-100k', 'health', '保健師数（人口10万人当たり）', NULL, NULL, 42, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-health-checkup-rate-lifestyle-diseases', 'health', '生活習慣病健康診断受診率', NULL, NULL, 43, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-maternal-health-guidance-per-100-births', 'health', '妊産婦保健指導数（出産数100当たり）', NULL, NULL, 44, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-dental-checkup-guidance-persons-per-1000', 'health', '歯科健診・保健指導延人員（人口千人当たり）', NULL, NULL, 45, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-dental-checkup-persons-per-1000', 'health', '歯科健診受診延人員（人口千人当たり）', NULL, NULL, 46, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-dental-guidance-persons-per-1000', 'health', '歯科保健指導延人員（人口千人当たり）', NULL, NULL, 47, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-food-business-facility-penalties-per-1000', 'health', '食品営業施設処分件数（千施設当たり）', NULL, NULL, 48, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-pharmacy-count-per-100k', 'health', '薬局数（人口10万人当たり）', NULL, NULL, 49, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- バッチ 16 / 16
INSERT OR REPLACE INTO ranking_groups (
  group_key, subcategory_id, name, description, 
  icon, display_order, is_collapsed, created_at, updated_at
) VALUES
  ('group-pharmaceutical-sales-count-per-100k', 'health', '医薬品販売業数（人口10万人当たり）', NULL, NULL, 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-pharmacy-count-per-100km2', 'health', '薬局数（可住地面積100km2当たり）', NULL, NULL, 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-pharmaceutical-sales-count-per-100km2', 'health', '医薬品販売業数（可住地面積100km2当たり）', NULL, NULL, 2, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-national-health-insurance-enrollees-per-1000', 'health', '国民健康保険被保険者数（人口千人当たり）', NULL, NULL, 3, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-national-health-insurance-visit-rate-per-1000', 'health', '国民健康保険受診率（被保険者千人当たり）', NULL, NULL, 4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-national-health-insurance-medical-expense-per-person', 'health', '国民健康保険診療費（被保険者1人当たり）', NULL, NULL, 5, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-national-medical-expense-per-person', 'health', '1人当たりの国民医療費', NULL, NULL, 6, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-japan-health-insurance-society-enrollees-per-1000', 'health', '全国保険協会管掌健康保険加入者数（人口千人当たり）', NULL, NULL, 7, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-japan-health-insurance-society-visit-rate-insured-per-1000', 'health', '全国保険協会管掌健康保険受診率（被保険者千人当たり）', NULL, NULL, 8, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-japan-health-insurance-society-visit-rate-dependents-per-1000', 'health', '全国保険協会管掌健康保険受診率（被扶養者千人当たり）', NULL, NULL, 9, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-govt-health-insurance-visit-expense-insured-per-person', 'health', '政府管掌健康保険受診金額（被保険者1人当たり）', NULL, NULL, 10, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-govt-health-insurance-visit-expense-dependents-per-person', 'health', '政府管掌健康保険受診金額（被扶養者1人当たり）', NULL, NULL, 11, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-japan-health-insurance-society-medical-expense-insured-per-person', 'health', '全国保険協会管掌健康保険医療費（被保険者1人当たり）', NULL, NULL, 12, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('group-japan-health-insurance-society-medical-expense-dependents-per-person', 'health', '全国保険協会管掌健康保険医療費（被扶養者1人当たり）', NULL, NULL, 13, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ========================================
-- ランキング項目の group_id を更新
-- ========================================
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-financial-power-index'),
    display_order_in_group = 0
WHERE ranking_key = 'financial-power-index';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-real-balance-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'real-balance-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-self-financing-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'self-financing-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-local-debt-current-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'local-debt-current-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-current-balance-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'current-balance-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-investment-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'investment-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-general-revenue-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'general-revenue-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-local-tax-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'local-tax-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-local-allocation-tax-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'local-allocation-tax-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-national-treasury-disbursement-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'national-treasury-disbursement-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-inhabitant-tax-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-inhabitant-tax-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-fixed-asset-tax-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-fixed-asset-tax-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-national-tax-collected'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-national-tax-collected';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-taxpayer-taxable-income'),
    display_order_in_group = 0
WHERE ranking_key = 'per-taxpayer-taxable-income';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-taxpayer-ratio-per-pref-resident'),
    display_order_in_group = 0
WHERE ranking_key = 'taxpayer-ratio-per-pref-resident';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-welfare-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'welfare-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-social-welfare-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'social-welfare-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elderly-welfare-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'elderly-welfare-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-child-welfare-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'child-welfare-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-assistance-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'public-assistance-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-sanitation-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'sanitation-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-labor-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'labor-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-agriculture-forestry-fisheries-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'agriculture-forestry-fisheries-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-commerce-industry-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'commerce-industry-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-works-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'public-works-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-police-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'police-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-firefighting-expenditure-ratio-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'firefighting-expenditure-ratio-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-education-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'education-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-disaster-recovery-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'disaster-recovery-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-personnel-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'personnel-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-assistance-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'assistance-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-ordinary-construction-expenditure-ratio-pref-finance'),
    display_order_in_group = 0
WHERE ranking_key = 'ordinary-construction-expenditure-ratio-pref-finance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-total-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-total-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-welfare-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-welfare-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-social-welfare-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-social-welfare-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-elderly-welfare-expenditure-65plus-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-elderly-welfare-expenditure-65plus-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-child-welfare-expenditure-under17-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-child-welfare-expenditure-under17-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-public-assistance-expenditure-protected-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-public-assistance-expenditure-protected-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-sanitation-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-sanitation-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-public-works-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-public-works-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-police-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-police-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-firefighting-expenditure-tokyo-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-firefighting-expenditure-tokyo-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-education-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-education-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-child-public-elementary-school-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-child-public-elementary-school-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-student-public-junior-high-school-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-student-public-junior-high-school-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-student-public-high-school-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-student-public-high-school-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-child-student-special-support-school-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-child-student-special-support-school-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-child-kindergarten-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-child-kindergarten-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-social-education-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-social-education-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-disaster-recovery-expenditure-pref-municipal'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-disaster-recovery-expenditure-pref-municipal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-households-on-public-assistance-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'households-on-public-assistance-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-persons-on-public-assistance-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'persons-on-public-assistance-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-assistance-education-beneficiaries-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'public-assistance-education-beneficiaries-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-assistance-medical-beneficiaries-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'public-assistance-medical-beneficiaries-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-assistance-housing-beneficiaries-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'public-assistance-housing-beneficiaries-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-assistance-nursing-beneficiaries-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'public-assistance-nursing-beneficiaries-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elderly-on-public-assistance-per-1000-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'elderly-on-public-assistance-per-1000-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-physical-disability-certificates-issued-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'physical-disability-certificates-issued-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-welfare-facilities-count-per-100k-on-assistance'),
    display_order_in_group = 0
WHERE ranking_key = 'welfare-facilities-count-per-100k-on-assistance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nursing-home-count-per-100k-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'nursing-home-count-per-100k-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-senior-welfare-center-count-per-100k-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'senior-welfare-center-count-per-100k-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-senior-recreation-home-count-per-100k-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'senior-recreation-home-count-per-100k-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-paid-nursing-home-count-per-100k-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'paid-nursing-home-count-per-100k-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nursing-welfare-facility-count-per-100k-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'nursing-welfare-facility-count-per-100k-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-physical-disability-rehabilitation-facility-count-per-1m'),
    display_order_in_group = 0
WHERE ranking_key = 'physical-disability-rehabilitation-facility-count-per-1m';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-intellectual-disability-support-facility-count-per-1m'),
    display_order_in_group = 0
WHERE ranking_key = 'intellectual-disability-support-facility-count-per-1m';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-child-welfare-facility-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'child-welfare-facility-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-welfare-facility-staff-per-1000-on-assistance'),
    display_order_in_group = 0
WHERE ranking_key = 'welfare-facility-staff-per-1000-on-assistance';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nursing-home-staff-per-100k-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'nursing-home-staff-per-100k-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-senior-welfare-center-staff-per-100k-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'senior-welfare-center-staff-per-100k-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-senior-recreation-home-staff-per-100k-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'senior-recreation-home-staff-per-100k-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-physical-disability-rehabilitation-facility-staff-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'physical-disability-rehabilitation-facility-staff-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-intellectual-disability-support-facility-staff-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'intellectual-disability-support-facility-staff-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-child-welfare-facility-staff-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'child-welfare-facility-staff-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-assistance-facility-capacity-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'public-assistance-facility-capacity-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-assistance-facility-residents-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'public-assistance-facility-residents-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nursing-home-capacity-per-1000-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'nursing-home-capacity-per-1000-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nursing-home-residents-per-1000-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'nursing-home-residents-per-1000-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-paid-nursing-home-capacity-per-1000-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'paid-nursing-home-capacity-per-1000-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-paid-nursing-home-residents-per-1000-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'paid-nursing-home-residents-per-1000-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-physical-disability-rehabilitation-facility-capacity-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'physical-disability-rehabilitation-facility-capacity-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-physical-disability-rehabilitation-facility-residents-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'physical-disability-rehabilitation-facility-residents-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-intellectual-disability-support-facility-capacity-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'intellectual-disability-support-facility-capacity-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-intellectual-disability-support-facility-residents-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'intellectual-disability-support-facility-residents-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-welfare-commissioner-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'welfare-commissioner-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-home-helper-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'home-helper-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-home-helper-users-per-office'),
    display_order_in_group = 0
WHERE ranking_key = 'home-helper-users-per-office';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-welfare-commissioner-consultations-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'welfare-commissioner-consultations-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-welfare-office-public-assistance-applications-per-1000-households'),
    display_order_in_group = 0
WHERE ranking_key = 'welfare-office-public-assistance-applications-per-1000-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-physical-disability-rehabilitation-cases-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'physical-disability-rehabilitation-cases-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-welfare-office-intellectual-disability-consultations-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'welfare-office-intellectual-disability-consultations-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-physical-disability-rehabilitation-center-cases-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'physical-disability-rehabilitation-center-cases-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-intellectual-disability-rehabilitation-center-cases-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'intellectual-disability-rehabilitation-center-cases-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-late-elderly-medical-expense-per-insured'),
    display_order_in_group = 0
WHERE ranking_key = 'late-elderly-medical-expense-per-insured';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-municipal-intellectual-disability-consultations-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'municipal-intellectual-disability-consultations-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-child-consultation-center-cases-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'child-consultation-center-cases-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-national-pension-enrollees-type1-per-1000-20-59'),
    display_order_in_group = 0
WHERE ranking_key = 'national-pension-enrollees-type1-per-1000-20-59';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-national-pension-enrollees-type3-per-1000-20-59'),
    display_order_in_group = 0
WHERE ranking_key = 'national-pension-enrollees-type3-per-1000-20-59';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-department-count-per-100-km2'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-department-count-per-100-km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-department-branch-count-per-100-km2'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-department-branch-count-per-100-km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-department-pump-car-count-per-100-thousand-people'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-department-pump-car-count-per-100-thousand-people';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-department-water-count-per-100-thousand-people'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-department-water-count-per-100-thousand-people';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-related-personnel-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-related-personnel-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-department-member-count-per-100-thousand-people'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-department-member-count-per-100-thousand-people';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-department-dispatch-count-per-100-thousand-people'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-department-dispatch-count-per-100-thousand-people';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-dispatch-for-building-fire-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-dispatch-for-building-fire-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-building-fire-count-per-100-thousand-people'),
    display_order_in_group = 0
WHERE ranking_key = 'building-fire-count-per-100-thousand-people';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-building-fire-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'building-fire-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-damage-casualties-per-population'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-damage-casualties-per-population';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-building-fire-damage-amount-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'building-fire-damage-amount-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-damage-household-count-per-100-building-fires'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-damage-household-count-per-100-building-fires';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-damage-casualties-per-accident'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-damage-casualties-per-accident';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-building-fire-damage-amount-per-building-fire'),
    display_order_in_group = 0
WHERE ranking_key = 'building-fire-damage-amount-per-building-fire';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-grade-separated-pedestrian-crossings-per-1000-km'),
    display_order_in_group = 0
WHERE ranking_key = 'grade-separated-pedestrian-crossings-per-1000-km';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-traffic-accident-count-per-population'),
    display_order_in_group = 0
WHERE ranking_key = 'traffic-accident-count-per-population';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-traffic-accident-count-per-1000-km'),
    display_order_in_group = 0
WHERE ranking_key = 'traffic-accident-count-per-1000-km';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-traffic-accident-casualties-per-population'),
    display_order_in_group = 0
WHERE ranking_key = 'traffic-accident-casualties-per-population';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-traffic-accident-deaths-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'traffic-accident-deaths-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-traffic-accident-injuries-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'traffic-accident-injuries-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-traffic-accident-casualties-per-100-accidents'),
    display_order_in_group = 0
WHERE ranking_key = 'traffic-accident-casualties-per-100-accidents';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-traffic-accident-deaths-per-100-accidents'),
    display_order_in_group = 0
WHERE ranking_key = 'traffic-accident-deaths-per-100-accidents';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-road-traffic-law-violation-arrest-count-per-population'),
    display_order_in_group = 0
WHERE ranking_key = 'road-traffic-law-violation-arrest-count-per-population';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-police-officer-count-per-population'),
    display_order_in_group = 0
WHERE ranking_key = 'police-officer-count-per-population';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-penal-code-offenses-recognized-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'penal-code-offenses-recognized-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-theft-offenses-recognized-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'theft-offenses-recognized-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-criminal-arrest-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'criminal-arrest-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-theft-criminal-arrest-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'theft-criminal-arrest-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-juvenile-criminal-arrest-person-per-population'),
    display_order_in_group = 0
WHERE ranking_key = 'juvenile-criminal-arrest-person-per-population';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-juvenile-theft-offender-arrests-per-1000-14-19'),
    display_order_in_group = 0
WHERE ranking_key = 'juvenile-theft-offender-arrests-per-1000-14-19';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-criminal-recognition-count-of-serious-crime-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'criminal-recognition-count-of-serious-crime-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-criminal-recognition-count-of-violent-crime-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'criminal-recognition-count-of-violent-crime-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-criminal-recognition-count-of-theft-crime-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'criminal-recognition-count-of-theft-crime-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-criminal-recognition-count-of-prostitution-crime-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'criminal-recognition-count-of-prostitution-crime-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-special-law-criminal-arrest-count-per-population'),
    display_order_in_group = 0
WHERE ranking_key = 'special-law-criminal-arrest-count-per-population';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-drug-enforcement-arrest-count-per-population'),
    display_order_in_group = 0
WHERE ranking_key = 'drug-enforcement-arrest-count-per-population';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-disaster-damage-amount-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'disaster-damage-amount-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-accidental-deaths-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'accidental-deaths-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-pollution-complaints-received-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'pollution-complaints-received-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-smoke-emitting-facility-count'),
    display_order_in_group = 0
WHERE ranking_key = 'smoke-emitting-facility-count';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-general-dust-emitting-facility-count'),
    display_order_in_group = 0
WHERE ranking_key = 'general-dust-emitting-facility-count';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-specific-business-sites-under-water-pollution-control-act'),
    display_order_in_group = 0
WHERE ranking_key = 'specific-business-sites-under-water-pollution-control-act';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-private-life-insurance-contracts-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'private-life-insurance-contracts-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-private-life-insurance-amount-per-contract'),
    display_order_in_group = 0
WHERE ranking_key = 'private-life-insurance-amount-per-contract';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-private-life-insurance-contract-amount-per-household'),
    display_order_in_group = 0
WHERE ranking_key = 'private-life-insurance-contract-amount-per-household';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-simple-life-insurance-contract-count-per-population'),
    display_order_in_group = 0
WHERE ranking_key = 'simple-life-insurance-contract-count-per-population';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-simple-life-insurance-contract-amount-per-contract'),
    display_order_in_group = 0
WHERE ranking_key = 'simple-life-insurance-contract-amount-per-contract';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-insurance-new-contracts-per-1000-households'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-insurance-new-contracts-per-1000-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-insurance-claims-received-per-1000-households'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-insurance-claims-received-per-1000-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-insurance-amount-received-per-contract'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-insurance-amount-received-per-contract';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-insurance-new-contracts-per-1000-households-alt'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-insurance-new-contracts-per-1000-households-alt';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-insurance-claims-received-per-1000-households-alt'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-insurance-claims-received-per-1000-households-alt';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-insurance-amount-received-per-contract-alt'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-insurance-amount-received-per-contract-alt';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-auto-liability-insurance-amount-received-per-payment'),
    display_order_in_group = 0
WHERE ranking_key = 'auto-liability-insurance-amount-received-per-payment';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-private-auto-insurance-penetration-rate-vehicle'),
    display_order_in_group = 0
WHERE ranking_key = 'private-auto-insurance-penetration-rate-vehicle';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-voluntary-auto-insurance-penetration-personal'),
    display_order_in_group = 0
WHERE ranking_key = 'voluntary-auto-insurance-penetration-personal';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-voluntary-auto-insurance-penetration-property'),
    display_order_in_group = 0
WHERE ranking_key = 'voluntary-auto-insurance-penetration-property';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elementary-school-count-per-100k-6-11'),
    display_order_in_group = 0
WHERE ranking_key = 'elementary-school-count-per-100k-6-11';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-junior-high-school-count-per-100k-12-14'),
    display_order_in_group = 0
WHERE ranking_key = 'junior-high-school-count-per-100k-12-14';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-high-school-count-per-100k-15-17'),
    display_order_in_group = 0
WHERE ranking_key = 'high-school-count-per-100k-15-17';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-kindergarten-count-per-100k-3-5'),
    display_order_in_group = 0
WHERE ranking_key = 'kindergarten-count-per-100k-3-5';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nursery-count-per-100k-0-5'),
    display_order_in_group = 0
WHERE ranking_key = 'nursery-count-per-100k-0-5';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-certified-childcare-center-count-per-100k-0-5'),
    display_order_in_group = 0
WHERE ranking_key = 'certified-childcare-center-count-per-100k-0-5';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-compulsory-education-school-count-per-100k-6-14'),
    display_order_in_group = 0
WHERE ranking_key = 'compulsory-education-school-count-per-100k-6-14';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-secondary-education-school-count-per-100k-12-17'),
    display_order_in_group = 0
WHERE ranking_key = 'secondary-education-school-count-per-100k-12-17';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elementary-school-count-per-100km2-habitable'),
    display_order_in_group = 0
WHERE ranking_key = 'elementary-school-count-per-100km2-habitable';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-junior-high-school-count-per-100km2-habitable'),
    display_order_in_group = 0
WHERE ranking_key = 'junior-high-school-count-per-100km2-habitable';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-high-school-count-per-100km2-habitable'),
    display_order_in_group = 0
WHERE ranking_key = 'high-school-count-per-100km2-habitable';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-high-school-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'public-high-school-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-kindergarten-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'public-kindergarten-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-nursery-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'public-nursery-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-elementary-school-gym-installation-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'public-elementary-school-gym-installation-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-junior-high-school-gym-installation-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'public-junior-high-school-gym-installation-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-elementary-school-pool-installation-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'public-elementary-school-pool-installation-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-junior-high-school-pool-installation-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'public-junior-high-school-pool-installation-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-high-school-pool-installation-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'public-high-school-pool-installation-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elementary-school-teacher-ratio-male'),
    display_order_in_group = 0
WHERE ranking_key = 'elementary-school-teacher-ratio-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-junior-high-school-teacher-ratio-male'),
    display_order_in_group = 0
WHERE ranking_key = 'junior-high-school-teacher-ratio-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elementary-school-students-per-class'),
    display_order_in_group = 0
WHERE ranking_key = 'elementary-school-students-per-class';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-junior-high-school-students-per-class'),
    display_order_in_group = 0
WHERE ranking_key = 'junior-high-school-students-per-class';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elementary-school-students-per-teacher'),
    display_order_in_group = 0
WHERE ranking_key = 'elementary-school-students-per-teacher';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-junior-high-school-students-per-teacher'),
    display_order_in_group = 0
WHERE ranking_key = 'junior-high-school-students-per-teacher';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-high-school-students-per-teacher'),
    display_order_in_group = 0
WHERE ranking_key = 'high-school-students-per-teacher';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-kindergarten-students-per-teacher'),
    display_order_in_group = 0
WHERE ranking_key = 'kindergarten-students-per-teacher';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nursery-children-per-nursery-teacher'),
    display_order_in_group = 0
WHERE ranking_key = 'nursery-children-per-nursery-teacher';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-high-school-student-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'public-high-school-student-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-kindergarten-student-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'public-kindergarten-student-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-nursery-student-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'public-nursery-student-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-junior-college-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'junior-college-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-university-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'university-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-junior-college-capacity-index'),
    display_order_in_group = 0
WHERE ranking_key = 'junior-college-capacity-index';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-university-capacity-index'),
    display_order_in_group = 0
WHERE ranking_key = 'university-capacity-index';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-national-university-student-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'national-university-student-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-university-student-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'public-university-student-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-private-university-student-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'private-university-student-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-specialized-school-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'specialized-school-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-miscellaneous-school-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'miscellaneous-school-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-specialized-school-students-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'specialized-school-students-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-miscellaneous-school-students-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'miscellaneous-school-students-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-kindergarten-education-diffusion-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'kindergarten-education-diffusion-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nursery-education-diffusion-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'nursery-education-diffusion-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nursery-utilization-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'nursery-utilization-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elementary-school-long-absence-ratio-over-30days-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'elementary-school-long-absence-ratio-over-30days-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-junior-high-school-long-absence-ratio-over-30days-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'junior-high-school-long-absence-ratio-over-30days-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elementary-school-long-absence-ratio-nonattendance-over-30days-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'elementary-school-long-absence-ratio-nonattendance-over-30days-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-junior-high-school-long-absence-ratio-nonattendance-over-30days-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'junior-high-school-long-absence-ratio-nonattendance-over-30days-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-junior-high-school-graduates-advancement-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'junior-high-school-graduates-advancement-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-high-school-graduates-advancement-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'high-school-graduates-advancement-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-in-pref-university-entrance-ratio-by-highschool-origin'),
    display_order_in_group = 0
WHERE ranking_key = 'in-pref-university-entrance-ratio-by-highschool-origin';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-final-education-elementary-junior-high-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'final-education-elementary-junior-high-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-final-education-highschool-old-junior-high-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'final-education-highschool-old-junior-high-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-final-education-junior-college-technical-college-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'final-education-junior-college-technical-college-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-final-education-university-graduate-school-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'final-education-university-graduate-school-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-kindergarten-education-cost-per-student'),
    display_order_in_group = 0
WHERE ranking_key = 'kindergarten-education-cost-per-student';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elementary-school-education-cost-per-student'),
    display_order_in_group = 0
WHERE ranking_key = 'elementary-school-education-cost-per-student';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-junior-high-school-education-cost-per-student'),
    display_order_in_group = 0
WHERE ranking_key = 'junior-high-school-education-cost-per-student';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-high-school-education-cost-fulltime-per-student'),
    display_order_in_group = 0
WHERE ranking_key = 'high-school-education-cost-fulltime-per-student';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-certified-childcare-center-education-cost-per-student'),
    display_order_in_group = 0
WHERE ranking_key = 'certified-childcare-center-education-cost-per-student';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-primary-activity-avg-time-male'),
    display_order_in_group = 0
WHERE ranking_key = 'primary-activity-avg-time-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-primary-activity-avg-time-female'),
    display_order_in_group = 0
WHERE ranking_key = 'primary-activity-avg-time-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-secondary-activity-avg-time-employed-male'),
    display_order_in_group = 0
WHERE ranking_key = 'secondary-activity-avg-time-employed-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-secondary-activity-avg-time-unemployed-male'),
    display_order_in_group = 0
WHERE ranking_key = 'secondary-activity-avg-time-unemployed-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-secondary-activity-avg-time-employed-female'),
    display_order_in_group = 0
WHERE ranking_key = 'secondary-activity-avg-time-employed-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-secondary-activity-avg-time-unemployed-female'),
    display_order_in_group = 0
WHERE ranking_key = 'secondary-activity-avg-time-unemployed-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tertiary-activity-avg-time-employed-male'),
    display_order_in_group = 0
WHERE ranking_key = 'tertiary-activity-avg-time-employed-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tertiary-activity-avg-time-unemployed-male'),
    display_order_in_group = 0
WHERE ranking_key = 'tertiary-activity-avg-time-unemployed-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tertiary-activity-avg-time-employed-female'),
    display_order_in_group = 0
WHERE ranking_key = 'tertiary-activity-avg-time-employed-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tertiary-activity-avg-time-unemployed-female'),
    display_order_in_group = 0
WHERE ranking_key = 'tertiary-activity-avg-time-unemployed-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-work-avg-time-employed-male'),
    display_order_in_group = 0
WHERE ranking_key = 'work-avg-time-employed-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-work-avg-time-employed-female'),
    display_order_in_group = 0
WHERE ranking_key = 'work-avg-time-employed-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-hobby-leisure-avg-time-employed-male'),
    display_order_in_group = 0
WHERE ranking_key = 'hobby-leisure-avg-time-employed-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-hobby-leisure-avg-time-unemployed-male'),
    display_order_in_group = 0
WHERE ranking_key = 'hobby-leisure-avg-time-unemployed-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-hobby-leisure-avg-time-employed-female'),
    display_order_in_group = 0
WHERE ranking_key = 'hobby-leisure-avg-time-employed-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-hobby-leisure-avg-time-unemployed-female'),
    display_order_in_group = 0
WHERE ranking_key = 'hobby-leisure-avg-time-unemployed-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-broadcast-media-consumption-time-employed-man'),
    display_order_in_group = 0
WHERE ranking_key = 'average-broadcast-media-consumption-time-employed-man';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-media-avg-time-unemployed-male'),
    display_order_in_group = 0
WHERE ranking_key = 'media-avg-time-unemployed-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-maverage-broadcast-media-consumption-time-employed-woman'),
    display_order_in_group = 0
WHERE ranking_key = 'maverage-broadcast-media-consumption-time-employed-woman';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-media-avg-time-unemployed-female'),
    display_order_in_group = 0
WHERE ranking_key = 'media-avg-time-unemployed-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-hall-count-per-million'),
    display_order_in_group = 0
WHERE ranking_key = 'public-hall-count-per-million';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-library-count-per-million'),
    display_order_in_group = 0
WHERE ranking_key = 'library-count-per-million';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-museum-count-per-million'),
    display_order_in_group = 0
WHERE ranking_key = 'museum-count-per-million';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-youth-education-facility-count-per-million'),
    display_order_in_group = 0
WHERE ranking_key = 'youth-education-facility-count-per-million';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-community-sports-facility-count-per-million'),
    display_order_in_group = 0
WHERE ranking_key = 'community-sports-facility-count-per-million';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-multipurpose-sports-ground-count-per-million'),
    display_order_in_group = 0
WHERE ranking_key = 'public-multipurpose-sports-ground-count-per-million';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-gymnasium-count-per-million'),
    display_order_in_group = 0
WHERE ranking_key = 'public-gymnasium-count-per-million';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-swimming-pool-count-per-million'),
    display_order_in_group = 0
WHERE ranking_key = 'public-swimming-pool-count-per-million';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-youth-class-lecture-count-per-million'),
    display_order_in_group = 0
WHERE ranking_key = 'youth-class-lecture-count-per-million';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-adult-class-lecture-count-per-million'),
    display_order_in_group = 0
WHERE ranking_key = 'adult-class-lecture-count-per-million';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-female-class-lecture-count-per-million-female'),
    display_order_in_group = 0
WHERE ranking_key = 'female-class-lecture-count-per-million-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elderly-class-lecture-count-per-million'),
    display_order_in_group = 0
WHERE ranking_key = 'elderly-class-lecture-count-per-million';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-volunteer-activity-annual-participation-rate-15plus'),
    display_order_in_group = 0
WHERE ranking_key = 'volunteer-activity-annual-participation-rate-15plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-volunteer-activity-annual-participation-rate-10plus'),
    display_order_in_group = 0
WHERE ranking_key = 'volunteer-activity-annual-participation-rate-10plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-sports-annual-participation-rate-10plus'),
    display_order_in_group = 0
WHERE ranking_key = 'sports-annual-participation-rate-10plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-passport-issuance-count-per-thousand'),
    display_order_in_group = 0
WHERE ranking_key = 'passport-issuance-count-per-thousand';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-travel-leisure-annual-participation-rate-15plus'),
    display_order_in_group = 0
WHERE ranking_key = 'travel-leisure-annual-participation-rate-15plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-travel-leisure-annual-participation-rate-10plus'),
    display_order_in_group = 0
WHERE ranking_key = 'travel-leisure-annual-participation-rate-10plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-overseas-travel-annual-participation-rate-15plus'),
    display_order_in_group = 0
WHERE ranking_key = 'overseas-travel-annual-participation-rate-15plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-overseas-travel-annual-participation-rate-10plus'),
    display_order_in_group = 0
WHERE ranking_key = 'overseas-travel-annual-participation-rate-10plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-room-occupancy-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'room-occupancy-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-book-magazine-retail-annual-sales-per-capita'),
    display_order_in_group = 0
WHERE ranking_key = 'book-magazine-retail-annual-sales-per-capita';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-labor-force-population-ratio-man'),
    display_order_in_group = 0
WHERE ranking_key = 'labor-force-population-ratio-man';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-labor-force-population-ratio-woman'),
    display_order_in_group = 0
WHERE ranking_key = 'labor-force-population-ratio-woman';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employed-people-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'employed-people-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employed-people-ratio-primary'),
    display_order_in_group = 0
WHERE ranking_key = 'employed-people-ratio-primary';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employed-people-ratio-secondary'),
    display_order_in_group = 0
WHERE ranking_key = 'employed-people-ratio-secondary';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employed-people-ratio-tertiary'),
    display_order_in_group = 0
WHERE ranking_key = 'employed-people-ratio-tertiary';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-secondary-employed-people-ratio-tertiary'),
    display_order_in_group = 0
WHERE ranking_key = 'secondary-employed-people-ratio-tertiary';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unemployment-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'unemployment-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unemployment-rate-man'),
    display_order_in_group = 0
WHERE ranking_key = 'unemployment-rate-man';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unemployment-rate-woman'),
    display_order_in_group = 0
WHERE ranking_key = 'unemployment-rate-woman';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-dual-income-household-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'dual-income-household-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employee-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'employee-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-in-prefecture-employed-people-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'in-prefecture-employed-people-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-migrant-worker-ratio-sales-farm'),
    display_order_in_group = 0
WHERE ranking_key = 'migrant-worker-ratio-sales-farm';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-commuter-ratio-to-other-municipalities'),
    display_order_in_group = 0
WHERE ranking_key = 'commuter-ratio-to-other-municipalities';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-commuter-ratio-from-other-municipalities'),
    display_order_in_group = 0
WHERE ranking_key = 'commuter-ratio-from-other-municipalities';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employment-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'employment-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employed-outside-the-prefecture-pre2018'),
    display_order_in_group = 0
WHERE ranking_key = 'employed-outside-the-prefecture-pre2018';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employed-outside-the-prefecture'),
    display_order_in_group = 0
WHERE ranking_key = 'employed-outside-the-prefecture';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-active-job-opening-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'active-job-opening-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fulfillment-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'fulfillment-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-part-time-employment-rate-regular'),
    display_order_in_group = 0
WHERE ranking_key = 'part-time-employment-rate-regular';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-female-part-time-workers-pre2019'),
    display_order_in_group = 0
WHERE ranking_key = 'female-part-time-workers-pre2019';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-male-part-time-workers-pre2019'),
    display_order_in_group = 0
WHERE ranking_key = 'male-part-time-workers-pre2019';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-female-part-time-workers'),
    display_order_in_group = 0
WHERE ranking_key = 'female-part-time-workers';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-male-part-time-workers'),
    display_order_in_group = 0
WHERE ranking_key = 'male-part-time-workers';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-high-school-new-graduates-employment-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'high-school-new-graduates-employment-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-high-school-graduates-out-of-prefecture-job-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'high-school-graduates-out-of-prefecture-job-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-high-school-graduates-job-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'high-school-graduates-job-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-high-school-new-graduates-job-opening-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'high-school-new-graduates-job-opening-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-junior-college-new-graduates-unemployment-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'junior-college-new-graduates-unemployment-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-university-new-graduates-unemployment-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'university-new-graduates-unemployment-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-university-graduates-job-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'university-graduates-job-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-middle-aged-employment-rate-45plus'),
    display_order_in_group = 0
WHERE ranking_key = 'middle-aged-employment-rate-45plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-middle-aged-job-ratio-45plus'),
    display_order_in_group = 0
WHERE ranking_key = 'middle-aged-job-ratio-45plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elderly-workers-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'elderly-workers-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elderly-general-worker-old-population-ratio-pre2019'),
    display_order_in_group = 0
WHERE ranking_key = 'elderly-general-worker-old-population-ratio-pre2019';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elderly-general-worker-old-population-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'elderly-general-worker-old-population-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-disabled-job-ratio-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'disabled-job-ratio-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-disabled-employment-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'disabled-employment-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-job-change-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'job-change-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-turnover-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'turnover-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-employment-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'new-employment-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employment-mobility-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'employment-mobility-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-monthly-average-actual-working-hours-male-pre2019'),
    display_order_in_group = 0
WHERE ranking_key = 'monthly-average-actual-working-hours-male-pre2019';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-monthly-average-actual-working-hours-female-pre2019'),
    display_order_in_group = 0
WHERE ranking_key = 'monthly-average-actual-working-hours-female-pre2019';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-monthly-average-actual-working-hours-male'),
    display_order_in_group = 0
WHERE ranking_key = 'monthly-average-actual-working-hours-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-monthly-average-actual-working-hours-female'),
    display_order_in_group = 0
WHERE ranking_key = 'monthly-average-actual-working-hours-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-regular-cash-salary-male-pre2019'),
    display_order_in_group = 0
WHERE ranking_key = 'regular-cash-salary-male-pre2019';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-regular-cash-salary-female-pre2019'),
    display_order_in_group = 0
WHERE ranking_key = 'regular-cash-salary-female-pre2019';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-regular-cash-salary-male'),
    display_order_in_group = 0
WHERE ranking_key = 'regular-cash-salary-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-regular-cash-salary-female'),
    display_order_in_group = 0
WHERE ranking_key = 'regular-cash-salary-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-graduate-starting-salary-highschool-male'),
    display_order_in_group = 0
WHERE ranking_key = 'new-graduate-starting-salary-highschool-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-graduate-starting-salary-highschool-female'),
    display_order_in_group = 0
WHERE ranking_key = 'new-graduate-starting-salary-highschool-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-graduate-starting-salary-university-male'),
    display_order_in_group = 0
WHERE ranking_key = 'new-graduate-starting-salary-university-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-graduate-starting-salary-technical-juniorcollege-female'),
    display_order_in_group = 0
WHERE ranking_key = 'new-graduate-starting-salary-technical-juniorcollege-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-graduate-starting-salary-university-female'),
    display_order_in_group = 0
WHERE ranking_key = 'new-graduate-starting-salary-university-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-graduate-starting-salary-technical-juniorcollege-male'),
    display_order_in_group = 0
WHERE ranking_key = 'new-graduate-starting-salary-technical-juniorcollege-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-graduate-regular-salary-highschool-male'),
    display_order_in_group = 0
WHERE ranking_key = 'new-graduate-regular-salary-highschool-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-graduate-regular-salary-highschool-female'),
    display_order_in_group = 0
WHERE ranking_key = 'new-graduate-regular-salary-highschool-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-graduate-regular-salary-technical-juniorcollege-male'),
    display_order_in_group = 0
WHERE ranking_key = 'new-graduate-regular-salary-technical-juniorcollege-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-graduate-regular-salary-technical-juniorcollege-female'),
    display_order_in_group = 0
WHERE ranking_key = 'new-graduate-regular-salary-technical-juniorcollege-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-graduate-regular-salary-university-male'),
    display_order_in_group = 0
WHERE ranking_key = 'new-graduate-regular-salary-university-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-graduate-regular-salary-university-female'),
    display_order_in_group = 0
WHERE ranking_key = 'new-graduate-regular-salary-university-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-female-part-time-hourly-wage-pre2019'),
    display_order_in_group = 0
WHERE ranking_key = 'female-part-time-hourly-wage-pre2019';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-male-part-time-hourly-wage-pre2019'),
    display_order_in_group = 0
WHERE ranking_key = 'male-part-time-hourly-wage-pre2019';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-female-part-time-hourly-wage'),
    display_order_in_group = 0
WHERE ranking_key = 'female-part-time-hourly-wage';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-male-part-time-hourly-wage'),
    display_order_in_group = 0
WHERE ranking_key = 'male-part-time-hourly-wage';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employment-insurance-receipt-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'employment-insurance-receipt-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employment-insurance-basic-benefit-average'),
    display_order_in_group = 0
WHERE ranking_key = 'employment-insurance-basic-benefit-average';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employment-insurance-daily-receipt-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'employment-insurance-daily-receipt-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employment-insurance-daily-basic-benefit-average'),
    display_order_in_group = 0
WHERE ranking_key = 'employment-insurance-daily-basic-benefit-average';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-workers-compensation-insurance-benefits-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'workers-compensation-insurance-benefits-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-payment-amount-of-workers-compensation-insurance-benefits'),
    display_order_in_group = 0
WHERE ranking_key = 'average-payment-amount-of-workers-compensation-insurance-benefits';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-frequency-of-occupational-accidents'),
    display_order_in_group = 0
WHERE ranking_key = 'frequency-of-occupational-accidents';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-work-accident-severity'),
    display_order_in_group = 0
WHERE ranking_key = 'work-accident-severity';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-female-part-time-workers-post2019 '),
    display_order_in_group = 0
WHERE ranking_key = 'female-part-time-workers-post2019 ';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-total-farm-household-income'),
    display_order_in_group = 0
WHERE ranking_key = 'total-farm-household-income';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-agricultural-income-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'agricultural-income-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-non-agricultural-income-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'non-agricultural-income-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-actual-income-worker-households-per-month'),
    display_order_in_group = 0
WHERE ranking_key = 'actual-income-worker-households-per-month';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-household-head-income-worker-households-per-month'),
    display_order_in_group = 0
WHERE ranking_key = 'household-head-income-worker-households-per-month';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-farm-household-expenditure-per-month'),
    display_order_in_group = 0
WHERE ranking_key = 'farm-household-expenditure-per-month';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-consumption-expenditure-multi-person-households-per-month'),
    display_order_in_group = 0
WHERE ranking_key = 'consumption-expenditure-multi-person-households-per-month';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-food-expenditure-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'food-expenditure-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-housing-expenditure-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'housing-expenditure-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-utilities-expenditure-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'utilities-expenditure-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-furniture-household-goods-expenditure-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'furniture-household-goods-expenditure-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-clothing-footwear-expenditure-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'clothing-footwear-expenditure-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-healthcare-expenditure-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'healthcare-expenditure-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-transport-communication-expenditure-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'transport-communication-expenditure-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-education-expenditure-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'education-expenditure-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-culture-recreation-expenditure-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'culture-recreation-expenditure-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-other-consumption-expenditure-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'other-consumption-expenditure-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-propensity-to-consume-of-farm-households'),
    display_order_in_group = 0
WHERE ranking_key = 'average-propensity-to-consume-of-farm-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-avg-propensity-to-consume-worker-households'),
    display_order_in_group = 0
WHERE ranking_key = 'avg-propensity-to-consume-worker-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-avg-savings-rate-worker-households'),
    display_order_in_group = 0
WHERE ranking_key = 'avg-savings-rate-worker-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-net-increase-rate-deposits-worker-households'),
    display_order_in_group = 0
WHERE ranking_key = 'net-increase-rate-deposits-worker-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-net-decrease-rate-land-house-loans-worker-households'),
    display_order_in_group = 0
WHERE ranking_key = 'net-decrease-rate-land-house-loans-worker-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-current-savings-balance-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'current-savings-balance-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-current-deposit-balance-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'current-deposit-balance-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-current-life-insurance-balance-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'current-life-insurance-balance-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-current-securities-balance-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'current-securities-balance-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-current-liabilities-balance-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'current-liabilities-balance-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-housing-land-liabilities-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'housing-land-liabilities-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-microwave-ownership-multi-person-households-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'microwave-ownership-multi-person-households-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-room-aircon-ownership-multi-person-households-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'room-aircon-ownership-multi-person-households-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-piano-ownership-multi-person-households-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'piano-ownership-multi-person-households-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-car-ownership-multi-person-households-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'car-ownership-multi-person-households-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-stereo-cd-md-radio-ownership-multi-person-households-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'stereo-cd-md-radio-ownership-multi-person-households-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-mobile-phone-ownership-multi-person-households-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'mobile-phone-ownership-multi-person-households-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-pc-ownership-multi-person-households-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'pc-ownership-multi-person-households-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tablet-ownership-multi-person-households-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'tablet-ownership-multi-person-households-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-smartphone-ownership-multi-person-households-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'smartphone-ownership-multi-person-households-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-total'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-total';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-excl-owner-rent'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-excl-owner-rent';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-excl-fresh-food'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-excl-fresh-food';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-food'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-food';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-housing'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-housing';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-utilities'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-utilities';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-furniture'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-furniture';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-clothing'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-clothing';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-healthcare'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-healthcare';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-transport-communication'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-transport-communication';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-education'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-education';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-culture-recreation'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-culture-recreation';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-miscellaneous'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-miscellaneous';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-excl-food-energy'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-excl-food-energy';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-change-rate-excl-fresh-food-energy'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-change-rate-excl-fresh-food-energy';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-total-tokyo100'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-total-tokyo100';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-total-51cities100'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-total-51cities100';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-food-tokyo100'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-food-tokyo100';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-food-51cities100'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-food-51cities100';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-standard-price-change-rate-residential'),
    display_order_in_group = 0
WHERE ranking_key = 'standard-price-change-rate-residential';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-standard-price-change-rate-commercial'),
    display_order_in_group = 0
WHERE ranking_key = 'standard-price-change-rate-commercial';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-standard-price-change-rate-industrial'),
    display_order_in_group = 0
WHERE ranking_key = 'standard-price-change-rate-industrial';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-total'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-total';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-excl-rent'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-excl-rent';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-food'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-food';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-housing'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-housing';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-utilities'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-utilities';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-furniture'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-furniture';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-clothing'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-clothing';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-healthcare'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-healthcare';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-transport-communication'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-transport-communication';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-education'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-education';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-culture-recreation'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-culture-recreation';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cpi-regional-difference-index-miscellaneous'),
    display_order_in_group = 0
WHERE ranking_key = 'cpi-regional-difference-index-miscellaneous';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-financial-assets-balance-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'financial-assets-balance-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-deposit-balance-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'deposit-balance-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-life-insurance-balance-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'life-insurance-balance-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-securities-balance-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'securities-balance-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-liabilities-balance-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'liabilities-balance-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-housing-land-liabilities-ratio-multi-person-households'),
    display_order_in_group = 0
WHERE ranking_key = 'housing-land-liabilities-ratio-multi-person-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-annual-income-per-household'),
    display_order_in_group = 0
WHERE ranking_key = 'annual-income-per-household';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-household-head-annual-income-per-household'),
    display_order_in_group = 0
WHERE ranking_key = 'household-head-annual-income-per-household';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-total-area-including-northern-territories-and-takeshima'),
    display_order_in_group = 0
WHERE ranking_key = 'total-area-including-northern-territories-and-takeshima';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-area-ratio-of-total'),
    display_order_in_group = 0
WHERE ranking_key = 'area-ratio-of-total';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-forest-area-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'forest-area-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nature-park-area-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'nature-park-area-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-habitable-area-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'habitable-area-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-total-assessed-land-area-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'total-assessed-land-area-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-total-assessed-land-area-ratio-paddy'),
    display_order_in_group = 0
WHERE ranking_key = 'total-assessed-land-area-ratio-paddy';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-total-assessed-land-area-ratio-field'),
    display_order_in_group = 0
WHERE ranking_key = 'total-assessed-land-area-ratio-field';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-total-assessed-land-area-ratio-residential'),
    display_order_in_group = 0
WHERE ranking_key = 'total-assessed-land-area-ratio-residential';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-temperature'),
    display_order_in_group = 0
WHERE ranking_key = 'average-temperature';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-maximum-temperature'),
    display_order_in_group = 0
WHERE ranking_key = 'maximum-temperature';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-lowest-temperature'),
    display_order_in_group = 0
WHERE ranking_key = 'lowest-temperature';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-relative-humidity'),
    display_order_in_group = 0
WHERE ranking_key = 'average-relative-humidity';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-annual-clear-days'),
    display_order_in_group = 0
WHERE ranking_key = 'annual-clear-days';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-annual-precipitation-days'),
    display_order_in_group = 0
WHERE ranking_key = 'annual-precipitation-days';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-annual-snow-days'),
    display_order_in_group = 0
WHERE ranking_key = 'annual-snow-days';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-annual-sunshine-duration'),
    display_order_in_group = 0
WHERE ranking_key = 'annual-sunshine-duration';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-annual-precipitation'),
    display_order_in_group = 0
WHERE ranking_key = 'annual-precipitation';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-gdp-growth-rate-pref-h17'),
    display_order_in_group = 0
WHERE ranking_key = 'gdp-growth-rate-pref-h17';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-prefectural-income-growth-rate-h17'),
    display_order_in_group = 0
WHERE ranking_key = 'prefectural-income-growth-rate-h17';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-gross-prefectural-income-growth-rate-nominal-h17'),
    display_order_in_group = 0
WHERE ranking_key = 'gross-prefectural-income-growth-rate-nominal-h17';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-gross-prefectural-income-growth-rate-real-h17'),
    display_order_in_group = 0
WHERE ranking_key = 'gross-prefectural-income-growth-rate-real-h17';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-gdp-growth-rate-pref-h23'),
    display_order_in_group = 0
WHERE ranking_key = 'gdp-growth-rate-pref-h23';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-prefectural-income-growth-rate-h23'),
    display_order_in_group = 0
WHERE ranking_key = 'prefectural-income-growth-rate-h23';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-gross-prefectural-income-growth-rate-nominal-h23'),
    display_order_in_group = 0
WHERE ranking_key = 'gross-prefectural-income-growth-rate-nominal-h23';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-gdp-growth-rate-pref-h27'),
    display_order_in_group = 0
WHERE ranking_key = 'gdp-growth-rate-pref-h27';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-prefectural-income-growth-rate-h27'),
    display_order_in_group = 0
WHERE ranking_key = 'prefectural-income-growth-rate-h27';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-gross-prefectural-income-growth-rate-nominal-h27'),
    display_order_in_group = 0
WHERE ranking_key = 'gross-prefectural-income-growth-rate-nominal-h27';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-prefectural-income-h17'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-prefectural-income-h17';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-prefectural-income-h23'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-prefectural-income-h23';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-per-capita-prefectural-income-h27'),
    display_order_in_group = 0
WHERE ranking_key = 'per-capita-prefectural-income-h27';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-secondary-industry-establishment-ratio-census'),
    display_order_in_group = 0
WHERE ranking_key = 'secondary-industry-establishment-ratio-census';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tertiary-industry-establishment-ratio-census'),
    display_order_in_group = 0
WHERE ranking_key = 'tertiary-industry-establishment-ratio-census';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-secondary-industry-establishment-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'secondary-industry-establishment-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tertiary-industry-establishment-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'tertiary-industry-establishment-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-establishment-ratio-1-4-employees-private'),
    display_order_in_group = 0
WHERE ranking_key = 'establishment-ratio-1-4-employees-private';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-establishment-ratio-5-9-employees-private'),
    display_order_in_group = 0
WHERE ranking_key = 'establishment-ratio-5-9-employees-private';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-establishment-ratio-10-29-employees-private'),
    display_order_in_group = 0
WHERE ranking_key = 'establishment-ratio-10-29-employees-private';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-establishment-ratio-100-299-employees-private'),
    display_order_in_group = 0
WHERE ranking_key = 'establishment-ratio-100-299-employees-private';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-establishment-ratio-300plus-employees-private'),
    display_order_in_group = 0
WHERE ranking_key = 'establishment-ratio-300plus-employees-private';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employee-ratio-1-4-employee-establishments-private'),
    display_order_in_group = 0
WHERE ranking_key = 'employee-ratio-1-4-employee-establishments-private';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employee-ratio-5-9-employee-establishments-private'),
    display_order_in_group = 0
WHERE ranking_key = 'employee-ratio-5-9-employee-establishments-private';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employee-ratio-10-29-employee-establishments-private'),
    display_order_in_group = 0
WHERE ranking_key = 'employee-ratio-10-29-employee-establishments-private';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employee-ratio-100-299-employee-establishments-private'),
    display_order_in_group = 0
WHERE ranking_key = 'employee-ratio-100-299-employee-establishments-private';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-employee-ratio-300plus-employee-establishments-private'),
    display_order_in_group = 0
WHERE ranking_key = 'employee-ratio-300plus-employee-establishments-private';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-secondary-industry-employees-per-establishment-census'),
    display_order_in_group = 0
WHERE ranking_key = 'secondary-industry-employees-per-establishment-census';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tertiary-industry-employees-per-establishment-census'),
    display_order_in_group = 0
WHERE ranking_key = 'tertiary-industry-employees-per-establishment-census';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-secondary-industry-employees-per-establishment'),
    display_order_in_group = 0
WHERE ranking_key = 'secondary-industry-employees-per-establishment';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tertiary-industry-employees-per-establishment'),
    display_order_in_group = 0
WHERE ranking_key = 'tertiary-industry-employees-per-establishment';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-agricultural-output-per-employed-person'),
    display_order_in_group = 0
WHERE ranking_key = 'agricultural-output-per-employed-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-agricultural-output-per-worker-individual-farm'),
    display_order_in_group = 0
WHERE ranking_key = 'agricultural-output-per-worker-individual-farm';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cultivated-land-area-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'cultivated-land-area-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-land-productivity-per-ha'),
    display_order_in_group = 0
WHERE ranking_key = 'land-productivity-per-ha';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cultivated-land-area-per-household'),
    display_order_in_group = 0
WHERE ranking_key = 'cultivated-land-area-per-household';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-manufacturing-shipment-amount-per-employee'),
    display_order_in_group = 0
WHERE ranking_key = 'manufacturing-shipment-amount-per-employee';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-manufacturing-shipment-amount-per-establishment'),
    display_order_in_group = 0
WHERE ranking_key = 'manufacturing-shipment-amount-per-establishment';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-annual-sales-amount-per-employee'),
    display_order_in_group = 0
WHERE ranking_key = 'annual-sales-amount-per-employee';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-annual-sales-amount-per-establishment'),
    display_order_in_group = 0
WHERE ranking_key = 'annual-sales-amount-per-establishment';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-deposit-balance-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'deposit-balance-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-postal-savings-balance-per-capita'),
    display_order_in_group = 0
WHERE ranking_key = 'postal-savings-balance-per-capita';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-bank-deposit-balance-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'bank-deposit-balance-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-total-population'),
    display_order_in_group = 0
WHERE ranking_key = 'total-population';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-total-population-male'),
    display_order_in_group = 0
WHERE ranking_key = 'total-population-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-total-population-female'),
    display_order_in_group = 0
WHERE ranking_key = 'total-population-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-population-ratio-to-national-total'),
    display_order_in_group = 0
WHERE ranking_key = 'population-ratio-to-national-total';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-population-density-per-km2-total-area'),
    display_order_in_group = 0
WHERE ranking_key = 'population-density-per-km2-total-area';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-population-density-per-km2-inhabitable-area'),
    display_order_in_group = 0
WHERE ranking_key = 'population-density-per-km2-inhabitable-area';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-day-time-population-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'day-time-population-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-densely-inhabited-district-population-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'densely-inhabited-district-population-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-densely-populated-area-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'densely-populated-area-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-densely-inhabited-district-population-density'),
    display_order_in_group = 0
WHERE ranking_key = 'densely-inhabited-district-population-density';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-densely-populated-area-change-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'densely-populated-area-change-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-foreign-resident-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'foreign-resident-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-foreign-resident-count-korea-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'foreign-resident-count-korea-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-foreign-resident-count-china-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'foreign-resident-count-china-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-foreign-resident-count-usa-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'foreign-resident-count-usa-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-future-population-2020'),
    display_order_in_group = 0
WHERE ranking_key = 'future-population-2020';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-future-population-2025'),
    display_order_in_group = 0
WHERE ranking_key = 'future-population-2025';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-future-population-2030'),
    display_order_in_group = 0
WHERE ranking_key = 'future-population-2030';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-future-population-2035'),
    display_order_in_group = 0
WHERE ranking_key = 'future-population-2035';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-future-population-2040'),
    display_order_in_group = 0
WHERE ranking_key = 'future-population-2040';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-future-population-2045'),
    display_order_in_group = 0
WHERE ranking_key = 'future-population-2045';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-future-population-2050'),
    display_order_in_group = 0
WHERE ranking_key = 'future-population-2050';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-sex-ratio-total'),
    display_order_in_group = 0
WHERE ranking_key = 'sex-ratio-total';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-sex-young-population-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'sex-young-population-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-sex-production-age-population-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'sex-production-age-population-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-sex-old-population-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'sex-old-population-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-young-population-index'),
    display_order_in_group = 0
WHERE ranking_key = 'young-population-index';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-old-population-index'),
    display_order_in_group = 0
WHERE ranking_key = 'old-population-index';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-dependent-population-index'),
    display_order_in_group = 0
WHERE ranking_key = 'dependent-population-index';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-aging-index'),
    display_order_in_group = 0
WHERE ranking_key = 'aging-index';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-young-population-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'young-population-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-production-age-population-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'production-age-population-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-old-population-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'old-population-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unmarried-ratio-male-20-24'),
    display_order_in_group = 0
WHERE ranking_key = 'unmarried-ratio-male-20-24';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unmarried-ratio-female-20-24'),
    display_order_in_group = 0
WHERE ranking_key = 'unmarried-ratio-female-20-24';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unmarried-ratio-male-25-29'),
    display_order_in_group = 0
WHERE ranking_key = 'unmarried-ratio-male-25-29';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unmarried-ratio-female-25-29'),
    display_order_in_group = 0
WHERE ranking_key = 'unmarried-ratio-female-25-29';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unmarried-ratio-male-30-34'),
    display_order_in_group = 0
WHERE ranking_key = 'unmarried-ratio-male-30-34';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unmarried-ratio-female-30-34'),
    display_order_in_group = 0
WHERE ranking_key = 'unmarried-ratio-female-30-34';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unmarried-ratio-male-35-39'),
    display_order_in_group = 0
WHERE ranking_key = 'unmarried-ratio-male-35-39';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unmarried-ratio-female-35-39'),
    display_order_in_group = 0
WHERE ranking_key = 'unmarried-ratio-female-35-39';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unmarried-ratio-male-40-44'),
    display_order_in_group = 0
WHERE ranking_key = 'unmarried-ratio-male-40-44';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unmarried-ratio-female-40-44'),
    display_order_in_group = 0
WHERE ranking_key = 'unmarried-ratio-female-40-44';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unmarried-ratio-male-45-49'),
    display_order_in_group = 0
WHERE ranking_key = 'unmarried-ratio-male-45-49';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unmarried-ratio-female-45-49'),
    display_order_in_group = 0
WHERE ranking_key = 'unmarried-ratio-female-45-49';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-unmarried-ratio-15plus'),
    display_order_in_group = 0
WHERE ranking_key = 'unmarried-ratio-15plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-widowed-ratio-male-60plus'),
    display_order_in_group = 0
WHERE ranking_key = 'widowed-ratio-male-60plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-widowed-ratio-female-60plus'),
    display_order_in_group = 0
WHERE ranking_key = 'widowed-ratio-female-60plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-divorced-ratio-male-40-49'),
    display_order_in_group = 0
WHERE ranking_key = 'divorced-ratio-male-40-49';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-divorced-ratio-female-40-49'),
    display_order_in_group = 0
WHERE ranking_key = 'divorced-ratio-female-40-49';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-divorced-ratio-male-50-59'),
    display_order_in_group = 0
WHERE ranking_key = 'divorced-ratio-male-50-59';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-divorced-ratio-female-50-59'),
    display_order_in_group = 0
WHERE ranking_key = 'divorced-ratio-female-50-59';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-population-growth-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'population-growth-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-natural-increase-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'natural-increase-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-crude-birth-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'crude-birth-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-total-fertility-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'total-fertility-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-crude-death-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'crude-death-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-crude-death-rate-male'),
    display_order_in_group = 0
WHERE ranking_key = 'crude-death-rate-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-crude-death-rate-female'),
    display_order_in_group = 0
WHERE ranking_key = 'crude-death-rate-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-age-specific-death-rate-0-4-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'age-specific-death-rate-0-4-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-age-adjusted-mortality-rate-old'),
    display_order_in_group = 0
WHERE ranking_key = 'age-adjusted-mortality-rate-old';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-age-adjusted-death-rate-male-s60-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'age-adjusted-death-rate-male-s60-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-age-adjusted-death-rate-female-s60-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'age-adjusted-death-rate-female-s60-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-age-adjusted-death-rate-male-h27-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'age-adjusted-death-rate-male-h27-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-age-adjusted-death-rate-female-h27-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'age-adjusted-death-rate-female-h27-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-moving-in-excess-rate-japanese'),
    display_order_in_group = 0
WHERE ranking_key = 'moving-in-excess-rate-japanese';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-moving-in-rate-japanese'),
    display_order_in_group = 0
WHERE ranking_key = 'moving-in-rate-japanese';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-moving-out-rate-japanese'),
    display_order_in_group = 0
WHERE ranking_key = 'moving-out-rate-japanese';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-inflow-population-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'inflow-population-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-outflow-population-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'outflow-population-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-social-increase-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'social-increase-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-moving-in-excess-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'moving-in-excess-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-moving-in-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'moving-in-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-moving-out-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'moving-out-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-ratio-of-general-households-to-national'),
    display_order_in_group = 0
WHERE ranking_key = 'ratio-of-general-households-to-national';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-persons-per-general-household'),
    display_order_in_group = 0
WHERE ranking_key = 'average-persons-per-general-household';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-general-households'),
    display_order_in_group = 0
WHERE ranking_key = 'general-households';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nuclear-family-households-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'nuclear-family-households-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-single-person-household-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'single-person-household-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-household-ratio-with-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'household-ratio-with-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-elderly-couple-only-household-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'elderly-couple-only-household-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-single-person-household-old-population-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'single-person-household-old-population-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-marriages-per-total-population'),
    display_order_in_group = 0
WHERE ranking_key = 'marriages-per-total-population';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-divorces-per-total-population'),
    display_order_in_group = 0
WHERE ranking_key = 'divorces-per-total-population';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-housing-construction-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'new-housing-construction-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-owner-occupied-housing-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'owner-occupied-housing-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-rented-housing-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'rented-housing-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-private-rented-housing-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'private-rented-housing-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-detached-house-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'detached-house-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-row-house-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'row-house-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-apartment-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'apartment-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-vacant-housing-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'vacant-housing-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-owner-occupied-housing-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'new-owner-occupied-housing-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-new-rented-housing-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'new-rented-housing-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-rooms-per-dwelling'),
    display_order_in_group = 0
WHERE ranking_key = 'rooms-per-dwelling';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-rooms-per-dwelling-owner'),
    display_order_in_group = 0
WHERE ranking_key = 'rooms-per-dwelling-owner';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-rooms-per-dwelling-rented'),
    display_order_in_group = 0
WHERE ranking_key = 'rooms-per-dwelling-rented';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tatami-per-dwelling-owner'),
    display_order_in_group = 0
WHERE ranking_key = 'tatami-per-dwelling-owner';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tatami-per-dwelling-rented'),
    display_order_in_group = 0
WHERE ranking_key = 'tatami-per-dwelling-rented';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-floor-area-per-dwelling-owner'),
    display_order_in_group = 0
WHERE ranking_key = 'floor-area-per-dwelling-owner';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-floor-area-per-dwelling-rented'),
    display_order_in_group = 0
WHERE ranking_key = 'floor-area-per-dwelling-rented';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-site-area-per-dwelling'),
    display_order_in_group = 0
WHERE ranking_key = 'site-area-per-dwelling';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-floor-area-new-owner-dwelling'),
    display_order_in_group = 0
WHERE ranking_key = 'floor-area-new-owner-dwelling';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-floor-area-new-rented-dwelling'),
    display_order_in_group = 0
WHERE ranking_key = 'floor-area-new-rented-dwelling';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-floor-area-new-owner-rented-dwelling'),
    display_order_in_group = 0
WHERE ranking_key = 'floor-area-new-owner-rented-dwelling';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-site-area-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'site-area-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tatami-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'tatami-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-floor-area-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'floor-area-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tatami-per-person-owner'),
    display_order_in_group = 0
WHERE ranking_key = 'tatami-per-person-owner';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-tatami-per-person-rented'),
    display_order_in_group = 0
WHERE ranking_key = 'tatami-per-person-rented';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-site-area-per-person-alt'),
    display_order_in_group = 0
WHERE ranking_key = 'site-area-per-person-alt';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-flush-toilet-housing-count-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'flush-toilet-housing-count-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-flush-toilet-housing-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'flush-toilet-housing-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-bathroom-housing-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'bathroom-housing-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-bathroom-housing-count-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'bathroom-housing-count-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-household-ratio-above-minimum-housing-area'),
    display_order_in_group = 0
WHERE ranking_key = 'household-ratio-above-minimum-housing-area';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-household-ratio-main-earner-employee-commute-90min'),
    display_order_in_group = 0
WHERE ranking_key = 'household-ratio-main-earner-employee-commute-90min';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-main-household-ratio-main-earner-employee-commute-90min'),
    display_order_in_group = 0
WHERE ranking_key = 'main-household-ratio-main-earner-employee-commute-90min';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-rental-housing-rent-per-3-3m2'),
    display_order_in_group = 0
WHERE ranking_key = 'public-rental-housing-rent-per-3-3m2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-private-rental-housing-rent-per-3-3m2'),
    display_order_in_group = 0
WHERE ranking_key = 'private-rental-housing-rent-per-3-3m2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-housing-site-value-per-3-3m2'),
    display_order_in_group = 0
WHERE ranking_key = 'housing-site-value-per-3-3m2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-planned-construction-cost-per-m2'),
    display_order_in_group = 0
WHERE ranking_key = 'planned-construction-cost-per-m2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-city-gas-supply-area-household-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'city-gas-supply-area-household-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-city-gas-sales-volume'),
    display_order_in_group = 0
WHERE ranking_key = 'city-gas-sales-volume';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-gasoline-sales-volume'),
    display_order_in_group = 0
WHERE ranking_key = 'gasoline-sales-volume';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-electricity-generation-capacity'),
    display_order_in_group = 0
WHERE ranking_key = 'electricity-generation-capacity';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-power-demand-amount'),
    display_order_in_group = 0
WHERE ranking_key = 'power-demand-amount';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-water-supply-population-ratio-pre2011'),
    display_order_in_group = 0
WHERE ranking_key = 'water-supply-population-ratio-pre2011';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-water-supply-population-ratio-2012on'),
    display_order_in_group = 0
WHERE ranking_key = 'water-supply-population-ratio-2012on';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-sewerage-penetration-rate-pre2011'),
    display_order_in_group = 0
WHERE ranking_key = 'sewerage-penetration-rate-pre2011';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-sewerage-penetration-rate-2012on'),
    display_order_in_group = 0
WHERE ranking_key = 'sewerage-penetration-rate-2012on';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-flush-toilet-population-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'flush-toilet-population-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-night-soil-treatment-population-ratio-pre2011'),
    display_order_in_group = 0
WHERE ranking_key = 'night-soil-treatment-population-ratio-pre2011';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-night-soil-treatment-population-ratio-2012on'),
    display_order_in_group = 0
WHERE ranking_key = 'night-soil-treatment-population-ratio-2012on';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-garbage-recycling-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'garbage-recycling-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-garbage-landfill-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'garbage-landfill-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-final-disposal-site-remaining-capacity'),
    display_order_in_group = 0
WHERE ranking_key = 'final-disposal-site-remaining-capacity';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-retail-store-count-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'retail-store-count-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-apparel-retail-store-count-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'apparel-retail-store-count-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-food-retail-store-count-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'food-retail-store-count-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-restaurant-count-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'restaurant-count-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-large-retail-store-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'large-retail-store-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-department-store-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'department-store-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-self-service-store-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'self-service-store-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-convenience-store-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'convenience-store-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-barber-beauty-salon-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'barber-beauty-salon-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-cleaning-shop-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'cleaning-shop-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-bath-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'public-bath-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-gas-station-count-per-100km'),
    display_order_in_group = 0
WHERE ranking_key = 'gas-station-count-per-100km';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-retail-store-count-per-1000-alt'),
    display_order_in_group = 0
WHERE ranking_key = 'retail-store-count-per-1000-alt';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-apparel-retail-store-count-per-1000-alt'),
    display_order_in_group = 0
WHERE ranking_key = 'apparel-retail-store-count-per-1000-alt';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-food-retail-store-count-per-1000-alt'),
    display_order_in_group = 0
WHERE ranking_key = 'food-retail-store-count-per-1000-alt';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-restaurant-count-per-1000-alt'),
    display_order_in_group = 0
WHERE ranking_key = 'restaurant-count-per-1000-alt';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-large-retail-store-count-per-100k-alt'),
    display_order_in_group = 0
WHERE ranking_key = 'large-retail-store-count-per-100k-alt';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-department-supermarket-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'department-supermarket-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-post-office-count-per-100km2'),
    display_order_in_group = 0
WHERE ranking_key = 'post-office-count-per-100km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-telephone-subscription-count-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'telephone-subscription-count-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-residential-telephone-subscription-count-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'residential-telephone-subscription-count-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-phone-count-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'public-phone-count-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-mail-acceptance-count'),
    display_order_in_group = 0
WHERE ranking_key = 'mail-acceptance-count';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-mobile-phone-contract-count-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'mobile-phone-contract-count-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-road-length-per-km2'),
    display_order_in_group = 0
WHERE ranking_key = 'road-length-per-km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-main-road-length-per-km2'),
    display_order_in_group = 0
WHERE ranking_key = 'main-road-length-per-km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-main-road-paving-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'main-road-paving-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-municipal-road-paving-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'municipal-road-paving-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-vehicle-kilometers-traveled'),
    display_order_in_group = 0
WHERE ranking_key = 'vehicle-kilometers-traveled';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-road-traffic'),
    display_order_in_group = 0
WHERE ranking_key = 'average-road-traffic';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-urbanization-control-area-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'urbanization-control-area-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-residential-area-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'residential-area-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-residential-and-mixed-area-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'residential-and-mixed-area-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-neighborhood-commercial-area-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'neighborhood-commercial-area-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-commercial-and-neighborhood-commercial-area-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'commercial-and-neighborhood-commercial-area-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-industrial-and-semi-industrial-area-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'industrial-and-semi-industrial-area-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-industrial-exclusive-area-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'industrial-exclusive-area-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-urban-park-area-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'urban-park-area-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-urban-park-count-per-100km2'),
    display_order_in_group = 0
WHERE ranking_key = 'urban-park-count-per-100km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-block-park-count-per-100km2'),
    display_order_in_group = 0
WHERE ranking_key = 'block-park-count-per-100km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-neighborhood-park-count-per-100km2'),
    display_order_in_group = 0
WHERE ranking_key = 'neighborhood-park-count-per-100km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-sports-park-count-per-100km2'),
    display_order_in_group = 0
WHERE ranking_key = 'sports-park-count-per-100km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-height-primary-school-fifth-grade-male'),
    display_order_in_group = 0
WHERE ranking_key = 'average-height-primary-school-fifth-grade-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-height-primary-school-fifth-grade-female'),
    display_order_in_group = 0
WHERE ranking_key = 'average-height-primary-school-fifth-grade-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-height-middle-school-second-grade-male'),
    display_order_in_group = 0
WHERE ranking_key = 'average-height-middle-school-second-grade-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-height-middle-school-second-grade-female'),
    display_order_in_group = 0
WHERE ranking_key = 'average-height-middle-school-second-grade-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-avg-height-high-school-2nd-male'),
    display_order_in_group = 0
WHERE ranking_key = 'avg-height-high-school-2nd-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-height-high-school-second-grade-female'),
    display_order_in_group = 0
WHERE ranking_key = 'average-height-high-school-second-grade-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-weight-primary-school-fifth-grade-male'),
    display_order_in_group = 0
WHERE ranking_key = 'average-weight-primary-school-fifth-grade-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-weight-primary-school-fifth-grade-female'),
    display_order_in_group = 0
WHERE ranking_key = 'average-weight-primary-school-fifth-grade-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-weight-middle-school-second-grade-male'),
    display_order_in_group = 0
WHERE ranking_key = 'average-weight-middle-school-second-grade-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-height-middle-school-second-grade-female'),
    display_order_in_group = 0
WHERE ranking_key = 'average-height-middle-school-second-grade-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-weight-high-school-second-grade-male'),
    display_order_in_group = 0
WHERE ranking_key = 'average-weight-high-school-second-grade-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-weight-high-school-second-grade-female'),
    display_order_in_group = 0
WHERE ranking_key = 'average-weight-high-school-second-grade-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-annual-new-inpatients-general-hospital-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'annual-new-inpatients-general-hospital-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-annual-new-inpatients-general-hospital-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'annual-new-inpatients-general-hospital-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-annual-new-inpatients-psychiatric-hospital-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'annual-new-inpatients-psychiatric-hospital-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-outpatient-rate-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'outpatient-rate-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-complainant-rate-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'complainant-rate-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-outpatient-rate-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'outpatient-rate-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-complainant-rate-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'complainant-rate-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-avg-daily-outpatients-general-hospital-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'avg-daily-outpatients-general-hospital-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-avg-daily-outpatients-general-hospital-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'avg-daily-outpatients-general-hospital-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-avg-daily-outpatients-psychiatric-hospital-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'avg-daily-outpatients-psychiatric-hospital-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-avg-daily-inpatients-general-hospital-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'avg-daily-inpatients-general-hospital-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-avg-daily-inpatients-general-hospital-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'avg-daily-inpatients-general-hospital-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-avg-daily-inpatients-psychiatric-hospital-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'avg-daily-inpatients-psychiatric-hospital-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-avg-daily-inpatients-psychiatric-hospital-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'avg-daily-inpatients-psychiatric-hospital-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-standardized-mortality-rate-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'standardized-mortality-rate-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-standardized-mortality-rate-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'standardized-mortality-rate-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-life-expectancy-0-male'),
    display_order_in_group = 0
WHERE ranking_key = 'life-expectancy-0-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-life-expectancy-0-female'),
    display_order_in_group = 0
WHERE ranking_key = 'life-expectancy-0-female';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-life-expectancy-male'),
    display_order_in_group = 0
WHERE ranking_key = 'average-life-expectancy-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-life-expectancy-female '),
    display_order_in_group = 0
WHERE ranking_key = 'average-life-expectancy-female ';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-life-expectancy-65-male'),
    display_order_in_group = 0
WHERE ranking_key = 'life-expectancy-65-male';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-average-life-expectancy-female-65'),
    display_order_in_group = 0
WHERE ranking_key = 'average-life-expectancy-female-65';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-deaths-lifestyle-diseases-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'deaths-lifestyle-diseases-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-deaths-malignant-neoplasms-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'deaths-malignant-neoplasms-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-deaths-diabetes-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'deaths-diabetes-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-deaths-hypertensive-diseases-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'deaths-hypertensive-diseases-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-deaths-heart-disease-excl-hypertensive-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'deaths-heart-disease-excl-hypertensive-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-deaths-cerebrovascular-disease-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'deaths-cerebrovascular-disease-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-suicides-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'suicides-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-stillbirth-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'stillbirth-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-neonatal-mortality-rate-per-1000-births'),
    display_order_in_group = 0
WHERE ranking_key = 'neonatal-mortality-rate-per-1000-births';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-infant-mortality-rate-per-1000-births'),
    display_order_in_group = 0
WHERE ranking_key = 'infant-mortality-rate-per-1000-births';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-maternal-mortality-rate-per-100k-births'),
    display_order_in_group = 0
WHERE ranking_key = 'maternal-mortality-rate-per-100k-births';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-perinatal-mortality-rate-per-1000-births'),
    display_order_in_group = 0
WHERE ranking_key = 'perinatal-mortality-rate-per-1000-births';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-low-birthweight-rate-per-1000-births'),
    display_order_in_group = 0
WHERE ranking_key = 'low-birthweight-rate-per-1000-births';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-long-absence-primary-school-illness-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'long-absence-primary-school-illness-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-long-absence-middle-school-illness-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'long-absence-middle-school-illness-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-general-hospital-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'general-hospital-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-general-clinic-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'general-clinic-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-dental-clinic-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'dental-clinic-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-psychiatric-hospital-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'psychiatric-hospital-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-general-hospital-bed-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'general-hospital-bed-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-psychiatric-bed-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'psychiatric-bed-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-long-term-care-medical-facility-count-per-100k-65plus'),
    display_order_in_group = 0
WHERE ranking_key = 'long-term-care-medical-facility-count-per-100k-65plus';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-physicians-in-medical-facilities-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'physicians-in-medical-facilities-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-dentists-in-medical-facilities-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'dentists-in-medical-facilities-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nurses-in-medical-facilities-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'nurses-in-medical-facilities-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fulltime-physicians-general-hospital-per-100beds-report'),
    display_order_in_group = 0
WHERE ranking_key = 'fulltime-physicians-general-hospital-per-100beds-report';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fulltime-physicians-general-hospital-per-100beds'),
    display_order_in_group = 0
WHERE ranking_key = 'fulltime-physicians-general-hospital-per-100beds';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nurses-general-hospital-per-100beds-report'),
    display_order_in_group = 0
WHERE ranking_key = 'nurses-general-hospital-per-100beds-report';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-nurses-general-hospital-per-100beds'),
    display_order_in_group = 0
WHERE ranking_key = 'nurses-general-hospital-per-100beds';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-general-hospital-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'public-general-hospital-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-general-hospital-bed-ratio'),
    display_order_in_group = 0
WHERE ranking_key = 'public-general-hospital-bed-ratio';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-general-hospital-count-per-100km2'),
    display_order_in_group = 0
WHERE ranking_key = 'general-hospital-count-per-100km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-general-clinic-count-per-100km2'),
    display_order_in_group = 0
WHERE ranking_key = 'general-clinic-count-per-100km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-dental-clinic-count-per-100km2'),
    display_order_in_group = 0
WHERE ranking_key = 'dental-clinic-count-per-100km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-outpatients-per-fulltime-physician-per-day-report'),
    display_order_in_group = 0
WHERE ranking_key = 'outpatients-per-fulltime-physician-per-day-report';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-inpatients-per-fulltime-physician-per-day-report'),
    display_order_in_group = 0
WHERE ranking_key = 'inpatients-per-fulltime-physician-per-day-report';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-inpatients-per-nurse-per-day-report'),
    display_order_in_group = 0
WHERE ranking_key = 'inpatients-per-nurse-per-day-report';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-general-hospital-bed-occupancy-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'general-hospital-bed-occupancy-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-general-hospital-avg-length-of-stay'),
    display_order_in_group = 0
WHERE ranking_key = 'general-hospital-avg-length-of-stay';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-outpatients-per-fulltime-physician-per-day'),
    display_order_in_group = 0
WHERE ranking_key = 'outpatients-per-fulltime-physician-per-day';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-inpatients-per-fulltime-physician-per-day'),
    display_order_in_group = 0
WHERE ranking_key = 'inpatients-per-fulltime-physician-per-day';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-inpatients-per-nurse-per-day'),
    display_order_in_group = 0
WHERE ranking_key = 'inpatients-per-nurse-per-day';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-psychiatric-outpatients-per-fulltime-physician-per-day-report'),
    display_order_in_group = 0
WHERE ranking_key = 'psychiatric-outpatients-per-fulltime-physician-per-day-report';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-psychiatric-inpatients-per-fulltime-physician-per-day-report'),
    display_order_in_group = 0
WHERE ranking_key = 'psychiatric-inpatients-per-fulltime-physician-per-day-report';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-psychiatric-inpatients-per-nurse-per-day-report'),
    display_order_in_group = 0
WHERE ranking_key = 'psychiatric-inpatients-per-nurse-per-day-report';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-psychiatric-hospital-bed-occupancy-rate'),
    display_order_in_group = 0
WHERE ranking_key = 'psychiatric-hospital-bed-occupancy-rate';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-psychiatric-hospital-avg-length-of-stay'),
    display_order_in_group = 0
WHERE ranking_key = 'psychiatric-hospital-avg-length-of-stay';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-psychiatric-outpatients-per-fulltime-physician-per-day'),
    display_order_in_group = 0
WHERE ranking_key = 'psychiatric-outpatients-per-fulltime-physician-per-day';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-psychiatric-inpatients-per-fulltime-physician-per-day'),
    display_order_in_group = 0
WHERE ranking_key = 'psychiatric-inpatients-per-fulltime-physician-per-day';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-psychiatric-inpatients-per-nurse-per-day'),
    display_order_in_group = 0
WHERE ranking_key = 'psychiatric-inpatients-per-nurse-per-day';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-emergency-hospital-general-clinic-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'emergency-hospital-general-clinic-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-fire-department-emergency-car-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'fire-department-emergency-car-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-annual-emergency-dispatches-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'annual-emergency-dispatches-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-public-health-nurse-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'public-health-nurse-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-health-checkup-rate-lifestyle-diseases'),
    display_order_in_group = 0
WHERE ranking_key = 'health-checkup-rate-lifestyle-diseases';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-maternal-health-guidance-per-100-births'),
    display_order_in_group = 0
WHERE ranking_key = 'maternal-health-guidance-per-100-births';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-dental-checkup-guidance-persons-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'dental-checkup-guidance-persons-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-dental-checkup-persons-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'dental-checkup-persons-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-dental-guidance-persons-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'dental-guidance-persons-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-food-business-facility-penalties-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'food-business-facility-penalties-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-pharmacy-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'pharmacy-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-pharmaceutical-sales-count-per-100k'),
    display_order_in_group = 0
WHERE ranking_key = 'pharmaceutical-sales-count-per-100k';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-pharmacy-count-per-100km2'),
    display_order_in_group = 0
WHERE ranking_key = 'pharmacy-count-per-100km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-pharmaceutical-sales-count-per-100km2'),
    display_order_in_group = 0
WHERE ranking_key = 'pharmaceutical-sales-count-per-100km2';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-national-health-insurance-enrollees-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'national-health-insurance-enrollees-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-national-health-insurance-visit-rate-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'national-health-insurance-visit-rate-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-national-health-insurance-medical-expense-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'national-health-insurance-medical-expense-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-national-medical-expense-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'national-medical-expense-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-japan-health-insurance-society-enrollees-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'japan-health-insurance-society-enrollees-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-japan-health-insurance-society-visit-rate-insured-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'japan-health-insurance-society-visit-rate-insured-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-japan-health-insurance-society-visit-rate-dependents-per-1000'),
    display_order_in_group = 0
WHERE ranking_key = 'japan-health-insurance-society-visit-rate-dependents-per-1000';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-govt-health-insurance-visit-expense-insured-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'govt-health-insurance-visit-expense-insured-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-govt-health-insurance-visit-expense-dependents-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'govt-health-insurance-visit-expense-dependents-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-japan-health-insurance-society-medical-expense-insured-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'japan-health-insurance-society-medical-expense-insured-per-person';
UPDATE ranking_items
SET group_id = (SELECT id FROM ranking_groups WHERE group_key = 'group-japan-health-insurance-society-medical-expense-dependents-per-person'),
    display_order_in_group = 0
WHERE ranking_key = 'japan-health-insurance-society-medical-expense-dependents-per-person';
