import { describe, expect, it } from 'vitest';

import { THEME_CATALOGS } from '../../theme-catalog';
import { JAPAN_CATALOGS } from '../japan-catalog';
import { KNOWN_MUNICIPALITY_THEME_SLUGS } from '../municipality-catalog';
import {
  MUNICIPALITY_THEME_FOR_PREFECTURE_THEME,
  PREFECTURE_THEME_FOR_MUNICIPALITY_THEME,
  scopeHrefsForJapanTheme,
  scopeHrefsForMunicipalityRanking,
  scopeHrefsForMunicipalityTheme,
  scopeHrefsForPrefectureTheme,
} from '../scope-theme-links';

/** カタログを持たない都道府県テーマのページ (`app/themes/local-finance` ほか)。 */
const BESPOKE_PREFECTURE_THEMES = new Set(['local-finance', 'climate']);
const isPrefectureTheme = (key: string) => key in THEME_CATALOGS || BESPOKE_PREFECTURE_THEMES.has(key);

describe('主語を切り替えたときの同じ主題への対応表', () => {
  it('都道府県→市区町村: 両端とも公開中のテーマ', () => {
    for (const [prefectureTheme, municipalityTheme] of Object.entries(MUNICIPALITY_THEME_FOR_PREFECTURE_THEME)) {
      expect(isPrefectureTheme(prefectureTheme), prefectureTheme).toBe(true);
      expect(KNOWN_MUNICIPALITY_THEME_SLUGS.has(municipalityTheme), municipalityTheme).toBe(true);
    }
  });

  it('市区町村→都道府県: 公開中の市区町村テーマを全件、公開中の都道府県テーマへ対応させる', () => {
    expect(new Set(Object.keys(PREFECTURE_THEME_FOR_MUNICIPALITY_THEME))).toEqual(new Set(KNOWN_MUNICIPALITY_THEME_SLUGS));
    for (const prefectureTheme of Object.values(PREFECTURE_THEME_FOR_MUNICIPALITY_THEME)) {
      expect(isPrefectureTheme(prefectureTheme), prefectureTheme).toBe(true);
    }
  });

  it('リンク先は対応のある主語だけを返し、日本のテーマは存在するときだけ', () => {
    // 全国の市区町村を比べるページの slug は都道府県のテーマ名 (2026-10-31 IA-REGION-THEME-01)
    expect(scopeHrefsForPrefectureTheme('living-housing')).toMatchObject({ municipalities: '/municipalities/themes/living-housing' });
    expect(scopeHrefsForPrefectureTheme('climate').municipalities).toBeUndefined();
    expect(scopeHrefsForMunicipalityTheme('municipal-revenue').prefectures).toBe('/themes/local-finance');
    expect(scopeHrefsForJapanTheme('education-culture')).toEqual({
      prefectures: '/themes/education-culture',
      municipalities: '/municipalities/themes/education-culture',
    });
    for (const slug of KNOWN_MUNICIPALITY_THEME_SLUGS) {
      const japan = scopeHrefsForMunicipalityTheme(slug).japan;
      if (japan) expect(JAPAN_CATALOGS[japan.replace('/japan/', '')]).toBeDefined();
    }
  });

  it('市区町村ランキング: 同じ key の都道府県ランキングがあればそこへ、無ければテーマの対応先へ', () => {
    expect(scopeHrefsForMunicipalityRanking('rooms-per-dwelling', () => true).prefectures).toBe('/ranking/rooms-per-dwelling');
    expect(scopeHrefsForMunicipalityRanking('vacant-houses-city', () => false).prefectures).toBe('/themes/living-housing');
  });
});
