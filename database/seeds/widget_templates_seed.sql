-- ウィジェットテンプレートシードデータ
-- 再利用可能なウィジェット定義
-- 作成日: 2025-01-XX

-- デフォルトメトリックカード
INSERT INTO widget_templates (
  id, template_key, name, widget_type, default_config
) VALUES (
  1, 'metric-default', 'デフォルトメトリックカード', 'metric', '{"size": "large"}'
);

-- 小メトリックカード
INSERT INTO widget_templates (
  id, template_key, name, widget_type, default_config
) VALUES (
  2, 'metric-small', '小メトリックカード', 'metric', '{"size": "small"}'
);

-- デフォルト折れ線グラフ
INSERT INTO widget_templates (
  id, template_key, name, widget_type, default_config
) VALUES (
  3, 'line-default', 'デフォルト折れ線グラフ', 'line-chart', '{"height": 300}'
);

-- 高折れ線グラフ
INSERT INTO widget_templates (
  id, template_key, name, widget_type, default_config
) VALUES (
  4, 'line-tall', '高折れ線グラフ', 'line-chart', '{"height": 400}'
);

-- デフォルト棒グラフ
INSERT INTO widget_templates (
  id, template_key, name, widget_type, default_config
) VALUES (
  5, 'bar-default', 'デフォルト棒グラフ', 'bar-chart', '{"height": 300}'
);

-- 広棒グラフ
INSERT INTO widget_templates (
  id, template_key, name, widget_type, default_config
) VALUES (
  6, 'bar-wide', '広棒グラフ', 'bar-chart', '{"height": 300, "horizontal": true}'
);

-- デフォルトエリアチャート
INSERT INTO widget_templates (
  id, template_key, name, widget_type, default_config
) VALUES (
  7, 'area-default', 'デフォルトエリアチャート', 'area-chart', '{"height": 300}'
);

-- 積層エリアチャート
INSERT INTO widget_templates (
  id, template_key, name, widget_type, default_config
) VALUES (
  8, 'area-stacked', '積層エリアチャート', 'area-chart', '{"height": 300, "stacked": true}'
);

