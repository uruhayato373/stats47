import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * 広告の枠の台帳 (data/ads/placements.json) の行から AdSense のユニット名を決める規則。
 * 撮影 (capture-ad-layout.ts) と管理画面 (/affiliate/layout) が同じ関数を使い、画面の「台帳にあり写っていない」が
 * 撮影の当て方と食い違わないようにする。
 */
export function unitOfEntry(entry: { marker: string; adsenseSlot?: string }): string | null {
  if (entry.adsenseSlot) return entry.adsenseSlot;
  const m = entry.marker.match(/slot=\{([A-Z0-9_]+)\}/) ?? entry.marker.match(/slotId=\{([A-Z0-9_]+)\.slotId\}/);
  if (m) return m[1];
  // FooterAdSlot は中で CONTENT_FOOTER を使う (apps/web/src/features/ads/components/slots/FooterAdSlot.tsx)
  if (entry.marker.includes("FooterAdSlot")) return "CONTENT_FOOTER";
  return null;
}

/** AdSense のユニットの定義 (定数名と slotId の正本) */
const ADSENSE_CONSTANTS = "apps/web/src/lib/google-adsense/constants.ts";

/**
 * slotId (番号) → ユニットの定数名。広告の段は番号でしか枠を記録できないので、台帳の名前と照らすために使う。
 * 定数の書き方 `export const NAME: AdSlotConfig = { slotId: "123", ... }` を読む。名前に数字を含む定数 (BLOG_ROW_2) も読む (2026-11-12 まで読めなかった)。
 */
export function adsenseUnitNames(projectRoot: string): Map<string, string> {
  const text = readFileSync(join(projectRoot, ADSENSE_CONSTANTS), "utf8");
  const names = new Map<string, string>();
  for (const m of text.matchAll(/export const ([A-Z0-9_]+): AdSlotConfig = \{\s*slotId: "(\d+)"/g)) names.set(m[2], m[1]);
  return names;
}
