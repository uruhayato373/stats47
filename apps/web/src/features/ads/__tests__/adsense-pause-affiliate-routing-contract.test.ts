import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = resolve(import.meta.dirname, '../../../../../..');
const AREA_PAGE = readFileSync(
  resolve(PROJECT_ROOT, 'apps/web/src/app/areas/[areaCode]/page.tsx'),
  'utf8'
);

describe('AdSense pause affiliate routing contract', () => {
  it('keeps prefecture monetization on prefecture-specific furusato links', () => {
    expect(AREA_PAGE).toContain('<FurusatoNozeiCard');
    expect(AREA_PAGE).toContain('position="area-furusato-content"');
    expect(AREA_PAGE).not.toContain('resolveAreaPageAffiliateBanners');
    expect(AREA_PAGE).not.toContain('position="area-content"');
    expect(AREA_PAGE).not.toContain('<AreaBannerAd');
  });

  it('preserves the AdSense branch for a one-switch rollback', () => {
    expect(AREA_PAGE).toContain('ADSENSE_DISPLAY_ENABLED && <InContentAdSlot');
    expect(AREA_PAGE).toContain('<InContentAdSlot slot={HUB_INCONTENT} />');
  });
});
