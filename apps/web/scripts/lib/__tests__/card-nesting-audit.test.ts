import { describe, expect, it } from 'vitest';

import { findNestedCardSurfaces } from '../card-nesting-audit.mjs';

describe('findNestedCardSurfaces', () => {
  it('div を挟んだ card-in-card を検出する', () => {
    const result = findNestedCardSurfaces(`
      export function Example() {
        return (
          <SurfaceSection>
            <div><SurfaceCard>value</SurfaceCard></div>
          </SurfaceSection>
        );
      }
    `);

    expect(result).toEqual([
      expect.objectContaining({
        parent: 'SurfaceSection',
        child: 'SurfaceCard',
      }),
    ]);
  });

  it('隣接するカードと文字列中のタグ名は検出しない', () => {
    const result = findNestedCardSurfaces(`
      const note = '<SurfaceSection><SurfaceCard /></SurfaceSection>';
      export function Example() {
        return <><SurfaceSection>one</SurfaceSection><SurfaceCard>two</SurfaceCard></>;
      }
    `);

    expect(result).toEqual([]);
  });

  it('複数階層の surface をそれぞれ検出する', () => {
    const result = findNestedCardSurfaces(`
      <ArticleCard>
        <SurfaceSection>
          <ChartCard />
        </SurfaceSection>
      </ArticleCard>
    `);

    expect(result).toEqual([
      expect.objectContaining({ parent: 'ArticleCard', child: 'SurfaceSection' }),
      expect.objectContaining({ parent: 'SurfaceSection', child: 'ChartCard' }),
    ]);
  });

  it('getSurfaceCardClassName で作った外枠のネストも検出する', () => {
    const result = findNestedCardSurfaces(`
      <div className={getSurfaceCardClassName()}>
        <Link className={getSurfaceCardClassName({ interactive: true })}>go</Link>
      </div>
    `);

    expect(result).toEqual([
      expect.objectContaining({
        parent: 'div[getSurfaceCardClassName]',
        child: 'Link[getSurfaceCardClassName]',
      }),
    ]);
  });

  it('border と card 背景を直書きした外枠のネストも検出する', () => {
    const result = findNestedCardSurfaces(`
      <section className="border bg-card p-4">
        <div className="overflow-hidden border bg-card">value</div>
      </section>
    `);

    expect(result).toEqual([
      expect.objectContaining({
        parent: 'section[card-classes]',
        child: 'div[card-classes]',
      }),
    ]);
  });

});
