import { describe, expect, it } from 'vitest';

import {
  RANKING_THUMBNAIL_SIZE,
  RANKING_THUMBNAIL_VERSION,
  rankingThumbnailKeys,
} from '../ranking-thumbnail';

describe('rankingThumbnailKeys', () => {
  it('route対応のcanonical R2キーを返す', () => {
    expect(rankingThumbnailKeys('annual-sunshine-duration')).toEqual({
      light: 'app/ranking/annual-sunshine-duration/thumbnail-light.webp',
      dark: 'app/ranking/annual-sunshine-duration/thumbnail-dark.webp',
      manifest: 'app/ranking/annual-sunshine-duration/thumbnail.json',
    });
    expect(RANKING_THUMBNAIL_VERSION).toBe(4);
    expect(RANKING_THUMBNAIL_SIZE).toEqual({ width: 640, height: 360 });
  });
});
