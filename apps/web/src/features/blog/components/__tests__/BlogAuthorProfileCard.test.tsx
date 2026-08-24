import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OPERATOR_PROFILE } from '@/config/operator-profile';

import { BlogAuthorProfileCard } from '../BlogAuthorProfileCard';

describe('BlogAuthorProfileCard', () => {
  it('運営者情報と専門領域をプロフィールSSOTから表示する', () => {
    render(<BlogAuthorProfileCard />);

    expect(screen.getByText('運営者')).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_PROFILE.name)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_PROFILE.bio)).toBeInTheDocument();
    expect(screen.getByText('経歴・専門領域')).toBeInTheDocument();

    for (const item of OPERATOR_PROFILE.expertise) {
      expect(screen.getByText(item)).toBeInTheDocument();
    }

    expect(
      screen.getByRole('img', { name: OPERATOR_PROFILE.avatarAlt })
    ).toBeInTheDocument();
  });

  it('noteはCTA、SNSはアイコンリンクとして提供する', () => {
    const { container } = render(<BlogAuthorProfileCard />);

    expect(
      screen.getByRole('link', {
        name: 'noteで統計の読み方・AI活用を発信中',
      })
    ).toHaveAttribute('href', OPERATOR_PROFILE.links.note);
    expect(screen.getByRole('link', { name: 'X' })).toHaveAttribute(
      'href',
      OPERATOR_PROFILE.links.x
    );
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      OPERATOR_PROFILE.links.instagram
    );
    expect(screen.getByRole('link', { name: 'YouTube' })).toHaveAttribute(
      'href',
      OPERATOR_PROFILE.links.youtube
    );
    expect(
      screen.getByRole('link', { name: '運営者について →' })
    ).toHaveAttribute('href', OPERATOR_PROFILE.links.about);

    const socialLinks = ['X', 'Instagram', 'YouTube'].map((name) =>
      screen.getByRole('link', { name })
    );
    for (const link of socialLinks) {
      expect(within(link).queryByText(/stats47|@/)).not.toBeInTheDocument();
    }
    expect(container).not.toHaveTextContent('@stats47');
  });

  it('compact表示では記事レール向けの最小情報だけを表示する', () => {
    render(<BlogAuthorProfileCard compact />);

    expect(screen.getByText('運営者')).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_PROFILE.name)).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_PROFILE.bio)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: '運営者について →' })
    ).toHaveAttribute('href', OPERATOR_PROFILE.links.about);
    expect(screen.queryByText('経歴・専門領域')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', {
        name: 'noteで統計の読み方・AI活用を発信中',
      })
    ).not.toBeInTheDocument();
  });
});
