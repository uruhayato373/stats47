import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { HorizontalCardCarousel } from '../HorizontalCardCarousel';

describe('HorizontalCardCarousel', () => {
  it('overflow時だけ左右矢印を表示し、表示カード単位で移動する', () => {
    window.matchMedia = vi.fn().mockReturnValue({ matches: true });

    render(
      <HorizontalCardCarousel ariaLabel="テストカード">
        <a href="/1">1</a>
        <a href="/2">2</a>
        <a href="/3">3</a>
        <a href="/4">4</a>
        <a href="/5">5</a>
      </HorizontalCardCarousel>
    );

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
    expect(rightButton).toHaveClass(
      'h-9',
      'w-9',
      'sm:h-8',
      'sm:w-8',
      '-right-2'
    );
    expect(rightButton.querySelector('svg')).toHaveClass('size-4');
    expect(
      screen.queryByRole('button', { name: 'テストカードを左へ' })
    ).not.toBeInTheDocument();

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
      screen.queryByRole('button', { name: 'テストカードを右へ' })
    ).not.toBeInTheDocument();
  });
});
