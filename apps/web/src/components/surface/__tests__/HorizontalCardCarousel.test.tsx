import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  HorizontalCardCarousel,
  HorizontalCardCarouselControls,
  HorizontalCardCarouselFrame,
  HorizontalCardCarouselSection,
} from '../HorizontalCardCarousel';

describe('HorizontalCardCarousel', () => {
  it('1 画面の枚数を本文の幅 (コンテナ) で決め、カードの格子と同じく上限 3 枚にする', () => {
    render(
      <HorizontalCardCarousel ariaLabel="幅の検査">
        <a href="/1">1</a>
      </HorizontalCardCarousel>
    );
    const region = screen.getByRole('region', { name: /幅の検査/ });
    // 枚数は包みの幅を見る (スクロールする要素は自分の幅を問い合わせられない)
    expect(region.parentElement).toHaveClass('@container');
    const classes = region.className.split(/\s+/);
    // 画面の幅で決める書き方 (sm:/lg:/xl:) に戻さない。サイドバーの有無で本文の幅が変わっても枚数が変わらず、
    // 同じ画面で格子は 3 列・カルーセルは 4 枚とずれた (2026-11-03)
    expect(classes.filter((c) => /^(sm|md|lg|xl|2xl):auto-cols-/.test(c))).toEqual([]);
    expect(classes.filter((c) => c.startsWith('@sm:auto-cols-'))).toHaveLength(1);
    expect(classes.filter((c) => c.startsWith('@md:auto-cols-'))).toHaveLength(1);
    // 4 枚目の段 (@lg 以上) は作らない
    expect(classes.filter((c) => /^@(lg|xl|2xl):auto-cols-/.test(c))).toEqual([]);
  });

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

  it('Frame は題名をカードの見出し (h2) に置き、カード列を区切り線のセルにする', () => {
    render(
      <HorizontalCardCarouselFrame
        title="注目のランキング"
        action={<button type="button">もっと見る</button>}
      >
        <HorizontalCardCarousel ariaLabel="注目">
          <a href="/1">1</a>
          <a href="/2">2</a>
        </HorizontalCardCarousel>
      </HorizontalCardCarouselFrame>
    );

    const heading = screen.getByRole('heading', { level: 2, name: '注目のランキング' });
    expect(heading.closest('[data-slot="card-header"]')).not.toBeNull();
    expect(screen.getByRole("button", { name: "もっと見る" }).closest('[data-slot="card-action"]')).not.toBeNull();

    const region = screen.getByRole('region', { name: /注目/ });
    // カードを入れ子にしない: 隙間なしの区切り線のセル。項目側は data-carousel=cells で枠を外す
    expect(region).toHaveAttribute('data-carousel', 'cells');
    expect(region).toHaveClass('divide-x');
    expect(region).not.toHaveClass('gap-3');
  });

  it('Frame の外では従来どおり隙間付きのカード列になる', () => {
    render(
      <HorizontalCardCarousel ariaLabel="単独">
        <a href="/1">1</a>
      </HorizontalCardCarousel>
    );
    const region = screen.getByRole('region', { name: /単独/ });
    expect(region).toHaveAttribute('data-carousel', 'cards');
    expect(region).toHaveClass('gap-3');
  });
});
