import { afterEach, describe, expect, it, vi } from 'vitest';

import { processOne } from '../../scripts/page-data-batch';
import { agriculturalOutput } from '../metrics/agricultural-output';
import { resolveMetricSource } from '../source-for-entity';

afterEach(() => vi.unstubAllGlobals());

function mockValues(values: Record<string, string>[]) {
  const fetcher = vi.fn(async (_url: string) => new Response(JSON.stringify({
    GET_STATS_DATA: {
      RESULT: { STATUS: 0 },
      STATISTICAL_DATA: { DATA_INF: { VALUE: values } },
    },
  }), { status: 200 }));
  vi.stubGlobal('fetch', fetcher);
  return fetcher;
}

describe('農業産出額の県2024更新と既存市区町村系列の両立', () => {
  it('県は公式公表表、市区町村は従来のSSDS市表として出典を分離する', () => {
    expect(agriculturalOutput.entities).toEqual(['prefecture', 'city']);
    expect(agriculturalOutput.years).toEqual({ from: 1975, to: 2024 });
    expect(resolveMetricSource(agriculturalOutput, 'prefecture')).toMatchObject({
      kind: 'external', fetcherKey: 'manual', displayName: '生産農業所得統計',
    });
    expect(resolveMetricSource(agriculturalOutput, 'city')).toMatchObject({
      kind: 'estat', statsDataId: '0000020203', cdCat01: 'C3101',
      url: 'https://www.e-stat.go.jp/dbview?sid=0000020203',
    });
  });

  it('県sourceがmanualでも市表を再取得し、県行を市区町村データへ混ぜない', async () => {
    const fetcher = mockValues([
      { '@area': '01000', '@time': '2023000000', '@unit': '百万円', $: '1347800' },
      { '@area': '01100', '@time': '2023000000', '@unit': '百万円', $: '1200' },
    ]);
    const before = structuredClone(agriculturalOutput);
    const result = await processOne(agriculturalOutput, 'test-app-id', true);
    expect(result).toMatchObject({ ok: true, rows: 1, message: 'would write city=1' });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const url = new URL(fetcher.mock.calls[0][0] as string);
    expect(url.searchParams.get('statsDataId')).toBe('0000020203');
    expect(url.searchParams.get('cdCat01')).toBe('C3101');
    expect(agriculturalOutput).toEqual(before);
  });

  it('県だけを更新する実行で市表を取得せず、manual県表をe-Statへ誤変換しない', async () => {
    const fetcher = mockValues([]);
    const result = await processOne({ ...agriculturalOutput, entities: ['prefecture'] }, 'test-app-id', true);
    expect(result.status).toBe('skip');
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('市表の代わりに県payloadが返った場合は0件として停止する', async () => {
    mockValues([{ '@area': '01000', '@time': '2023000000', '@unit': '百万円', $: '1347800' }]);
    const result = await processOne(agriculturalOutput, 'test-app-id', true);
    expect(result.rows).toBe(0);
    expect(result.ok).toBe(false);
    expect(result.status).toBe('empty');
  });

  it('市専用sourceのない既存指標では共通sourceの解決を維持する', () => {
    const { citySource: _citySource, ...shared } = agriculturalOutput;
    expect(resolveMetricSource(shared, 'city')).toBe(shared.source);
  });
});
