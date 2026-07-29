import {
  HOME_PORTAL_USE_CASES,
  validateHomePortal,
  type HomePortalUseCase,
} from '@stats47/data-configs';
import { describe, expect, it } from 'vitest';

import { ALL_THEMES } from '@/features/theme-dashboard/server';

const THEME_KEYS = new Set(ALL_THEMES.map((theme) => theme.themeKey));

describe('validateHomePortal', () => {
  it('現行のhome portal設定は妥当', () => {
    expect(validateHomePortal(THEME_KEYS)).toEqual([]);
  });

  it('use caseのthemeKeyはすべてALL_THEMESに実在する', () => {
    for (const useCase of HOME_PORTAL_USE_CASES) {
      expect(THEME_KEYS.has(useCase.themeKey)).toBe(true);
    }
  });

  it('実在しないthemeKeyを拒否する', () => {
    const invalid: HomePortalUseCase[] = [
      {
        id: 'invalid',
        label: 'invalid',
        description: 'invalid',
        themeKey: 'no-such-theme',
        order: 1,
        isActive: true,
      },
    ];

    expect(
      validateHomePortal(THEME_KEYS, invalid).some((error) =>
        error.includes('no-such-theme')
      )
    ).toBe(true);
  });

  it('id・遷移先・orderの重複を拒否する', () => {
    const invalid: HomePortalUseCase[] = [
      {
        id: 'duplicate',
        label: 'a',
        description: 'a',
        themeKey: 'healthcare',
        order: 1,
        isActive: true,
      },
      {
        id: 'duplicate',
        label: 'b',
        description: 'b',
        themeKey: 'healthcare',
        order: 1,
        isActive: true,
      },
    ];
    const errors = validateHomePortal(THEME_KEYS, invalid);

    expect(errors).toContain('use case id 重複: duplicate');
    expect(errors.some((error) => error.includes('use case href 重複'))).toBe(
      true
    );
    expect(errors).toContain('use case order 重複: 1');
  });
});
