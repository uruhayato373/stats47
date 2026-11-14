import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { OPERATOR_AVATAR_SIZE, OPERATOR_PROFILE } from '@/config/operator-profile';

import AboutPage from '../about/page';
import PrivacyPage from '../privacy/page';

/**
 * 守る意図: 本文で運営者を紹介する 2 ページ (運営者情報・プライバシーポリシー) は、同じ写真を同じ大きさで出す。
 * ページごとに大きさを書いていて、48px と 56px に食い違っていた (UI-FOLLOWUP-01)。
 * 大きさは運営者プロフィールの定義 (config/operator-profile.ts) の 1 か所で決める。
 */

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

function avatarOf(page: React.ReactElement) {
  const { container, unmount } = render(page);
  const avatars = [...container.querySelectorAll<HTMLImageElement>('img')].filter(
    (img) => img.getAttribute('alt') === OPERATOR_PROFILE.avatarAlt
  );
  const result = avatars.map((img) => ({
    width: img.getAttribute('width'),
    height: img.getAttribute('height'),
    className: img.className,
  }));
  unmount();
  return result;
}

describe('本文の運営者の写真', () => {
  it('運営者情報とプライバシーポリシーで同じ大きさ・同じ class にする', () => {
    const about = avatarOf(<AboutPage />);
    const privacy = avatarOf(<PrivacyPage />);

    expect(about).toHaveLength(1);
    expect(privacy).toHaveLength(1);
    expect(about[0]).toEqual(privacy[0]);
    expect(about[0]!.width).toBe(String(OPERATOR_AVATAR_SIZE));
    expect(about[0]!.height).toBe(String(OPERATOR_AVATAR_SIZE));
  });
});
