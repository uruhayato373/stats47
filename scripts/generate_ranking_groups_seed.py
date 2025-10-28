#!/usr/bin/env python3
"""
prefectures.csvからランキンググループのseedを生成する

各ランキング項目に対して個別のグループを作成し、
各項目をそのグループに関連付ける。
"""

import csv
from pathlib import Path

# プロジェクトルートを取得
project_root = Path(__file__).parent.parent
csv_file = project_root / "data" / "prefectures.csv"
output_file = project_root / "database" / "seeds" / "ranking_groups_seed.sql"

# stats_data_idからsubcategory_idへのマッピング
STATS_TO_SUBCATEGORY = {
    "0000010204": "finance",  # 都道府県財政
    "0000010210": "welfare",  # 福祉
    "0000010211": "safety",  # 消防・警察
    "0000010205": "education",  # 教育
    "0000010206": "labor",  # 労働
    "0000010207": "culture",  # 文化・スポーツ
    "0000010212": "economy",  # 家計
    "0000010202": "environment",  # 国土・気象
    "0000010203": "economy",  # 経済
    "0000010201": "population",  # 人口
    "0000010208": "lifestyle",  # 生活
    "0000010209": "health",  # 保健医療
    "0000010213": "lifestyle",  # 社会生活
}

# バッチサイズ（SQLの長さ制限を避けるため）
BATCH_SIZE = 50


def read_csv_data():
    """CSVファイルを読み込む"""
    items = []
    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            items.append(row)
    return items


def generate_groups_and_items_sql(items):
    """グループ作成とアイテム更新のSQLを生成"""
    sql_parts = []
    
    # ヘッダー
    sql_parts.append(f"""-- ランキンググループとアイテムの関連付けseed
-- 生成日: 2025-01-28
-- データソース: data/prefectures.csv
-- グループ数: {len(items)}
-- 更新項目数: {len(items)}

-- ========================================
-- ランキンググループの作成（バッチ処理）
-- ========================================
""")
    
    # バッチサイズで分割してINSERT文を生成
    for batch_start in range(0, len(items), BATCH_SIZE):
        batch_end = min(batch_start + BATCH_SIZE, len(items))
        batch_items = items[batch_start:batch_end]
        
        sql_parts.append(f"-- バッチ {batch_start // BATCH_SIZE + 1} / {(len(items) + BATCH_SIZE - 1) // BATCH_SIZE}\n")
        sql_parts.append("INSERT OR REPLACE INTO ranking_groups (\n")
        sql_parts.append("  group_key, subcategory_id, name, description, \n")
        sql_parts.append("  icon, display_order, is_collapsed, created_at, updated_at\n")
        sql_parts.append(") VALUES\n")
        
        group_values = []
        display_order_map = {}  # subcategory_idごとの表示順序
        
        for item in batch_items:
            item_code = item["item_code"]
            item_name = item["item_name"]
            stats_data_id = item["stats_data_id"]
            subcategory_id = STATS_TO_SUBCATEGORY.get(stats_data_id, "general")
            
            # 表示順序を生成（subcategory_idごとにカウント）
            if subcategory_id not in display_order_map:
                display_order_map[subcategory_id] = 0
            display_order = display_order_map[subcategory_id]
            display_order_map[subcategory_id] += 1
            
            group_key = f"group-{item_code}"
            
            # SQLインジェクション対策：シングルクォートをエスケープ
            item_name_escaped = item_name.replace("'", "''")
            
            group_values.append(
                f"  ('{group_key}', '{subcategory_id}', '{item_name_escaped}', "
                f"NULL, NULL, {display_order}, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
            )
        
        sql_parts.append(",\n".join(group_values))
        sql_parts.append(";\n\n")
    
    # ranking_items の group_id を更新
    sql_parts.append("""-- ========================================
-- ランキング項目の group_id を更新
-- ========================================
""")
    
    for item in items:
        item_code = item["item_code"]
        group_key = f"group-{item_code}"
        
        sql_parts.append(
            f"UPDATE ranking_items\n"
            f"SET group_id = (SELECT id FROM ranking_groups WHERE group_key = '{group_key}'),\n"
            f"    display_order_in_group = 0\n"
            f"WHERE ranking_key = '{item_code}';\n"
        )
    
    return "".join(sql_parts)


def main():
    """メイン処理"""
    print(f"Reading CSV file: {csv_file}")
    items = read_csv_data()
    print(f"Found {len(items)} items")
    
    print("Generating SQL...")
    sql = generate_groups_and_items_sql(items)
    
    print(f"Writing to: {output_file}")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(sql)
    
    print(f"Generated {len(items)} groups")
    print(f"Output file: {output_file}")
    print("Done!")


if __name__ == "__main__":
    main()
