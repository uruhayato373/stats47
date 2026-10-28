/**
 * Cookie 同意の帯 (CookieConsentBanner) の契約。ルートレイアウトの SidebarInset の最後の子に置く。
 *
 * - 同意が未設定なら、画面下端に留まる 1 行の帯 (sticky bottom-0) を出す。fixed で本文に浮かべない
 *   (浮かべると本文・地図とテーブルのタブを覆い、その分の余白も無かった)
 * - 同意 / 拒否を押すと消え、cookie と gtag の同意状態を更新する
 * - 同意済みなら出さない
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CookieConsentBanner } from '@/lib/analytics/components/CookieConsentBanner';

function clearConsentCookie() {
  document.cookie = 'stats47_consent=; path=/; max-age=0';
}

async function renderBanner() {
  vi.useFakeTimers();
  const result = render(<CookieConsentBanner />);
  await act(async () => {
    vi.runAllTimers();
  });
  vi.useRealTimers();
  return result;
}

const gtag = vi.fn();

describe('CookieConsentBanner', () => {
  beforeEach(() => {
    clearConsentCookie();
    gtag.mockClear();
    Object.defineProperty(window, 'gtag', { value: gtag, configurable: true, writable: true });
  });

  afterEach(() => {
    clearConsentCookie();
  });

  it('同意が未設定なら画面下端の帯を出す (fixed で本文に浮かべない)', async () => {
    await renderBanner();
    const region = screen.getByRole('region', { name: 'Cookie の利用について' });
    expect(region).toHaveClass('sticky', 'bottom-0', 'border-t');
    expect(region.className).not.toMatch(/\bfixed\b/);
    // 文は 1 文。ボタンは文と同じ帯の中
    expect(region.querySelectorAll('p')).toHaveLength(1);
    expect(screen.getByRole('button', { name: '同意する' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '拒否' })).toBeInTheDocument();
  });

  it('同意すると帯が消え、cookie と gtag の同意状態を更新する', async () => {
    await renderBanner();
    fireEvent.click(screen.getByRole('button', { name: '同意する' }));
    expect(screen.queryByRole('region', { name: 'Cookie の利用について' })).toBeNull();
    expect(document.cookie).toContain('stats47_consent=granted');
    expect(gtag).toHaveBeenCalledWith('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
    });
  });

  it('同意済みなら帯を出さない', async () => {
    document.cookie = 'stats47_consent=denied; path=/';
    await renderBanner();
    expect(screen.queryByRole('region', { name: 'Cookie の利用について' })).toBeNull();
  });

  it('ルートレイアウトは帯を SidebarInset の最後 (Footer の後) に置く', () => {
    const layout = readFileSync(resolve(process.cwd(), 'src/app/layout.tsx'), 'utf8');
    const inset = layout.slice(layout.indexOf('<SidebarInset'), layout.indexOf('</SidebarInset>'));
    expect(inset.indexOf('<CookieConsentBanner />')).toBeGreaterThan(inset.indexOf('<Footer />'));
    expect(layout.match(/<CookieConsentBanner \/>/g)).toHaveLength(1);
  });
});
