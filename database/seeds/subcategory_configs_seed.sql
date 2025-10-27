-- サブカテゴリ設定テーブルの作成とデータ投入
-- 作成日: 2025-10-27

-- 1. subcategory_configs テーブルを作成
CREATE TABLE IF NOT EXISTS subcategory_configs (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  default_ranking_key TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. categories.jsonのデータを投入
-- 国土・気象
INSERT INTO subcategory_configs (id, category_id, name, description) VALUES
  ('land-area', 'landweather', '土地面積', NULL),
  ('land-use', 'landweather', '土地利用', NULL),
  ('natural-environment', 'landweather', '自然環境', NULL),
  ('weather-climate', 'landweather', '気象・気候', NULL);

-- 人口・世帯
INSERT INTO subcategory_configs (id, category_id, name, description) VALUES
  ('basic-population', 'population', '総人口', NULL),
  ('population-movement', 'population', '人口移動', NULL),
  ('population-composition', 'population', '人口構成', NULL),
  ('marriage', 'population', '婚姻・家族', NULL),
  ('households', 'population', '世帯', NULL),
  ('birth-death', 'population', '出生・死亡', NULL);

-- 労働・賃金
INSERT INTO subcategory_configs (id, category_id, name, description) VALUES
  ('wages-working-conditions', 'laborwage', '賃金・労働条件', NULL),
  ('labor-force-structure', 'laborwage', '労働力構造', NULL),
  ('industrial-structure', 'laborwage', '産業構造', NULL),
  ('commuting-employment', 'laborwage', '通勤・就職', NULL),
  ('labor-disputes', 'laborwage', '労働争議', NULL),
  ('job-seeking-placement', 'laborwage', '求職・求人', NULL),
  ('industry-occupation', 'laborwage', '産業・職業別', NULL),
  ('employment-type', 'laborwage', '雇用形態', NULL);

-- 農林水産業
INSERT INTO subcategory_configs (id, category_id, name, description) VALUES
  ('agricultural-household', 'agriculture', '農業世帯', NULL);

-- 鉱工業
INSERT INTO subcategory_configs (id, category_id, name, description) VALUES
  ('manufacturing', 'miningindustry', '製造業', NULL);

-- 商業・サービス業
INSERT INTO subcategory_configs (id, category_id, name, description) VALUES
  ('commerce-service-industry', 'commercial', '商業・サービス産業', NULL),
  ('commercial-facilities', 'commercial', '商業施設', NULL);

-- 企業・家計・経済
INSERT INTO subcategory_configs (id, category_id, name, description) VALUES
  ('worker-household-income', 'economy', '労働者世帯収入', NULL),
  ('household-economy', 'economy', '家計', NULL);

-- 確認用クエリ
SELECT id, category_id, name FROM subcategory_configs ORDER BY category_id, id;
