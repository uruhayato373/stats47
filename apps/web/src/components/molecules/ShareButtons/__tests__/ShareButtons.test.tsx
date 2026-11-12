import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ShareButtons } from '..';

const { trackShare } = vi.hoisted(() => ({ trackShare: vi.fn() }));
vi.mock('@/lib/analytics/events', () => ({ trackShare }));

afterEach(() => vi.restoreAllMocks());

describe('共有メニュー', () => {
  it('ボタン1つから共有先を開き、既存のURL生成と計測を使う', async () => {
    const user = userEvent.setup();
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<ShareButtons title="総人口" url="https://stats47.jp/ranking/total-population" variant="menu" platforms={['X (Twitter)', 'LINE']} />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
    await user.tab();
    await user.keyboard('{Enter}');
    expect(await screen.findAllByRole('menuitem')).toHaveLength(3);
    expect(screen.queryByRole('menuitem', { name: 'Facebook' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: 'LINE' }));

    const target = new URL(open.mock.calls[0]![0] as string);
    expect(target.hostname).toBe('social-plugins.line.me');
    expect(target.searchParams.get('url')).toBe('https://stats47.jp/ranking/total-population');
    expect(trackShare).toHaveBeenCalledWith({ method: 'LINE', contentType: 'page' });
  });

  it('リンクをコピーするとメニューを閉じても成功表示が残る', async () => {
    const user = userEvent.setup();
    const write = vi.spyOn(navigator.clipboard, 'writeText');
    render(<ShareButtons title="総人口" url="https://stats47.jp/ranking/total-population" variant="menu" />);
    await user.tab();
    await user.keyboard('{Enter}');
    await user.click(await screen.findByRole('menuitem', { name: 'リンクをコピー' }));
    expect(write).toHaveBeenCalledWith('https://stats47.jp/ranking/total-population');
    expect(await screen.findByRole('button', { name: 'コピーしました' })).toBeVisible();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
