import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ResponsiveArticleImage } from '../ResponsiveArticleImage';

function mobileSource(container: HTMLElement): HTMLSourceElement | null {
  return container.querySelector('source');
}

describe('ResponsiveArticleImage', () => {
  it('4:5 の型の画像は PC で 560px までに抑え、横長の図は広げたままにする', () => {
    const { container: typed } = render(<ResponsiveArticleImage src="data/income-ranking.svg" alt="順位" />);
    expect(typed.querySelector('img')?.className).toContain('sm:max-w-[560px]');
    const { container: lines } = render(<ResponsiveArticleImage src="data/rate-lines.svg" alt="推移" />);
    expect(lines.querySelector('img')?.className).toContain('sm:max-w-[560px]');
    const { container: legacy } = render(<ResponsiveArticleImage src="data/rate-trend.svg" alt="推移" />);
    expect(legacy.querySelector('img')?.className).not.toContain('max-w-[560px]');
    const { container: wide } = render(<ResponsiveArticleImage src="data/tax-breakdown.svg" alt="内訳" />);
    expect(wide.querySelector('img')?.className).not.toContain('max-w-[560px]');
  });

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

  it('ランキングはスマホ版に切り替え、比率は 4:5 の型の画像に任せる (2:3 に固定しない)', () => {
    const { container } = render(<ResponsiveArticleImage src="data/golf-ranking.svg" alt="ランキング" />);

    expect(mobileSource(container)).toHaveAttribute('srcset', 'data/golf-ranking-mobile.svg');
    expect(container.querySelector('picture')?.className).not.toContain('aspect-2/3');
  });

  it('ランキングと地図は暗い表示のとき -dark.svg を出し、明るい版は隠す', () => {
    const { container } = render(<ResponsiveArticleImage src="data/golf-map.svg" alt="地図" />);

    const [light, dark] = screen.getAllByAltText('地図');
    expect(container.querySelector('picture')?.className).toContain('dark:hidden');
    expect(light.getAttribute('src')).toContain('data/golf-map.svg');
    expect(dark.getAttribute('src')).toContain('data/golf-map-dark.svg');
    expect(dark.className).toContain('hidden');
    expect(dark.className).toContain('dark:block');
    expect(mobileSource(container)).toBeNull();
  });

  it('-dark.svg が無い図は読み込み失敗で暗い表示でも明るい版を出す', () => {
    const { container } = render(<ResponsiveArticleImage src="data/golf-ranking.svg" alt="ランキング" />);

    fireEvent.error(screen.getAllByAltText('ランキング')[1]);

    expect(screen.getAllByAltText('ランキング')).toHaveLength(1);
    expect(container.querySelector('picture')?.className).not.toContain('dark:hidden');
  });

  it('対象外の図は切り替えない', () => {
    const { container } = render(<ResponsiveArticleImage src="data/golf-flow.svg" alt="流れ図" />);

    expect(mobileSource(container)).toBeNull();
    expect(screen.getAllByAltText('流れ図')).toHaveLength(1);
  });
});
