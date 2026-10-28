import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { RankingDataTable } from '../../RankingDataTable';
import { buildRankingRows } from '../../RankingDataTable/ranking-rows';
import { RankingAreaDetailSheet } from '../RankingAreaDetailSheet';

import type { RankingItem } from '@stats47/ranking';
import type { StatsSchema } from '@stats47/types';

const value = (areaCode: string, areaName: string, v: number): StatsSchema => ({
  metricKey: 'total-population',
  areaType: 'prefecture',
  areaCode,
  areaName,
  yearCode: '2025',
  yearName: '2025年',
  value: v,
  unit: '人',
});

const VALUES = [
  value('00000', '全国', 300),
  value('13000', '東京都', 140),
  value('14000', '神奈川県', 92),
  value('27000', '大阪府', 88),
];

const ITEM = {
  rankingKey: 'total-population',
  title: '総人口',
  unit: '人',
  categoryKey: 'population',
} as RankingItem;

describe('RankingAreaDetailSheet', () => {
  it('開いた県の順位・値と、県のページへの計測付きリンクを出す', () => {
    render(
      <RankingAreaDetailSheet rankingItem={ITEM} rows={buildRankingRows(VALUES)} areaCode="14000" onAreaChange={() => {}} />
    );

    expect(screen.getByRole('heading', { name: '神奈川県' })).toBeInTheDocument();
    // 全国 (00000) は順位の母数に入れない: 2位 / 3
    expect(screen.getByText('2位')).toBeInTheDocument();
    expect(screen.getByText('/ 3', { exact: false })).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /神奈川県のデータブック/ });
    expect(link).toHaveAttribute('href', '/areas/14000');
    expect(link.closest('[data-nav-surface]')).toHaveAttribute('data-nav-surface', 'ranking_detail_sheet');
  });

  it('前後送りは順位の隣の県へ移り、端では押せない', () => {
    const onAreaChange = vi.fn();
    const rows = buildRankingRows(VALUES);
    const { rerender } = render(
      <RankingAreaDetailSheet rankingItem={ITEM} rows={rows} areaCode="14000" onAreaChange={onAreaChange} />
    );
    fireEvent.click(screen.getByRole('button', { name: '1位の東京都へ' }));
    expect(onAreaChange).toHaveBeenCalledWith('13000', 'step');
    fireEvent.click(screen.getByRole('button', { name: '3位の大阪府へ' }));
    expect(onAreaChange).toHaveBeenCalledWith('27000', 'step');

    rerender(<RankingAreaDetailSheet rankingItem={ITEM} rows={rows} areaCode="13000" onAreaChange={onAreaChange} />);
    expect(screen.getByRole('button', { name: '前の県はありません' })).toBeDisabled();
  });

  it('県が選ばれていなければ何も開かない', () => {
    render(<RankingAreaDetailSheet rankingItem={ITEM} rows={buildRankingRows(VALUES)} areaCode={null} onAreaChange={() => {}} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

describe('RankingDataTable の県の選択', () => {
  it('順位のボタンで詳細を開き、県名のリンクは県のページへの移動だけを行う', () => {
    const onSelectArea = vi.fn();
    render(<RankingDataTable rankingValues={VALUES} rankingItem={ITEM} bare onSelectArea={onSelectArea} />);

    fireEvent.click(screen.getByRole('button', { name: '東京都の詳細を開く' }));
    expect(onSelectArea).toHaveBeenCalledWith('13000');

    onSelectArea.mockClear();
    fireEvent.click(screen.getByRole('link', { name: '大阪府' }));
    expect(onSelectArea).not.toHaveBeenCalled();
  });

  it('onSelectArea を渡さないときは順位をボタンにしない (従来の表)', () => {
    render(<RankingDataTable rankingValues={VALUES} rankingItem={ITEM} bare />);
    expect(screen.queryByRole('button', { name: /の詳細を開く/ })).not.toBeInTheDocument();
  });
});
