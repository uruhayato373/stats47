import { describe, expect, it } from 'vitest';

import {
  buildOgpPrompt,
  computeLegacyPromptHashV1,
  computePromptHash,
  resolveOgpVisual,
} from '../blog-ogp-visual';

describe('resolveOgpVisual — 優先順位', () => {
  it('explicit ogpVisualType が tags/category より優先される', () => {
    const r = resolveOgpVisual({
      ogpVisualType: 'timeline',
      category: 'population', // → people のはずだが explicit が勝つ
      tags: ['ranking'], // → comparison のはずだが explicit が勝つ
    });
    expect(r.visualType).toBe('timeline');
    expect(r.source).toBe('explicit');
  });

  it('explicit ogpMotif が有効なら採用、visualType 由来でも上書きできる', () => {
    const r = resolveOgpVisual({
      category: 'population',
      ogpMotif: 'generations',
    });
    expect(r.visualType).toBe('people');
    expect(r.motif).toBe('generations');
  });

  it('category → visualType 対応表を使う', () => {
    expect(resolveOgpVisual({ category: 'economy' }).visualType).toBe(
      'economy'
    );
    expect(resolveOgpVisual({ category: 'agriculture' }).visualType).toBe(
      'industry'
    );
    expect(resolveOgpVisual({ category: 'landweather' }).source).toBe(
      'category'
    );
  });

  it('category が無ければ archetype、無ければ tags の順で決まる', () => {
    expect(resolveOgpVisual({ archetype: 'C' }).visualType).toBe('timeline');
    expect(resolveOgpVisual({ archetype: 'C' }).source).toBe('archetype');
    expect(resolveOgpVisual({ tags: ['future'] }).visualType).toBe('timeline');
    expect(resolveOgpVisual({ tags: ['ranking'] }).source).toBe('tags');
  });

  it('tags は登録順で最初に一致したものを採る', () => {
    // income(economy) が labor(industry) より先に登録されている
    const r = resolveOgpVisual({ tags: ['unknown-tag', 'income', 'labor'] });
    expect(r.visualType).toBe('economy');
  });
});

describe('resolveOgpVisual — 既定・不正値の安全な落とし込み', () => {
  it('何も一致しなければ既定 map / prefecture-comparison', () => {
    const r = resolveOgpVisual({});
    expect(r.visualType).toBe('map');
    expect(r.motif).toBe('prefecture-comparison');
    expect(r.source).toBe('default');
  });

  it('不正な ogpVisualType は無視して次 tier / 既定へ落ちる', () => {
    expect(resolveOgpVisual({ ogpVisualType: 'banana' }).source).toBe(
      'default'
    );
    expect(
      resolveOgpVisual({ ogpVisualType: 'banana', category: 'population' })
        .visualType
    ).toBe('people');
  });

  it('不正な ogpMotif は visualType の既定 motif に落ちる', () => {
    const r = resolveOgpVisual({
      ogpVisualType: 'economy',
      ogpMotif: 'not-a-motif',
    });
    expect(r.visualType).toBe('economy');
    expect(r.motif).toBe('coins-budget'); // economy の既定 motif
  });
});

describe('computePromptHash — 決定性と変化', () => {
  const base = {
    visualType: 'people' as const,
    motif: 'households',
    title: '秋田の人口',
  };

  it('同一入力は同一 hash', () => {
    expect(computePromptHash(base)).toBe(computePromptHash(base));
  });

  it('title / motif / model / promptVersion / visualType の変化で hash が変わる', () => {
    const h0 = computePromptHash(base);
    expect(computePromptHash({ ...base, title: '青森の人口' })).not.toBe(h0);
    expect(computePromptHash({ ...base, motif: 'generations' })).not.toBe(h0);
    expect(computePromptHash({ ...base, model: 'other-model' })).not.toBe(h0);
    expect(
      computePromptHash({ ...base, promptVersion: 'blog-ogp-v2' })
    ).not.toBe(h0);
    expect(computePromptHash({ ...base, visualType: 'map' })).not.toBe(h0);
  });

  it('hash は sha256- プレフィックス付き', () => {
    expect(computePromptHash(base)).toMatch(/^sha256-[0-9a-f]{64}$/);
  });

  it('legacy hash migration is enabled only for the frozen v1 prompt catalog', () => {
    expect(computeLegacyPromptHashV1(base)).toMatch(/^sha256-[0-9a-f]{16}$/);
    expect(
      computeLegacyPromptHashV1({
        ...base,
        promptVersion: 'blog-ogp-v2',
      })
    ).toBeNull();
  });
});

describe('buildOgpPrompt', () => {
  it('固定スタイルの no-text ガードと motif 主題を含み、タイトルはテーマ文脈で入る', () => {
    const p = buildOgpPrompt({
      visualType: 'map',
      motif: 'prefecture-comparison',
      title: '日本の人口',
    });
    expect(p).toContain('no text');
    expect(p).toContain('Japanese archipelago');
    expect(p).toContain('do not render any text');
    expect(p).toContain('日本の人口');
  });
});
