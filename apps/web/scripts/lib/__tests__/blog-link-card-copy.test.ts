import { describe, expect, it } from 'vitest';

import { createBlogImagePlan, resolveBlogImageData } from '../blog-image-generation';

describe('short external blog card copy', () => {
  const full = {title:'下水道普及率が低い県は不衛生なのか？徳島22%の意外な真相',subtitle:null};
  it('shortens the approved headline without changing the original article input', () => {
    const data = resolveBlogImageData('sewerage-water-supply-gap',full);
    expect(data.title).toBe('下水道普及率と衛生の関係');
    expect(full.title).toContain('徳島22%');
    expect(resolveBlogImageData('sewerage-water-supply-gap',data)).toEqual(data);
  });
  it('rejects stale short copy after the article topic changes', () => {
    expect(()=>resolveBlogImageData('sewerage-water-supply-gap',{title:'別の主題',subtitle:null})).toThrow(/review/);
  });
  it('keeps unrelated plan fingerprints stable', () => {
    const options = {slug:'other',data:full,background:{source:'brand' as const},rendererHash:'a'.repeat(64)};
    expect(resolveBlogImageData('other',full)).toBe(full);
    expect(createBlogImagePlan({...options,data:resolveBlogImageData('other',full)}).fingerprint).toBe(createBlogImagePlan(options).fingerprint);
  });
});
