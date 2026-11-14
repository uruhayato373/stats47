import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Cell } from '@/components/admin-ui/data-table';
import { Freshness } from '@/components/ops/primitives';

const cellClass = (props: { nowrap?: boolean }) => {
  const html = renderToStaticMarkup(
    createElement('table', null, createElement('tbody', null, createElement('tr', null, createElement(Cell, props, '2026-11-14')))),
  );
  return /class="([^"]*)"/.exec(html.slice(html.indexOf('<td')))?.[1].split(/\s+/) ?? [];
};

/** UI-FOLLOWUP-02: 管理画面の表のセルと鮮度のバッジの表示の不具合 */
describe('管理画面の表のセルと鮮度のバッジ', () => {
  afterEach(() => vi.useRealTimers());

  // 既定の `whitespace-normal!` (important) が nowrap の `whitespace-nowrap` に勝ち、nowrap を渡しても折り返していた
  it('nowrap を渡したセルは折り返さない指定だけを持つ', () => {
    const classes = cellClass({ nowrap: true });
    expect(classes).toContain('whitespace-nowrap!');
    expect(classes).not.toContain('whitespace-normal!');
    expect(cellClass({})).toContain('whitespace-normal!');
  });

  // ISO 文字列の先頭 10 文字は UTC の日付なので、日本時間の朝 (UTC の前日) に開くと前日の日付を出していた
  it('鮮度のバッジは日本時間の日付を出す', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-14T00:30:00Z'));
    // 日本時間 2026-11-14 08:10 (UTC では 11-13 23:10)
    const html = renderToStaticMarkup(createElement(Freshness, { iso: '2026-11-13T23:10:00Z' }));
    expect(html).toContain('2026-11-14');
    expect(html).not.toContain('2026-11-13');
  });
});
