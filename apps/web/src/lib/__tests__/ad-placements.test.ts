import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import placements from '../../../../../config/ads/placements.json';
import { AFFILIATE_ADS } from '../../../scripts/affiliate-ads-data';
import { adSlotType } from '../ad-placements';

/**
 * 広告の枠の台帳 (config/ads/placements.json) とコードの照合 (2026-10-29 新設。同日ランキングを載せて一般化)。
 *
 * 台帳は「どの枠を、どのページの、どこに置くか」の正本。コードと別々に直すとずれるので、次をここで止める:
 *  (a) 置き方の目印 (marker) が、そのファイル (source) に台帳と同じ順である
 *  (b) 台帳の枠の部品をファイルに直に置くなら、台帳に載っている (載っていない枠を足さない)
 *  (c) 同じファイルで続く枠の間には内容がある。隣り合わせは knownAdjacentReason の例外だけで、直ったら例外も消す
 *  (d) 本文の AdSense は上限まで / 登録の大きさは台帳の語彙にある / 箱は本番の実測のまま
 */

const ROOT = path.resolve(__dirname, '../../../../..');
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');

type Placement = (typeof placements.pages)[keyof typeof placements.pages][number] & { knownAdjacentReason?: string };
const PAGES = placements.pages as Record<string, Placement[]>;
const SLOT_COMPONENTS = new Set(placements.slotTypes.map((slot) => slot.component));
/** 広告を描く部品 (隣り合わせの判定で「内容」に数えない) */
const AD_COMPONENTS = new Set([
  ...SLOT_COMPONENTS,
  'AdSenseAd', 'BannerAd', 'AffiliateAdSlot', 'SidebarPromoBanner', 'RakutenItemsCard', 'FurusatoNozeiCard',
]);

/**
 * 特定の指標でしか描かれないカード。隣り合わせの判定で内容に数えない (ほとんどのページで何も描かないため)。
 * 港湾の地図は港湾の指標だけ。2026-10-29 に、これを区切りに数えて PR と右レールの最後の AdSense の隣り合わせを見落とした
 */
const RARELY_RENDERED = new Set(['PortStatisticsMapCard']);

/** 置き方ごとに、ファイルの中の目印の位置を引く */
function locate(list: Placement[]) {
  return list.map((placement) => {
    const source = read(placement.source);
    return { placement, source, index: source.indexOf(placement.marker) };
  });
}

describe('広告の枠の台帳 (config/ads/placements.json)', () => {
  it('ページの置き方が指す枠の種類は台帳にある', () => {
    for (const [page, list] of Object.entries(PAGES)) {
      for (const placement of list) expect(() => adSlotType(placement.slot), `${page}: ${placement.slot}`).not.toThrow();
    }
  });

  it.each(Object.keys(PAGES))('%s: 目印がファイルにあり、同じファイルの中で台帳と同じ順に並ぶ', (page) => {
    const located = locate(PAGES[page]);
    for (const { placement, index } of located) {
      expect(index, `${placement.source} に ${placement.marker} が無い`).toBeGreaterThanOrEqual(0);
    }
    for (let i = 1; i < located.length; i++) {
      if (located[i].placement.source !== located[i - 1].placement.source) continue;
      expect(located[i].index, `${located[i].placement.marker} が前の枠より前にある`).toBeGreaterThan(located[i - 1].index);
    }
  });

  it.each(Object.keys(PAGES))('%s: ファイルに直に置いた台帳の枠の部品は、どれも台帳に載っている', (page) => {
    const sources = [...new Set(PAGES[page].map((p) => p.source))];
    for (const rel of sources) {
      const source = read(rel);
      const markers = PAGES[page].filter((p) => p.source === rel).map((p) => source.indexOf(p.marker));
      for (const match of source.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)) {
        if (!SLOT_COMPONENTS.has(match[1])) continue;
        const at = match.index ?? 0;
        // 目印は部品のタグか、その直後の属性 (slotId・position) にある
        expect(markers.some((m) => m >= at && m <= at + 400), `${rel} の <${match[1]}> が台帳に無い`).toBe(true);
      }
    }
  });

  it.each(Object.keys(PAGES))('%s: 続く枠の間に内容がある (隣り合わせは理由付きの例外だけ)', (page) => {
    const located = locate(PAGES[page]);
    for (let i = 1; i < located.length; i++) {
      const prev = located[i - 1];
      const cur = located[i];
      if (cur.placement.region !== prev.placement.region) continue;
      // 同じファイルなら 2 つの目印の間。別のファイル (右レールの最後に別のファイルが枠を足す) なら、前のファイルの目印より後ろ全部
      const between =
        cur.placement.source === prev.placement.source
          ? cur.source.slice(prev.index + prev.placement.marker.length, cur.index)
          : prev.source.slice(prev.index + prev.placement.marker.length);
      // 内容 = 広告ではない部品のタグか、広告ではない節の差し込み ({sections.relatedRankings} など。名前に affiliate を含む節は広告)
      const content = [
        ...[...between.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].filter((m) => !AD_COMPONENTS.has(m[1]) && !RARELY_RENDERED.has(m[1])),
        ...[...between.matchAll(/\{sections\.([A-Za-z0-9]+)\}/g)].filter((m) => !/affiliate/i.test(m[1])),
      ];
      const adjacent = content.length === 0;
      const label = `${page}: ${prev.placement.marker} → ${cur.placement.marker}`;
      if (adjacent) expect(cur.placement.knownAdjacentReason, `${label} が隣り合わせ`).toBeTruthy();
      // 直ったのに例外が残っていたら、例外を消す (例外を増やさない・残さない)
      else expect(cur.placement.knownAdjacentReason, `${label} は隣り合わせではない。knownAdjacentReason を消す`).toBeUndefined();
    }
  });

  it.each(Object.keys(PAGES))('%s: 本文の AdSense は上限まで', (page) => {
    const bodyAdsense = PAGES[page].filter((p) => p.slot === 'adsense-body').length;
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

  it('箱は本番の実測のまま (本文の AdSense 幅いっぱい × 280)', () => {
    expect(adSlotType('adsense-body').box).toEqual({ width: 'full', height: 280 });
  });
});
