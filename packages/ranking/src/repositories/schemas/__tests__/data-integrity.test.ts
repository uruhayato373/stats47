/**
 * データ整合性テスト
 *
 * ローカル D1 の metrics / stats が Zod スキーマでパースできるかを検証する。
 * 本番で 404 を引き起こすフォーマット不整合を事前に検出する。
 *
 * 背景: latest_year が配列形式 ["2023"] で保存された、area_code が 2 桁 "01" で
 * 保存された等の問題で 40 ページが 404 になったインシデントへの対策。
 */
import { describe, expect, test, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import Database from "better-sqlite3";
import { LOCAL_DB_PATHS } from "@stats47/database/config";
import { parseRankingItemDB } from "../ranking-items.schemas";

const DB_PATH = LOCAL_DB_PATHS.STATIC.getPath();

describe("metrics データ整合性", () => {
  test("全 active metrics が parseRankingItemDB でパースできる", () => {
    const db = new Database(DB_PATH, { readonly: true });
    try {
      const rows = db
        .prepare(
          `SELECT
            key         AS ranking_key,
            title       AS ranking_name,
            title,
            subtitle,
            demographic_attr,
            normalization_basis,
            unit,
            NULL        AS annotation,
            description,
            NULL        AS latest_year,
            NULL        AS available_years,
            is_active,
            is_featured,
            featured_order,
            survey_id,
            'estat'     AS data_source_id,
            source_config_json          AS source_config,
            value_display_config_json   AS value_display_config,
            visualization_config_json   AS visualization_config,
            calculation_config_json     AS calculation_config,
            seo_title,
            seo_description,
            created_at,
            updated_at
           FROM metrics WHERE is_active = 1`
        )
        .all();

      expect(rows.length).toBeGreaterThan(0);

      const errors: string[] = [];
      for (const row of rows) {
        try {
          parseRankingItemDB(row);
        } catch (e) {
          const r = row as Record<string, unknown>;
          const msg = e instanceof Error ? e.message : String(e);
          errors.push(`${r.ranking_key}: ${msg}`);
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

  test("stats の area_code が全て5桁形式", () => {
    const db = new Database(DB_PATH, { readonly: true });
    try {
      const bad = db
        .prepare(
          `SELECT DISTINCT metric_key, area_code
           FROM stats
           WHERE LENGTH(area_code) != 5
             AND area_code != '0'
           LIMIT 20`
        )
        .all() as { metric_key: string; area_code: string }[];

      expect(
        bad,
        `不正な area_code:\n${bad.map((r) => `${r.metric_key}: ${r.area_code}`).join("\n")}`
      ).toEqual([]);
    } finally {
      db.close();
    }
  });

  test("metrics の calculation_config が有効な JSON 形式", () => {
    const db = new Database(DB_PATH, { readonly: true });
    try {
      const rows = db
        .prepare(
          `SELECT key, calculation_config_json
           FROM metrics
           WHERE is_active = 1
             AND calculation_config_json IS NOT NULL`
        )
        .all() as { key: string; calculation_config_json: string }[];

      const errors: string[] = [];
      for (const row of rows) {
        try {
          JSON.parse(row.calculation_config_json);
        } catch {
          errors.push(`${row.key}: JSON パース失敗 ${row.calculation_config_json}`);
        }
      }

      expect(
        errors,
        `${errors.length}件の calculation_config_json エラー:\n${errors.join("\n")}`
      ).toEqual([]);
    } finally {
      db.close();
    }
  });

  test("metrics の source_config が有効な JSON 形式", () => {
    const db = new Database(DB_PATH, { readonly: true });
    try {
      const rows = db
        .prepare(
          `SELECT key, source_config_json
           FROM metrics
           WHERE is_active = 1
             AND source_config_json IS NOT NULL`
        )
        .all() as { key: string; source_config_json: string }[];

      const errors: string[] = [];
      for (const row of rows) {
        try {
          JSON.parse(row.source_config_json);
        } catch {
          errors.push(`${row.key}: JSON パース失敗 ${row.source_config_json}`);
        }
      }

      expect(
        errors,
        `${errors.length}件の source_config_json エラー:\n${errors.join("\n")}`
      ).toEqual([]);
    } finally {
      db.close();
    }
  });
});
