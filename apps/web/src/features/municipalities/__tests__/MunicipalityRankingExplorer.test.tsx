import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { MunicipalityRankingExplorer } from '../components/MunicipalityRankingExplorer';

/**
 * 守る意図: 全国版の市区町村ランキングは 1 指標 1 URL でキャッシュする。
 * - 初期表示ではサーバーが描いた上位の表だけを見せ、全行の JSON を読まない (読むのは操作したときだけ・1 回だけ)
 * - 絞り込み・51 位以下の表示は URL を書き換えない (?pref= / ?page= / ?q= を作らない)
 */

const values = Array.from({ length: 120 }, (_, index) => ({
  areaCode: String(10000 + index),
  areaName: `${index < 60 ? '北海道' : '青森県'} 自治体${index}`,
  prefectureCode: index < 60 ? '01000' : '02000',
  value: 1200 - index,
  rank: index + 1,
}));

const prefectures = [
  { prefCode: '01000', prefName: '北海道' },
  { prefCode: '02000', prefName: '青森県' },
];

const fetchMock = vi.fn<typeof fetch>();

function renderExplorer() {
  return render(
    <MunicipalityRankingExplorer
      rankingKey="population"
      yearCode="2020"
      unit="人"
      precision={0}
      total={values.length}
      initialCount={50}
      prefectures={prefectures}
    >
      <table data-testid="server-top">
        <tbody>
          <tr>
            <td>サーバーの上位の表</td>
          </tr>
        </tbody>
      </table>
    </MunicipalityRankingExplorer>
  );
}

// 全行の表は dynamic import で遅れて出る
async function dataRows() {
  return within(await screen.findByRole('table', { name: '市区町村の順位' }))
    .getAllByRole('row')
    .slice(1);
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async () => Response.json({ rankingKey: 'population', yearCode: '2020', values }));
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(window.history, 'pushState');
  vi.spyOn(window.history, 'replaceState');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('MunicipalityRankingExplorer', () => {
  it('初期表示ではサーバーの上位の表だけを見せ、全行の JSON を読まない', () => {
    renderExplorer();
    expect(screen.getByTestId('server-top')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('120件中 上位50件');
    expect(screen.getByRole('button', { name: 'すべての自治体を表示（120件）' })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('自治体名を入れたときに初めて 1 指標 1 URL の JSON を読み、合う行だけを出す', async () => {
    renderExplorer();
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: '自治体11' } });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/^11件$/));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/municipalities/ranking/population');
    expect(screen.queryByTestId('server-top')).not.toBeInTheDocument();
    // 自治体11 と 自治体110〜119 (北海道 11 位以外は青森県)
    expect((await dataRows()).map((row) => row.textContent)).toEqual([
      expect.stringContaining('12位'),
      ...Array.from({ length: 10 }, (_, i) => expect.stringContaining(`${111 + i}位`)),
    ]);
    // 市区町村のページへのリンクにクエリを付けない
    for (const link of screen.getAllByRole('link')) {
      expect(link.getAttribute('href')).not.toContain('?');
    }

    // 条件を変えても読み直さない
    fireEvent.change(input, { target: { value: '自治体119' } });
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/^1件$/));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(window.history.pushState).not.toHaveBeenCalled();
    expect(window.history.replaceState).not.toHaveBeenCalled();
    expect(window.location.search).toBe('');
  });

  it('「すべての自治体を表示」で 51 位以下まで読み、条件の解除で上位の表へ戻す', async () => {
    renderExplorer();
    fireEvent.click(screen.getByRole('button', { name: 'すべての自治体を表示（120件）' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/^120件$/));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // 1 ページは 50 行
    expect(await dataRows()).toHaveLength(50);
    expect(window.location.search).toBe('');

    fireEvent.click(screen.getByRole('button', { name: '上位だけを表示' }));
    expect(screen.getByTestId('server-top')).toBeInTheDocument();
  });

  it('都道府県を選ぶとその県の自治体だけを出す', async () => {
    renderExplorer();
    // Base UI の Select は pointer の一連の操作で選ぶので、fireEvent.click ではなく user-event で操作する
    const user = userEvent.setup();
    await user.click(screen.getByRole('combobox', { name: '都道府県で絞り込む' }));
    await user.click(await screen.findByRole('option', { name: '青森県' }, { timeout: 10000 }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/^60件$/));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect((await dataRows())[0]).toHaveTextContent('61位');
    expect(window.history.pushState).not.toHaveBeenCalled();
    expect(window.location.search).toBe('');
  }, 20000);

  it('絞り込み中に読めなかったときは全国上位を出さず、エラーと再読み込みだけを出す', async () => {
    fetchMock.mockImplementationOnce(async () => new Response('', { status: 503 }));
    renderExplorer();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '自治体11' } });
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('一覧を読み込めませんでした')
    );
    expect(screen.queryByTestId('server-top')).not.toBeInTheDocument();
    expect(screen.queryByRole('table', { name: '市区町村の順位' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '再読み込み' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/^11件$/));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('button', { name: '再読み込み' })).not.toBeInTheDocument();
  });

  it('「すべて表示」で読めなかったときは上位の表を残してエラーと再読み込みを出し、再読み込みで直る', async () => {
    fetchMock.mockImplementationOnce(async () => new Response('', { status: 503 }));
    renderExplorer();
    fireEvent.click(screen.getByRole('button', { name: 'すべての自治体を表示（120件）' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('一覧を読み込めませんでした')
    );
    expect(screen.getByTestId('server-top')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '再読み込み' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/^120件$/));
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(screen.queryByTestId('server-top')).not.toBeInTheDocument();
  });

  it('JSON の年がページの年と違うときは行を使わず、読めなかったときと同じ表示にする', async () => {
    fetchMock.mockImplementationOnce(async () =>
      Response.json({ rankingKey: 'population', yearCode: '2021', values: values.slice(0, 3) })
    );
    renderExplorer();
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: '自治体1' } });
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('一覧を読み込めませんでした')
    );
    expect(screen.queryByTestId('server-top')).not.toBeInTheDocument();
    expect(screen.queryByRole('table', { name: '市区町村の順位' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '再読み込み' })).toBeInTheDocument();
  });
});
