-- ダッシュボード設定シードデータ
-- 全サブカテゴリ × 2地域タイプ（national, prefecture）の設定を自動生成
-- 作成日: 2025-01-XX

-- 土地面積 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (1, 'land-area', 'national', 'grid', 1, 1);

-- 土地面積 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (2, 'land-area', 'prefecture', 'grid', 1, 1);

-- 土地利用 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (3, 'land-use', 'national', 'grid', 1, 1);

-- 土地利用 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (4, 'land-use', 'prefecture', 'grid', 1, 1);

-- 自然環境 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (5, 'natural-environment', 'national', 'grid', 1, 1);

-- 自然環境 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (6, 'natural-environment', 'prefecture', 'grid', 1, 1);

-- 気象・気候 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (7, 'weather-climate', 'national', 'grid', 1, 1);

-- 気象・気候 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (8, 'weather-climate', 'prefecture', 'grid', 1, 1);

-- 総人口 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (9, 'basic-population', 'national', 'grid', 1, 1);

-- 総人口 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (10, 'basic-population', 'prefecture', 'grid', 1, 1);

-- 人口移動 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (11, 'population-movement', 'national', 'grid', 1, 1);

-- 人口移動 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (12, 'population-movement', 'prefecture', 'grid', 1, 1);

-- 人口構成 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (13, 'population-composition', 'national', 'grid', 1, 1);

-- 人口構成 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (14, 'population-composition', 'prefecture', 'grid', 1, 1);

-- 婚姻・家族 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (15, 'marriage', 'national', 'grid', 1, 1);

-- 婚姻・家族 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (16, 'marriage', 'prefecture', 'grid', 1, 1);

-- 世帯 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (17, 'households', 'national', 'grid', 1, 1);

-- 世帯 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (18, 'households', 'prefecture', 'grid', 1, 1);

-- 出生・死亡 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (19, 'birth-death', 'national', 'grid', 1, 1);

-- 出生・死亡 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (20, 'birth-death', 'prefecture', 'grid', 1, 1);

-- 賃金・労働条件 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (21, 'wages-working-conditions', 'national', 'grid', 1, 1);

-- 賃金・労働条件 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (22, 'wages-working-conditions', 'prefecture', 'grid', 1, 1);

-- 労働力構造 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (23, 'labor-force-structure', 'national', 'grid', 1, 1);

-- 労働力構造 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (24, 'labor-force-structure', 'prefecture', 'grid', 1, 1);

-- 産業構造 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (25, 'industrial-structure', 'national', 'grid', 1, 1);

-- 産業構造 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (26, 'industrial-structure', 'prefecture', 'grid', 1, 1);

-- 通勤・就職 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (27, 'commuting-employment', 'national', 'grid', 1, 1);

-- 通勤・就職 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (28, 'commuting-employment', 'prefecture', 'grid', 1, 1);

-- 労働争議 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (29, 'labor-disputes', 'national', 'grid', 1, 1);

-- 労働争議 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (30, 'labor-disputes', 'prefecture', 'grid', 1, 1);

-- 求職・求人 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (31, 'job-seeking-placement', 'national', 'grid', 1, 1);

-- 求職・求人 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (32, 'job-seeking-placement', 'prefecture', 'grid', 1, 1);

-- 産業・職業別 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (33, 'industry-occupation', 'national', 'grid', 1, 1);

-- 産業・職業別 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (34, 'industry-occupation', 'prefecture', 'grid', 1, 1);

-- 雇用形態 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (35, 'employment-type', 'national', 'grid', 1, 1);

-- 雇用形態 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (36, 'employment-type', 'prefecture', 'grid', 1, 1);

-- 農業世帯 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (37, 'agricultural-household', 'national', 'grid', 1, 1);

-- 農業世帯 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (38, 'agricultural-household', 'prefecture', 'grid', 1, 1);

-- 製造業 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (39, 'manufacturing', 'national', 'grid', 1, 1);

-- 製造業 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (40, 'manufacturing', 'prefecture', 'grid', 1, 1);

-- 商業・サービス産業 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (41, 'commerce-service-industry', 'national', 'grid', 1, 1);

-- 商業・サービス産業 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (42, 'commerce-service-industry', 'prefecture', 'grid', 1, 1);

-- 商業施設 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (43, 'commercial-facilities', 'national', 'grid', 1, 1);

-- 商業施設 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (44, 'commercial-facilities', 'prefecture', 'grid', 1, 1);

-- 労働者世帯収入 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (45, 'worker-household-income', 'national', 'grid', 1, 1);

-- 労働者世帯収入 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (46, 'worker-household-income', 'prefecture', 'grid', 1, 1);

-- 家計 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (47, 'household-economy', 'national', 'grid', 1, 1);

-- 家計 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (48, 'household-economy', 'prefecture', 'grid', 1, 1);

-- 企業規模 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (49, 'business-scale', 'national', 'grid', 1, 1);

-- 企業規模 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (50, 'business-scale', 'prefecture', 'grid', 1, 1);

-- 企業活動 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (51, 'business-activity', 'national', 'grid', 1, 1);

-- 企業活動 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (52, 'business-activity', 'prefecture', 'grid', 1, 1);

-- 総生産・経済指標 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (53, 'gross-product-economic-indicators', 'national', 'grid', 1, 1);

-- 総生産・経済指標 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (54, 'gross-product-economic-indicators', 'prefecture', 'grid', 1, 1);

-- 消費者物価地域差指数 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (55, 'consumer-price-difference-index', 'national', 'grid', 1, 1);

-- 消費者物価地域差指数 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (56, 'consumer-price-difference-index', 'prefecture', 'grid', 1, 1);

-- 生活環境 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (57, 'living-environment', 'national', 'grid', 1, 1);

-- 生活環境 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (58, 'living-environment', 'prefecture', 'grid', 1, 1);

-- 住宅所有 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (59, 'housing-ownership', 'national', 'grid', 1, 1);

-- 住宅所有 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (60, 'housing-ownership', 'prefecture', 'grid', 1, 1);

-- 住宅構造 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (61, 'housing-structure', 'national', 'grid', 1, 1);

-- 住宅構造 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (62, 'housing-structure', 'prefecture', 'grid', 1, 1);

-- 住宅設備 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (63, 'housing-facilities', 'national', 'grid', 1, 1);

-- 住宅設備 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (64, 'housing-facilities', 'prefecture', 'grid', 1, 1);

-- 建設・製造 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (65, 'construction-manufacturing', 'national', 'grid', 1, 1);

-- 建設・製造 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (66, 'construction-manufacturing', 'prefecture', 'grid', 1, 1);

-- 福祉施設 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (67, 'welfare-facilities', 'national', 'grid', 1, 1);

-- 福祉施設 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (68, 'welfare-facilities', 'prefecture', 'grid', 1, 1);

-- 住宅統計 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (69, 'housing-statistics', 'national', 'grid', 1, 1);

-- 住宅統計 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (70, 'housing-statistics', 'prefecture', 'grid', 1, 1);

-- 上水道・下水道 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (71, 'water-supply-sewerage', 'national', 'grid', 1, 1);

-- 上水道・下水道 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (72, 'water-supply-sewerage', 'prefecture', 'grid', 1, 1);

-- 廃棄物処理 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (73, 'waste-management', 'national', 'grid', 1, 1);

-- 廃棄物処理 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (74, 'waste-management', 'prefecture', 'grid', 1, 1);

-- 工業用水 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (75, 'industrial-water', 'national', 'grid', 1, 1);

-- 工業用水 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (76, 'industrial-water', 'prefecture', 'grid', 1, 1);

-- インフラ・エネルギー (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (77, 'infrastructure-energy', 'national', 'grid', 1, 1);

-- インフラ・エネルギー (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (78, 'infrastructure-energy', 'prefecture', 'grid', 1, 1);

-- 観光・宿泊 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (79, 'tourism-accommodation', 'national', 'grid', 1, 1);

-- 観光・宿泊 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (80, 'tourism-accommodation', 'prefecture', 'grid', 1, 1);

-- 幼稚園 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (81, 'kindergarten', 'national', 'grid', 1, 1);

-- 幼稚園 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (82, 'kindergarten', 'prefecture', 'grid', 1, 1);

-- 小学校 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (83, 'elementary-school', 'national', 'grid', 1, 1);

-- 小学校 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (84, 'elementary-school', 'prefecture', 'grid', 1, 1);

-- 中学校 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (85, 'junior-high-school', 'national', 'grid', 1, 1);

-- 中学校 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (86, 'junior-high-school', 'prefecture', 'grid', 1, 1);

-- 高等学校 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (87, 'high-school', 'national', 'grid', 1, 1);

-- 高等学校 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (88, 'high-school', 'prefecture', 'grid', 1, 1);

-- 短大・大学 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (89, 'college-university', 'national', 'grid', 1, 1);

-- 短大・大学 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (90, 'college-university', 'prefecture', 'grid', 1, 1);

-- 文化施設 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (91, 'cultural-facilities', 'national', 'grid', 1, 1);

-- 文化施設 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (92, 'cultural-facilities', 'prefecture', 'grid', 1, 1);

-- スポーツ施設 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (93, 'sports-facilities', 'national', 'grid', 1, 1);

-- スポーツ施設 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (94, 'sports-facilities', 'prefecture', 'grid', 1, 1);

-- 社会活動 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (95, 'social-activities', 'national', 'grid', 1, 1);

-- 社会活動 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (96, 'social-activities', 'prefecture', 'grid', 1, 1);

-- 保育・幼児教育 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (97, 'childcare-early-education', 'national', 'grid', 1, 1);

-- 保育・幼児教育 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (98, 'childcare-early-education', 'prefecture', 'grid', 1, 1);

-- 義務教育 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (99, 'compulsory-education', 'national', 'grid', 1, 1);

-- 義務教育 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (100, 'compulsory-education', 'prefecture', 'grid', 1, 1);

-- 財政指標 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (101, 'fiscal-indicators', 'national', 'grid', 1, 1);

-- 財政指標 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (102, 'fiscal-indicators', 'prefecture', 'grid', 1, 1);

-- 職員・議会・選挙 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (103, 'staff-assembly-election', 'national', 'grid', 1, 1);

-- 職員・議会・選挙 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (104, 'staff-assembly-election', 'prefecture', 'grid', 1, 1);

-- 税収 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (105, 'tax-revenue', 'national', 'grid', 1, 1);

-- 税収 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (106, 'tax-revenue', 'prefecture', 'grid', 1, 1);

-- 投資 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (107, 'investment', 'national', 'grid', 1, 1);

-- 投資 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (108, 'investment', 'prefecture', 'grid', 1, 1);

-- 歳入 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (109, 'revenue', 'national', 'grid', 1, 1);

-- 歳入 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (110, 'revenue', 'prefecture', 'grid', 1, 1);

-- 歳出 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (111, 'expenditure', 'national', 'grid', 1, 1);

-- 歳出 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (112, 'expenditure', 'prefecture', 'grid', 1, 1);

-- 消防・緊急事態 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (113, 'fire-emergency', 'national', 'grid', 1, 1);

-- 消防・緊急事態 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (114, 'fire-emergency', 'prefecture', 'grid', 1, 1);

-- 火災保険 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (115, 'fire-insurance', 'national', 'grid', 1, 1);

-- 火災保険 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (116, 'fire-insurance', 'prefecture', 'grid', 1, 1);

-- 警察・犯罪 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (117, 'police-crime', 'national', 'grid', 1, 1);

-- 警察・犯罪 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (118, 'police-crime', 'prefecture', 'grid', 1, 1);

-- 交通事故 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (119, 'traffic-accidents', 'national', 'grid', 1, 1);

-- 交通事故 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (120, 'traffic-accidents', 'prefecture', 'grid', 1, 1);

-- 公害・環境 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (121, 'pollution-environment', 'national', 'grid', 1, 1);

-- 公害・環境 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (122, 'pollution-environment', 'prefecture', 'grid', 1, 1);

-- 社会保障指標 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (123, 'card', 'national', 'grid', 1, 1);

-- 社会保障指標 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (124, 'card', 'prefecture', 'grid', 1, 1);

-- 死亡統計 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (125, 'death-statistics', 'national', 'grid', 1, 1);

-- 死亡統計 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (126, 'death-statistics', 'prefecture', 'grid', 1, 1);

-- 生活保護・福祉 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (127, 'public-assistance-welfare', 'national', 'grid', 1, 1);

-- 生活保護・福祉 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (128, 'public-assistance-welfare', 'prefecture', 'grid', 1, 1);

-- 健康・保健 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (129, 'health-care', 'national', 'grid', 1, 1);

-- 健康・保健 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (130, 'health-care', 'prefecture', 'grid', 1, 1);

-- 外国人人口 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (131, 'foreign-population', 'national', 'grid', 1, 1);

-- 外国人人口 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (132, 'foreign-population', 'prefecture', 'grid', 1, 1);

-- 外国人統計 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (133, 'foreigners', 'national', 'grid', 1, 1);

-- 外国人統計 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (134, 'foreigners', 'prefecture', 'grid', 1, 1);

-- 道路 (全国)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (135, 'roads', 'national', 'grid', 1, 1);

-- 道路 (都道府県)
INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES
  (136, 'roads', 'prefecture', 'grid', 1, 1);

