// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { assertLinkCardTextLayout } from '../link-card-preview';
import { resolveLinkCardTitleLayout } from '../../../src/features/ogp/LinkCardOgp';

describe('external link-card readability', () => {
  const titleBox = {text:'年間日照時間',left:300,top:260,width:600,height:170};
  it('accepts readable primary text in the square safe area', () => {
    expect(() => assertLinkCardTextLayout([titleBox], titleBox.text, 100)).not.toThrow();
  });
  it('rejects the old left-aligned composition that gets cut off in note', () => {
    expect(() => assertLinkCardTextLayout([{...titleBox,left:64}], titleBox.text, 100)).toThrow('安全域');
  });
  it('rejects tiny primary text even when it technically fits', () => {
    expect(() => assertLinkCardTextLayout([titleBox], titleBox.text, 44)).toThrow('15px');
  });
  it('requires evidence for the actual headline, not an empty review', () => {
    expect(() => assertLinkCardTextLayout([], titleBox.text, 100)).toThrow('検査');
    expect(() => assertLinkCardTextLayout([{...titleBox,text:'別の主題'}], titleBox.text, 100)).toThrow('検査');
  });
  it('rejects overlapping headline and footer', () => {
    expect(() => assertLinkCardTextLayout([titleBox,{...titleBox,text:'stats47',top:400,height:40}], titleBox.text, 100)).toThrow('重な');
  });
  it('keeps statistical qualifiers and stops instead of truncating a long title', () => {
    const title='持ち家率（二人以上世帯）';
    expect(resolveLinkCardTitleLayout(title).text).toBe(title);
    expect(() => resolveLinkCardTitleLayout('長い指標名'.repeat(20))).toThrow('短い見出し');
  });
});
