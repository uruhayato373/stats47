#!/usr/bin/env python3
"""
⚠️ DEPRECATED: このスクリプトは categories.json に依存していますが、ファイルは削除されました。

カテゴリは既にデータベースで管理されているため、このスクリプトは不要です。
新しいカテゴリを追加する場合は、管理画面またはデータベースシードファイルを直接編集してください。

このスクリプトを実行するとエラーになります。
"""

import json
from pathlib import Path

# プロジェクトルートを取得
project_root = Path(__file__).parent.parent
json_file = project_root / "src" / "config" / "categories.json"
output_file = project_root / "database" / "seeds" / "categories_seed.sql"


def generate_categories_seed():
    """categories.jsonからSQL seedを生成（⚠️ 非推奨）"""
    
    if not json_file.exists():
        print(f"ERROR: {json_file} が見つかりません。")
        print("categories.json は削除され、カテゴリはデータベースで管理されています。")
        print("このスクリプトは不要です。新しいカテゴリは管理画面から追加してください。")
        return None
    
    # JSONファイルを読み込む
    with open(json_file, "r", encoding="utf-8") as f:
        categories_data = json.load(f)
    
    sql_parts = []
    
    # ヘッダー
    sql_parts.append(f"""-- カテゴリとサブカテゴリのseedデータ
-- 生成日: 2025-01-28
-- データソース: src/config/categories.json
-- カテゴリ数: {len(categories_data)}

-- ========================================
-- カテゴリの作成
-- ========================================
""")
    
    # カテゴリのINSERT
    sql_parts.append("INSERT OR REPLACE INTO categories (\n")
    sql_parts.append("  category_key, name, icon, display_order, is_active, created_at, updated_at\n")
    sql_parts.append(") VALUES\n")
    
    category_values = []
    for index, category in enumerate(categories_data):
        category_key = category["id"]
        name = category["name"].replace("'", "''")  # SQLインジェクション対策
        icon = category.get("icon", "")
        display_order = index
        is_active = 1
        
        category_values.append(
            f"  ('{category_key}', '{name}', '{icon}', {display_order}, {is_active}, "
            f"CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
        )
    
    sql_parts.append(",\n".join(category_values))
    sql_parts.append(";\n\n")
    
    # サブカテゴリのINSERT
    sql_parts.append("""-- ========================================
-- サブカテゴリの作成
-- ========================================
""")
    
    sql_parts.append("INSERT OR REPLACE INTO subcategories (\n")
    sql_parts.append("  subcategory_key, name, category_id, href, display_order, is_active, created_at, updated_at\n")
    sql_parts.append(") VALUES\n")
    
    subcategory_values = []
    for category in categories_data:
        category_key = category["id"]
        
        # カテゴリIDを取得するためのSELECT
        for sub_index, subcategory in enumerate(category.get("subcategories", [])):
            subcategory_key = subcategory["id"]
            name = subcategory["name"].replace("'", "''")
            href = subcategory.get("href", "")
            display_order = subcategory.get("displayOrder", sub_index)
            is_active = 1
            
            subcategory_values.append(
                f"  ('{subcategory_key}', '{name}', "
                f"(SELECT id FROM categories WHERE category_key = '{category_key}'), "
                f"'{href}', {display_order}, {is_active}, "
                f"CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)"
            )
    
    sql_parts.append(",\n".join(subcategory_values))
    sql_parts.append(";\n")
    
    return "".join(sql_parts)


def main():
    """メイン処理"""
    print("⚠️ WARNING: このスクリプトは非推奨です。")
    print("categories.json は削除され、カテゴリはデータベースで管理されています。")
    print("このスクリプトを実行する必要はありません。")
    print()
    
    print(f"Reading JSON file: {json_file}")
    
    print("Generating SQL...")
    sql = generate_categories_seed()
    
    if sql is None:
        return
    
    print(f"Writing to: {output_file}")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(sql)
    
    print("Done!")


if __name__ == "__main__":
    main()

