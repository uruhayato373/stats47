#!/usr/bin/env python3
"""
e-Statランキングマッピングのシードファイル生成スクリプト（分割版）

現在のローカルD1データベースからestat_ranking_mappingsテーブルのデータを取得し、
バッチサイズごとに分割されたINSERT OR REPLACE形式のSQLファイルを生成します。

使用方法:
    python scripts/generate_estat_ranking_mappings_seed.py

出力:
    database/seeds/estat_ranking_mappings_seed_part_001.sql
    database/seeds/estat_ranking_mappings_seed_part_002.sql
    ...
    database/seeds/estat_ranking_mappings_seed_part_XXX.sql
"""

import json
import subprocess
import sys
from pathlib import Path
from datetime import datetime
from typing import Optional

# プロジェクトルートのパス
PROJECT_ROOT = Path(__file__).parent.parent
SEED_DIR = PROJECT_ROOT / "database" / "seeds"

# バッチサイズ（SQLの長さ制限を避けるため、1ファイルあたりの最大レコード数）
# SQLiteの制限（約1MB）を考慮して300件に設定
BATCH_SIZE = 300


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


def generate_seed_sql_batch(rows: list[dict], batch_num: int, total_batches: int) -> str:
    """SQLシードファイルの内容を生成（1バッチ分）"""
    if not rows:
        return ""

    sql_lines = [
        f"-- e-Statランキングマッピングのシードデータ（パート {batch_num}/{total_batches}）",
        f"-- 生成日: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        "-- データソース: ローカルD1データベース",
        f"-- このバッチのレコード数: {len(rows)}",
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
    print("🔧 e-Statランキングマッピングシードファイル生成スクリプト（分割版）")
    print("=" * 70)

    # データベースからデータを取得
    rows = fetch_data_from_database()

    if not rows:
        print("⚠️  データが見つかりませんでした。")
        sys.exit(0)

    print(f"📊 {len(rows)}件のレコードを取得しました")

    # 既存のシードファイル（パート番号付き）を削除
    print("🧹 既存の分割シードファイルを削除中...")
    for seed_file in SEED_DIR.glob("estat_ranking_mappings_seed_part_*.sql"):
        seed_file.unlink()
        print(f"  削除: {seed_file.name}")

    # バッチに分割してSQLファイルを生成
    total_batches = (len(rows) + BATCH_SIZE - 1) // BATCH_SIZE
    print(f"📦 {total_batches}個のファイルに分割します（1ファイルあたり最大{BATCH_SIZE}件）")
    print()

    generated_files = []

    for batch_num in range(total_batches):
        batch_start = batch_num * BATCH_SIZE
        batch_end = min(batch_start + BATCH_SIZE, len(rows))
        batch_rows = rows[batch_start:batch_end]

        # SQLファイルの内容を生成
        sql_content = generate_seed_sql_batch(
            batch_rows, batch_num + 1, total_batches
        )

        # ファイル名を生成（001, 002, ...）
        part_num = batch_num + 1
        filename = f"estat_ranking_mappings_seed_part_{part_num:03d}.sql"
        file_path = SEED_DIR / filename

        # ファイルに書き込み
        SEED_DIR.mkdir(parents=True, exist_ok=True)
        file_path.write_text(sql_content, encoding="utf-8")

        generated_files.append(filename)
        print(
            f"✅ {filename} を作成しました: {len(batch_rows)}件（バッチ {batch_num + 1}/{total_batches}）"
        )

    print()
    print("=" * 70)
    print(f"✅ {len(generated_files)}個のシードファイルを生成しました")
    print()
    print("次のコマンドで適用できます:")
    print("  APPLY_SEEDS=true npm run db:reset:local")
    print()
    print("または、個別に適用:")
    for filename in generated_files:
        print(f"  npx wrangler d1 execute stats47 --local --file=database/seeds/{filename}")


if __name__ == "__main__":
    main()
