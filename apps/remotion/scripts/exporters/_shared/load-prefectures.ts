import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// 完全DBレス (docs/01_技術設計/02_データアーキテクチャ.md): prefecture master の SSOT は
// git TS の packages/area/src/data/prefectures.json (47 県, 静的 Reference)。
// 旧版は D1 prefectures を読んでいたが Phase C で git TS に repoint した
// (D1 と code/name/順序が完全一致することを移行時に検証済)。
const PREFECTURES_JSON = resolve(
  __dirname,
  "../../../../../packages/area/src/data/prefectures.json",
);

export interface Pref {
  code: string;
  name: string;
  region: string | null;
  displayOrder: number | null;
}

let cache: Pref[] | null = null;

/**
 * 47 都道府県 master を git TS (packages/area) から読み込む。
 * code は 5-digit ("01000"〜"47000")、配列順は JIS 順 (北海道→沖縄)。
 */
export function loadPrefectures(): Pref[] {
  if (cache) return cache;
  const raw = JSON.parse(readFileSync(PREFECTURES_JSON, "utf-8")) as Array<{
    prefCode: string;
    prefName: string;
  }>;
  cache = raw.map((p, i) => ({
    code: p.prefCode,
    name: p.prefName,
    region: null,
    displayOrder: i,
  }));
  return cache;
}

/** 2 桁 ("01") に正規化 */
export function to2(code: string | number): string {
  return String(code).padStart(2, "0").slice(0, 2);
}

/** 5 桁 ("01000") に正規化。area_code は基本 5 桁。 */
export function to5(code: string | number): string {
  const s = String(code);
  if (s.length >= 5) return s.slice(0, 5);
  return s.padStart(2, "0") + "000";
}
