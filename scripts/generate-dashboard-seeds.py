#!/usr/bin/env python3
"""
ダッシュボード設定シードデータ生成スクリプト
categories.jsonから全66サブカテゴリのダッシュボード設定を自動生成
"""
import json
import sys
from pathlib import Path

# プロジェクトルート
PROJECT_ROOT = Path(__file__).parent.parent
CATEGORIES_FILE = PROJECT_ROOT / "src/config/categories.json"
SEEDS_DIR = PROJECT_ROOT / "database/seeds"

# サブカテゴリ別デフォルトウィジェット設定
WIDGET_TEMPLATES = {
    "metric": {
        "grid_col_span": 1,
        "grid_row_span": 1,
        "config": '{"size": "large"}',
    },
    "line-chart": {
        "grid_col_span": 2,
        "grid_row_span": 2,
        "config": '{"height": 300}',
    },
    "bar-chart": {
        "grid_col_span": 2,
        "grid_row_span": 2,
        "config": '{"height": 300}',
    },
    "area-chart": {
        "grid_col_span": 2,
        "grid_row_span": 2,
        "config": '{"height": 300}',
    },
}


def load_categories():
    """categories.jsonを読み込む"""
    with open(CATEGORIES_FILE, encoding="utf-8") as f:
        return json.load(f)


def generate_dashboard_configs(categories):
    """全サブカテゴリのダッシュボード設定を生成"""
    sql = []
    sql.append(
        "-- ダッシュボード設定シードデータ\n"
        "-- 全サブカテゴリ × 2地域タイプ（national, prefecture）の設定を自動生成\n"
        "-- 作成日: 2025-01-XX\n\n"
    )

    dashboard_id = 1

    for category in categories:
        for subcategory in category.get("subcategories", []):
            subcategory_id = subcategory["id"]

            # national ダッシュボード設定
            sql.append(
                f"-- {subcategory['name']} (全国)\n"
                f"INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES\n"
                f"  ({dashboard_id}, '{subcategory_id}', 'national', 'grid', 1, 1);\n\n"
            )
            dashboard_id += 1

            # prefecture ダッシュボード設定
            sql.append(
                f"-- {subcategory['name']} (都道府県)\n"
                f"INSERT INTO dashboard_configs (id, subcategory_id, area_type, layout_type, version, is_active) VALUES\n"
                f"  ({dashboard_id}, '{subcategory_id}', 'prefecture', 'grid', 1, 1);\n\n"
            )
            dashboard_id += 1

    return "".join(sql), dashboard_id


def generate_widgets(categories):
    """全サブカテゴリのウィジェット定義を生成"""
    sql = []
    sql.append(
        "-- ダッシュボードウィジェットシードデータ\n"
        "-- 各ダッシュボードに3-5個のウィジェットを定義\n"
        "-- 作成日: 2025-01-XX\n\n"
    )

    widget_id = 1
    dashboard_id = 1

    for category in categories:
        for subcategory in category.get("subcategories", []):
            subcategory_id = subcategory["id"]

            # 各サブカテゴリに2つのダッシュボード（national, prefecture）
            for area_type in ["national", "prefecture"]:
                display_order = 1

                # メトリックカード × 3
                for i in range(3):
                    metric_templates = [
                        ("平均値", "totalAreaExcluding", "interpolateBlues"),
                        ("最大値", "totalAreaExcluding", "interpolateGreens"),
                        ("最小値", "totalAreaExcluding", "interpolateReds"),
                    ]
                    metric_key = metric_templates[i % len(metric_templates)][0]
                    data_source_key = metric_templates[i % len(metric_templates)][1]

                    sql.append(
                        f"-- {subcategory['name']} ({area_type}) - メトリックカード {i+1}\n"
                        f"INSERT INTO dashboard_widgets (\n"
                        f"  id, dashboard_config_id, widget_type, widget_key, title,\n"
                        f"  config, data_source_type, data_source_key,\n"
                        f"  grid_col_span, grid_row_span, display_order, is_visible\n"
                        f") VALUES (\n"
                        f"  {widget_id}, {dashboard_id}, 'metric',\n"
                        f"  '{subcategory_id}-{area_type}-metric-{i+1}', '{metric_key}',\n"
                        f"  '{{}}', 'ranking', '{data_source_key}',\n"
                        f"  1, 1, {display_order}, 1\n"
                        f");\n\n"
                    )
                    widget_id += 1
                    display_order += 1

                # 折れ線グラフ
                sql.append(
                    f"-- {subcategory['name']} ({area_type}) - 折れ線グラフ\n"
                    f"INSERT INTO dashboard_widgets (\n"
                    f"  id, dashboard_config_id, widget_type, widget_key, title,\n"
                    f"  config, data_source_type, data_source_key,\n"
                    f"  grid_col_span, grid_row_span, display_order, is_visible\n"
                    f") VALUES (\n"
                    f"  {widget_id}, {dashboard_id}, 'line-chart',\n"
                    f"  '{subcategory_id}-{area_type}-line-1', '推移グラフ',\n"
                    f"  '{{'height': 300}}', 'ranking', 'totalAreaExcluding',\n"
                    f"  2, 2, {display_order}, 1\n"
                    f");\n\n"
                )
                widget_id += 1
                display_order += 1

                # 棒グラフ
                sql.append(
                    f"-- {subcategory['name']} ({area_type}) - 棒グラフ\n"
                    f"INSERT INTO dashboard_widgets (\n"
                    f"  id, dashboard_config_id, widget_type, widget_key, title,\n"
                    f"  config, data_source_type, data_source_key,\n"
                    f"  grid_col_span, grid_row_span, display_order, is_visible\n"
                    f") VALUES (\n"
                    f"  {widget_id}, {dashboard_id}, 'bar-chart',\n"
                    f"  '{subcategory_id}-{area_type}-bar-1', '比較グラフ',\n"
                    f"  '{{'height': 300}}', 'ranking', 'totalAreaExcluding',\n"
                    f"  2, 2, {display_order}, 1\n"
                    f");\n\n"
                )
                widget_id += 1
                display_order += 1

                dashboard_id += 1

    return "".join(sql)


def generate_widget_templates():
    """ウィジェットテンプレート定義を生成"""
    sql = []
    sql.append(
        "-- ウィジェットテンプレートシードデータ\n"
        "-- 再利用可能なウィジェット定義\n"
        "-- 作成日: 2025-01-XX\n\n"
    )

    templates = [
        ("metric-default", "デフォルトメトリックカード", "metric", '{"size": "large"}'),
        ("metric-small", "小メトリックカード", "metric", '{"size": "small"}'),
        ("line-default", "デフォルト折れ線グラフ", "line-chart", '{"height": 300}'),
        ("line-tall", "高折れ線グラフ", "line-chart", '{"height": 400}'),
        ("bar-default", "デフォルト棒グラフ", "bar-chart", '{"height": 300}'),
        ("bar-wide", "広棒グラフ", "bar-chart", '{"height": 300, "horizontal": true}'),
        ("area-default", "デフォルトエリアチャート", "area-chart", '{"height": 300}'),
        ("area-stacked", "積層エリアチャート", "area-chart", '{"height": 300, "stacked": true}'),
    ]

    for i, (key, name, widget_type, config) in enumerate(templates, start=1):
        sql.append(
            f"-- {name}\n"
            f"INSERT INTO widget_templates (\n"
            f"  id, template_key, name, widget_type, default_config\n"
            f") VALUES (\n"
            f"  {i}, '{key}', '{name}', '{widget_type}', '{config}'\n"
            f");\n\n"
        )

    return "".join(sql)


def main():
    """メイン処理"""
    print("categories.jsonを読み込み中...")
    categories = load_categories()

    print(f"カテゴリ数: {len(categories)}")
    total_subcategories = sum(
        len(c.get("subcategories", [])) for c in categories
    )
    print(f"サブカテゴリ数: {total_subcategories}")

    # ダッシュボード設定生成
    print("\nダッシュボード設定を生成中...")
    configs_sql, last_dashboard_id = generate_dashboard_configs(categories)
    print(f"ダッシュボード設定数: {last_dashboard_id - 1}")

    # ウィジェット定義生成
    print("ウィジェット定義を生成中...")
    widgets_sql = generate_widgets(categories)

    # テンプレート定義生成
    print("ウィジェットテンプレートを生成中...")
    templates_sql = generate_widget_templates()

    # SQLファイル書き込み
    SEEDS_DIR.mkdir(exist_ok=True)

    print(f"\ndashboard_configs_seed.sql を書き込み中...")
    with open(SEEDS_DIR / "dashboard_configs_seed.sql", "w", encoding="utf-8") as f:
        f.write(configs_sql)

    print(f"dashboard_widgets_seed.sql を書き込み中...")
    with open(SEEDS_DIR / "dashboard_widgets_seed.sql", "w", encoding="utf-8") as f:
        f.write(widgets_sql)

    print(f"widget_templates_seed.sql を書き込み中...")
    with open(SEEDS_DIR / "widget_templates_seed.sql", "w", encoding="utf-8") as f:
        f.write(templates_sql)

    print("\n完了しました！")


if __name__ == "__main__":
    main()

