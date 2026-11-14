import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { LinkRowNav, StatisticsScopeNav } from '../StatisticsScopeNav';

describe('StatisticsScopeNav', () => {
  it('3つの公開スコープを共通URLへ接続する', () => {
    render(<StatisticsScopeNav current="municipalities" />);

    expect(screen.getByRole('link', { name: '47都道府県' })).toHaveAttribute(
      'href',
      '/themes'
    );
    expect(screen.getByRole('link', { name: '市区町村' })).toHaveAttribute(
      'href',
      '/municipalities'
    );
    expect(screen.getByRole('link', { name: '日本' })).toHaveAttribute(
      'href',
      '/japan'
    );
  });

  it('現在スコープだけaria-current=pageにする', () => {
    render(<StatisticsScopeNav current="japan" />);

    expect(screen.getByRole('link', { name: '日本' })).toHaveAttribute(
      'aria-current',
      'page'
    );
    expect(
      screen.getByRole('link', { name: '47都道府県' })
    ).not.toHaveAttribute('aria-current');
  });

  it('左レールでも同じリンクを比較単位として表示する', () => {
    render(<StatisticsScopeNav current="prefectures" variant="rail" />);

    const nav = screen.getByRole('navigation', { name: '統計の地域単位' });
    expect(nav).toHaveTextContent('比較単位');
    expect(
      screen.getByRole('link', { name: '47都道府県' })
    ).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: '市区町村' })).toHaveAttribute(
      'href',
      '/municipalities'
    );
  });
});

describe('LinkRowNav', () => {
  const items = Array.from({ length: 18 }, (_, index) => ({
    key: `section-${index}`,
    label: `節${index}`,
    href: `#databook-section-${index}`,
  }));

  it('既定は 1 行の横スクロールにし、右端のフェードで続きを示す', () => {
    render(<LinkRowNav label="このページの内容" items={items} />);

    const nav = screen.getByRole('navigation', { name: 'このページの内容' });
    expect(nav.querySelector('.overflow-x-auto')).not.toBeNull();
    expect(nav.querySelector('[aria-hidden]')).not.toBeNull();
    expect(nav.querySelector('.flex-wrap')).toBeNull();
  });

  // UI-FOLLOWUP-01: リンクは高さ 28px (Button sm)・行間 4px で、スマホのタップ領域の目安 44px を下回っていた。
  // リンクの行 (LINK_ROW_SIZE_CLASS) と同じく、sm 未満の幅だけ最小の高さを 44px (min-h-11) にする
  it('スマホの幅ではリンクの高さを 44px 以上にする (横スクロールでも折り返しでも)', () => {
    const { unmount } = render(<LinkRowNav label="このページの内容" items={items} />);
    for (const link of screen.getAllByRole('link')) expect(link).toHaveClass('max-sm:min-h-11');
    unmount();
    render(<LinkRowNav label="東京都の目次" items={items} wrap />);
    for (const link of screen.getAllByRole('link')) expect(link).toHaveClass('max-sm:min-h-11');
  });

  // AREA-TOC-MOBILE-01: 幅 375px で 1 行の横スクロールだと県の目次 18 件のうち 3 件しか表示領域に入らない。
  // 項目の多い目次は折り返して全件を出す。スクロールしないので、続きを示すフェードも置かない
  it('wrap を渡すと折り返すリンクの並びにし、横スクロールの容器とフェードを持たない', () => {
    render(<LinkRowNav label="東京都の目次" items={items} wrap />);

    const nav = screen.getByRole('navigation', { name: '東京都の目次' });
    expect(nav).toHaveClass('flex', 'flex-wrap');
    expect(nav.querySelector('.overflow-x-auto')).toBeNull();
    expect(nav.querySelector('.w-max')).toBeNull();
    expect(nav.querySelector('[aria-hidden]')).toBeNull();
    expect(screen.getAllByRole('link')).toHaveLength(items.length);
    expect(screen.getByRole('link', { name: '節17' })).toHaveAttribute(
      'href',
      '#databook-section-17'
    );
  });
});
