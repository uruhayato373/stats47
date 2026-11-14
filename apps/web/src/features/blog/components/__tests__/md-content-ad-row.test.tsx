import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MDContent } from '../md-content';

// 広告の段そのものの描画は AdRow の責務。ここでは本文の中のどこに置かれるかだけを見る
vi.mock('@/features/ads', () => ({
  AdRow: () => <div data-testid="ad-row-stub" />,
}));

const SOURCE = ['冒頭の文章。', '', '## 1', '', '本文 1。', '', '## 2', '', '本文 2。', ''].join('\n');
const CELLS = [{ kind: 'adsense' }] as never;

afterEach(() => vi.restoreAllMocks());

describe('MDContent の広告の段', () => {
  it('段が <p> の中に入らず、hydration の警告 (validateDOMNesting) が出ない', () => {
    const errors = vi.spyOn(console, 'error').mockImplementation(() => {});
    // 本文の段 1 つ (h2 が 2 本) + 記事の末尾の段 1 つ
    const { container } = render(<MDContent source={SOURCE} adRows={[CELLS, CELLS]} />);

    const stubs = container.querySelectorAll('[data-testid="ad-row-stub"]');
    expect(stubs.length).toBe(2);
    for (const stub of stubs) expect(stub.closest('p')).toBeNull();
    const nestingWarnings = errors.mock.calls.filter((c) => String(c[0]).includes('cannot be a descendant of'));
    expect(nestingWarnings).toEqual([]);
  });

  it('本文の段は 2 番目の h2 の直前に置かれたまま (表示位置が変わらない)', () => {
    const { container } = render(<MDContent source={SOURCE} adRows={[CELLS, CELLS]} />);
    const headings = [...container.querySelectorAll('h2')];
    const bodyRow = container.querySelector('[data-testid="ad-row-stub"]')!;
    expect(headings.length).toBe(2);
    // 本文の段は 1 番目の h2 より後・2 番目の h2 より前
    expect(headings[0].compareDocumentPosition(bodyRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(bodyRow.compareDocumentPosition(headings[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
