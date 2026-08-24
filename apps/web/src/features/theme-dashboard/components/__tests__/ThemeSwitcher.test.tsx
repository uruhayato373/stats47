import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ALL_THEMES } from '../../config/all-themes';
import { ThemePrefectureProvider } from '../ThemePrefectureContext';
import { ThemeSwitcher, buildThemeSwitcherOptions } from '../ThemeSwitcher';

// router.push を安定した spy にするため next/navigation をこのファイルで上書きする
// (test.setup.tsx のグローバルモックは呼び出しごとに新しい push を返すため assert できない)。
const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

const TYPE_B = ['ports', 'railway', 'roads'];

beforeEach(() => {
  pushMock.mockClear();
});

describe('buildThemeSwitcherOptions', () => {
  it('全国 (areaContext なし): 全テーマを /themes/{key} で返す', () => {
    const opts = buildThemeSwitcherOptions();
    expect(opts.length).toBe(ALL_THEMES.length);
    for (const o of opts) {
      expect(o.href).toBe(`/themes/${o.themeKey}`);
    }
    expect(opts.map((o) => o.themeKey)).not.toContain('local-finance-city');
  });

  it('areaContext: 都道府県文脈を維持し /areas/{code}/{key} を返す', () => {
    const opts = buildThemeSwitcherOptions({ areaCode: '13000' });
    for (const o of opts) {
      expect(o.href).toBe(`/areas/13000/${o.themeKey}`);
    }
  });

  it('areaContext: 都道府県ページで 410 になる Type B テーマを除外する', () => {
    const keys = buildThemeSwitcherOptions({ areaCode: '13000' }).map(
      (o) => o.themeKey
    );
    for (const b of TYPE_B) {
      expect(keys).not.toContain(b);
    }
    // Type A の代表は残る
    expect(keys).toContain('population-dynamics');
    expect(keys).toContain('tourism');
  });

  it('通常テーマ間のリンクへ選択中の都道府県を引き継ぐ', () => {
    const opts = buildThemeSwitcherOptions(undefined, '28000');
    expect(opts.find((o) => o.themeKey === 'tourism')?.href).toBe(
      '/themes/tourism?pref=28000'
    );
  });

  it('47都道府県の明示選択もテーマ間リンクへ引き継ぐ', () => {
    const opts = buildThemeSwitcherOptions(undefined, null);
    expect(opts.find((o) => o.themeKey === 'tourism')?.href).toBe(
      '/themes/tourism?pref=all'
    );
  });
});

describe('ThemeSwitcher', () => {
  it('aria-label で「テーマを切り替える」目的が分かる (アクセシブル)', () => {
    render(<ThemeSwitcher currentThemeKey="population-dynamics" />);
    expect(screen.getByLabelText('テーマを切り替える')).toBeInTheDocument();
  });

  it('compact 表示では短いラベルを使う', () => {
    render(<ThemeSwitcher currentThemeKey="population-dynamics" compact />);
    expect(screen.getByText('テーマ')).toBeInTheDocument();
    expect(screen.queryByText('テーマを切り替える')).toBeNull();
  });

  it('現在のテーマがセレクターの現在値として表示される', () => {
    const current = ALL_THEMES.find((t) => t.themeKey === 'tourism')!;
    render(<ThemeSwitcher currentThemeKey="tourism" />);
    // Radix Select のトリガーは選択中アイテムのテキスト (= 現テーマ名) を表示する
    expect(screen.getByRole('combobox')).toHaveTextContent(current.title);
  });

  it('別テーマを選択すると /themes/{key} へ遷移する (全国)', async () => {
    render(<ThemeSwitcher currentThemeKey="population-dynamics" />);
    const target = ALL_THEMES.find((t) => t.themeKey === 'tourism')!;

    fireEvent.click(screen.getByRole('combobox'));
    const option = await screen.findByRole('option', { name: target.title });
    fireEvent.click(option);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/themes/tourism');
    });
  });

  it('Provider 配下では選択中の都道府県を保って別テーマへ遷移する', async () => {
    render(
      <ThemePrefectureProvider initialAreaCode="28000" initialAreaName="兵庫県">
        <ThemeSwitcher currentThemeKey="population-dynamics" />
      </ThemePrefectureProvider>
    );
    const target = ALL_THEMES.find((t) => t.themeKey === 'tourism')!;

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: target.title }));

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/themes/tourism?pref=28000');
    });
  });

  it('areaContext: 別テーマを選択すると都道府県文脈を維持した /areas/{code}/{key} へ遷移する', async () => {
    render(
      <ThemeSwitcher
        currentThemeKey="population-dynamics"
        areaContext={{ areaCode: '13000' }}
      />
    );
    const target = ALL_THEMES.find((t) => t.themeKey === 'tourism')!;

    fireEvent.click(screen.getByRole('combobox'));
    const listbox = await screen.findByRole('listbox');
    // Type B テーマは選択肢に無い (存在しない/410 URL を作らない)
    expect(
      within(listbox).queryByRole('option', { name: /港湾|鉄道|道路/ })
    ).toBeNull();
    fireEvent.click(
      within(listbox).getByRole('option', { name: target.title })
    );

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/areas/13000/tourism');
    });
  });
});
