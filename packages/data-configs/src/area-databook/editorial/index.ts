/**
 * AREA_EDITORIALS — 県別編集コンテンツ (特産品・県シンボル) の登録簿。
 *
 * ⚠️ AUTO-GENERATED — DO NOT EDIT.
 * 生成: npx tsx packages/data-configs/scripts/generate-editorial-index.ts
 * 記録の正本は台帳 areas.editorial (県ごとの JSON + Schema)。ファイルを追加したら再生成する。
 * 規約: .claude/rules/area-databook-standards.md
 */
import type { AreaEditorial } from "../types";
import e01000 from "../../../../../data/areas/editorial/01000.json";
import e02000 from "../../../../../data/areas/editorial/02000.json";
import e03000 from "../../../../../data/areas/editorial/03000.json";
import e04000 from "../../../../../data/areas/editorial/04000.json";
import e05000 from "../../../../../data/areas/editorial/05000.json";
import e06000 from "../../../../../data/areas/editorial/06000.json";
import e07000 from "../../../../../data/areas/editorial/07000.json";
import e08000 from "../../../../../data/areas/editorial/08000.json";
import e09000 from "../../../../../data/areas/editorial/09000.json";
import e10000 from "../../../../../data/areas/editorial/10000.json";
import e11000 from "../../../../../data/areas/editorial/11000.json";
import e12000 from "../../../../../data/areas/editorial/12000.json";
import e13000 from "../../../../../data/areas/editorial/13000.json";
import e14000 from "../../../../../data/areas/editorial/14000.json";
import e15000 from "../../../../../data/areas/editorial/15000.json";
import e16000 from "../../../../../data/areas/editorial/16000.json";
import e17000 from "../../../../../data/areas/editorial/17000.json";
import e18000 from "../../../../../data/areas/editorial/18000.json";
import e19000 from "../../../../../data/areas/editorial/19000.json";
import e20000 from "../../../../../data/areas/editorial/20000.json";
import e21000 from "../../../../../data/areas/editorial/21000.json";
import e22000 from "../../../../../data/areas/editorial/22000.json";
import e23000 from "../../../../../data/areas/editorial/23000.json";
import e24000 from "../../../../../data/areas/editorial/24000.json";
import e25000 from "../../../../../data/areas/editorial/25000.json";
import e26000 from "../../../../../data/areas/editorial/26000.json";
import e27000 from "../../../../../data/areas/editorial/27000.json";
import e28000 from "../../../../../data/areas/editorial/28000.json";
import e29000 from "../../../../../data/areas/editorial/29000.json";
import e30000 from "../../../../../data/areas/editorial/30000.json";
import e31000 from "../../../../../data/areas/editorial/31000.json";
import e32000 from "../../../../../data/areas/editorial/32000.json";
import e33000 from "../../../../../data/areas/editorial/33000.json";
import e34000 from "../../../../../data/areas/editorial/34000.json";
import e35000 from "../../../../../data/areas/editorial/35000.json";
import e36000 from "../../../../../data/areas/editorial/36000.json";
import e37000 from "../../../../../data/areas/editorial/37000.json";
import e38000 from "../../../../../data/areas/editorial/38000.json";
import e39000 from "../../../../../data/areas/editorial/39000.json";
import e40000 from "../../../../../data/areas/editorial/40000.json";
import e41000 from "../../../../../data/areas/editorial/41000.json";
import e42000 from "../../../../../data/areas/editorial/42000.json";
import e43000 from "../../../../../data/areas/editorial/43000.json";
import e44000 from "../../../../../data/areas/editorial/44000.json";
import e45000 from "../../../../../data/areas/editorial/45000.json";
import e46000 from "../../../../../data/areas/editorial/46000.json";
import e47000 from "../../../../../data/areas/editorial/47000.json";

const RECORDS = [
  e01000,
  e02000,
  e03000,
  e04000,
  e05000,
  e06000,
  e07000,
  e08000,
  e09000,
  e10000,
  e11000,
  e12000,
  e13000,
  e14000,
  e15000,
  e16000,
  e17000,
  e18000,
  e19000,
  e20000,
  e21000,
  e22000,
  e23000,
  e24000,
  e25000,
  e26000,
  e27000,
  e28000,
  e29000,
  e30000,
  e31000,
  e32000,
  e33000,
  e34000,
  e35000,
  e36000,
  e37000,
  e38000,
  e39000,
  e40000,
  e41000,
  e42000,
  e43000,
  e44000,
  e45000,
  e46000,
  e47000,
];

/** 県別編集コンテンツの登録簿 (areaCode → editorial)。sourceNote (出典の注記) は記録だけが持ち、ここには出さない。 */
export const AREA_EDITORIALS: Record<string, AreaEditorial> = Object.fromEntries(
  RECORDS.map(({ sourceNote: _sourceNote, ...editorial }) => [editorial.areaCode, editorial as AreaEditorial]),
);

/** 登録済み editorial 配列。 */
export function listAreaEditorials(): AreaEditorial[] {
  return Object.values(AREA_EDITORIALS);
}
