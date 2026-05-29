import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { openD1 } from "./_shared/d1-client.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "../../../..");
const AREA_DATA_DIR = resolve(REPO_ROOT, "packages/area/src/data");

export function exportMaster(): { files: number; skipped: string[] } {
  const skipped: string[] = [];
  const db = openD1();
  try {
    // @stats47/area の既存 interface に合わせる ({prefCode, prefName} 5-digit)
    const prefs = (
      db
        .prepare(
          `SELECT code, name FROM prefectures
           WHERE is_active IS NULL OR is_active = 1
           ORDER BY code`,
        )
        .all() as Array<{ code: string; name: string }>
    ).map((p) => ({ prefCode: p.code, prefName: p.name }));

    mkdirSync(AREA_DATA_DIR, { recursive: true });
    writeFileSync(
      resolve(AREA_DATA_DIR, "prefectures.json"),
      JSON.stringify(prefs, null, 2) + "\n",
    );

    // cities.json は scope 外: D1 cities (2,701) と既存 JSON (1,913) は別範囲を表しており
    // `prefCode` の意味合いも異なる ("01100"=親都市 vs "01000"=県)。Phase 3 で意図を
    // 確認してから master 同期に追加する。今は手動編集ファイルとして残す。
    skipped.push(
      "cities.json: D1 と既存 JSON の scope/意味が異なるため master export 対象外 (Phase 3 で再判定)",
    );

    return { files: 1, skipped };
  } finally {
    db.close();
  }
}
