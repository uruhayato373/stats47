import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics/events', () => ({ trackAffiliateClick: vi.fn() }));

import { TrackedAffiliateLink } from '../components/tracked-affiliate-link';

const common = {
  category: 'economy',
  label: 'test',
  position: 'blog-bottom',
};

describe('TrackedAffiliateLink ASP attributes', () => {
  it('もしもの必須referrer/attribution属性を維持する', () => {
    render(
      <TrackedAffiliateLink
        {...common}
        href="https://af.moshimo.com/af/c/click?a_id=1"
      >
        もしも
      </TrackedAffiliateLink>
    );
    const link = screen.getByRole('link', { name: 'test' });
    expect(link).toHaveAttribute('rel', 'nofollow noopener sponsored');
    expect(link).toHaveAttribute(
      'referrerpolicy',
      'no-referrer-when-downgrade'
    );
    expect(link).toHaveAttribute('attributionsrc', '');
  });

  it('他ASPでは既存のnoreferrer契約を変えない', () => {
    render(
      <TrackedAffiliateLink
        {...common}
        href="https://px.a8.net/svt/ejp?a8mat=x"
      >
        A8
      </TrackedAffiliateLink>
    );
    const link = screen.getByRole('link', { name: 'test' });
    expect(link).toHaveAttribute('rel', 'noopener noreferrer sponsored');
    expect(link).not.toHaveAttribute('referrerpolicy');
    expect(link).not.toHaveAttribute('attributionsrc');
  });
});
