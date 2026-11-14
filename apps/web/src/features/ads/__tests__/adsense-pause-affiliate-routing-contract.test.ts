// @vitest-environment node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const PROJECT_ROOT = resolve(import.meta.dirname, '../../../../../..');
const AREA_PAGE = readFileSync(
  resolve(PROJECT_ROOT, 'apps/web/src/app/areas/[areaCode]/page.tsx'),
  'utf8'
);

describe('AdSense pause affiliate routing contract', () => {
  it('does not bring back the removed Rakuten furusato card or the older banners', () => {
    expect(AREA_PAGE).not.toContain('FurusatoNozeiCard');
    expect(AREA_PAGE).not.toContain('resolveAreaPageAffiliateBanners');
    expect(AREA_PAGE).not.toContain('position="area-content"');
    expect(AREA_PAGE).not.toContain('<AreaBannerAd');
  });

  // 2026-11-03: 県の本文の AdSense は広告の段 (AdRow) に入れた。AdSense を止めると composeAdRows が AdSense の枠を落とす
  it('preserves the AdSense branch for a one-switch rollback', () => {
    expect(AREA_PAGE).toContain('composeAdRows(');
    expect(AREA_PAGE).toContain('[AREA_DATABOOK_ROW_1, AREA_DATABOOK_ROW_2, AREA_DATABOOK_ROW_3, AREA_AFTER_DATABOOK, AREA_END]');
  });
});
