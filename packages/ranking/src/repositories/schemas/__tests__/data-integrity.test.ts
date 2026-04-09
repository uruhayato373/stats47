/**
 * データ整合性テスト
 *
 * ローカル D1 の ranking_items / ranking_data が Zod スキーマでパースできるかを検証する。
 * 本番で 404 を引き起こすフォーマット不整合を事前に検出する。
 *
 * 背景: latest_year が配列形式 ["2023"] で保存された、area_code が 2 桁 "01" で
 * 保存された等の問題で 40 ページが 404 になったインシデントへの対策。
 */
import { describe, expect, test } from "vitest";
import Database from "better-sqlite3";
import { LOCAL_DB_PATHS } from "@stats47/database/config";
import { parseRankingItemDB } from "../ranking-items.schemas";

const DB_PATH = LOCAL_DB_PATHS.STATIC.getPath();

describe("ranking_items データ整合性", () => {
  test("全 active ranking_items が parseRankingItemDB でパースできる", () => {
    const db = new Database(DB_PATH, { readonly: true });
    try {
      const rows = db
        .prepare("SELECT * FROM ranking_items WHERE is_active = 1")
        .all();

      expect(rows.length).toBeGreaterThan(0);

      const errors: string[] = [];
      for (const row of rows) {
        try {
          parseRankingItemDB(row);
        } catch (e) {
          const r = row as Record<string, unknown>;
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`${r.ranking_key}/${r.area_type}: ${msg}`);
        }
      }

      expect(
        errors,
        `${errors.length}件のパースエラー:\n${errors.join("\n")}`
      ).toEqual([]);
    } finally {
      db.close();
    }
  });

  test("ranking_data の area_code が全て5桁形式", () => {
    const db = new Database(DB_PATH, { readonly: true });
    try {
      const bad = db
        .prepare(
          `SELECT DISTINCT category_code, area_code
           FROM ranking_data
           WHERE LENGTH(area_code) != 5
             AND area_code != '0'
           LIMIT 20`
        )
        .all() as { category_code: string; area_code: string }[];

      expect(
        bad,
        `不正な area_code:\n${bad.map((r) => `${r.category_code}: ${r.area_code}`).join("\n")}`
      ).toEqual([]);
    } finally {
      db.close();
    }
  });

  test("ranking_items の latest_year が有効な JSON オブジェクト形式", () => {
    const db = new Database(DB_PATH, { readonly: true });
    try {
      const arrayFormat = db
        .prepare(
          `SELECT ranking_key, area_type, latest_year
           FROM ranking_items
           WHERE is_active = 1
             AND latest_year LIKE '[%'`
        )
        .all() as {
        ranking_key: string;
        area_type: string;
        latest_year: string;
      }[];

      expect(
        arrayFormat,
        `配列形式の latest_year:\n${arrayFormat.map((r) => `${r.ranking_key}/${r.area_type}: ${r.latest_year}`).join("\n")}`
      ).toEqual([]);
    } finally {
      db.close();
    }
  });

  test("ranking_items の available_years が有効な JSON 配列形式", () => {
    const db = new Database(DB_PATH, { readonly: true });
    try {
      const rows = db
        .prepare(
          `SELECT ranking_key, area_type, available_years
           FROM ranking_items
           WHERE is_active = 1
             AND available_years IS NOT NULL`
        )
        .all() as {
        ranking_key: string;
        area_type: string;
        available_years: string;
      }[];

      const errors: string[] = [];
      for (const row of rows) {
        try {
          const parsed: unknown = JSON.parse(row.available_years);
          if (!Array.isArray(parsed)) {
            errors.push(
              `${row.ranking_key}/${row.area_type}: 配列でない (${typeof parsed})`
            );
            continue;
          }
          for (const item of parsed) {
            // 文字列 "2023" 形式は Zod スキーマで変換されるので許容
            // オブジェクト {yearCode, yearName} 形式も OK
            if (typeof item !== "string" && (typeof item !== "object" || item === null || !("yearCode" in item))) {
              errors.push(
                `${row.ranking_key}/${row.area_type}: 不正な要素 ${JSON.stringify(item)}`
              );
            }
          }
        } catch {
          errors.push(
            `${row.ranking_key}/${row.area_type}: JSON パース失敗 ${row.available_years}`
          );
        }
      }

      expect(
        errors,
        `${errors.length}件の available_years エラー:\n${errors.join("\n")}`
      ).toEqual([]);
    } finally {
      db.close();
    }
  });
});
