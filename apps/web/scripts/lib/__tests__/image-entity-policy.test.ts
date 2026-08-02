import { describe, expect, it } from 'vitest';

import { isSafeNoteSlug } from '../image-entity-policy';

describe('image entity policy', () => {
  it('accepts canonical note slugs including the existing uppercase vertical prefix', () => {
    expect(isSafeNoteSlug('A-laborwage-commute-time-prefecture')).toBe(true);
    expect(isSafeNoteSlug('stats47-note-2026')).toBe(true);
  });

  it('rejects path traversal and URL/path separators', () => {
    for (const slug of ['../note', '/note', 'note/path', 'note\\\\path', 'note slug', '']) {
      expect(isSafeNoteSlug(slug)).toBe(false);
    }
  });
});
