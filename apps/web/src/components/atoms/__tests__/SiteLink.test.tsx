import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import SiteLink from '../SiteLink';

const prefetch = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ prefetch }) }));

// next/link が受け取った prefetch を DOM へ書き出す (本物の Link は prefetch を DOM に出さない)
vi.mock('next/link', () => ({
  default: ({ prefetch: value, children, href, ...rest }: Record<string, unknown> & { children?: React.ReactNode; href: string }) => (
    <a href={href} data-prefetch={String(value)} {...rest}>
      {children}
    </a>
  ),
}));

describe('SiteLink', () => {
  beforeEach(() => prefetch.mockClear());

  // 表示時の先読み (_rsc) はキャッシュを通らず毎回サーバー描画になり、
  // 2026-10-16 の計測で Workers CPU の約 72% を占めた (CF-CPU-SURGE-01)
  it('画面に表示しただけでは先読みしない', () => {
    render(<SiteLink href="/ranking">ランキング</SiteLink>);
    expect(screen.getByText('ランキング')).toHaveAttribute('data-prefetch', 'false');
    expect(prefetch).not.toHaveBeenCalled();
  });

  it('マウスを乗せる・指で触れると 1 回だけ先読みし、呼び出し側のハンドラも呼ぶ', () => {
    const onMouseEnter = vi.fn();
    render(
      <>
        <SiteLink href="/ranking" onMouseEnter={onMouseEnter}>
          ランキング
        </SiteLink>
        <SiteLink href="/areas">地域</SiteLink>
      </>,
    );
    fireEvent.mouseEnter(screen.getByText('ランキング'));
    fireEvent.mouseEnter(screen.getByText('ランキング'));
    fireEvent.touchStart(screen.getByText('地域'));

    expect(prefetch.mock.calls).toEqual([['/ranking'], ['/areas']]);
    expect(onMouseEnter).toHaveBeenCalledTimes(2);
  });

  it('呼び出し側が prefetch を明示したときはその値を渡し、触れても先読みしない', () => {
    render(
      <>
        <SiteLink href="/geo" prefetch={false}>
          地図
        </SiteLink>
        <SiteLink href="/blog" prefetch={null}>
          ブログ
        </SiteLink>
      </>,
    );
    fireEvent.mouseEnter(screen.getByText('地図'));
    fireEvent.mouseEnter(screen.getByText('ブログ'));

    expect(screen.getByText('地図')).toHaveAttribute('data-prefetch', 'false');
    expect(screen.getByText('ブログ')).toHaveAttribute('data-prefetch', 'null');
    expect(prefetch).not.toHaveBeenCalled();
  });
});
