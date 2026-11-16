import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ValueTable, type ValueTableRow } from '../ValueTable';

const columns = [
  { key: 'name', header: '項目', rowHeader: true },
  { key: 'value', header: '値' },
];
const makeRows = (count: number, withTotal = false): ValueTableRow[] => [
  ...Array.from({ length: count }, (_, i) => ({ key: `r${i}`, cells: [`項目${i}`, String(i)] })),
  ...(withTotal ? [{ key: 'total', total: true, cells: ['合計', '999'] }] : []),
];
const foldedRows = (container: HTMLElement) => container.querySelectorAll('tr[data-fold]');

describe('ValueTable fold: 上位・下位の数行だけ見せ、全行は HTML に残す', () => {
  it('fold 指定の表は中ほどの行に data-fold を付け、全行を描く (検索エンジンと JS 前の画面に全行がある)', () => {
    const { container } = render(<ValueTable columns={columns} rows={makeRows(12)} fold />);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(12);
    expect(foldedRows(container)).toHaveLength(6);
    expect(container.querySelector('[data-folded="true"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: '全件を見る（残り 6 件）' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('見せる行は上 3 行と下 3 行で、合計の行は数えずいつも見せる', () => {
    const { container } = render(<ValueTable columns={columns} rows={makeRows(12, true)} fold />);
    const hiddenNames = [...foldedRows(container)].map((row) => row.querySelector('th')?.textContent);
    expect(hiddenNames).toEqual(['項目3', '項目4', '項目5', '項目6', '項目7', '項目8']);
  });

  it('ボタンで開閉できる', () => {
    const { container } = render(<ValueTable columns={columns} rows={makeRows(12)} fold />);
    fireEvent.click(screen.getByRole('button', { name: /全件を見る/ }));
    expect(container.querySelector('[data-folded="false"]')).not.toBeNull();
    expect(screen.getByRole('button', { name: '折りたたむ' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('隠れる行が 3 行未満の表は畳まない', () => {
    const { container } = render(<ValueTable columns={columns} rows={makeRows(8)} fold />);
    expect(foldedRows(container)).toHaveLength(0);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('fold を指定しない表は今までどおり全行を見せる', () => {
    const { container } = render(<ValueTable columns={columns} rows={makeRows(30)} />);
    expect(foldedRows(container)).toHaveLength(0);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('見せる行数は head / tail で変えられる', () => {
    const { container } = render(<ValueTable columns={columns} rows={makeRows(12)} fold={{ head: 5, tail: 1 }} />);
    expect(foldedRows(container)).toHaveLength(6);
    expect(foldedRows(container)[0].querySelector('th')?.textContent).toBe('項目5');
  });
});
