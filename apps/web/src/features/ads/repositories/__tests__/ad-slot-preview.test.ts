import { afterEach, describe, expect, it, vi } from 'vitest';

import { AFFILIATE_VERTICALS } from '../../constants/affiliate-category';
import { buildPreviewAffiliateAds, isAdSlotPreviewEnabled } from '../ad-slot-preview';

// 開発用の広告枠の表示 (2026-10-30)。在庫を代わりの広告で満たして配置を確かめる。本番では働かない
describe('開発用の広告枠の表示', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('AD_SLOT_PREVIEW=1 の開発環境だけで働き、本番のビルドでは働かない', () => {
    vi.stubEnv('AD_SLOT_PREVIEW', '1');
    vi.stubEnv('NODE_ENV', 'development');
    expect(isAdSlotPreviewEnabled()).toBe(true);
    vi.stubEnv('NODE_ENV', 'production');
    expect(isAdSlotPreviewEnabled()).toBe(false);
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('AD_SLOT_PREVIEW', '');
    expect(isAdSlotPreviewEnabled()).toBe(false);
  });

  it('全ての意図軸に 300×250 のバナー 8 枚と、場所ごとのテキスト広告 4 本を用意する', () => {
    const ads = buildPreviewAffiliateAds();
    for (const vertical of AFFILIATE_VERTICALS) {
      const own = ads.filter((ad) => ad.vertical === vertical);
      const banners = own.filter((ad) => ad.adType === 'banner');
      expect(banners, vertical).toHaveLength(8);
      expect(banners.every((ad) => ad.width === 300 && ad.height === 250 && ad.imageUrl?.startsWith('data:image/svg+xml'))).toBe(true);
      expect(own.filter((ad) => ad.adType === 'text' && ad.locationCode === 'sidebar-bottom')).toHaveLength(4);
      expect(own.filter((ad) => ad.adType === 'text' && ad.locationCode === 'footer')).toHaveLength(4);
    }
    // 同じ行き先は配信側で 1 つにまとめられるので、行き先 (htmlContent) と id は全て別にする
    expect(new Set(ads.map((ad) => ad.htmlContent)).size).toBe(ads.length);
    expect(new Set(ads.map((ad) => ad.id)).size).toBe(ads.length);
  });
});
