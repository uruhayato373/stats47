import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FooterSocialLinks } from '../FooterSocialLinks';

describe('FooterSocialLinks', () => {
  it('SNSリンクの見た目を変えずに24px以上の操作領域を持つ', () => {
    render(<FooterSocialLinks />);

    for (const name of ['X (Twitter)', 'Instagram', 'YouTube', 'note']) {
      expect(screen.getByRole('link', { name })).toHaveClass(
        'inline-flex',
        'min-h-6',
        'min-w-6',
        'items-center',
        'justify-center',
      );
    }
  });
});
