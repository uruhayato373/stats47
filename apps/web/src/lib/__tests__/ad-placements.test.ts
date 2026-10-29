import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import placements from '../../../../../config/ads/placements.json';
import { AFFILIATE_ADS } from '../../../scripts/affiliate-ads-data';
import { adPagePlacements, adSlotType } from '../ad-placements';

/**
 * 広告の枠の台帳 (config/ads/placements.json) とコードの照合 (2026-10-29 新設)。
 *
 * 台帳は「どの枠を、どのページの、どこに置くか」の正本。コードと別々に直すとずれるので、次をここで止める:
 *  (a) ページのコードに、台帳と同じ枠が同じ順で置かれている (台帳に無い広告の部品を置かない)
 *  (b) 広告の枠同士を間に内容を挟まずに並べない / 本文の AdSense は上限まで
 *  (c) 登録されている広告の大きさは、すべて台帳の大きさの語彙に載っている (新しい大きさは台帳で判断してから)
 *  (d) 本文の AdSense の箱は本番の実測 (幅いっぱい × 280) のまま
 */

const ROOT = path.resolve(__dirname, '../../../../..');
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');

/** ページの種類 → そのページを組み立てるコード */
const PAGE_SOURCES: Record<string, string> = {
  theme: 'apps/web/src/features/theme-dashboard/components/ThemePageLayout.tsx',
};

/** 広告の部品 (台帳の slotTypes の component) の出現を、ソースの中の位置の順に拾う */
function adComponentsInOrder(source: string) {
  const components = new Set(placements.slotTypes.map((slot) => slot.component));
  const found: { component: string; index: number; tag: string }[] = [];
  for (const match of source.matchAll(/<([A-Z][A-Za-z0-9]*)\b([^>]*)/g)) {
    if (components.has(match[1])) found.push({ component: match[1], index: match.index ?? 0, tag: match[0] });
  }
  return found;
}

describe('広告の枠の台帳 (config/ads/placements.json)', () => {
  it('ページの置き方が指す枠の種類は台帳にある', () => {
    for (const [page, list] of Object.entries(placements.pages)) {
      for (const placement of list) expect(() => adSlotType(placement.slot), `${page}: ${placement.slot}`).not.toThrow();
    }
  });

  it.each(Object.keys(PAGE_SOURCES))('%s: コードの広告の部品が台帳と同じ順で置かれている', (page) => {
    const source = read(PAGE_SOURCES[page]);
    const expected = adPagePlacements(page);
    const actual = adComponentsInOrder(source);
    expect(actual.map((a) => a.component)).toEqual(expected.map((p) => adSlotType(p.slot).component));
    expected.forEach((placement, i) => {
      if (placement.adsenseSlot) expect(actual[i].tag).toContain(`slot={${placement.adsenseSlot}}`);
      if (placement.trackingPosition) {
        expect(source.slice(actual[i].index, actual[i].index + 400)).toContain(`position="${placement.trackingPosition}"`);
      }
    });
  });

  it.each(Object.keys(PAGE_SOURCES))('%s: 広告の枠同士を隣り合わせにせず、本文の AdSense は上限まで', (page) => {
    const source = read(PAGE_SOURCES[page]);
    const actual = adComponentsInOrder(source);
    for (let i = 1; i < actual.length; i++) {
      // 前の枠の終わりから次の枠までの間に、広告ではない部品 (内容) が 1 つ以上ある
      const between = source.slice(actual[i - 1].index + actual[i - 1].tag.length, actual[i].index);
      const contentTags = [...between.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].map((m) => m[1]);
      expect(contentTags.length, `${actual[i - 1].component} と ${actual[i].component} の間に内容が無い`).toBeGreaterThan(0);
    }
    const bodyAdsense = adPagePlacements(page).filter((p) => p.slot === 'adsense-body').length;
    expect(bodyAdsense).toBeLessThanOrEqual(placements.rules.maxAdsenseBodyPerPage);
  });

  it('登録されている広告の大きさは、すべて台帳の大きさの語彙に載っている', () => {
    const vocabulary = new Map(placements.sizes.map((s) => [s.size, s]));
    for (const ad of AFFILIATE_ADS.filter((a) => a.isActive !== false)) {
      const size = ad.adType === 'banner' ? `${ad.width}x${ad.height}` : 'text';
      const entry = vocabulary.get(size);
      expect(entry, `${ad.id} の大きさ ${size} が台帳に無い`).toBeDefined();
      // 判断待ち・退役の大きさは、対象の登録を台帳に名指しする (知らないうちに増えない)
      if (entry && entry.status !== 'standard') expect(entry.adIds, `${ad.id} (${size})`).toContain(ad.id);
    }
  });

  it('本文の AdSense の箱は本番の実測 (幅いっぱい × 280) のまま', () => {
    expect(adSlotType('adsense-body').box).toEqual({ width: 'full', height: 280 });
  });
});
