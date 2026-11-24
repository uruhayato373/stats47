import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { ChartFooter } from '../ChartFooter';

// 2026-10-30 オーナー決定: 注記はチャートの下に見せ、出典・指標の定義・ランキングへのリンクは
// 「出典・指標の定義」のボタン 1 つから開く Sheet にまとめる (旧: 「出典」「ランキング」のリンクと件数付きのメニュー)

/**
 * Sheet の部品は初めて押されたときに読み込む (SourcesSheet の loadSheet・配信サイズ策 D)。ファイルで最初に開くテストは
 * この読み込みを待つので、テストを束ねて流すと findByRole の既定 1 秒を超えて「role=dialog が見つからない」で落ちた
 * (CHART-FOOTER-MENU-TEST-01・2026-11-24 の観測)。開くのを待つ時間だけを延ばす (中身の検査は変えない)。
 */
const SHEET_OPEN_TIMEOUT = { timeout: 5000 };

async function openSheet() {
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: '出典・指標の定義' }));
  return screen.findByRole('dialog', undefined, SHEET_OPEN_TIMEOUT);
}

describe('ChartFooter', () => {
  it('チャートの下には注記とボタン 1 つだけを置き、出典・ランキングのリンクは出さない', () => {
    render(
      <ChartFooter
        annotation="2020年に系列が接続しません。"
        source="人口動態統計"
        sourceLinks={[{ label: '人口動態統計', url: '/survey/vital-statistics' }]}
        rankingLink="/ranking/primary"
        rankingLabel="指標の定義・ランキング"
      />
    );
    expect(screen.getByText('2020年に系列が接続しません。')).toBeVisible();
    expect(screen.getByRole('button', { name: '出典・指標の定義' })).toHaveAttribute('aria-haspopup', 'dialog');
    expect(screen.queryByRole('link')).toBeNull();
  });

  it('ボタンを押すと、複数の出典とランキングを省略せず Sheet に並べる', async () => {
    render(
      <ChartFooter
        source="複数調査"
        sourceLinks={[
          { label: '人口動態統計', url: '/survey/vital-statistics' },
          { label: '国勢調査', url: '/survey/census' },
        ]}
        sourceDetail="各年10月1日現在"
        rankingLink="/ranking/primary"
        rankingLabel="指標の定義・ランキング"
        rankingLinks={[{ label: '関連指標の定義・ランキング', url: '/ranking/secondary' }]}
      />
    );
    const sheet = within(await openSheet());
    expect(sheet.getByRole('link', { name: '出典: 人口動態統計' })).toHaveAttribute('href', '/survey/vital-statistics');
    expect(sheet.getByRole('link', { name: '出典: 国勢調査' })).toHaveAttribute('href', '/survey/census');
    expect(sheet.getByText('各年10月1日現在')).toBeVisible();
    expect(sheet.getByRole('link', { name: '指標の定義・ランキング' })).toHaveAttribute('href', '/ranking/primary');
    expect(sheet.getByRole('link', { name: '関連指標の定義・ランキング' })).toHaveAttribute('href', '/ranking/secondary');
  });

  it('注記を配列で渡すと、footer は段落で並べ、header は Sheet の先頭に全件並べる (2026-11-22)', async () => {
    const notes = ['分母は総数です。', '不詳を含みます。'];
    const { unmount } = render(<ChartFooter annotation={notes} source="国勢調査" />);
    expect(screen.getByText('分母は総数です。')).toBeVisible();
    expect(screen.getByText('不詳を含みます。')).toBeVisible();
    unmount();

    render(<ChartFooter placement="header" annotation={notes} source="国勢調査" />);
    expect(screen.queryByText('分母は総数です。')).toBeNull();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '出典・指標の定義・読むときの注意' }));
    const sheet = within(await screen.findByRole('dialog', undefined, SHEET_OPEN_TIMEOUT));
    expect(sheet.getByText('分母は総数です。')).toBeVisible();
    expect(sheet.getByText('不詳を含みます。')).toBeVisible();
  });

  it('固定 ID を渡すとボタンの id に使う', () => {
    render(<ChartFooter id="theme-ports-footer" rankingLinks={[{ label: '輸出', url: '/ranking/export' }]} />);
    expect(screen.getByRole('button', { name: '出典・指標の定義' })).toHaveAttribute(
      'id',
      'theme-ports-footer-sources-trigger'
    );
  });

  it('リンク先が無い出典は名前だけを Sheet に残す', async () => {
    render(<ChartFooter source="独自集計" />);
    const sheet = within(await openSheet());
    expect(sheet.getByText('出典: 独自集計')).toBeVisible();
    expect(sheet.queryByRole('link', { name: /独自集計/ })).toBeNull();
  });

  it('出典もランキングも注記も無ければ何も描かない', () => {
    const { container } = render(<ChartFooter />);
    expect(container).toBeEmptyDOMElement();
  });
});
