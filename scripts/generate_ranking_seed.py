#!/usr/bin/env python3
"""
ランキング関連テーブルのseedデータを生成するスクリプト

ranking_groups, ranking_items, ranking_group_subcategoriesの
seedデータをデータベースから取得してSQLファイルを生成します。

使用方法:
  python scripts/generate_ranking_seed.py

出力ファイル:
  - database/seeds/ranking_groups_seed.sql
  - database/seeds/ranking_items_seed.sql
  - database/seeds/ranking_group_subcategories_seed.sql
"""

import json
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Optional

# プロジェクトルートを取得
project_root = Path(__file__).parent.parent

# 出力ファイルパス
RANKING_GROUPS_SEED = project_root / "database" / "seeds" / "ranking_groups_seed.sql"
RANKING_ITEMS_SEED = project_root / "database" / "seeds" / "ranking_items_seed.sql"
RANKING_GROUP_SUBCATEGORIES_SEED = (
    project_root / "database" / "seeds" / "ranking_group_subcategories_seed.sql"
)

# バッチサイズ（SQLの長さ制限を避けるため）
BATCH_SIZE = 100


def execute_d1_query(command: str) -> list:
    """D1データベースからデータを取得"""
    try:
        result = subprocess.run(
            ["npx", "wrangler", "d1", "execute", "stats47", "--local", "--command", command],
            capture_output=True,
            text=True,
            check=True,
        )
        
        # JSON出力を抽出
        output = result.stdout
        json_match = output[output.find("[") : output.rfind("]") + 1]
        if not json_match:
            return []
        
        data = json.loads(json_match)
        if isinstance(data, list) and len(data) > 0 and "results" in data[0]:
            return data[0]["results"]
        return []
    except Exception as e:
        print(f"エラー: {e}")
        return []


def escape_sql_string(value: Optional[str]) -> str:
    """SQLインジェクション対策: シングルクォートをエスケープ"""
    if value is None:
        return "NULL"
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"


def generate_ranking_groups_seed():
    """ranking_groupsテーブルのseedデータを生成"""
    print("ranking_groupsからデータを取得中...")
    
    rows = execute_d1_query(
        "SELECT group_key, group_name, label, display_order FROM ranking_groups ORDER BY group_key;"
    )
    
    if not rows:
        print("⚠️  ranking_groupsにデータが見つかりませんでした。")
        return
    
    sql_parts = [
        f"""-- ランキンググループのseedデータ
-- 生成日: {datetime.now().strftime('%Y-%m-%d')}
-- データソース: ローカルD1データベース
-- グループ数: {len(rows)}

-- ========================================
-- ランキンググループの作成
-- ========================================
""",
    ]
    
    # バッチサイズで分割してINSERT文を生成
    for batch_start in range(0, len(rows), BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, len(rows))
        batch_rows = rows[batch_start:batch_end]
        
        sql_parts.append(
            f"-- バッチ {batch_start // BATCH_SIZE + 1} / {(len(rows) + BATCH_SIZE - 1) // BATCH_SIZE}\n"
        )
        sql_parts.append("INSERT OR REPLACE INTO ranking_groups (\n")
        sql_parts.append("  group_key, group_name, label, display_order,\n")
        sql_parts.append("  created_at, updated_at\n")
        sql_parts.append(") VALUES\n")
        
        group_values = []
        for row in batch_rows:
            group_values.append(
                f"  ({escape_sql_string(row.get('group_key'))}, "
                f"{escape_sql_string(row.get('group_name'))}, "
                f"{escape_sql_string(row.get('label'))}, "
                f"{row.get('display_order', 0)}, "
                f"CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
            )
        
        sql_parts.append(",\n".join(group_values))
        sql_parts.append(";\n\n")
    
    # ファイルに書き込み
    RANKING_GROUPS_SEED.parent.mkdir(parents=True, exist_ok=True)
    RANKING_GROUPS_SEED.write_text("\n".join(sql_parts), encoding="utf-8")
    
    print(f"✅ ranking_groups_seed.sqlを作成しました: {len(rows)}グループ")


def generate_ranking_group_subcategories_seed():
    """ranking_group_subcategoriesテーブルのseedデータを生成"""
    print("ranking_group_subcategoriesからデータを取得中...")
    
    rows = execute_d1_query(
        "SELECT group_key, subcategory_id, display_order FROM ranking_group_subcategories ORDER BY group_key, display_order;"
    )
    
    if not rows:
        print("⚠️  ranking_group_subcategoriesにデータが見つかりませんでした。")
        return
    
    sql_parts = [
        f"""-- ランキンググループとサブカテゴリの関連付けseedデータ
-- 生成日: {datetime.now().strftime('%Y-%m-%d')}
-- データソース: ローカルD1データベース
-- 関連付け数: {len(rows)}

-- ========================================
-- ランキンググループとサブカテゴリの関連付け
-- ========================================
""",
    ]
    
    # バッチサイズで分割してINSERT文を生成
    for batch_start in range(0, len(rows), BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, len(rows))
        batch_rows = rows[batch_start:batch_end]
        
        sql_parts.append(
            f"-- バッチ {batch_start // BATCH_SIZE + 1} / {(len(rows) + BATCH_SIZE - 1) // BATCH_SIZE}\n"
        )
        sql_parts.append("INSERT OR REPLACE INTO ranking_group_subcategories (\n")
        sql_parts.append("  group_key, subcategory_id, display_order,\n")
        sql_parts.append("  created_at\n")
        sql_parts.append(") VALUES\n")
        
        group_values = []
        for row in batch_rows:
            group_values.append(
                f"  ({escape_sql_string(row.get('group_key'))}, "
                f"{escape_sql_string(row.get('subcategory_id'))}, "
                f"{row.get('display_order', 0)}, "
                f"CURRENT_TIMESTAMP)"
            )
        
        sql_parts.append(",\n".join(group_values))
        sql_parts.append(";\n\n")
    
    # ファイルに書き込み
    RANKING_GROUP_SUBCATEGORIES_SEED.parent.mkdir(parents=True, exist_ok=True)
    RANKING_GROUP_SUBCATEGORIES_SEED.write_text("\n".join(sql_parts), encoding="utf-8")
    
    print(f"✅ ranking_group_subcategories_seed.sqlを作成しました: {len(rows)}関連付け")


def generate_ranking_items_seed():
    """ranking_itemsテーブルのseedデータを生成"""
    print("ranking_itemsからデータを取得中...")
    
    rows = execute_d1_query(
        """SELECT 
           ranking_key, area_type, label, ranking_name, annotation, unit,
           group_key, display_order_in_group,
           map_color_scheme, map_diverging_midpoint, ranking_direction,
           conversion_factor, decimal_places, is_active
         FROM ranking_items 
         ORDER BY ranking_key, area_type;"""
    )
    
    if not rows:
        print("⚠️  ranking_itemsにデータが見つかりませんでした。")
        return
    
    sql_parts = [
        f"""-- ランキング項目のseedデータ
-- 生成日: {datetime.now().strftime('%Y-%m-%d')}
-- データソース: ローカルD1データベース
-- 項目数: {len(rows)}

-- 注意: ranking_itemsテーブルはR2→D1同期機能で自動生成・更新されます
-- このseedファイルは開発環境での初期データ投入用です

-- ========================================
-- ランキング項目の作成
-- ========================================
""",
    ]
    
    # バッチサイズで分割してINSERT文を生成
    for batch_start in range(0, len(rows), BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, len(rows))
        batch_rows = rows[batch_start:batch_end]
        
        sql_parts.append(
            f"-- バッチ {batch_start // BATCH_SIZE + 1} / {(len(rows) + BATCH_SIZE - 1) // BATCH_SIZE}\n"
        )
        sql_parts.append("INSERT OR REPLACE INTO ranking_items (\n")
        sql_parts.append(
            "  ranking_key, area_type, label, ranking_name, annotation, unit,\n"
        )
        sql_parts.append(
            "  group_key, display_order_in_group,\n"
        )
        sql_parts.append(
            "  map_color_scheme, map_diverging_midpoint, ranking_direction,\n"
        )
        sql_parts.append(
            "  conversion_factor, decimal_places, is_active,\n"
        )
        sql_parts.append("  created_at, updated_at\n")
        sql_parts.append(") VALUES\n")
        
        item_values = []
        for row in batch_rows:
            # annotationがnullの場合はNULLを返す
            annotation_value = row.get('annotation')
            annotation_sql = "NULL" if annotation_value is None or annotation_value == "null" or annotation_value == "" else escape_sql_string(annotation_value)
            
            item_values.append(
                f"  ({escape_sql_string(row.get('ranking_key'))}, "
                f"{escape_sql_string(row.get('area_type'))}, "
                f"{escape_sql_string(row.get('label'))}, "
                f"{escape_sql_string(row.get('ranking_name'))}, "
                f"{annotation_sql}, "
                f"{escape_sql_string(row.get('unit'))}, "
                f"{escape_sql_string(row.get('group_key'))}, "
                f"{row.get('display_order_in_group', 0)}, "
                f"{escape_sql_string(row.get('map_color_scheme', 'interpolateBlues'))}, "
                f"{escape_sql_string(row.get('map_diverging_midpoint', 'zero'))}, "
                f"{escape_sql_string(row.get('ranking_direction', 'desc'))}, "
                f"{row.get('conversion_factor', 1)}, "
                f"{row.get('decimal_places', 0)}, "
                f"{1 if row.get('is_active', True) else 0}, "
                f"CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
            )
        
        sql_parts.append(",\n".join(item_values))
        sql_parts.append(";\n\n")
    
    # ファイルに書き込み
    RANKING_ITEMS_SEED.parent.mkdir(parents=True, exist_ok=True)
    RANKING_ITEMS_SEED.write_text("\n".join(sql_parts), encoding="utf-8")
    
    print(f"✅ ranking_items_seed.sqlを作成しました: {len(rows)}項目")


def main():
    """メイン処理"""
    print("🔧 ランキング関連テーブルのseedデータ生成スクリプト")
    print("=" * 60)
    print()
    
    try:
        # 各テーブルのseedデータを生成
        generate_ranking_groups_seed()
        print()
        
        generate_ranking_group_subcategories_seed()
        print()
        
        generate_ranking_items_seed()
        print()
        
        print("✅ すべてのseedファイルの生成が完了しました！")
        print()
        print("次のコマンドで適用できます:")
        print(
            f"  npx wrangler d1 execute stats47 --local --file={RANKING_GROUPS_SEED}"
        )
        print(
            f"  npx wrangler d1 execute stats47 --local --file={RANKING_GROUP_SUBCATEGORIES_SEED}"
        )
        print(
            f"  npx wrangler d1 execute stats47 --local --file={RANKING_ITEMS_SEED}"
        )
        
    except Exception as e:
        print(f"❌ エラーが発生しました: {e}")
        import traceback
        
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())

