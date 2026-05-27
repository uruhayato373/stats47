import type Database from "better-sqlite3";

export interface Pref {
  code: string;
  name: string;
  region: string | null;
  displayOrder: number | null;
}

export function loadPrefectures(db: Database.Database): Pref[] {
  return db
    .prepare(
      `SELECT code, name, region, display_order AS displayOrder
       FROM prefectures
       WHERE is_active IS NULL OR is_active = 1
       ORDER BY display_order, code`,
    )
    .all() as Pref[];
}

export function loadPrefByCode(db: Database.Database, code: string): Pref | null {
  return (
    (db
      .prepare(
        `SELECT code, name, region, display_order AS displayOrder
         FROM prefectures WHERE code = ?`,
      )
      .get(code) as Pref | undefined) ?? null
  );
}

/** 2 桁 ("01") に正規化 */
export function to2(code: string | number): string {
  return String(code).padStart(2, "0").slice(0, 2);
}

/** 5 桁 ("01000") に正規化。D1 の area_code は基本 5 桁。 */
export function to5(code: string | number): string {
  const s = String(code);
  if (s.length >= 5) return s.slice(0, 5);
  return s.padStart(2, "0") + "000";
}
