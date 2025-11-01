#!/usr/bin/env python3
"""
e-Statランキングマッピングのシードファイル生成スクリプト

現在のローカルD1データベースからestat_ranking_mappingsテーブルのデータを取得し、
INSERT OR REPLACE形式のSQLファイルを生成します。

使用方法:
    python scripts/generate_estat_ranking_mappings_seed.py

出力:
    database/seeds/estat_ranking_mappings_seed.sql
"""

import json
import subprocess
import sys
from pathlib import Path
from typing import Optional

# プロジェクトルートのパス
PROJECT_ROOT = Path(__file__).parent.parent
SEED_OUTPUT_PATH = (
    PROJECT_ROOT / "database" / "seeds" / "estat_ranking_mappings_seed.sql"
)


def escape_sql_string(value: Optional[str]) -> str:
    """SQL文字列をエスケープ"""
    if value is None:
        return "NULL"
    # シングルクォートをエスケープ
    escaped = str(value).replace("'", "''")
    return f"'{escaped}'"


def format_value(value: Optional[str]) -> str:
    """SQL値としてフォーマット（NULLの場合はNULL、文字列の場合はエスケープ）"""
    if value is None or value == "null" or value == "":
        return "NULL"
    return escape_sql_string(value)


def format_boolean(value: Optional[bool]) -> str:
    """ブール値をSQL形式にフォーマット"""
    if value is None:
        return "0"
    return "1" if value else "0"


def fetch_data_from_database() -> list[dict]:
    """ローカルD1データベースからestat_ranking_mappingsデータを取得"""
    print("📊 データベースからestat_ranking_mappingsデータを取得中...")

    try:
        # wranglerコマンドを実行してデータを取得
        result = subprocess.run(
            [
                "npx",
                "wrangler",
                "d1",
                "execute",
                "stats47",
                "--local",
                "--command",
                "SELECT stats_data_id, cat01, item_name, item_code, unit, area_type, is_ranking, created_at, updated_at FROM estat_ranking_mappings ORDER BY stats_data_id, cat01;",
            ],
            capture_output=True,
            text=True,
            check=True,
        )

        # JSONレスポンスをパース
        output = result.stdout.strip()
        # wranglerの出力からJSON部分を抽出
        if "[" in output:
            json_start = output.index("[")
            json_end = output.rindex("]") + 1
            json_str = output[json_start:json_end]
            data = json.loads(json_str)

            if isinstance(data, list) and len(data) > 0:
                if "results" in data[0]:
                    return data[0]["results"]
                return data
            elif isinstance(data, dict) and "results" in data:
                return data["results"]

        print("⚠️  データが見つかりませんでした")
        return []

    except subprocess.CalledProcessError as e:
        print(f"❌ データベースからの取得に失敗しました: {e}")
        print(f"エラー出力: {e.stderr}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ JSON解析エラー: {e}")
        print(f"出力: {result.stdout}")
        sys.exit(1)


def generate_seed_sql(rows: list[dict]) -> str:
    """SQLシードファイルの内容を生成"""
    if not rows:
        return "-- estat_ranking_mappings テーブルにデータがありません\n"

    sql_lines = [
        "-- e-Statランキングマッピングのシードデータ",
        "-- 生成日: 自動生成",
        f"-- データソース: ローカルD1データベース",
        f"-- レコード数: {len(rows)}",
        "",
        "-- べき等性を保つため、INSERT OR REPLACEを使用",
        "-- このファイルは何度実行しても同じ結果になります",
        "",
        "INSERT OR REPLACE INTO estat_ranking_mappings (",
        "  stats_data_id,",
        "  cat01,",
        "  item_name,",
        "  item_code,",
        "  unit,",
        "  area_type,",
        "  is_ranking,",
        "  created_at,",
        "  updated_at",
        ") VALUES",
    ]

    # 各行のVALUESを生成
    for i, row in enumerate(rows):
        stats_data_id = format_value(row.get("stats_data_id"))
        cat01 = format_value(row.get("cat01"))
        item_name = format_value(row.get("item_name"))
        item_code = format_value(row.get("item_code"))
        unit = format_value(row.get("unit"))
        area_type = format_value(row.get("area_type"))
        is_ranking = format_boolean(row.get("is_ranking"))
        created_at = format_value(row.get("created_at"))
        updated_at = format_value(row.get("updated_at"))

        # 最後の行以外はカンマを付ける
        comma = "," if i < len(rows) - 1 else ";"

        value_line = (
            f"  ({stats_data_id}, {cat01}, {item_name}, {item_code}, "
            f"{unit}, {area_type}, {is_ranking}, {created_at}, {updated_at}){comma}"
        )
        sql_lines.append(value_line)

    return "\n".join(sql_lines) + "\n"


def main():
    """メイン処理"""
    print("🔧 e-Statランキングマッピングシードファイル生成スクリプト")
    print("=" * 50)

    # データベースからデータを取得
    rows = fetch_data_from_database()

    if not rows:
        print("⚠️  データが見つかりませんでした。空のseedファイルを作成します。")
        rows = []

    # SQLファイルを生成
    sql_content = generate_seed_sql(rows)

    # ファイルに書き込み
    SEED_OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    SEED_OUTPUT_PATH.write_text(sql_content, encoding="utf-8")

    print(f"✅ Seedファイルを作成しました: {SEED_OUTPUT_PATH}")
    print(f"📊 レコード数: {len(rows)}")
    print("")
    print("次のコマンドで適用できます:")
    print(
        f"  npx wrangler d1 execute stats47 --local --file={SEED_OUTPUT_PATH}"
    )


if __name__ == "__main__":
    main()

