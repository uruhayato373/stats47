/**
 * 広告の枠の台帳 (config/ads/placements.json) の行から AdSense のユニット名を決める規則。
 * 撮影 (capture-ad-layout.ts) と管理画面 (/affiliate/layout) が同じ関数を使い、画面の「台帳にあり写っていない」が
 * 撮影の当て方と食い違わないようにする。
 */
export function unitOfEntry(entry: { marker: string; adsenseSlot?: string }): string | null {
  if (entry.adsenseSlot) return entry.adsenseSlot;
  const m = entry.marker.match(/slot=\{([A-Z_]+)\}/) ?? entry.marker.match(/slotId=\{([A-Z_]+)\.slotId\}/);
  if (m) return m[1];
  // FooterAdSlot は中で CONTENT_FOOTER を使う (apps/web/src/features/ads/components/slots/FooterAdSlot.tsx)
  if (entry.marker.includes("FooterAdSlot")) return "CONTENT_FOOTER";
  return null;
}
