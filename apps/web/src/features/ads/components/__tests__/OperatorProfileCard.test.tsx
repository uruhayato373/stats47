import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { OPERATOR_PROFILE } from '@/config/operator-profile';

import { OperatorProfileCard } from '../OperatorProfileCard';

describe('OperatorProfileCard', () => {
  it('サイト横断で使える運営者情報と詳細導線を表示する', () => {
    render(<OperatorProfileCard />);

    expect(screen.getByText('運営者')).toBeInTheDocument();
    expect(screen.getByText(OPERATOR_PROFILE.name)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: OPERATOR_PROFILE.avatarAlt })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '体験記を読む' })).toHaveAttribute(
      'href',
      OPERATOR_PROFILE.links.story
    );
    expect(
      screen.getByRole('link', { name: '運営者について' })
    ).toHaveAttribute('href', OPERATOR_PROFILE.links.about);
  });
});
