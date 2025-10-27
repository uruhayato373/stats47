-- ランキングデータ生成SQL
-- このファイルは scripts/generate-ranking-data.ts から自動生成されました

INSERT OR IGNORE INTO subcategory_configs (id, category_id, name, description)
VALUES ('prefecture-finance', 'economy', '都道府県財政', '都道府県財政に関する指標');
INSERT OR IGNORE INTO subcategory_configs (id, category_id, name, description)
VALUES ('social-welfare', 'welfare', '社会福祉', '社会福祉に関する指標');
INSERT OR IGNORE INTO subcategory_configs (id, category_id, name, description)
VALUES ('public-safety', 'safety', '公共安全・治安', '公共安全と治安に関する指標');
INSERT OR IGNORE INTO subcategory_configs (id, category_id, name, description)
VALUES ('education', 'education', '教育', '教育に関する指標');

-- Ranking Items
INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  1, 'financial-power-index', '財政力指数（都道府県財政）', '財政力指数（都道府県財政）', '財政力指数（都道府県財政）', '‐', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (1, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0110101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  2, 'real-balance-ratio', '実質収支比率（都道府県財政）', '実質収支比率（都道府県財政）', '実質収支比率（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (2, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D01102"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  3, 'current-balance-ratio', '経常収支比率（都道府県財政）', '経常収支比率（都道府県財政）', '経常収支比率（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (3, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D01401"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  4, 'self-financing-ratio', '自主財源の割合（都道府県財政）', '自主財源の割合（都道府県財政）', '自主財源の割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (4, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0120101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  5, 'local-tax-ratio-pref-finance', '地方税割合（都道府県財政）', '地方税割合（都道府県財政）', '地方税割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (5, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0210101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  6, 'local-allocation-tax-ratio-pref-finance', '地方交付税割合（都道府県財政）', '地方交付税割合（都道府県財政）', '地方交付税割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (6, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0210201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  7, 'national-treasury-disbursement-ratio-pref-finance', '国庫支出金割合（都道府県財政）', '国庫支出金割合（都道府県財政）', '国庫支出金割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (7, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0210301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  8, 'local-debt-current-ratio', '地方債現在高の割合（都道府県財政）', '地方債現在高の割合（都道府県財政）', '地方債現在高の割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (8, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0130201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  9, 'general-revenue-ratio-pref-finance', '一般財源の割合（都道府県財政）', '一般財源の割合（都道府県財政）', '一般財源の割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (9, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0140301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  10, 'per-taxpayer-taxable-income', '課税対象所得（納税義務者1人当たり）', '課税対象所得（納税義務者1人当たり）', '課税対象所得（納税義務者1人当たり）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (10, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D02206"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  11, 'taxpayer-ratio-per-pref-resident', '納税義務者割合（都道府県民1人当たり）', '納税義務者割合（都道府県民1人当たり）', '納税義務者割合（都道府県民1人当たり）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (11, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D02207"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  12, 'social-welfare-expenditure-ratio-pref-finance', '社会福祉費割合（都道府県財政）', '社会福祉費割合（都道府県財政）', '社会福祉費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (12, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0310401"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  13, 'elderly-welfare-expenditure-ratio-pref-finance', '老人福祉費割合（都道府県財政）', '老人福祉費割合（都道府県財政）', '老人福祉費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (13, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0310501"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  14, 'child-welfare-expenditure-ratio-pref-finance', '児童福祉費割合（都道府県財政）', '児童福祉費割合（都道府県財政）', '児童福祉費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (14, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0310601"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  15, 'public-assistance-expenditure-ratio-pref-finance', '生活保護費割合（都道府県財政）', '生活保護費割合（都道府県財政）', '生活保護費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (15, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0310701"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  16, 'disaster-recovery-expenditure-ratio-pref-finance', '災害復旧費割合（都道府県財政）', '災害復旧費割合（都道府県財政）', '災害復旧費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (16, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0312301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  17, 'per-capita-public-assistance-expenditure-protected-pref-municipal', '被保護実人員1人当たり生活保護費（都道府県・市町村財政合計）', '被保護実人員1人当たり生活保護費（都道府県・市町村財政合計）', '被保護実人員1人当たり生活保護費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (17, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0330603"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  18, 'per-child-public-elementary-school-expenditure-pref-municipal', '児童1人当たり公立小学校費（都道府県・市町村財政合計）', '児童1人当たり公立小学校費（都道府県・市町村財政合計）', '児童1人当たり公立小学校費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (18, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0331503"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  19, 'per-student-public-junior-high-school-expenditure-pref-municipal', '生徒1人当たり公立中学校費（都道府県・市町村財政合計）', '生徒1人当たり公立中学校費（都道府県・市町村財政合計）', '生徒1人当たり公立中学校費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (19, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0331603"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  20, 'per-student-public-high-school-expenditure-pref-municipal', '生徒1人当たり公立高等学校費（都道府県・市町村財政合計）', '生徒1人当たり公立高等学校費（都道府県・市町村財政合計）', '生徒1人当たり公立高等学校費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (20, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0331703"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  21, 'per-child-student-special-support-school-expenditure-pref-municipal', '児童・生徒1人当たり特別支援学校費（都道府県・市町村財政合計）', '児童・生徒1人当たり特別支援学校費（都道府県・市町村財政合計）', '児童・生徒1人当たり特別支援学校費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (21, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0331804"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  22, 'per-child-kindergarten-expenditure-pref-municipal', '児童1人当たり幼稚園費（都道府県・市町村財政合計）', '児童1人当たり幼稚園費（都道府県・市町村財政合計）', '児童1人当たり幼稚園費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (22, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0331903"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  23, 'investment-expenditure-ratio-pref-finance', '投資的経費の割合（都道府県財政）', '投資的経費の割合（都道府県財政）', '投資的経費の割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (23, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0140201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  24, 'personnel-expenditure-ratio-pref-finance', '人件費割合（都道府県財政）', '人件費割合（都道府県財政）', '人件費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (24, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0320101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  25, 'assistance-expenditure-ratio-pref-finance', '扶助費割合（都道府県財政）', '扶助費割合（都道府県財政）', '扶助費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (25, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0320201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  26, 'ordinary-construction-expenditure-ratio-pref-finance', '普通建設事業費割合（都道府県財政）', '普通建設事業費割合（都道府県財政）', '普通建設事業費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (26, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0320301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  27, 'per-capita-inhabitant-tax-pref-municipal', '人口1人当たり住民税（都道府県・市町村財政合計）', '人口1人当たり住民税（都道府県・市町村財政合計）', '人口1人当たり住民税（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (27, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0220103"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  28, 'per-capita-fixed-asset-tax-pref-municipal', '人口1人当たり固定資産税（都道府県・市町村財政合計）', '人口1人当たり固定資産税（都道府県・市町村財政合計）', '人口1人当たり固定資産税（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (28, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D02202"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  29, 'per-capita-national-tax-collected', '国税徴収決定済額（人口1人当たり）', '国税徴収決定済額（人口1人当たり）', '国税徴収決定済額（人口1人当たり）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (29, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D02204"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  30, 'per-capita-total-expenditure-pref-municipal', '人口1人当たり歳出決算総額（都道府県・市町村財政合計）', '人口1人当たり歳出決算総額（都道府県・市町村財政合計）', '人口1人当たり歳出決算総額（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (30, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0330103"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  31, 'per-capita-social-welfare-expenditure-pref-municipal', '人口1人当たり社会福祉費（都道府県・市町村財政合計）', '人口1人当たり社会福祉費（都道府県・市町村財政合計）', '人口1人当たり社会福祉費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (31, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0330303"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  32, 'per-capita-elderly-welfare-expenditure-65plus-pref-municipal', '65歳以上人口1人当たり老人福祉費（都道府県・市町村財政合計）', '65歳以上人口1人当たり老人福祉費（都道府県・市町村財政合計）', '65歳以上人口1人当たり老人福祉費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (32, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0330403"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  33, 'per-capita-child-welfare-expenditure-under17-pref-municipal', '17歳以下人口1人当たり児童福祉費（都道府県・市町村財政合計）', '17歳以下人口1人当たり児童福祉費（都道府県・市町村財政合計）', '17歳以下人口1人当たり児童福祉費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (33, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0330503"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  34, 'per-capita-disaster-recovery-expenditure-pref-municipal', '人口1人当たり災害復旧費（都道府県・市町村財政合計）', '人口1人当たり災害復旧費（都道府県・市町村財政合計）', '人口1人当たり災害復旧費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (34, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0332103"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  35, 'welfare-expenditure-ratio-pref-finance', '民生費割合（都道府県財政）', '民生費割合（都道府県財政）', '民生費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (35, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0310301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  36, 'sanitation-expenditure-ratio-pref-finance', '衛生費割合（都道府県財政）', '衛生費割合（都道府県財政）', '衛生費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (36, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0310801"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  37, 'labor-expenditure-ratio-pref-finance', '労働費割合（都道府県財政）', '労働費割合（都道府県財政）', '労働費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (37, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0310901"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  38, 'agriculture-forestry-fisheries-expenditure-ratio-pref-finance', '農林水産業費割合（都道府県財政）', '農林水産業費割合（都道府県財政）', '農林水産業費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (38, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0311001"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  39, 'commerce-industry-expenditure-ratio-pref-finance', '商工費割合（都道府県財政）', '商工費割合（都道府県財政）', '商工費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (39, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0311101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  40, 'public-works-expenditure-ratio-pref-finance', '土木費割合（都道府県財政）', '土木費割合（都道府県財政）', '土木費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (40, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0311201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  41, 'police-expenditure-ratio-pref-finance', '警察費割合（都道府県財政）', '警察費割合（都道府県財政）', '警察費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (41, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D03113"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  42, 'firefighting-expenditure-ratio-pref-municipal', '消防費割合（都・市町村財政合計）', '消防費割合（都・市町村財政合計）', '消防費割合（都・市町村財政合計）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (42, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D03114"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  43, 'education-expenditure-ratio-pref-finance', '教育費割合（都道府県財政）', '教育費割合（都道府県財政）', '教育費割合（都道府県財政）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (43, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0311501"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  44, 'per-capita-welfare-expenditure-pref-municipal', '人口1人当たり民生費（都道府県・市町村財政合計）', '人口1人当たり民生費（都道府県・市町村財政合計）', '人口1人当たり民生費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (44, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0330203"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  45, 'per-capita-sanitation-expenditure-pref-municipal', '人口1人当たり衛生費（都道府県・市町村財政合計）', '人口1人当たり衛生費（都道府県・市町村財政合計）', '人口1人当たり衛生費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (45, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0330703"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  46, 'per-capita-public-works-expenditure-pref-municipal', '人口1人当たり土木費（都道府県・市町村財政合計）', '人口1人当たり土木費（都道府県・市町村財政合計）', '人口1人当たり土木費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (46, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0331103"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  47, 'per-capita-police-expenditure-pref-municipal', '人口1人当たり警察費（都道府県財政）', '人口1人当たり警察費（都道府県財政）', '人口1人当たり警察費（都道府県財政）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (47, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D03312"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  48, 'per-capita-firefighting-expenditure-tokyo-municipal', '人口1人当たり消防費（東京都・市町村財政合計）', '人口1人当たり消防費（東京都・市町村財政合計）', '人口1人当たり消防費（東京都・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (48, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D03313"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  49, 'per-capita-education-expenditure-pref-municipal', '人口1人当たり教育費（都道府県・市町村財政合計）', '人口1人当たり教育費（都道府県・市町村財政合計）', '人口1人当たり教育費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (49, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0331403"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  50, 'per-capita-social-education-expenditure-pref-municipal', '人口1人当たり社会教育費（都道府県・市町村財政合計）', '人口1人当たり社会教育費（都道府県・市町村財政合計）', '人口1人当たり社会教育費（都道府県・市町村財政合計）', '千円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (50, 'estat', '{"stats_data_id": "0000010204", "cd_cat01": "#D0332003"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  51, 'households-on-public-assistance-per-1000', '生活保護被保護実世帯数（月平均一般世帯千世帯当たり）', '生活保護被保護実世帯数（月平均一般世帯千世帯当たり）', '生活保護被保護実世帯数（月平均一般世帯千世帯当たり）', '世帯', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (51, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J01101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  52, 'persons-on-public-assistance-per-1000', '生活保護被保護実人員（月平均人口千人当たり）', '生活保護被保護実人員（月平均人口千人当たり）', '生活保護被保護実人員（月平均人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (52, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J01107"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  53, 'public-assistance-education-beneficiaries-per-1000', '生活保護教育扶助人員（月平均人口千人当たり）', '生活保護教育扶助人員（月平均人口千人当たり）', '生活保護教育扶助人員（月平均人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (53, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J0110803"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  54, 'public-assistance-medical-beneficiaries-per-1000', '生活保護医療扶助人員（月平均人口千人当たり）', '生活保護医療扶助人員（月平均人口千人当たり）', '生活保護医療扶助人員（月平均人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (54, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J0110804"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  55, 'public-assistance-housing-beneficiaries-per-1000', '生活保護住宅扶助人員（月平均人口千人当たり）', '生活保護住宅扶助人員（月平均人口千人当たり）', '生活保護住宅扶助人員（月平均人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (55, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J0110805"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  56, 'public-assistance-nursing-beneficiaries-per-1000', '生活保護介護扶助人員（月平均人口千人当たり）', '生活保護介護扶助人員（月平均人口千人当たり）', '生活保護介護扶助人員（月平均人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (56, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J0110806"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  57, 'elderly-on-public-assistance-per-1000-65plus', '生活保護被保護高齢者数（月平均65歳以上人口千人当たり）', '生活保護被保護高齢者数（月平均65歳以上人口千人当たり）', '生活保護被保護高齢者数（月平均65歳以上人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (57, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J0110902"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  58, 'welfare-facilities-count-per-100k-on-assistance', '保護施設数（生活保護被保護実人員10万人当たり）', '保護施設数（生活保護被保護実人員10万人当たり）', '保護施設数（生活保護被保護実人員10万人当たり）', '所', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (58, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J02101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  59, 'welfare-facility-staff-per-1000-on-assistance', '保護施設従事者数（生活保護被保護実人員千人当たり）', '保護施設従事者数（生活保護被保護実人員千人当たり）', '保護施設従事者数（生活保護被保護実人員千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (59, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J03101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  60, 'public-assistance-facility-capacity-per-1000', '生活保護施設定員数（被保護実人員千人当たり）', '生活保護施設定員数（被保護実人員千人当たり）', '生活保護施設定員数（被保護実人員千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (60, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J04101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  61, 'public-assistance-facility-residents-per-1000', '生活保護施設在所者数（被保護実人員千人当たり）', '生活保護施設在所者数（被保護実人員千人当たり）', '生活保護施設在所者数（被保護実人員千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (61, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J04102"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  62, 'welfare-office-public-assistance-applications-per-1000-households', '福祉事務所生活保護申請件数（被保護世帯千世帯当たり）', '福祉事務所生活保護申請件数（被保護世帯千世帯当たり）', '福祉事務所生活保護申請件数（被保護世帯千世帯当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (62, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J05202"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  63, 'physical-disability-certificates-issued-per-1000', '身体障害者手帳交付数（人口千人当たり）', '身体障害者手帳交付数（人口千人当たり）', '身体障害者手帳交付数（人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (63, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J01200"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  64, 'physical-disability-rehabilitation-facility-count-per-1m', '身体障害者更生援護施設数（人口100万人当たり）', '身体障害者更生援護施設数（人口100万人当たり）', '身体障害者更生援護施設数（人口100万人当たり）', '所', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (64, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J02301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  65, 'intellectual-disability-support-facility-count-per-1m', '知的障害者援護施設数（人口100万人当たり）', '知的障害者援護施設数（人口100万人当たり）', '知的障害者援護施設数（人口100万人当たり）', '所', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (65, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J02401"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  66, 'physical-disability-rehabilitation-facility-staff-per-100k', '身体障害者更生援護施設従事者数（人口10万人当たり）', '身体障害者更生援護施設従事者数（人口10万人当たり）', '身体障害者更生援護施設従事者数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (66, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J03301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  67, 'intellectual-disability-support-facility-staff-per-100k', '知的障害者援護施設従事者数（人口10万人当たり）', '知的障害者援護施設従事者数（人口10万人当たり）', '知的障害者援護施設従事者数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (67, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J03401"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  68, 'physical-disability-rehabilitation-facility-capacity-per-100k', '身体障害者更生援護施設定員数（人口10万人当たり）', '身体障害者更生援護施設定員数（人口10万人当たり）', '身体障害者更生援護施設定員数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (68, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J04301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  69, 'physical-disability-rehabilitation-facility-residents-per-100k', '身体障害者更生援護施設在所者数（人口10万人当たり）', '身体障害者更生援護施設在所者数（人口10万人当たり）', '身体障害者更生援護施設在所者数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (69, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J04302"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  70, 'intellectual-disability-support-facility-capacity-per-100k', '知的障害者援護施設定員数（人口10万人当たり）', '知的障害者援護施設定員数（人口10万人当たり）', '知的障害者援護施設定員数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (70, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J04401"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  71, 'intellectual-disability-support-facility-residents-per-100k', '知的障害者援護施設在所者数（人口10万人当たり）', '知的障害者援護施設在所者数（人口10万人当たり）', '知的障害者援護施設在所者数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (71, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J04402"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  72, 'physical-disability-rehabilitation-cases-per-1000', '身体障害者更生援護取扱実人員（人口千人当たり）', '身体障害者更生援護取扱実人員（人口千人当たり）', '身体障害者更生援護取扱実人員（人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (72, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J05203"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  73, 'welfare-office-intellectual-disability-consultations-per-100k', '福祉事務所知的障害者相談実人員（人口10万人当たり）', '福祉事務所知的障害者相談実人員（人口10万人当たり）', '福祉事務所知的障害者相談実人員（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (73, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J05204"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  74, 'physical-disability-rehabilitation-center-cases-per-1000', '身体障害者更生相談所取扱実人員（人口千人当たり）', '身体障害者更生相談所取扱実人員（人口千人当たり）', '身体障害者更生相談所取扱実人員（人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (74, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J05206"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  75, 'intellectual-disability-rehabilitation-center-cases-per-100k', '知的障害者更生相談所取扱実人員（人口10万人当たり）', '知的障害者更生相談所取扱実人員（人口10万人当たり）', '知的障害者更生相談所取扱実人員（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (75, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J05207"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  76, 'municipal-intellectual-disability-consultations-per-100k', '市町村における知的障害者相談実人員（人口10万人当たり）', '市町村における知的障害者相談実人員（人口10万人当たり）', '市町村における知的障害者相談実人員（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (76, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J05209"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  77, 'nursing-home-count-per-100k-65plus', '老人ホーム数（65歳以上人口10万人当たり）', '老人ホーム数（65歳以上人口10万人当たり）', '老人ホーム数（65歳以上人口10万人当たり）', '所', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (77, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J022011"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  78, 'senior-welfare-center-count-per-100k-65plus', '老人福祉センター数（65歳以上人口10万人当たり）', '老人福祉センター数（65歳以上人口10万人当たり）', '老人福祉センター数（65歳以上人口10万人当たり）', '所', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (78, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J02202"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  79, 'senior-recreation-home-count-per-100k-65plus', '老人憩の家数（65歳以上人口10万人当たり）', '老人憩の家数（65歳以上人口10万人当たり）', '老人憩の家数（65歳以上人口10万人当たり）', '所', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (79, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J02203"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  80, 'paid-nursing-home-count-per-100k-65plus', '有料老人ホーム数（65歳以上人口10万人当たり）', '有料老人ホーム数（65歳以上人口10万人当たり）', '有料老人ホーム数（65歳以上人口10万人当たり）', '所', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (80, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J02204"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  81, 'nursing-welfare-facility-count-per-100k-65plus', '介護老人福祉施設数（65歳以上人口10万人当たり）', '介護老人福祉施設数（65歳以上人口10万人当たり）', '介護老人福祉施設数（65歳以上人口10万人当たり）', '所', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (81, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J02205"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  82, 'nursing-home-staff-per-100k-65plus', '老人ホーム従事者数（65歳以上人口10万人当たり）', '老人ホーム従事者数（65歳以上人口10万人当たり）', '老人ホーム従事者数（65歳以上人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (82, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J032011"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  83, 'senior-welfare-center-staff-per-100k-65plus', '老人福祉センター従事者数（65歳以上人口10万人当たり）', '老人福祉センター従事者数（65歳以上人口10万人当たり）', '老人福祉センター従事者数（65歳以上人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (83, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J03202"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  84, 'senior-recreation-home-staff-per-100k-65plus', '老人憩の家従事者数（65歳以上人口10万人当たり）', '老人憩の家従事者数（65歳以上人口10万人当たり）', '老人憩の家従事者数（65歳以上人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (84, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J03203"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  85, 'nursing-home-capacity-per-1000-65plus', '老人ホーム定員数（65歳以上人口千人当たり）', '老人ホーム定員数（65歳以上人口千人当たり）', '老人ホーム定員数（65歳以上人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (85, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J042011"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  86, 'nursing-home-residents-per-1000-65plus', '老人ホーム在所者数（65歳以上人口千人当たり）', '老人ホーム在所者数（65歳以上人口千人当たり）', '老人ホーム在所者数（65歳以上人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (86, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J042021"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  87, 'paid-nursing-home-capacity-per-1000-65plus', '有料老人ホーム定員数（65歳以上人口千人当たり）', '有料老人ホーム定員数（65歳以上人口千人当たり）', '有料老人ホーム定員数（65歳以上人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (87, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J04203"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  88, 'paid-nursing-home-residents-per-1000-65plus', '有料老人ホーム在所者数（65歳以上人口千人当たり）', '有料老人ホーム在所者数（65歳以上人口千人当たり）', '有料老人ホーム在所者数（65歳以上人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (88, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J04204"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  89, 'late-elderly-medical-expense-per-insured', '後期高齢者医療費（被保険者1人当たり）', '後期高齢者医療費（被保険者1人当たり）', '後期高齢者医療費（被保険者1人当たり）', '円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (89, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J05208"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  90, 'child-welfare-facility-count-per-100k', '児童福祉施設等数（人口10万人当たり）', '児童福祉施設等数（人口10万人当たり）', '児童福祉施設等数（人口10万人当たり）', '所', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (90, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J02501"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  91, 'child-welfare-facility-staff-per-100k', '児童福祉施設等従事者数（人口10万人当たり）', '児童福祉施設等従事者数（人口10万人当たり）', '児童福祉施設等従事者数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (91, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J03501"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  92, 'welfare-commissioner-count-per-100k', '民生委員（児童委員）数（人口10万人当たり）', '民生委員（児童委員）数（人口10万人当たり）', '民生委員（児童委員）数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (92, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J05101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  93, 'welfare-commissioner-consultations-per-person', '民生委員（児童委員）1人当たり相談・支援件数', '民生委員（児童委員）1人当たり相談・支援件数', '民生委員（児童委員）1人当たり相談・支援件数', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (93, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J05201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  94, 'child-consultation-center-cases-per-1000', '児童相談所受付件数（人口千人当たり）', '児童相談所受付件数（人口千人当たり）', '児童相談所受付件数（人口千人当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (94, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J05210"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  95, 'home-helper-count-per-100k', '訪問介護員（ホームヘルパー）数（人口10万人当たり）', '訪問介護員（ホームヘルパー）数（人口10万人当たり）', '訪問介護員（ホームヘルパー）数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (95, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J05108"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  96, 'home-helper-users-per-office', '訪問介護利用者数（訪問介護1事業所当たり）', '訪問介護利用者数（訪問介護1事業所当たり）', '訪問介護利用者数（訪問介護1事業所当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (96, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J05109"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  97, 'national-pension-enrollees-type1-per-1000-20-59', '国民年金被保険者数（第1号）（20～59歳人口千人当たり）', '国民年金被保険者数（第1号）（20～59歳人口千人当たり）', '国民年金被保険者数（第1号）（20～59歳人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (97, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J0610101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  98, 'national-pension-enrollees-type3-per-1000-20-59', '国民年金被保険者数（第3号）（20～59歳人口千人当たり）', '国民年金被保険者数（第3号）（20～59歳人口千人当たり）', '国民年金被保険者数（第3号）（20～59歳人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (98, 'estat', '{"stats_data_id": "0000010210", "cd_cat01": "#J0610102"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  99, 'fire-department-count-per-100-km2', '消防署数（可住地面積100km2当たり）', '消防署数（可住地面積100km2当たり）', '消防署数（可住地面積100km2当たり）', '署', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (99, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K01102"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  100, 'fire-department-branch-count-per-100-km2', '消防団・分団数（可住地面積100km2当たり）', '消防団・分団数（可住地面積100km2当たり）', '消防団・分団数（可住地面積100km2当たり）', '団', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (100, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K01104"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  101, 'fire-department-pump-car-count-per-100-thousand-people', '消防ポンプ自動車等現有数（人口10万人当たり）', '消防ポンプ自動車等現有数（人口10万人当たり）', '消防ポンプ自動車等現有数（人口10万人当たり）', '台', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (101, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K01105"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  102, 'fire-department-water-count-per-100-thousand-people', '消防水利数（人口10万人当たり）', '消防水利数（人口10万人当たり）', '消防水利数（人口10万人当たり）', '所', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (102, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K01107"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  103, 'fire-related-personnel-count-per-100k', '消防関係人員数（人口10万人当たり）', '消防関係人員数（人口10万人当たり）', '消防関係人員数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (103, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K01301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  104, 'fire-department-member-count-per-100-thousand-people', '消防吏員数（人口10万人当たり）', '消防吏員数（人口10万人当たり）', '消防吏員数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (104, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K01302"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  105, 'fire-department-dispatch-count-per-100-thousand-people', '消防機関出動回数（人口10万人当たり）', '消防機関出動回数（人口10万人当たり）', '消防機関出動回数（人口10万人当たり）', '回', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (105, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K01401"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  106, 'fire-dispatch-for-building-fire-count-per-100k', '火災のための消防機関出動回数（人口10万人当たり）', '火災のための消防機関出動回数（人口10万人当たり）', '火災のための消防機関出動回数（人口10万人当たり）', '回', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (106, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K01402"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  107, 'building-fire-count-per-100-thousand-people', '火災出火件数（人口10万人当たり）', '火災出火件数（人口10万人当たり）', '火災出火件数（人口10万人当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (107, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K02101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  108, 'building-fire-count-per-100k', '建物火災出火件数（人口10万人当たり）', '建物火災出火件数（人口10万人当たり）', '建物火災出火件数（人口10万人当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (108, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K02103"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  109, 'fire-damage-casualties-per-population', '火災死傷者数（人口10万人当たり）', '火災死傷者数（人口10万人当たり）', '火災死傷者数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (109, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K02203"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  110, 'building-fire-damage-amount-per-person', '建物火災損害額（人口1人当たり）', '建物火災損害額（人口1人当たり）', '建物火災損害額（人口1人当たり）', '円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (110, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K02205"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  111, 'fire-damage-household-count-per-100-building-fires', '火災り災世帯数（建物火災100件当たり）', '火災り災世帯数（建物火災100件当たり）', '火災り災世帯数（建物火災100件当たり）', '世帯', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (111, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K02301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  112, 'fire-damage-casualties-per-accident', '火災死傷者数（建物火災100件当たり）', '火災死傷者数（建物火災100件当たり）', '火災死傷者数（建物火災100件当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (112, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K02303"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  113, 'building-fire-damage-amount-per-building-fire', '建物火災損害額（建物火災1件当たり）', '建物火災損害額（建物火災1件当たり）', '建物火災損害額（建物火災1件当たり）', '万円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (113, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K02306"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  114, 'fire-insurance-new-contracts-per-1000-households', '火災保険住宅物件・一般物件新契約件数（1年）（一般世帯千世帯当たり）', '火災保険住宅物件・一般物件新契約件数（1年）（一般世帯千世帯当たり）', '火災保険住宅物件・一般物件新契約件数（1年）（一般世帯千世帯当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (114, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  115, 'fire-insurance-claims-received-per-1000-households', '火災保険住宅物件・一般物件保険金受取件数（1年）（一般世帯千世帯当たり）', '火災保険住宅物件・一般物件保険金受取件数（1年）（一般世帯千世帯当たり）', '火災保険住宅物件・一般物件保険金受取件数（1年）（一般世帯千世帯当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (115, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10304"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  116, 'fire-insurance-amount-received-per-contract', '火災保険住宅物件・一般物件受取保険金額（1年）（保有契約1件当たり）', '火災保険住宅物件・一般物件受取保険金額（1年）（保有契約1件当たり）', '火災保険住宅物件・一般物件受取保険金額（1年）（保有契約1件当たり）', '万円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (116, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10305"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  117, 'fire-insurance-new-contracts-per-1000-households-alt', '火災保険住宅物件・一般物件新契約件数（一般世帯千世帯当たり）', '火災保険住宅物件・一般物件新契約件数（一般世帯千世帯当たり）', '火災保険住宅物件・一般物件新契約件数（一般世帯千世帯当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (117, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10306"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  118, 'fire-insurance-claims-received-per-1000-households-alt', '火災保険住宅物件・一般物件保険金受取件数（一般世帯千世帯当たり）', '火災保険住宅物件・一般物件保険金受取件数（一般世帯千世帯当たり）', '火災保険住宅物件・一般物件保険金受取件数（一般世帯千世帯当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (118, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10307"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  119, 'fire-insurance-amount-received-per-contract-alt', '火災保険住宅物件・一般物件受取保険金額（保有契約1件当たり）', '火災保険住宅物件・一般物件受取保険金額（保有契約1件当たり）', '火災保険住宅物件・一般物件受取保険金額（保有契約1件当たり）', '万円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (119, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10308"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  120, 'grade-separated-pedestrian-crossings-per-1000-km', '立体横断施設数（道路実延長千km当たり）', '立体横断施設数（道路実延長千km当たり）', '立体横断施設数（道路実延長千km当たり）', '所', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (120, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K03102"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  121, 'theft-offenses-recognized-per-1000', '窃盗犯認知件数（人口千人当たり）', '窃盗犯認知件数（人口千人当たり）', '窃盗犯認知件数（人口千人当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (121, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K06104"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  122, 'theft-criminal-arrest-rate', '窃盗犯検挙率', '窃盗犯検挙率', '窃盗犯検挙率', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (122, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K06204"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  123, 'juvenile-theft-offender-arrests-per-1000-14-19', '少年窃盗犯検挙人員（14～19歳人口千人当たり）', '少年窃盗犯検挙人員（14～19歳人口千人当たり）', '少年窃盗犯検挙人員（14～19歳人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (123, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K06304"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  124, 'special-law-criminal-arrest-count-per-population', '特別法犯検挙件数（人口10万人当たり）', '特別法犯検挙件数（人口10万人当たり）', '特別法犯検挙件数（人口10万人当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (124, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K06501"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  125, 'drug-enforcement-arrest-count-per-population', '覚醒剤取締検挙件数（人口10万人当たり）', '覚醒剤取締検挙件数（人口10万人当たり）', '覚醒剤取締検挙件数（人口10万人当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (125, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K06503"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  126, 'disaster-damage-amount-per-person', '災害被害額（人口1人当たり）', '災害被害額（人口1人当たり）', '災害被害額（人口1人当たり）', '円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (126, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K07105"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  127, 'accidental-deaths-per-100k', '不慮の事故による死亡者数（人口10万人当たり）', '不慮の事故による死亡者数（人口10万人当たり）', '不慮の事故による死亡者数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (127, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K08101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  128, 'pollution-complaints-received-per-100k', '公害苦情受付件数（人口10万人当たり）', '公害苦情受付件数（人口10万人当たり）', '公害苦情受付件数（人口10万人当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (128, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K09201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  129, 'smoke-emitting-facility-count', 'ばい煙発生施設数', 'ばい煙発生施設数', 'ばい煙発生施設数', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (129, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K09210"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  130, 'general-dust-emitting-facility-count', '一般粉じん発生施設数', '一般粉じん発生施設数', '一般粉じん発生施設数', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (130, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K09211"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  131, 'specific-business-sites-under-water-pollution-control-act', '水質汚濁防止法上の特定事業場数', '水質汚濁防止法上の特定事業場数', '水質汚濁防止法上の特定事業場数', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (131, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K09220"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  132, 'traffic-accident-count-per-population', '交通事故発生件数（人口10万人当たり）', '交通事故発生件数（人口10万人当たり）', '交通事故発生件数（人口10万人当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (132, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K04101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  133, 'traffic-accident-count-per-1000-km', '交通事故発生件数（道路実延長千km当たり）', '交通事故発生件数（道路実延長千km当たり）', '交通事故発生件数（道路実延長千km当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (133, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K04102"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  134, 'traffic-accident-casualties-per-population', '交通事故死傷者数（人口10万人当たり）', '交通事故死傷者数（人口10万人当たり）', '交通事故死傷者数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (134, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K04105"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  135, 'traffic-accident-deaths-per-100k', '交通事故死者数（人口10万人当たり）', '交通事故死者数（人口10万人当たり）', '交通事故死者数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (135, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K04106"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  136, 'traffic-accident-injuries-per-100k', '交通事故負傷者数（人口10万人当たり）', '交通事故負傷者数（人口10万人当たり）', '交通事故負傷者数（人口10万人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (136, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K04107"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  137, 'traffic-accident-casualties-per-100-accidents', '交通事故死傷者数（交通事故100件当たり）', '交通事故死傷者数（交通事故100件当たり）', '交通事故死傷者数（交通事故100件当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (137, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K04201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  138, 'traffic-accident-deaths-per-100-accidents', '交通事故死者数（交通事故100件当たり）', '交通事故死者数（交通事故100件当たり）', '交通事故死者数（交通事故100件当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (138, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K04202"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  139, 'road-traffic-law-violation-arrest-count-per-population', '道路交通法違反検挙件数（人口千人当たり）', '道路交通法違反検挙件数（人口千人当たり）', '道路交通法違反検挙件数（人口千人当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (139, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K04301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  140, 'police-officer-count-per-population', '警察官数（人口千人当たり）', '警察官数（人口千人当たり）', '警察官数（人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (140, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K05103"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  141, 'penal-code-offenses-recognized-per-1000', '刑法犯認知件数（人口千人当たり）', '刑法犯認知件数（人口千人当たり）', '刑法犯認知件数（人口千人当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (141, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K06101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  142, 'criminal-arrest-rate', '刑法犯検挙率', '刑法犯検挙率', '刑法犯検挙率', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (142, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K06201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  143, 'juvenile-criminal-arrest-person-per-population', '少年刑法犯検挙人員（14～19歳人口千人当たり）', '少年刑法犯検挙人員（14～19歳人口千人当たり）', '少年刑法犯検挙人員（14～19歳人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (143, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K06301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  144, 'criminal-recognition-count-of-serious-crime-rate', '刑法犯認知件数に占める凶悪犯の割合', '刑法犯認知件数に占める凶悪犯の割合', '刑法犯認知件数に占める凶悪犯の割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (144, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K06401"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  145, 'criminal-recognition-count-of-violent-crime-rate', '刑法犯認知件数に占める粗暴犯の割合', '刑法犯認知件数に占める粗暴犯の割合', '刑法犯認知件数に占める粗暴犯の割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (145, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K06402"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  146, 'criminal-recognition-count-of-theft-crime-rate', '刑法犯認知件数に占める窃盗犯の割合', '刑法犯認知件数に占める窃盗犯の割合', '刑法犯認知件数に占める窃盗犯の割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (146, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K06403"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  147, 'criminal-recognition-count-of-prostitution-crime-rate', '刑法犯認知件数に占める風俗犯の割合', '刑法犯認知件数に占める風俗犯の割合', '刑法犯認知件数に占める風俗犯の割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (147, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K06405"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  148, 'private-life-insurance-contracts-per-1000', '民間生命保険保有契約件数（人口千人当たり）', '民間生命保険保有契約件数（人口千人当たり）', '民間生命保険保有契約件数（人口千人当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (148, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  149, 'private-life-insurance-amount-per-contract', '民間生命保険保険金額（保有契約1件当たり）', '民間生命保険保険金額（保有契約1件当たり）', '民間生命保険保険金額（保有契約1件当たり）', '万円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (149, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10105"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  150, 'private-life-insurance-contract-amount-per-household', '民間生命保険保険金額（1世帯当たり）', '民間生命保険保険金額（1世帯当たり）', '民間生命保険保険金額（1世帯当たり）', '万円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (150, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10107"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  151, 'simple-life-insurance-contract-count-per-population', '簡易生命保険保有契約件数（人口千人当たり）', '簡易生命保険保有契約件数（人口千人当たり）', '簡易生命保険保有契約件数（人口千人当たり）', '件', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (151, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  152, 'simple-life-insurance-contract-amount-per-contract', '簡易生命保険保有契約保険金額（保有契約1件当たり）', '簡易生命保険保有契約保険金額（保有契約1件当たり）', '簡易生命保険保有契約保険金額（保有契約1件当たり）', '万円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (152, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10203"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  153, 'auto-liability-insurance-amount-received-per-payment', '自動車損害賠償責任保険受取保険金額（支払件数1件当たり）', '自動車損害賠償責任保険受取保険金額（支払件数1件当たり）', '自動車損害賠償責任保険受取保険金額（支払件数1件当たり）', '万円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (153, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10403"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  154, 'private-auto-insurance-penetration-rate-vehicle', '任意自動車保険普及率（車両）', '任意自動車保険普及率（車両）', '任意自動車保険普及率（車両）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (154, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10501"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  155, 'voluntary-auto-insurance-penetration-personal', '任意自動車保険普及率（対人）', '任意自動車保険普及率（対人）', '任意自動車保険普及率（対人）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (155, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10502"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  156, 'voluntary-auto-insurance-penetration-property', '任意自動車保険普及率（対物）', '任意自動車保険普及率（対物）', '任意自動車保険普及率（対物）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (156, 'estat', '{"stats_data_id": "0000010211", "cd_cat01": "#K10503"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  157, 'elementary-school-count-per-100k-6-11', '小学校数（6～11歳人口10万人当たり）', '小学校数（6～11歳人口10万人当たり）', '小学校数（6～11歳人口10万人当たり）', '校', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (157, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0110101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  158, 'elementary-school-count-per-100km2-habitable', '小学校数（可住地面積100km2当たり）', '小学校数（可住地面積100km2当たり）', '小学校数（可住地面積100km2当たり）', '校', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (158, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0110201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  159, 'public-elementary-school-gym-installation-rate', '公立小学校屋内運動場設置率', '公立小学校屋内運動場設置率', '公立小学校屋内運動場設置率', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (159, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E02601"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  160, 'public-elementary-school-pool-installation-rate', '公立小学校プール設置率', '公立小学校プール設置率', '公立小学校プール設置率', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (160, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E02701"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  161, 'elementary-school-teacher-ratio-male', '小学校教員割合（男）', '小学校教員割合（男）', '小学校教員割合（男）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (161, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E04101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  162, 'elementary-school-students-per-class', '小学校児童数（1学級当たり）', '小学校児童数（1学級当たり）', '小学校児童数（1学級当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (162, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0510201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  163, 'elementary-school-students-per-teacher', '小学校児童数（教員1人当たり）', '小学校児童数（教員1人当たり）', '小学校児童数（教員1人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (163, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0510301"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  164, 'elementary-school-long-absence-ratio-over-30days-per-1000', '小学校長期欠席児童比率（年度間30日以上）（児童千人当たり）', '小学校長期欠席児童比率（年度間30日以上）（児童千人当たり）', '小学校長期欠席児童比率（年度間30日以上）（児童千人当たり）', '‐', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (164, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E09211"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  165, 'elementary-school-long-absence-ratio-nonattendance-over-30days-per-1000', '不登校による小学校長期欠席児童比率（年度間30日以上）（児童千人当たり）', '不登校による小学校長期欠席児童比率（年度間30日以上）（児童千人当たり）', '不登校による小学校長期欠席児童比率（年度間30日以上）（児童千人当たり）', '‐', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (165, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E09213"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  166, 'elementary-school-education-cost-per-student', '小学校教育費（児童1人当たり）', '小学校教育費（児童1人当たり）', '小学校教育費（児童1人当たり）', '円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (166, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E10102"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  167, 'junior-high-school-count-per-100k-12-14', '中学校数（12～14歳人口10万人当たり）', '中学校数（12～14歳人口10万人当たり）', '中学校数（12～14歳人口10万人当たり）', '校', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (167, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0110102"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  168, 'junior-high-school-count-per-100km2-habitable', '中学校数（可住地面積100km2当たり）', '中学校数（可住地面積100km2当たり）', '中学校数（可住地面積100km2当たり）', '校', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (168, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0110202"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  169, 'public-junior-high-school-gym-installation-rate', '公立中学校屋内運動場設置率', '公立中学校屋内運動場設置率', '公立中学校屋内運動場設置率', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (169, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E02602"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  170, 'public-junior-high-school-pool-installation-rate', '公立中学校プール設置率', '公立中学校プール設置率', '公立中学校プール設置率', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (170, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E02702"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  171, 'junior-high-school-teacher-ratio-male', '中学校教員割合（男）', '中学校教員割合（男）', '中学校教員割合（男）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (171, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E04102"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  172, 'junior-high-school-students-per-class', '中学校生徒数（1学級当たり）', '中学校生徒数（1学級当たり）', '中学校生徒数（1学級当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (172, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0510202"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  173, 'junior-high-school-students-per-teacher', '中学校生徒数（教員1人当たり）', '中学校生徒数（教員1人当たり）', '中学校生徒数（教員1人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (173, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0510302"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  174, 'junior-high-school-long-absence-ratio-over-30days-per-1000', '中学校長期欠席生徒比率（年度間30日以上）（生徒千人当たり）', '中学校長期欠席生徒比率（年度間30日以上）（生徒千人当たり）', '中学校長期欠席生徒比率（年度間30日以上）（生徒千人当たり）', '‐', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (174, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E09212"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  175, 'junior-high-school-long-absence-ratio-nonattendance-over-30days-per-1000', '不登校による中学校長期欠席生徒比率（年度間30日以上）（生徒千人当たり）', '不登校による中学校長期欠席生徒比率（年度間30日以上）（生徒千人当たり）', '不登校による中学校長期欠席生徒比率（年度間30日以上）（生徒千人当たり）', '‐', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (175, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E09214"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  176, 'junior-high-school-graduates-advancement-rate', '中学校卒業者の進学率', '中学校卒業者の進学率', '中学校卒業者の進学率', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (176, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E09401"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  177, 'junior-high-school-education-cost-per-student', '中学校教育費（生徒1人当たり）', '中学校教育費（生徒1人当たり）', '中学校教育費（生徒1人当たり）', '円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (177, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E10103"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  178, 'high-school-count-per-100k-15-17', '高等学校数（15～17歳人口10万人当たり）', '高等学校数（15～17歳人口10万人当たり）', '高等学校数（15～17歳人口10万人当たり）', '校', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (178, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0110103"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  179, 'high-school-count-per-100km2-habitable', '高等学校数（可住地面積100km2当たり）', '高等学校数（可住地面積100km2当たり）', '高等学校数（可住地面積100km2当たり）', '校', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (179, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0110203"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  180, 'public-high-school-ratio', '公立高等学校割合', '公立高等学校割合', '公立高等学校割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (180, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E01303"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  181, 'public-high-school-pool-installation-rate', '公立高等学校プール設置率', '公立高等学校プール設置率', '公立高等学校プール設置率', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (181, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E02703"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  182, 'high-school-students-per-teacher', '高等学校生徒数（教員1人当たり）', '高等学校生徒数（教員1人当たり）', '高等学校生徒数（教員1人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (182, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0510303"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  183, 'public-high-school-student-ratio', '公立高等学校生徒比率', '公立高等学校生徒比率', '公立高等学校生徒比率', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (183, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E05203"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  184, 'high-school-graduates-advancement-rate', '高等学校卒業者の進学率', '高等学校卒業者の進学率', '高等学校卒業者の進学率', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (184, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E09402"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  185, 'in-pref-university-entrance-ratio-by-highschool-origin', '出身高校所在地県の県内大学への入学者割合（対大学入学者数）', '出身高校所在地県の県内大学への入学者割合（対大学入学者数）', '出身高校所在地県の県内大学への入学者割合（対大学入学者数）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (185, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0940302"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  186, 'final-education-highschool-old-junior-high-ratio', '最終学歴が高校・旧中卒の者の割合', '最終学歴が高校・旧中卒の者の割合', '最終学歴が高校・旧中卒の者の割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (186, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E09502"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  187, 'high-school-education-cost-fulltime-per-student', '高等学校教育費（全日制）（生徒1人当たり）', '高等学校教育費（全日制）（生徒1人当たり）', '高等学校教育費（全日制）（生徒1人当たり）', '円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (187, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E10104"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  188, 'kindergarten-count-per-100k-3-5', '幼稚園数（3～5歳人口10万人当たり）', '幼稚園数（3～5歳人口10万人当たり）', '幼稚園数（3～5歳人口10万人当たり）', '園', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (188, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0110104"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  189, 'public-kindergarten-ratio', '公立幼稚園割合', '公立幼稚園割合', '公立幼稚園割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (189, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E01304"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  190, 'kindergarten-students-per-teacher', '幼稚園在園者数（教員1人当たり）', '幼稚園在園者数（教員1人当たり）', '幼稚園在園者数（教員1人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (190, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0510304"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  191, 'public-kindergarten-student-ratio', '公立幼稚園在園者比率', '公立幼稚園在園者比率', '公立幼稚園在園者比率', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (191, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E05204"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  192, 'kindergarten-education-diffusion-rate', '教育普及度（幼稚園）', '教育普及度（幼稚園）', '教育普及度（幼稚園）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (192, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0910101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  193, 'kindergarten-education-cost-per-student', '幼稚園教育費（在園者1人当たり）', '幼稚園教育費（在園者1人当たり）', '幼稚園教育費（在園者1人当たり）', '円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (193, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E10101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  194, 'nursery-count-per-100k-0-5', '保育所等数（0～5歳人口10万人当たり）', '保育所等数（0～5歳人口10万人当たり）', '保育所等数（0～5歳人口10万人当たり）', '所', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (194, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0110105"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  195, 'certified-childcare-center-count-per-100k-0-5', '認定こども園数（0～5歳人口10万人当たり）', '認定こども園数（0～5歳人口10万人当たり）', '認定こども園数（0～5歳人口10万人当たり）', '園', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (195, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0110106"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  196, 'public-nursery-ratio', '公営保育所等割合', '公営保育所等割合', '公営保育所等割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (196, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E01305"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  197, 'nursery-children-per-nursery-teacher', '保育所等在所児数（保育士1人当たり）', '保育所等在所児数（保育士1人当たり）', '保育所等在所児数（保育士1人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (197, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0510305"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  198, 'public-nursery-student-ratio', '公営保育所等在所児比率', '公営保育所等在所児比率', '公営保育所等在所児比率', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (198, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E05205"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  199, 'nursery-education-diffusion-rate', '教育普及度（保育所等）', '教育普及度（保育所等）', '教育普及度（保育所等）', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (199, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0910102"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  200, 'nursery-utilization-rate', '保育所等利用率', '保育所等利用率', '保育所等利用率', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (200, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0910402"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  201, 'certified-childcare-center-education-cost-per-student', '幼保連携型認定こども園教育費（在園者1人当たり）', '幼保連携型認定こども園教育費（在園者1人当たり）', '幼保連携型認定こども園教育費（在園者1人当たり）', '円', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (201, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E10105"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  202, 'compulsory-education-school-count-per-100k-6-14', '義務教育学校数（6～14歳人口10万人当たり）', '義務教育学校数（6～14歳人口10万人当たり）', '義務教育学校数（6～14歳人口10万人当たり）', '校', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (202, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0110107"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  203, 'secondary-education-school-count-per-100k-12-17', '中等教育学校数（12～17歳人口10万人当たり）', '中等教育学校数（12～17歳人口10万人当たり）', '中等教育学校数（12～17歳人口10万人当たり）', '校', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (203, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0110108"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  204, 'final-education-elementary-junior-high-ratio', '最終学歴が小学・中学卒の者の割合', '最終学歴が小学・中学卒の者の割合', '最終学歴が小学・中学卒の者の割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (204, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E09501"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  205, 'final-education-junior-college-technical-college-ratio', '最終学歴が短大・高専卒の者の割合', '最終学歴が短大・高専卒の者の割合', '最終学歴が短大・高専卒の者の割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (205, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E09503"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  206, 'junior-college-count-per-100k', '短期大学数（人口10万人当たり）', '短期大学数（人口10万人当たり）', '短期大学数（人口10万人当たり）', '校', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (206, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0610101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  207, 'university-count-per-100k', '大学数（人口10万人当たり）', '大学数（人口10万人当たり）', '大学数（人口10万人当たり）', '校', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (207, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0610102"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  208, 'junior-college-capacity-index', '短期大学収容力指数', '短期大学収容力指数', '短期大学収容力指数', '‐', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (208, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0610201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  209, 'university-capacity-index', '大学収容力指数', '大学収容力指数', '大学収容力指数', '‐', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (209, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0610202"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  210, 'national-university-student-ratio', '国立大学学生数割合', '国立大学学生数割合', '国立大学学生数割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (210, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0620401"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  211, 'public-university-student-ratio', '公立大学学生数割合', '公立大学学生数割合', '公立大学学生数割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (211, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0620402"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  212, 'private-university-student-ratio', '私立大学学生数割合', '私立大学学生数割合', '私立大学学生数割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (212, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E0620403"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  213, 'final-education-university-graduate-school-ratio', '最終学歴が大学・大学院卒の者の割合', '最終学歴が大学・大学院卒の者の割合', '最終学歴が大学・大学院卒の者の割合', '％', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (213, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E09504"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  214, 'specialized-school-count-per-100k', '専修学校数（人口10万人当たり）', '専修学校数（人口10万人当たり）', '専修学校数（人口10万人当たり）', '校', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (214, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E08101"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  215, 'miscellaneous-school-count-per-100k', '各種学校数（人口10万人当たり）', '各種学校数（人口10万人当たり）', '各種学校数（人口10万人当たり）', '校', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (215, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E08102"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  216, 'specialized-school-students-per-1000', '専修学校生徒数（人口千人当たり）', '専修学校生徒数（人口千人当たり）', '専修学校生徒数（人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (216, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E08201"}');

INSERT OR IGNORE INTO ranking_items (
  id, ranking_key, label, name, description, unit, data_source_id,
  ranking_direction, conversion_factor, decimal_places, is_active
) VALUES (
  217, 'miscellaneous-school-students-per-1000', '各種学校生徒数（人口千人当たり）', '各種学校生徒数（人口千人当たり）', '各種学校生徒数（人口千人当たり）', '人', 'estat',
  'desc', 1, 0, 1
);

INSERT OR IGNORE INTO data_source_metadata (ranking_item_id, data_source_id, metadata)
VALUES (217, 'estat', '{"stats_data_id": "0000010205", "cd_cat01": "#E08202"}');


-- Ranking Groups
INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  1, 'prefecture-finance-0', 'prefecture-finance', '財政健全性指標', '財政の健全性を示す指標', '📊', 0
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  2, 'prefecture-finance-1', 'prefecture-finance', '歳入構成', '財政収入の構成要素', '💰', 1
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  3, 'prefecture-finance-other', 'prefecture-finance', 'その他', 'その他の指標', '📄', 999
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  4, 'prefecture-finance-3', 'prefecture-finance', '歳出構成（性質別）', '性質別の歳出構成', '📋', 3
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  5, 'prefecture-finance-4', 'prefecture-finance', '1人当たり指標', '人口1人当たりの財政指標', '👤', 4
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  6, 'prefecture-finance-2', 'prefecture-finance', '歳出構成（目的別）', '目的別の歳出構成', '🏛️', 2
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  7, 'social-welfare-0', 'social-welfare', '生活保護', '生活保護に関する指標', '🤝', 0
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  8, 'social-welfare-3', 'social-welfare', '障害者福祉', '障害者福祉に関する指標', '♿', 3
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  9, 'social-welfare-1', 'social-welfare', '高齢者福祉', '高齢者福祉に関する指標', '👴', 1
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  10, 'social-welfare-2', 'social-welfare', '児童福祉', '児童福祉に関する指標', '👶', 2
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  11, 'social-welfare-other', 'social-welfare', 'その他', 'その他の指標', '📄', 999
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  12, 'public-safety-0', 'public-safety', '消防・火災', '消防と火災に関する指標', '🚒', 0
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  13, 'public-safety-other', 'public-safety', 'その他', 'その他の指標', '📄', 999
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  14, 'public-safety-1', 'public-safety', '交通事故', '交通事故に関する指標', '🚗', 1
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  15, 'public-safety-2', 'public-safety', '治安・犯罪', '治安と犯罪に関する指標', '👮', 2
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  16, 'public-safety-3', 'public-safety', '保険', '保険に関する指標', '🛡️', 3
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  17, 'education-0', 'education', '小学校', '小学校に関する指標', '🏫', 0
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  18, 'education-1', 'education', '中学校', '中学校に関する指標', '🎓', 1
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  19, 'education-2', 'education', '高等学校', '高等学校に関する指標', '📚', 2
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  20, 'education-3', 'education', '幼稚園', '幼稚園に関する指標', '🧸', 3
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  21, 'education-4', 'education', '保育施設', '保育施設に関する指標', '👶', 4
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  22, 'education-other', 'education', 'その他', 'その他の指標', '📄', 999
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  23, 'education-5', 'education', '高等教育', '高等教育に関する指標', '🎓', 5
);

INSERT OR IGNORE INTO ranking_groups (
  id, group_key, subcategory_id, name, description, icon, display_order
) VALUES (
  24, 'education-6', 'education', 'その他教育機関', 'その他の教育機関', '📖', 6
);


-- Ranking Group Items
INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (1, 1, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (1, 2, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (1, 3, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (2, 4, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (2, 5, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (2, 6, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (2, 7, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 8, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 9, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 10, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 11, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 12, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 13, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 14, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 15, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 16, 9, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 17, 10, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 18, 11, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 19, 12, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 20, 13, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 21, 14, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (3, 22, 15, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (4, 23, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (4, 24, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (4, 25, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (4, 26, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (5, 27, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (5, 28, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (5, 29, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (5, 30, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (5, 31, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (5, 32, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (5, 33, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (5, 34, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 35, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 36, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 37, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 38, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 39, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 40, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 41, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 42, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 43, 9, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 44, 10, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 45, 11, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 46, 12, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 47, 13, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 48, 14, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 49, 15, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (6, 50, 16, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (7, 51, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (7, 52, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (7, 53, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (7, 54, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (7, 55, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (7, 56, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (7, 57, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (7, 58, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (7, 59, 9, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (7, 60, 10, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (7, 61, 11, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (7, 62, 12, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 63, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 64, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 65, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 66, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 67, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 68, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 69, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 70, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 71, 9, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 72, 10, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 73, 11, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 74, 12, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 75, 13, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (8, 76, 14, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (9, 77, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (9, 78, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (9, 79, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (9, 80, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (9, 81, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (9, 82, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (9, 83, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (9, 84, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (9, 85, 9, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (9, 86, 10, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (9, 87, 11, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (9, 88, 12, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (9, 89, 13, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (10, 90, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (10, 91, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (10, 92, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (10, 93, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (10, 94, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (11, 95, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (11, 96, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (11, 97, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (11, 98, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 99, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 100, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 101, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 102, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 103, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 104, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 105, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 106, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 107, 9, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 108, 10, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 109, 11, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 110, 12, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 111, 13, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 112, 14, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 113, 15, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 114, 16, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 115, 17, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 116, 18, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 117, 19, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 118, 20, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (12, 119, 21, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (13, 120, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (13, 121, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (13, 122, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (13, 123, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (13, 124, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (13, 125, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (13, 126, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (13, 127, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (13, 128, 9, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (13, 129, 10, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (13, 130, 11, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (13, 131, 12, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (14, 132, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (14, 133, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (14, 134, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (14, 135, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (14, 136, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (14, 137, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (14, 138, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (14, 139, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (15, 140, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (15, 141, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (15, 142, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (15, 143, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (15, 144, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (15, 145, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (15, 146, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (15, 147, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (16, 148, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (16, 149, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (16, 150, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (16, 151, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (16, 152, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (16, 153, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (16, 154, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (16, 155, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (16, 156, 9, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (17, 157, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (17, 158, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (17, 159, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (17, 160, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (17, 161, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (17, 162, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (17, 163, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (17, 164, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (17, 165, 9, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (17, 166, 10, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (18, 167, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (18, 168, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (18, 169, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (18, 170, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (18, 171, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (18, 172, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (18, 173, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (18, 174, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (18, 175, 9, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (18, 176, 10, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (18, 177, 11, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (19, 178, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (19, 179, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (19, 180, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (19, 181, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (19, 182, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (19, 183, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (19, 184, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (19, 185, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (19, 186, 9, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (19, 187, 10, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (20, 188, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (20, 189, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (20, 190, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (20, 191, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (20, 192, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (20, 193, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (21, 194, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (21, 195, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (21, 196, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (21, 197, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (21, 198, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (21, 199, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (21, 200, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (21, 201, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (22, 202, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (22, 203, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (22, 204, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (22, 205, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (23, 206, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (23, 207, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (23, 208, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (23, 209, 4, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (23, 210, 5, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (23, 211, 6, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (23, 212, 7, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (23, 213, 8, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (24, 214, 1, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (24, 215, 2, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (24, 216, 3, 0);

INSERT OR IGNORE INTO ranking_group_items (group_id, ranking_item_id, display_order, is_featured)
VALUES (24, 217, 4, 0);

