import { THEME_INDICATOR_SETS } from '@stats47/types';
import { describe, expect, it } from 'vitest';

import {
  THEME_THUMBNAIL_SUBJECTS,
  buildThemeThumbnailPrompt,
  getThemeThumbnailOutput,
  getThemeThumbnailSource,
  type ThemeThumbnailKey,
} from '../../data/theme-thumbnail-catalog';

const catalogKeys = Object.keys(THEME_THUMBNAIL_SUBJECTS) as ThemeThumbnailKey[];

describe('テーマのサムネイルのカタログ', () => {
  it('公開中のテーマと同じキーを過不足なく持つ (テーマを足したら絵の主題も足す)', () => {
    const themeKeys = THEME_INDICATOR_SETS.map((set) => set.key).sort();
    expect([...catalogKeys].sort()).toEqual(themeKeys);
  });

  it('依頼文は文字の面と文字を入れない共通の指示を全テーマで持つ', () => {
    for (const key of catalogKeys) {
      const prompt = buildThemeThumbnailPrompt(key);
      expect(prompt).toContain('no empty text panel');
      expect(prompt).toContain('Strictly no text');
      expect(prompt).toContain(THEME_THUMBNAIL_SUBJECTS[key].scene);
    }
  });

  it('描く小物はテーマごとに違う (同じ絵が並ばない)', () => {
    const scenes = catalogKeys.map((key) => THEME_THUMBNAIL_SUBJECTS[key].scene);
    expect(new Set(scenes).size).toBe(scenes.length);
  });

  it('元画像と配信画像の置き場はキーから決まる', () => {
    expect(getThemeThumbnailSource('healthcare')).toBe('assets/themes/thumbnails/healthcare.png');
    expect(getThemeThumbnailOutput('healthcare')).toBe('apps/web/public/images/themes/healthcare.webp');
  });
});
