/**
 * AREA_EDITORIALS — 県別編集コンテンツ (特産品・県シンボル) の登録簿。
 *
 * ⚠️ AUTO-GENERATED — DO NOT EDIT.
 * 生成: npx tsx packages/data-configs/scripts/generate-editorial-index.ts
 * 県別ファイル editorial/<code>.ts を追加後に再生成する。
 * 規約: .claude/rules/area-databook-standards.md
 */
import type { AreaEditorial } from "../types";
import { HOKKAIDO_EDITORIAL } from "./01000";
import { TOKYO_EDITORIAL } from "./13000";
import { NIIGATA_EDITORIAL } from "./15000";
import { OKINAWA_EDITORIAL } from "./47000";

/** 県別編集コンテンツの登録簿 (areaCode → editorial)。 */
export const AREA_EDITORIALS: Record<string, AreaEditorial> = {
  "01000": HOKKAIDO_EDITORIAL,
  "13000": TOKYO_EDITORIAL,
  "15000": NIIGATA_EDITORIAL,
  "47000": OKINAWA_EDITORIAL,
};

/** 登録済み editorial 配列。 */
export function listAreaEditorials(): AreaEditorial[] {
  return Object.values(AREA_EDITORIALS);
}
