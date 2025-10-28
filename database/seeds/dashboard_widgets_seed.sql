-- ダッシュボードウィジェットシードデータ
-- 各ダッシュボードに3-5個のウィジェットを定義
-- 作成日: 2025-01-XX

-- 土地面積 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  1, 1, 'metric',
  'land-area-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 土地面積 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  2, 1, 'metric',
  'land-area-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 土地面積 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  3, 1, 'metric',
  'land-area-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 土地面積 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  4, 1, 'line-chart',
  'land-area-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 土地面積 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  5, 1, 'bar-chart',
  'land-area-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 土地面積 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  6, 2, 'metric',
  'land-area-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 土地面積 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  7, 2, 'metric',
  'land-area-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 土地面積 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  8, 2, 'metric',
  'land-area-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 土地面積 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  9, 2, 'line-chart',
  'land-area-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 土地面積 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  10, 2, 'bar-chart',
  'land-area-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 土地利用 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  11, 3, 'metric',
  'land-use-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 土地利用 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  12, 3, 'metric',
  'land-use-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 土地利用 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  13, 3, 'metric',
  'land-use-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 土地利用 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  14, 3, 'line-chart',
  'land-use-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 土地利用 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  15, 3, 'bar-chart',
  'land-use-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 土地利用 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  16, 4, 'metric',
  'land-use-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 土地利用 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  17, 4, 'metric',
  'land-use-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 土地利用 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  18, 4, 'metric',
  'land-use-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 土地利用 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  19, 4, 'line-chart',
  'land-use-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 土地利用 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  20, 4, 'bar-chart',
  'land-use-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 自然環境 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  21, 5, 'metric',
  'natural-environment-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 自然環境 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  22, 5, 'metric',
  'natural-environment-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 自然環境 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  23, 5, 'metric',
  'natural-environment-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 自然環境 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  24, 5, 'line-chart',
  'natural-environment-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 自然環境 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  25, 5, 'bar-chart',
  'natural-environment-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 自然環境 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  26, 6, 'metric',
  'natural-environment-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 自然環境 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  27, 6, 'metric',
  'natural-environment-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 自然環境 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  28, 6, 'metric',
  'natural-environment-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 自然環境 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  29, 6, 'line-chart',
  'natural-environment-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 自然環境 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  30, 6, 'bar-chart',
  'natural-environment-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 気象・気候 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  31, 7, 'metric',
  'weather-climate-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 気象・気候 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  32, 7, 'metric',
  'weather-climate-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 気象・気候 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  33, 7, 'metric',
  'weather-climate-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 気象・気候 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  34, 7, 'line-chart',
  'weather-climate-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 気象・気候 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  35, 7, 'bar-chart',
  'weather-climate-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 気象・気候 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  36, 8, 'metric',
  'weather-climate-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 気象・気候 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  37, 8, 'metric',
  'weather-climate-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 気象・気候 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  38, 8, 'metric',
  'weather-climate-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 気象・気候 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  39, 8, 'line-chart',
  'weather-climate-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 気象・気候 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  40, 8, 'bar-chart',
  'weather-climate-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 総人口 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  41, 9, 'metric',
  'basic-population-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 総人口 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  42, 9, 'metric',
  'basic-population-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 総人口 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  43, 9, 'metric',
  'basic-population-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 総人口 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  44, 9, 'line-chart',
  'basic-population-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 総人口 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  45, 9, 'bar-chart',
  'basic-population-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 総人口 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  46, 10, 'metric',
  'basic-population-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 総人口 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  47, 10, 'metric',
  'basic-population-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 総人口 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  48, 10, 'metric',
  'basic-population-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 総人口 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  49, 10, 'line-chart',
  'basic-population-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 総人口 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  50, 10, 'bar-chart',
  'basic-population-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 人口移動 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  51, 11, 'metric',
  'population-movement-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 人口移動 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  52, 11, 'metric',
  'population-movement-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 人口移動 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  53, 11, 'metric',
  'population-movement-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 人口移動 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  54, 11, 'line-chart',
  'population-movement-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 人口移動 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  55, 11, 'bar-chart',
  'population-movement-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 人口移動 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  56, 12, 'metric',
  'population-movement-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 人口移動 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  57, 12, 'metric',
  'population-movement-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 人口移動 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  58, 12, 'metric',
  'population-movement-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 人口移動 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  59, 12, 'line-chart',
  'population-movement-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 人口移動 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  60, 12, 'bar-chart',
  'population-movement-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 人口構成 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  61, 13, 'metric',
  'population-composition-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 人口構成 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  62, 13, 'metric',
  'population-composition-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 人口構成 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  63, 13, 'metric',
  'population-composition-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 人口構成 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  64, 13, 'line-chart',
  'population-composition-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 人口構成 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  65, 13, 'bar-chart',
  'population-composition-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 人口構成 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  66, 14, 'metric',
  'population-composition-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 人口構成 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  67, 14, 'metric',
  'population-composition-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 人口構成 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  68, 14, 'metric',
  'population-composition-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 人口構成 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  69, 14, 'line-chart',
  'population-composition-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 人口構成 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  70, 14, 'bar-chart',
  'population-composition-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 婚姻・家族 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  71, 15, 'metric',
  'marriage-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 婚姻・家族 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  72, 15, 'metric',
  'marriage-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 婚姻・家族 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  73, 15, 'metric',
  'marriage-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 婚姻・家族 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  74, 15, 'line-chart',
  'marriage-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 婚姻・家族 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  75, 15, 'bar-chart',
  'marriage-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 婚姻・家族 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  76, 16, 'metric',
  'marriage-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 婚姻・家族 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  77, 16, 'metric',
  'marriage-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 婚姻・家族 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  78, 16, 'metric',
  'marriage-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 婚姻・家族 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  79, 16, 'line-chart',
  'marriage-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 婚姻・家族 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  80, 16, 'bar-chart',
  'marriage-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 世帯 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  81, 17, 'metric',
  'households-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 世帯 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  82, 17, 'metric',
  'households-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 世帯 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  83, 17, 'metric',
  'households-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 世帯 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  84, 17, 'line-chart',
  'households-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 世帯 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  85, 17, 'bar-chart',
  'households-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 世帯 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  86, 18, 'metric',
  'households-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 世帯 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  87, 18, 'metric',
  'households-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 世帯 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  88, 18, 'metric',
  'households-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 世帯 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  89, 18, 'line-chart',
  'households-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 世帯 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  90, 18, 'bar-chart',
  'households-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 出生・死亡 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  91, 19, 'metric',
  'birth-death-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 出生・死亡 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  92, 19, 'metric',
  'birth-death-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 出生・死亡 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  93, 19, 'metric',
  'birth-death-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 出生・死亡 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  94, 19, 'line-chart',
  'birth-death-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 出生・死亡 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  95, 19, 'bar-chart',
  'birth-death-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 出生・死亡 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  96, 20, 'metric',
  'birth-death-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 出生・死亡 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  97, 20, 'metric',
  'birth-death-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 出生・死亡 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  98, 20, 'metric',
  'birth-death-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 出生・死亡 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  99, 20, 'line-chart',
  'birth-death-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 出生・死亡 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  100, 20, 'bar-chart',
  'birth-death-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 賃金・労働条件 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  101, 21, 'metric',
  'wages-working-conditions-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 賃金・労働条件 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  102, 21, 'metric',
  'wages-working-conditions-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 賃金・労働条件 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  103, 21, 'metric',
  'wages-working-conditions-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 賃金・労働条件 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  104, 21, 'line-chart',
  'wages-working-conditions-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 賃金・労働条件 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  105, 21, 'bar-chart',
  'wages-working-conditions-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 賃金・労働条件 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  106, 22, 'metric',
  'wages-working-conditions-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 賃金・労働条件 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  107, 22, 'metric',
  'wages-working-conditions-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 賃金・労働条件 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  108, 22, 'metric',
  'wages-working-conditions-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 賃金・労働条件 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  109, 22, 'line-chart',
  'wages-working-conditions-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 賃金・労働条件 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  110, 22, 'bar-chart',
  'wages-working-conditions-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 労働力構造 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  111, 23, 'metric',
  'labor-force-structure-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 労働力構造 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  112, 23, 'metric',
  'labor-force-structure-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 労働力構造 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  113, 23, 'metric',
  'labor-force-structure-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 労働力構造 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  114, 23, 'line-chart',
  'labor-force-structure-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 労働力構造 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  115, 23, 'bar-chart',
  'labor-force-structure-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 労働力構造 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  116, 24, 'metric',
  'labor-force-structure-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 労働力構造 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  117, 24, 'metric',
  'labor-force-structure-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 労働力構造 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  118, 24, 'metric',
  'labor-force-structure-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 労働力構造 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  119, 24, 'line-chart',
  'labor-force-structure-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 労働力構造 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  120, 24, 'bar-chart',
  'labor-force-structure-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 産業構造 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  121, 25, 'metric',
  'industrial-structure-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 産業構造 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  122, 25, 'metric',
  'industrial-structure-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 産業構造 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  123, 25, 'metric',
  'industrial-structure-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 産業構造 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  124, 25, 'line-chart',
  'industrial-structure-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 産業構造 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  125, 25, 'bar-chart',
  'industrial-structure-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 産業構造 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  126, 26, 'metric',
  'industrial-structure-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 産業構造 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  127, 26, 'metric',
  'industrial-structure-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 産業構造 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  128, 26, 'metric',
  'industrial-structure-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 産業構造 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  129, 26, 'line-chart',
  'industrial-structure-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 産業構造 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  130, 26, 'bar-chart',
  'industrial-structure-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 通勤・就職 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  131, 27, 'metric',
  'commuting-employment-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 通勤・就職 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  132, 27, 'metric',
  'commuting-employment-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 通勤・就職 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  133, 27, 'metric',
  'commuting-employment-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 通勤・就職 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  134, 27, 'line-chart',
  'commuting-employment-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 通勤・就職 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  135, 27, 'bar-chart',
  'commuting-employment-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 通勤・就職 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  136, 28, 'metric',
  'commuting-employment-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 通勤・就職 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  137, 28, 'metric',
  'commuting-employment-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 通勤・就職 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  138, 28, 'metric',
  'commuting-employment-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 通勤・就職 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  139, 28, 'line-chart',
  'commuting-employment-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 通勤・就職 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  140, 28, 'bar-chart',
  'commuting-employment-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 労働争議 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  141, 29, 'metric',
  'labor-disputes-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 労働争議 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  142, 29, 'metric',
  'labor-disputes-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 労働争議 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  143, 29, 'metric',
  'labor-disputes-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 労働争議 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  144, 29, 'line-chart',
  'labor-disputes-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 労働争議 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  145, 29, 'bar-chart',
  'labor-disputes-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 労働争議 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  146, 30, 'metric',
  'labor-disputes-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 労働争議 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  147, 30, 'metric',
  'labor-disputes-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 労働争議 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  148, 30, 'metric',
  'labor-disputes-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 労働争議 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  149, 30, 'line-chart',
  'labor-disputes-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 労働争議 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  150, 30, 'bar-chart',
  'labor-disputes-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 求職・求人 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  151, 31, 'metric',
  'job-seeking-placement-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 求職・求人 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  152, 31, 'metric',
  'job-seeking-placement-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 求職・求人 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  153, 31, 'metric',
  'job-seeking-placement-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 求職・求人 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  154, 31, 'line-chart',
  'job-seeking-placement-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 求職・求人 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  155, 31, 'bar-chart',
  'job-seeking-placement-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 求職・求人 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  156, 32, 'metric',
  'job-seeking-placement-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 求職・求人 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  157, 32, 'metric',
  'job-seeking-placement-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 求職・求人 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  158, 32, 'metric',
  'job-seeking-placement-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 求職・求人 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  159, 32, 'line-chart',
  'job-seeking-placement-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 求職・求人 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  160, 32, 'bar-chart',
  'job-seeking-placement-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 産業・職業別 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  161, 33, 'metric',
  'industry-occupation-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 産業・職業別 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  162, 33, 'metric',
  'industry-occupation-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 産業・職業別 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  163, 33, 'metric',
  'industry-occupation-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 産業・職業別 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  164, 33, 'line-chart',
  'industry-occupation-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 産業・職業別 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  165, 33, 'bar-chart',
  'industry-occupation-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 産業・職業別 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  166, 34, 'metric',
  'industry-occupation-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 産業・職業別 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  167, 34, 'metric',
  'industry-occupation-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 産業・職業別 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  168, 34, 'metric',
  'industry-occupation-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 産業・職業別 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  169, 34, 'line-chart',
  'industry-occupation-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 産業・職業別 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  170, 34, 'bar-chart',
  'industry-occupation-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 雇用形態 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  171, 35, 'metric',
  'employment-type-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 雇用形態 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  172, 35, 'metric',
  'employment-type-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 雇用形態 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  173, 35, 'metric',
  'employment-type-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 雇用形態 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  174, 35, 'line-chart',
  'employment-type-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 雇用形態 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  175, 35, 'bar-chart',
  'employment-type-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 雇用形態 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  176, 36, 'metric',
  'employment-type-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 雇用形態 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  177, 36, 'metric',
  'employment-type-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 雇用形態 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  178, 36, 'metric',
  'employment-type-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 雇用形態 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  179, 36, 'line-chart',
  'employment-type-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 雇用形態 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  180, 36, 'bar-chart',
  'employment-type-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 農業世帯 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  181, 37, 'metric',
  'agricultural-household-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 農業世帯 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  182, 37, 'metric',
  'agricultural-household-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 農業世帯 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  183, 37, 'metric',
  'agricultural-household-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 農業世帯 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  184, 37, 'line-chart',
  'agricultural-household-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 農業世帯 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  185, 37, 'bar-chart',
  'agricultural-household-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 農業世帯 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  186, 38, 'metric',
  'agricultural-household-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 農業世帯 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  187, 38, 'metric',
  'agricultural-household-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 農業世帯 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  188, 38, 'metric',
  'agricultural-household-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 農業世帯 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  189, 38, 'line-chart',
  'agricultural-household-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 農業世帯 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  190, 38, 'bar-chart',
  'agricultural-household-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 製造業 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  191, 39, 'metric',
  'manufacturing-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 製造業 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  192, 39, 'metric',
  'manufacturing-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 製造業 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  193, 39, 'metric',
  'manufacturing-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 製造業 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  194, 39, 'line-chart',
  'manufacturing-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 製造業 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  195, 39, 'bar-chart',
  'manufacturing-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 製造業 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  196, 40, 'metric',
  'manufacturing-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 製造業 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  197, 40, 'metric',
  'manufacturing-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 製造業 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  198, 40, 'metric',
  'manufacturing-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 製造業 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  199, 40, 'line-chart',
  'manufacturing-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 製造業 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  200, 40, 'bar-chart',
  'manufacturing-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 商業・サービス産業 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  201, 41, 'metric',
  'commerce-service-industry-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 商業・サービス産業 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  202, 41, 'metric',
  'commerce-service-industry-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 商業・サービス産業 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  203, 41, 'metric',
  'commerce-service-industry-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 商業・サービス産業 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  204, 41, 'line-chart',
  'commerce-service-industry-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 商業・サービス産業 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  205, 41, 'bar-chart',
  'commerce-service-industry-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 商業・サービス産業 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  206, 42, 'metric',
  'commerce-service-industry-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 商業・サービス産業 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  207, 42, 'metric',
  'commerce-service-industry-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 商業・サービス産業 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  208, 42, 'metric',
  'commerce-service-industry-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 商業・サービス産業 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  209, 42, 'line-chart',
  'commerce-service-industry-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 商業・サービス産業 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  210, 42, 'bar-chart',
  'commerce-service-industry-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 商業施設 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  211, 43, 'metric',
  'commercial-facilities-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 商業施設 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  212, 43, 'metric',
  'commercial-facilities-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 商業施設 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  213, 43, 'metric',
  'commercial-facilities-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 商業施設 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  214, 43, 'line-chart',
  'commercial-facilities-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 商業施設 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  215, 43, 'bar-chart',
  'commercial-facilities-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 商業施設 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  216, 44, 'metric',
  'commercial-facilities-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 商業施設 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  217, 44, 'metric',
  'commercial-facilities-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 商業施設 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  218, 44, 'metric',
  'commercial-facilities-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 商業施設 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  219, 44, 'line-chart',
  'commercial-facilities-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 商業施設 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  220, 44, 'bar-chart',
  'commercial-facilities-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 労働者世帯収入 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  221, 45, 'metric',
  'worker-household-income-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 労働者世帯収入 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  222, 45, 'metric',
  'worker-household-income-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 労働者世帯収入 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  223, 45, 'metric',
  'worker-household-income-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 労働者世帯収入 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  224, 45, 'line-chart',
  'worker-household-income-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 労働者世帯収入 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  225, 45, 'bar-chart',
  'worker-household-income-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 労働者世帯収入 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  226, 46, 'metric',
  'worker-household-income-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 労働者世帯収入 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  227, 46, 'metric',
  'worker-household-income-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 労働者世帯収入 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  228, 46, 'metric',
  'worker-household-income-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 労働者世帯収入 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  229, 46, 'line-chart',
  'worker-household-income-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 労働者世帯収入 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  230, 46, 'bar-chart',
  'worker-household-income-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 家計 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  231, 47, 'metric',
  'household-economy-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 家計 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  232, 47, 'metric',
  'household-economy-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 家計 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  233, 47, 'metric',
  'household-economy-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 家計 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  234, 47, 'line-chart',
  'household-economy-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 家計 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  235, 47, 'bar-chart',
  'household-economy-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 家計 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  236, 48, 'metric',
  'household-economy-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 家計 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  237, 48, 'metric',
  'household-economy-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 家計 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  238, 48, 'metric',
  'household-economy-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 家計 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  239, 48, 'line-chart',
  'household-economy-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 家計 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  240, 48, 'bar-chart',
  'household-economy-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 企業規模 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  241, 49, 'metric',
  'business-scale-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 企業規模 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  242, 49, 'metric',
  'business-scale-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 企業規模 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  243, 49, 'metric',
  'business-scale-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 企業規模 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  244, 49, 'line-chart',
  'business-scale-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 企業規模 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  245, 49, 'bar-chart',
  'business-scale-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 企業規模 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  246, 50, 'metric',
  'business-scale-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 企業規模 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  247, 50, 'metric',
  'business-scale-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 企業規模 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  248, 50, 'metric',
  'business-scale-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 企業規模 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  249, 50, 'line-chart',
  'business-scale-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 企業規模 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  250, 50, 'bar-chart',
  'business-scale-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 企業活動 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  251, 51, 'metric',
  'business-activity-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 企業活動 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  252, 51, 'metric',
  'business-activity-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 企業活動 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  253, 51, 'metric',
  'business-activity-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 企業活動 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  254, 51, 'line-chart',
  'business-activity-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 企業活動 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  255, 51, 'bar-chart',
  'business-activity-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 企業活動 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  256, 52, 'metric',
  'business-activity-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 企業活動 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  257, 52, 'metric',
  'business-activity-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 企業活動 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  258, 52, 'metric',
  'business-activity-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 企業活動 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  259, 52, 'line-chart',
  'business-activity-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 企業活動 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  260, 52, 'bar-chart',
  'business-activity-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 総生産・経済指標 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  261, 53, 'metric',
  'gross-product-economic-indicators-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 総生産・経済指標 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  262, 53, 'metric',
  'gross-product-economic-indicators-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 総生産・経済指標 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  263, 53, 'metric',
  'gross-product-economic-indicators-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 総生産・経済指標 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  264, 53, 'line-chart',
  'gross-product-economic-indicators-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 総生産・経済指標 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  265, 53, 'bar-chart',
  'gross-product-economic-indicators-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 総生産・経済指標 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  266, 54, 'metric',
  'gross-product-economic-indicators-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 総生産・経済指標 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  267, 54, 'metric',
  'gross-product-economic-indicators-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 総生産・経済指標 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  268, 54, 'metric',
  'gross-product-economic-indicators-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 総生産・経済指標 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  269, 54, 'line-chart',
  'gross-product-economic-indicators-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 総生産・経済指標 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  270, 54, 'bar-chart',
  'gross-product-economic-indicators-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 消費者物価地域差指数 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  271, 55, 'metric',
  'consumer-price-difference-index-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 消費者物価地域差指数 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  272, 55, 'metric',
  'consumer-price-difference-index-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 消費者物価地域差指数 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  273, 55, 'metric',
  'consumer-price-difference-index-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 消費者物価地域差指数 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  274, 55, 'line-chart',
  'consumer-price-difference-index-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 消費者物価地域差指数 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  275, 55, 'bar-chart',
  'consumer-price-difference-index-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 消費者物価地域差指数 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  276, 56, 'metric',
  'consumer-price-difference-index-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 消費者物価地域差指数 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  277, 56, 'metric',
  'consumer-price-difference-index-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 消費者物価地域差指数 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  278, 56, 'metric',
  'consumer-price-difference-index-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 消費者物価地域差指数 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  279, 56, 'line-chart',
  'consumer-price-difference-index-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 消費者物価地域差指数 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  280, 56, 'bar-chart',
  'consumer-price-difference-index-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 生活環境 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  281, 57, 'metric',
  'living-environment-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 生活環境 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  282, 57, 'metric',
  'living-environment-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 生活環境 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  283, 57, 'metric',
  'living-environment-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 生活環境 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  284, 57, 'line-chart',
  'living-environment-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 生活環境 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  285, 57, 'bar-chart',
  'living-environment-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 生活環境 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  286, 58, 'metric',
  'living-environment-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 生活環境 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  287, 58, 'metric',
  'living-environment-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 生活環境 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  288, 58, 'metric',
  'living-environment-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 生活環境 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  289, 58, 'line-chart',
  'living-environment-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 生活環境 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  290, 58, 'bar-chart',
  'living-environment-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 住宅所有 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  291, 59, 'metric',
  'housing-ownership-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 住宅所有 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  292, 59, 'metric',
  'housing-ownership-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 住宅所有 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  293, 59, 'metric',
  'housing-ownership-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 住宅所有 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  294, 59, 'line-chart',
  'housing-ownership-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 住宅所有 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  295, 59, 'bar-chart',
  'housing-ownership-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 住宅所有 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  296, 60, 'metric',
  'housing-ownership-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 住宅所有 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  297, 60, 'metric',
  'housing-ownership-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 住宅所有 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  298, 60, 'metric',
  'housing-ownership-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 住宅所有 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  299, 60, 'line-chart',
  'housing-ownership-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 住宅所有 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  300, 60, 'bar-chart',
  'housing-ownership-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 住宅構造 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  301, 61, 'metric',
  'housing-structure-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 住宅構造 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  302, 61, 'metric',
  'housing-structure-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 住宅構造 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  303, 61, 'metric',
  'housing-structure-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 住宅構造 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  304, 61, 'line-chart',
  'housing-structure-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 住宅構造 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  305, 61, 'bar-chart',
  'housing-structure-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 住宅構造 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  306, 62, 'metric',
  'housing-structure-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 住宅構造 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  307, 62, 'metric',
  'housing-structure-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 住宅構造 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  308, 62, 'metric',
  'housing-structure-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 住宅構造 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  309, 62, 'line-chart',
  'housing-structure-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 住宅構造 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  310, 62, 'bar-chart',
  'housing-structure-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 住宅設備 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  311, 63, 'metric',
  'housing-facilities-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 住宅設備 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  312, 63, 'metric',
  'housing-facilities-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 住宅設備 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  313, 63, 'metric',
  'housing-facilities-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 住宅設備 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  314, 63, 'line-chart',
  'housing-facilities-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 住宅設備 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  315, 63, 'bar-chart',
  'housing-facilities-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 住宅設備 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  316, 64, 'metric',
  'housing-facilities-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 住宅設備 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  317, 64, 'metric',
  'housing-facilities-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 住宅設備 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  318, 64, 'metric',
  'housing-facilities-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 住宅設備 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  319, 64, 'line-chart',
  'housing-facilities-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 住宅設備 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  320, 64, 'bar-chart',
  'housing-facilities-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 建設・製造 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  321, 65, 'metric',
  'construction-manufacturing-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 建設・製造 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  322, 65, 'metric',
  'construction-manufacturing-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 建設・製造 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  323, 65, 'metric',
  'construction-manufacturing-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 建設・製造 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  324, 65, 'line-chart',
  'construction-manufacturing-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 建設・製造 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  325, 65, 'bar-chart',
  'construction-manufacturing-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 建設・製造 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  326, 66, 'metric',
  'construction-manufacturing-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 建設・製造 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  327, 66, 'metric',
  'construction-manufacturing-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 建設・製造 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  328, 66, 'metric',
  'construction-manufacturing-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 建設・製造 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  329, 66, 'line-chart',
  'construction-manufacturing-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 建設・製造 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  330, 66, 'bar-chart',
  'construction-manufacturing-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 福祉施設 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  331, 67, 'metric',
  'welfare-facilities-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 福祉施設 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  332, 67, 'metric',
  'welfare-facilities-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 福祉施設 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  333, 67, 'metric',
  'welfare-facilities-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 福祉施設 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  334, 67, 'line-chart',
  'welfare-facilities-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 福祉施設 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  335, 67, 'bar-chart',
  'welfare-facilities-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 福祉施設 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  336, 68, 'metric',
  'welfare-facilities-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 福祉施設 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  337, 68, 'metric',
  'welfare-facilities-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 福祉施設 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  338, 68, 'metric',
  'welfare-facilities-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 福祉施設 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  339, 68, 'line-chart',
  'welfare-facilities-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 福祉施設 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  340, 68, 'bar-chart',
  'welfare-facilities-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 住宅統計 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  341, 69, 'metric',
  'housing-statistics-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 住宅統計 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  342, 69, 'metric',
  'housing-statistics-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 住宅統計 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  343, 69, 'metric',
  'housing-statistics-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 住宅統計 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  344, 69, 'line-chart',
  'housing-statistics-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 住宅統計 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  345, 69, 'bar-chart',
  'housing-statistics-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 住宅統計 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  346, 70, 'metric',
  'housing-statistics-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 住宅統計 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  347, 70, 'metric',
  'housing-statistics-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 住宅統計 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  348, 70, 'metric',
  'housing-statistics-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 住宅統計 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  349, 70, 'line-chart',
  'housing-statistics-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 住宅統計 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  350, 70, 'bar-chart',
  'housing-statistics-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 上水道・下水道 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  351, 71, 'metric',
  'water-supply-sewerage-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 上水道・下水道 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  352, 71, 'metric',
  'water-supply-sewerage-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 上水道・下水道 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  353, 71, 'metric',
  'water-supply-sewerage-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 上水道・下水道 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  354, 71, 'line-chart',
  'water-supply-sewerage-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 上水道・下水道 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  355, 71, 'bar-chart',
  'water-supply-sewerage-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 上水道・下水道 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  356, 72, 'metric',
  'water-supply-sewerage-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 上水道・下水道 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  357, 72, 'metric',
  'water-supply-sewerage-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 上水道・下水道 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  358, 72, 'metric',
  'water-supply-sewerage-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 上水道・下水道 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  359, 72, 'line-chart',
  'water-supply-sewerage-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 上水道・下水道 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  360, 72, 'bar-chart',
  'water-supply-sewerage-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 廃棄物処理 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  361, 73, 'metric',
  'waste-management-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 廃棄物処理 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  362, 73, 'metric',
  'waste-management-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 廃棄物処理 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  363, 73, 'metric',
  'waste-management-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 廃棄物処理 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  364, 73, 'line-chart',
  'waste-management-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 廃棄物処理 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  365, 73, 'bar-chart',
  'waste-management-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 廃棄物処理 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  366, 74, 'metric',
  'waste-management-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 廃棄物処理 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  367, 74, 'metric',
  'waste-management-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 廃棄物処理 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  368, 74, 'metric',
  'waste-management-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 廃棄物処理 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  369, 74, 'line-chart',
  'waste-management-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 廃棄物処理 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  370, 74, 'bar-chart',
  'waste-management-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 工業用水 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  371, 75, 'metric',
  'industrial-water-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 工業用水 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  372, 75, 'metric',
  'industrial-water-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 工業用水 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  373, 75, 'metric',
  'industrial-water-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 工業用水 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  374, 75, 'line-chart',
  'industrial-water-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 工業用水 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  375, 75, 'bar-chart',
  'industrial-water-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 工業用水 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  376, 76, 'metric',
  'industrial-water-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 工業用水 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  377, 76, 'metric',
  'industrial-water-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 工業用水 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  378, 76, 'metric',
  'industrial-water-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 工業用水 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  379, 76, 'line-chart',
  'industrial-water-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 工業用水 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  380, 76, 'bar-chart',
  'industrial-water-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- インフラ・エネルギー (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  381, 77, 'metric',
  'infrastructure-energy-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- インフラ・エネルギー (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  382, 77, 'metric',
  'infrastructure-energy-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- インフラ・エネルギー (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  383, 77, 'metric',
  'infrastructure-energy-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- インフラ・エネルギー (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  384, 77, 'line-chart',
  'infrastructure-energy-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- インフラ・エネルギー (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  385, 77, 'bar-chart',
  'infrastructure-energy-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- インフラ・エネルギー (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  386, 78, 'metric',
  'infrastructure-energy-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- インフラ・エネルギー (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  387, 78, 'metric',
  'infrastructure-energy-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- インフラ・エネルギー (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  388, 78, 'metric',
  'infrastructure-energy-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- インフラ・エネルギー (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  389, 78, 'line-chart',
  'infrastructure-energy-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- インフラ・エネルギー (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  390, 78, 'bar-chart',
  'infrastructure-energy-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 観光・宿泊 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  391, 79, 'metric',
  'tourism-accommodation-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 観光・宿泊 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  392, 79, 'metric',
  'tourism-accommodation-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 観光・宿泊 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  393, 79, 'metric',
  'tourism-accommodation-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 観光・宿泊 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  394, 79, 'line-chart',
  'tourism-accommodation-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 観光・宿泊 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  395, 79, 'bar-chart',
  'tourism-accommodation-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 観光・宿泊 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  396, 80, 'metric',
  'tourism-accommodation-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 観光・宿泊 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  397, 80, 'metric',
  'tourism-accommodation-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 観光・宿泊 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  398, 80, 'metric',
  'tourism-accommodation-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 観光・宿泊 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  399, 80, 'line-chart',
  'tourism-accommodation-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 観光・宿泊 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  400, 80, 'bar-chart',
  'tourism-accommodation-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 幼稚園 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  401, 81, 'metric',
  'kindergarten-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 幼稚園 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  402, 81, 'metric',
  'kindergarten-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 幼稚園 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  403, 81, 'metric',
  'kindergarten-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 幼稚園 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  404, 81, 'line-chart',
  'kindergarten-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 幼稚園 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  405, 81, 'bar-chart',
  'kindergarten-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 幼稚園 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  406, 82, 'metric',
  'kindergarten-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 幼稚園 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  407, 82, 'metric',
  'kindergarten-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 幼稚園 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  408, 82, 'metric',
  'kindergarten-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 幼稚園 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  409, 82, 'line-chart',
  'kindergarten-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 幼稚園 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  410, 82, 'bar-chart',
  'kindergarten-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 小学校 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  411, 83, 'metric',
  'elementary-school-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 小学校 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  412, 83, 'metric',
  'elementary-school-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 小学校 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  413, 83, 'metric',
  'elementary-school-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 小学校 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  414, 83, 'line-chart',
  'elementary-school-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 小学校 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  415, 83, 'bar-chart',
  'elementary-school-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 小学校 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  416, 84, 'metric',
  'elementary-school-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 小学校 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  417, 84, 'metric',
  'elementary-school-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 小学校 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  418, 84, 'metric',
  'elementary-school-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 小学校 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  419, 84, 'line-chart',
  'elementary-school-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 小学校 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  420, 84, 'bar-chart',
  'elementary-school-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 中学校 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  421, 85, 'metric',
  'junior-high-school-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 中学校 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  422, 85, 'metric',
  'junior-high-school-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 中学校 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  423, 85, 'metric',
  'junior-high-school-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 中学校 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  424, 85, 'line-chart',
  'junior-high-school-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 中学校 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  425, 85, 'bar-chart',
  'junior-high-school-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 中学校 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  426, 86, 'metric',
  'junior-high-school-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 中学校 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  427, 86, 'metric',
  'junior-high-school-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 中学校 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  428, 86, 'metric',
  'junior-high-school-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 中学校 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  429, 86, 'line-chart',
  'junior-high-school-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 中学校 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  430, 86, 'bar-chart',
  'junior-high-school-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 高等学校 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  431, 87, 'metric',
  'high-school-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 高等学校 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  432, 87, 'metric',
  'high-school-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 高等学校 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  433, 87, 'metric',
  'high-school-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 高等学校 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  434, 87, 'line-chart',
  'high-school-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 高等学校 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  435, 87, 'bar-chart',
  'high-school-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 高等学校 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  436, 88, 'metric',
  'high-school-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 高等学校 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  437, 88, 'metric',
  'high-school-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 高等学校 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  438, 88, 'metric',
  'high-school-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 高等学校 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  439, 88, 'line-chart',
  'high-school-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 高等学校 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  440, 88, 'bar-chart',
  'high-school-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 短大・大学 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  441, 89, 'metric',
  'college-university-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 短大・大学 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  442, 89, 'metric',
  'college-university-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 短大・大学 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  443, 89, 'metric',
  'college-university-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 短大・大学 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  444, 89, 'line-chart',
  'college-university-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 短大・大学 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  445, 89, 'bar-chart',
  'college-university-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 短大・大学 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  446, 90, 'metric',
  'college-university-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 短大・大学 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  447, 90, 'metric',
  'college-university-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 短大・大学 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  448, 90, 'metric',
  'college-university-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 短大・大学 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  449, 90, 'line-chart',
  'college-university-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 短大・大学 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  450, 90, 'bar-chart',
  'college-university-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 文化施設 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  451, 91, 'metric',
  'cultural-facilities-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 文化施設 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  452, 91, 'metric',
  'cultural-facilities-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 文化施設 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  453, 91, 'metric',
  'cultural-facilities-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 文化施設 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  454, 91, 'line-chart',
  'cultural-facilities-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 文化施設 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  455, 91, 'bar-chart',
  'cultural-facilities-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 文化施設 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  456, 92, 'metric',
  'cultural-facilities-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 文化施設 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  457, 92, 'metric',
  'cultural-facilities-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 文化施設 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  458, 92, 'metric',
  'cultural-facilities-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 文化施設 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  459, 92, 'line-chart',
  'cultural-facilities-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 文化施設 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  460, 92, 'bar-chart',
  'cultural-facilities-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- スポーツ施設 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  461, 93, 'metric',
  'sports-facilities-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- スポーツ施設 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  462, 93, 'metric',
  'sports-facilities-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- スポーツ施設 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  463, 93, 'metric',
  'sports-facilities-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- スポーツ施設 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  464, 93, 'line-chart',
  'sports-facilities-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- スポーツ施設 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  465, 93, 'bar-chart',
  'sports-facilities-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- スポーツ施設 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  466, 94, 'metric',
  'sports-facilities-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- スポーツ施設 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  467, 94, 'metric',
  'sports-facilities-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- スポーツ施設 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  468, 94, 'metric',
  'sports-facilities-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- スポーツ施設 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  469, 94, 'line-chart',
  'sports-facilities-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- スポーツ施設 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  470, 94, 'bar-chart',
  'sports-facilities-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 社会活動 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  471, 95, 'metric',
  'social-activities-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 社会活動 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  472, 95, 'metric',
  'social-activities-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 社会活動 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  473, 95, 'metric',
  'social-activities-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 社会活動 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  474, 95, 'line-chart',
  'social-activities-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 社会活動 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  475, 95, 'bar-chart',
  'social-activities-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 社会活動 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  476, 96, 'metric',
  'social-activities-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 社会活動 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  477, 96, 'metric',
  'social-activities-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 社会活動 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  478, 96, 'metric',
  'social-activities-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 社会活動 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  479, 96, 'line-chart',
  'social-activities-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 社会活動 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  480, 96, 'bar-chart',
  'social-activities-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 保育・幼児教育 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  481, 97, 'metric',
  'childcare-early-education-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 保育・幼児教育 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  482, 97, 'metric',
  'childcare-early-education-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 保育・幼児教育 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  483, 97, 'metric',
  'childcare-early-education-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 保育・幼児教育 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  484, 97, 'line-chart',
  'childcare-early-education-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 保育・幼児教育 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  485, 97, 'bar-chart',
  'childcare-early-education-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 保育・幼児教育 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  486, 98, 'metric',
  'childcare-early-education-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 保育・幼児教育 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  487, 98, 'metric',
  'childcare-early-education-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 保育・幼児教育 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  488, 98, 'metric',
  'childcare-early-education-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 保育・幼児教育 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  489, 98, 'line-chart',
  'childcare-early-education-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 保育・幼児教育 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  490, 98, 'bar-chart',
  'childcare-early-education-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 義務教育 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  491, 99, 'metric',
  'compulsory-education-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 義務教育 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  492, 99, 'metric',
  'compulsory-education-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 義務教育 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  493, 99, 'metric',
  'compulsory-education-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 義務教育 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  494, 99, 'line-chart',
  'compulsory-education-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 義務教育 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  495, 99, 'bar-chart',
  'compulsory-education-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 義務教育 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  496, 100, 'metric',
  'compulsory-education-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 義務教育 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  497, 100, 'metric',
  'compulsory-education-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 義務教育 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  498, 100, 'metric',
  'compulsory-education-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 義務教育 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  499, 100, 'line-chart',
  'compulsory-education-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 義務教育 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  500, 100, 'bar-chart',
  'compulsory-education-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 財政指標 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  501, 101, 'metric',
  'fiscal-indicators-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 財政指標 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  502, 101, 'metric',
  'fiscal-indicators-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 財政指標 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  503, 101, 'metric',
  'fiscal-indicators-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 財政指標 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  504, 101, 'line-chart',
  'fiscal-indicators-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 財政指標 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  505, 101, 'bar-chart',
  'fiscal-indicators-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 財政指標 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  506, 102, 'metric',
  'fiscal-indicators-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 財政指標 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  507, 102, 'metric',
  'fiscal-indicators-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 財政指標 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  508, 102, 'metric',
  'fiscal-indicators-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 財政指標 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  509, 102, 'line-chart',
  'fiscal-indicators-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 財政指標 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  510, 102, 'bar-chart',
  'fiscal-indicators-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 職員・議会・選挙 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  511, 103, 'metric',
  'staff-assembly-election-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 職員・議会・選挙 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  512, 103, 'metric',
  'staff-assembly-election-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 職員・議会・選挙 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  513, 103, 'metric',
  'staff-assembly-election-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 職員・議会・選挙 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  514, 103, 'line-chart',
  'staff-assembly-election-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 職員・議会・選挙 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  515, 103, 'bar-chart',
  'staff-assembly-election-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 職員・議会・選挙 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  516, 104, 'metric',
  'staff-assembly-election-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 職員・議会・選挙 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  517, 104, 'metric',
  'staff-assembly-election-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 職員・議会・選挙 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  518, 104, 'metric',
  'staff-assembly-election-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 職員・議会・選挙 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  519, 104, 'line-chart',
  'staff-assembly-election-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 職員・議会・選挙 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  520, 104, 'bar-chart',
  'staff-assembly-election-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 税収 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  521, 105, 'metric',
  'tax-revenue-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 税収 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  522, 105, 'metric',
  'tax-revenue-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 税収 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  523, 105, 'metric',
  'tax-revenue-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 税収 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  524, 105, 'line-chart',
  'tax-revenue-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 税収 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  525, 105, 'bar-chart',
  'tax-revenue-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 税収 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  526, 106, 'metric',
  'tax-revenue-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 税収 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  527, 106, 'metric',
  'tax-revenue-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 税収 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  528, 106, 'metric',
  'tax-revenue-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 税収 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  529, 106, 'line-chart',
  'tax-revenue-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 税収 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  530, 106, 'bar-chart',
  'tax-revenue-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 投資 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  531, 107, 'metric',
  'investment-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 投資 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  532, 107, 'metric',
  'investment-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 投資 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  533, 107, 'metric',
  'investment-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 投資 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  534, 107, 'line-chart',
  'investment-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 投資 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  535, 107, 'bar-chart',
  'investment-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 投資 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  536, 108, 'metric',
  'investment-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 投資 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  537, 108, 'metric',
  'investment-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 投資 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  538, 108, 'metric',
  'investment-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 投資 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  539, 108, 'line-chart',
  'investment-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 投資 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  540, 108, 'bar-chart',
  'investment-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 歳入 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  541, 109, 'metric',
  'revenue-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 歳入 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  542, 109, 'metric',
  'revenue-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 歳入 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  543, 109, 'metric',
  'revenue-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 歳入 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  544, 109, 'line-chart',
  'revenue-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 歳入 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  545, 109, 'bar-chart',
  'revenue-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 歳入 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  546, 110, 'metric',
  'revenue-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 歳入 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  547, 110, 'metric',
  'revenue-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 歳入 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  548, 110, 'metric',
  'revenue-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 歳入 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  549, 110, 'line-chart',
  'revenue-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 歳入 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  550, 110, 'bar-chart',
  'revenue-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 歳出 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  551, 111, 'metric',
  'expenditure-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 歳出 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  552, 111, 'metric',
  'expenditure-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 歳出 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  553, 111, 'metric',
  'expenditure-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 歳出 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  554, 111, 'line-chart',
  'expenditure-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 歳出 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  555, 111, 'bar-chart',
  'expenditure-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 歳出 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  556, 112, 'metric',
  'expenditure-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 歳出 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  557, 112, 'metric',
  'expenditure-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 歳出 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  558, 112, 'metric',
  'expenditure-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 歳出 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  559, 112, 'line-chart',
  'expenditure-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 歳出 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  560, 112, 'bar-chart',
  'expenditure-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 消防・緊急事態 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  561, 113, 'metric',
  'fire-emergency-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 消防・緊急事態 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  562, 113, 'metric',
  'fire-emergency-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 消防・緊急事態 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  563, 113, 'metric',
  'fire-emergency-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 消防・緊急事態 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  564, 113, 'line-chart',
  'fire-emergency-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 消防・緊急事態 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  565, 113, 'bar-chart',
  'fire-emergency-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 消防・緊急事態 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  566, 114, 'metric',
  'fire-emergency-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 消防・緊急事態 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  567, 114, 'metric',
  'fire-emergency-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 消防・緊急事態 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  568, 114, 'metric',
  'fire-emergency-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 消防・緊急事態 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  569, 114, 'line-chart',
  'fire-emergency-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 消防・緊急事態 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  570, 114, 'bar-chart',
  'fire-emergency-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 火災保険 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  571, 115, 'metric',
  'fire-insurance-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 火災保険 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  572, 115, 'metric',
  'fire-insurance-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 火災保険 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  573, 115, 'metric',
  'fire-insurance-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 火災保険 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  574, 115, 'line-chart',
  'fire-insurance-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 火災保険 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  575, 115, 'bar-chart',
  'fire-insurance-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 火災保険 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  576, 116, 'metric',
  'fire-insurance-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 火災保険 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  577, 116, 'metric',
  'fire-insurance-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 火災保険 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  578, 116, 'metric',
  'fire-insurance-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 火災保険 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  579, 116, 'line-chart',
  'fire-insurance-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 火災保険 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  580, 116, 'bar-chart',
  'fire-insurance-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 警察・犯罪 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  581, 117, 'metric',
  'police-crime-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 警察・犯罪 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  582, 117, 'metric',
  'police-crime-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 警察・犯罪 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  583, 117, 'metric',
  'police-crime-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 警察・犯罪 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  584, 117, 'line-chart',
  'police-crime-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 警察・犯罪 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  585, 117, 'bar-chart',
  'police-crime-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 警察・犯罪 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  586, 118, 'metric',
  'police-crime-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 警察・犯罪 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  587, 118, 'metric',
  'police-crime-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 警察・犯罪 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  588, 118, 'metric',
  'police-crime-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 警察・犯罪 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  589, 118, 'line-chart',
  'police-crime-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 警察・犯罪 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  590, 118, 'bar-chart',
  'police-crime-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 交通事故 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  591, 119, 'metric',
  'traffic-accidents-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 交通事故 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  592, 119, 'metric',
  'traffic-accidents-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 交通事故 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  593, 119, 'metric',
  'traffic-accidents-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 交通事故 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  594, 119, 'line-chart',
  'traffic-accidents-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 交通事故 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  595, 119, 'bar-chart',
  'traffic-accidents-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 交通事故 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  596, 120, 'metric',
  'traffic-accidents-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 交通事故 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  597, 120, 'metric',
  'traffic-accidents-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 交通事故 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  598, 120, 'metric',
  'traffic-accidents-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 交通事故 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  599, 120, 'line-chart',
  'traffic-accidents-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 交通事故 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  600, 120, 'bar-chart',
  'traffic-accidents-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 公害・環境 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  601, 121, 'metric',
  'pollution-environment-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 公害・環境 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  602, 121, 'metric',
  'pollution-environment-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 公害・環境 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  603, 121, 'metric',
  'pollution-environment-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 公害・環境 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  604, 121, 'line-chart',
  'pollution-environment-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 公害・環境 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  605, 121, 'bar-chart',
  'pollution-environment-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 公害・環境 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  606, 122, 'metric',
  'pollution-environment-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 公害・環境 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  607, 122, 'metric',
  'pollution-environment-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 公害・環境 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  608, 122, 'metric',
  'pollution-environment-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 公害・環境 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  609, 122, 'line-chart',
  'pollution-environment-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 公害・環境 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  610, 122, 'bar-chart',
  'pollution-environment-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 社会保障指標 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  611, 123, 'metric',
  'card-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 社会保障指標 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  612, 123, 'metric',
  'card-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 社会保障指標 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  613, 123, 'metric',
  'card-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 社会保障指標 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  614, 123, 'line-chart',
  'card-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 社会保障指標 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  615, 123, 'bar-chart',
  'card-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 社会保障指標 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  616, 124, 'metric',
  'card-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 社会保障指標 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  617, 124, 'metric',
  'card-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 社会保障指標 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  618, 124, 'metric',
  'card-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 社会保障指標 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  619, 124, 'line-chart',
  'card-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 社会保障指標 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  620, 124, 'bar-chart',
  'card-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 死亡統計 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  621, 125, 'metric',
  'death-statistics-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 死亡統計 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  622, 125, 'metric',
  'death-statistics-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 死亡統計 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  623, 125, 'metric',
  'death-statistics-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 死亡統計 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  624, 125, 'line-chart',
  'death-statistics-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 死亡統計 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  625, 125, 'bar-chart',
  'death-statistics-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 死亡統計 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  626, 126, 'metric',
  'death-statistics-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 死亡統計 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  627, 126, 'metric',
  'death-statistics-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 死亡統計 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  628, 126, 'metric',
  'death-statistics-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 死亡統計 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  629, 126, 'line-chart',
  'death-statistics-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 死亡統計 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  630, 126, 'bar-chart',
  'death-statistics-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 生活保護・福祉 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  631, 127, 'metric',
  'public-assistance-welfare-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 生活保護・福祉 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  632, 127, 'metric',
  'public-assistance-welfare-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 生活保護・福祉 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  633, 127, 'metric',
  'public-assistance-welfare-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 生活保護・福祉 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  634, 127, 'line-chart',
  'public-assistance-welfare-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 生活保護・福祉 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  635, 127, 'bar-chart',
  'public-assistance-welfare-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 生活保護・福祉 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  636, 128, 'metric',
  'public-assistance-welfare-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 生活保護・福祉 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  637, 128, 'metric',
  'public-assistance-welfare-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 生活保護・福祉 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  638, 128, 'metric',
  'public-assistance-welfare-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 生活保護・福祉 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  639, 128, 'line-chart',
  'public-assistance-welfare-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 生活保護・福祉 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  640, 128, 'bar-chart',
  'public-assistance-welfare-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 健康・保健 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  641, 129, 'metric',
  'health-care-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 健康・保健 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  642, 129, 'metric',
  'health-care-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 健康・保健 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  643, 129, 'metric',
  'health-care-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 健康・保健 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  644, 129, 'line-chart',
  'health-care-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 健康・保健 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  645, 129, 'bar-chart',
  'health-care-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 健康・保健 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  646, 130, 'metric',
  'health-care-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 健康・保健 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  647, 130, 'metric',
  'health-care-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 健康・保健 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  648, 130, 'metric',
  'health-care-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 健康・保健 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  649, 130, 'line-chart',
  'health-care-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 健康・保健 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  650, 130, 'bar-chart',
  'health-care-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 外国人人口 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  651, 131, 'metric',
  'foreign-population-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 外国人人口 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  652, 131, 'metric',
  'foreign-population-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 外国人人口 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  653, 131, 'metric',
  'foreign-population-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 外国人人口 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  654, 131, 'line-chart',
  'foreign-population-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 外国人人口 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  655, 131, 'bar-chart',
  'foreign-population-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 外国人人口 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  656, 132, 'metric',
  'foreign-population-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 外国人人口 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  657, 132, 'metric',
  'foreign-population-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 外国人人口 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  658, 132, 'metric',
  'foreign-population-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 外国人人口 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  659, 132, 'line-chart',
  'foreign-population-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 外国人人口 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  660, 132, 'bar-chart',
  'foreign-population-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 外国人統計 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  661, 133, 'metric',
  'foreigners-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 外国人統計 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  662, 133, 'metric',
  'foreigners-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 外国人統計 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  663, 133, 'metric',
  'foreigners-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 外国人統計 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  664, 133, 'line-chart',
  'foreigners-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 外国人統計 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  665, 133, 'bar-chart',
  'foreigners-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 外国人統計 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  666, 134, 'metric',
  'foreigners-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 外国人統計 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  667, 134, 'metric',
  'foreigners-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 外国人統計 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  668, 134, 'metric',
  'foreigners-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 外国人統計 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  669, 134, 'line-chart',
  'foreigners-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 外国人統計 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  670, 134, 'bar-chart',
  'foreigners-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 道路 (national) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  671, 135, 'metric',
  'roads-national-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 道路 (national) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  672, 135, 'metric',
  'roads-national-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 道路 (national) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  673, 135, 'metric',
  'roads-national-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 道路 (national) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  674, 135, 'line-chart',
  'roads-national-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 道路 (national) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  675, 135, 'bar-chart',
  'roads-national-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

-- 道路 (prefecture) - メトリックカード 1
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  676, 136, 'metric',
  'roads-prefecture-metric-1', '平均値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 1, 1
);

-- 道路 (prefecture) - メトリックカード 2
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  677, 136, 'metric',
  'roads-prefecture-metric-2', '最大値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 2, 1
);

-- 道路 (prefecture) - メトリックカード 3
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  678, 136, 'metric',
  'roads-prefecture-metric-3', '最小値',
  '{}', 'ranking', 'totalAreaExcluding',
  1, 1, 3, 1
);

-- 道路 (prefecture) - 折れ線グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  679, 136, 'line-chart',
  'roads-prefecture-line-1', '推移グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 4, 1
);

-- 道路 (prefecture) - 棒グラフ
INSERT INTO dashboard_widgets (
  id, dashboard_config_id, widget_type, widget_key, title,
  config, data_source_type, data_source_key,
  grid_col_span, grid_row_span, display_order, is_visible
) VALUES (
  680, 136, 'bar-chart',
  'roads-prefecture-bar-1', '比較グラフ',
  '{'height': 300}', 'ranking', 'totalAreaExcluding',
  2, 2, 5, 1
);

