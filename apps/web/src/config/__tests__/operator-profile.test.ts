import { describe, expect, it } from 'vitest';

import { OPERATOR_PROFILE, OPERATOR_SOCIAL_URLS } from '../operator-profile';

describe('operator-profile SSOT', () => {
  it('構造化データ用URLを表示用リンクと同じ定義から導出する', () => {
    expect(OPERATOR_SOCIAL_URLS).toEqual([
      OPERATOR_PROFILE.links.note,
      OPERATOR_PROFILE.links.x,
      OPERATOR_PROFILE.links.instagram,
      OPERATOR_PROFILE.links.youtube,
    ]);
  });

  it('有効なstats47公式Xアカウントを参照する', () => {
    expect(OPERATOR_PROFILE.links.x).toBe('https://x.com/stats47jp373');
  });
});
