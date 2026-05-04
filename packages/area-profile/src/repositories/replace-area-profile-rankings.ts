import "server-only";

import { and, eq, inArray } from "drizzle-orm";

import { areaProfiles, getDrizzle, indicators } from "@stats47/database/server";

/**
 * 指定地域 (prefecture) の area_profiles を完全置換 (PR-5)
 *
 * 旧 InsertAreaProfileRanking 互換の入力 shape を維持。内部で indicators を
 * ルックアップして indicator_id に変換し、新 area_profiles に INSERT。
 */
export interface AreaProfileWriteRow {
  areaCode: string;
  areaName: string;
  year: string;
  indicator: string;
  rankingKey: string;
  type: "strength" | "weakness" | string;
  rank: number;
  value: number;
  unit: string;
  percentile: number;
  createdAt: string;
}

export async function replaceAreaProfileRankings(
  areaCode: string,
  rows: AreaProfileWriteRow[]
): Promise<void> {
  const db = getDrizzle();

  // 1. 既存の prefecture プロフィールを全削除
  await db
    .delete(areaProfiles)
    .where(
      and(
        eq(areaProfiles.entityType, "prefecture"),
        eq(areaProfiles.entityCode, areaCode)
      )
    );

  if (rows.length === 0) return;

  // 2. 入力の rankingKey → indicator_id を一括ルックアップ
  const uniqueKeys = [...new Set(rows.map((r) => r.rankingKey))];
  const indicatorRows = await db
    .select({ id: indicators.id, key: indicators.key })
    .from(indicators)
    .where(
      and(
        inArray(indicators.key, uniqueKeys),
        eq(indicators.areaType, "prefecture")
      )
    );
  const idByKey = new Map(indicatorRows.map((i) => [i.key, i.id]));

  // 3. INSERT 用に変換 (indicator_id が見つからない行は skip)
  type AreaProfileType = "strength" | "weakness";
  const inserts = rows
    .map((r) => {
      const id = idByKey.get(r.rankingKey);
      if (!id) return null;
      const t: AreaProfileType | null =
        r.type === "strength" ? "strength" : r.type === "weakness" ? "weakness" : null;
      if (!t) return null;
      return {
        entityType: "prefecture" as const,
        entityCode: r.areaCode,
        entityName: r.areaName,
        indicatorId: id,
        yearCode: r.year,
        type: t,
        rank: r.rank,
        valueNumeric: r.value,
        unit: r.unit,
        percentile: r.percentile,
        createdAt: r.createdAt,
      };
    })
    .filter((v): v is NonNullable<typeof v> => v !== null);

  // 4. chunk INSERT (SQLite の variable 数制限回避)
  const CHUNK_SIZE = 100;
  for (let i = 0; i < inserts.length; i += CHUNK_SIZE) {
    await db.insert(areaProfiles).values(inserts.slice(i, i + CHUNK_SIZE));
  }
}
