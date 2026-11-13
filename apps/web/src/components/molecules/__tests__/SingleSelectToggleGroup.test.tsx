import { useState } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SingleSelectToggleGroup } from '../SingleSelectToggleGroup';

const options = [
  { value: 'total', label: '総数', title: '合計の値' },
  { value: 'area', label: '面積あたり' },
  { value: 'unavailable', label: '準備中', disabled: true },
] as const;

describe('SingleSelectToggleGroup', () => {
  it('押し直しても選択を空にせず、変更した値だけ通知する', () => {
    const onChange = vi.fn();
    function Example() {
      const [value, setValue] = useState('total');
      return <SingleSelectToggleGroup aria-label="計算方法" value={value} options={options} onValueChange={next => { setValue(next); onChange(next); }} />;
    }
    render(<Example />);
    fireEvent.click(screen.getByRole('button', { name: '総数' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '総数' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '面積あたり' }));
    expect(onChange).toHaveBeenCalledExactlyOnceWith('area');
    expect(screen.getByRole('button', { name: '総数' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: '面積あたり' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '準備中' }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('矢印キーで移動でき、無効な選択肢を飛ばす', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<SingleSelectToggleGroup aria-label="計算方法" value="total" options={options} onValueChange={onChange} />);
    await user.tab();
    expect(screen.getByRole('button', { name: '総数' })).toHaveFocus();
    await user.keyboard('{ArrowRight}{Enter}');
    expect(screen.getByRole('button', { name: '面積あたり' })).toHaveFocus();
    expect(onChange).toHaveBeenCalledWith('area');
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('button', { name: '総数' })).toHaveFocus();
  });

  it('全体が無効なら選択を変更できない', () => {
    const onChange = vi.fn();
    render(<SingleSelectToggleGroup aria-label="計算方法" value="total" options={options} disabled onValueChange={onChange} />);
    for (const button of screen.getAllByRole('button')) expect(button).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '面積あたり' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
