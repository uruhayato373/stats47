import placements from '../../../../config/ads/placements.json';

/**
 * 広告の枠の台帳 (config/ads/placements.json) の読み口 (2026-10-29)。
 * 枠の部品は確保する箱の寸法をここから取り、本番の予約の高さとローカルの代わりの表示を同じ値にする。
 */

export type AdSlotTypeId = (typeof placements.slotTypes)[number]['id'];

export interface AdSlotBox {
  /** 数値 (px) か full (本文の幅いっぱい) */
  width: number | 'full';
  height: number;
}

export interface AdSlotType {
  id: string;
  name: string;
  provider: 'adsense' | 'affiliate';
  box: AdSlotBox;
  /** この枠を描く部品の名前 */
  component: string;
}

export interface AdPagePlacement {
  slot: string;
  position: string;
  adsenseSlot?: string;
  trackingPosition?: string;
}

const SLOT_TYPES = placements.slotTypes as readonly AdSlotType[];

/** 枠の種類を id で引く。台帳に無い id はコードの誤りなので投げる */
export function adSlotType(id: string): AdSlotType {
  const found = SLOT_TYPES.find((slot) => slot.id === id);
  if (!found) throw new Error(`広告の枠の台帳に無い枠の種類: ${id}`);
  return found;
}

/** ページの種類ごとの置き方 (上から順) */
export function adPagePlacements(page: string): readonly AdPagePlacement[] {
  return (placements.pages as Record<string, AdPagePlacement[]>)[page] ?? [];
}
