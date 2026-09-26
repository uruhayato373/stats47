import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Callout } from '../Callout';
import { CALLOUT_DEFINITIONS, CALLOUT_TYPES, toCalloutType } from '../callout-config';

describe('Callout', () => {
  it('種類を英語の見出しではなく日本語ラベルで示し、同じ名前で読み上げられる', () => {
    render(<Callout type="TIP"><p>本文です。</p></Callout>);

    const note = screen.getByRole('complementary', { name: '読み解きのポイント' });
    expect(note).toHaveTextContent('読み解きのポイント');
    expect(note).not.toHaveTextContent('TIP');
    expect(note.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('角は本文部品のトークン (rounded-content) を使い、左の色バーは使わない', () => {
    render(<Callout type="WARNING"><p>注意です。</p></Callout>);

    const note = screen.getByRole('complementary', { name: '注意' });
    expect(note.className).toContain('rounded-content');
    expect(note.className).not.toMatch(/rounded-card|border-l-4/);
  });

  it('全種類にラベル・色・優先度があり、大文字小文字を問わず種類を解決できる', () => {
    for (const type of CALLOUT_TYPES) {
      expect(CALLOUT_DEFINITIONS[type].label).not.toBe('');
      expect(toCalloutType(type.toLowerCase())).toBe(type);
    }
    expect(toCalloutType('unknown')).toBeNull();
  });
});
