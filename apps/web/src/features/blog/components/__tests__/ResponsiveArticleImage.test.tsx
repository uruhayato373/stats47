import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ResponsiveArticleImage } from '../ResponsiveArticleImage';

function mobileSource(container: HTMLElement): HTMLSourceElement | null {
  return container.querySelector('source');
}

describe('ResponsiveArticleImage', () => {
  it('積み上げ棒は 639px 以下で -mobile.svg に切り替え、比率は画像に任せる (2:3 に固定しない)', () => {
    const { container } = render(<ResponsiveArticleImage src="data/tax-breakdown.svg" alt="内訳" />);

    const source = mobileSource(container);
    expect(source).toHaveAttribute('srcset', 'data/tax-breakdown-mobile.svg');
    expect(source).toHaveAttribute('media', '(max-width: 639px)');
    expect(container.querySelector('picture')?.className).not.toContain('aspect-2/3');
  });

  it('-mobile.svg が無い記事は読み込み失敗で切り替えを外し、横長だけを出す', () => {
    const { container } = render(<ResponsiveArticleImage src="data/household-stacked.svg" alt="構成" />);

    fireEvent.error(screen.getByAltText('構成'));

    expect(mobileSource(container)).toBeNull();
    expect(screen.getByAltText('構成').getAttribute('src')).toContain('data/household-stacked.svg');
  });

  it('ランキングは従来どおり 2:3 の枠で切り替える', () => {
    const { container } = render(<ResponsiveArticleImage src="data/golf-ranking.svg" alt="ランキング" />);

    expect(mobileSource(container)).toHaveAttribute('srcset', 'data/golf-ranking-mobile.svg');
    expect(container.querySelector('picture')?.className).toContain('aspect-2/3');
  });

  it('対象外の図は切り替えない', () => {
    const { container } = render(<ResponsiveArticleImage src="data/golf-map.svg" alt="地図" />);

    expect(mobileSource(container)).toBeNull();
  });
});
