import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  HorizontalCardCarousel,
  HorizontalCardCarouselControls,
  HorizontalCardCarouselSection,
} from '../HorizontalCardCarousel';

describe('HorizontalCardCarousel', () => {
  it('overflow時だけ見出し行に左右矢印を表示し、表示カード単位で移動する', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });

    render(
      <HorizontalCardCarouselSection>
        <div data-testid="header">
          <HorizontalCardCarouselControls />
        </div>
        <HorizontalCardCarousel ariaLabel="テストカード">
          <a href="/1">1</a>
          <a href="/2">2</a>
          <a href="/3">3</a>
          <a href="/4">4</a>
          <a href="/5">5</a>
        </HorizontalCardCarousel>
      </HorizontalCardCarouselSection>
    );

    // 横に動かせないうちは矢印を描かない (操作だけの行を作らない)
    expect(
      screen.queryByRole('button', { name: 'テストカードを右へ' })
    ).not.toBeInTheDocument();

    const region = screen.getByRole('region', { name: /テストカード/ });
    Object.defineProperties(region, {
      clientWidth: { configurable: true, value: 400 },
      scrollWidth: { configurable: true, value: 800 },
      scrollLeft: { configurable: true, value: 0, writable: true },
    });
    vi.spyOn(
      region.firstElementChild as HTMLElement,
      'getBoundingClientRect'
    ).mockReturnValue({ width: 100 } as DOMRect);
    const scrollBy = vi.fn();
    region.scrollBy = scrollBy;

    fireEvent.scroll(region);
    const rightButton = screen.getByRole('button', {
      name: 'テストカードを右へ',
    });
    expect(rightButton).toBeEnabled();
    // 矢印はカードに重ねない: 見出し行 (カード列の外) に置き、絶対配置もしない。
    expect(screen.getByTestId('header')).toContainElement(rightButton);
    expect(region.contains(rightButton)).toBe(false);
    expect(rightButton).not.toHaveClass('absolute');
    expect(
      rightButton.compareDocumentPosition(region) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(rightButton.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(
      screen.getByRole('button', { name: 'テストカードを左へ' })
    ).toBeDisabled();

    fireEvent.click(rightButton);
    expect(scrollBy).toHaveBeenCalledWith({
      left: 300,
      behavior: 'auto',
    });

    region.scrollLeft = 400;
    fireEvent.scroll(region);
    expect(
      screen.getByRole('button', { name: 'テストカードを左へ' })
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'テストカードを右へ' })
    ).toBeDisabled();
  });
});
