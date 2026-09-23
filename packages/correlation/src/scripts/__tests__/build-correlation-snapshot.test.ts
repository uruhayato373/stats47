import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  CorrelationByKeySnapshot,
  CorrelationStatsSnapshot,
  CorrelationTopPairsSnapshot,
} from '../../types/snapshot';

// ── server-only / logger は no-op ──────────────────────────────────────────────
vi.mock('server-only', () => ({}));
vi.mock('@stats47/logger/server', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ── R2: saveToR2 は呼び出しを記録、fetch は all.json メタを返す ──────────────────
const saved = new Map<string, string>();
const fetchFromR2AsJsonMock = vi.fn();
vi.mock('@stats47/r2-storage/server', () => ({
  assertR2WriteAllowed: vi.fn(),
  saveToR2: vi.fn(async (key: string, body: string) => {
    saved.set(key, body);
    return { key, size: body.length };
  }),
  fetchFromR2AsJson: (key: string) => fetchFromR2AsJsonMock(key),
}));

// ── data-configs: 3 つの合成 metric (a,b,c) + 制御変数 ─────────────────────────
const CONTROL_KEYS = [
  'total-population',
  'total-area-excluding-northern-territories-and-takeshima',
  'ratio-65-plus',
  'population-density-per-km2-total-area',
];
function metric(key: string, title: string) {
  return {
    key,
    title,
    subtitle: undefined,
    unit: '件',
    category: 'population',
    entities: ['prefecture'],
    years: { from: 2020, to: 2020 } as unknown,
    isActive: true,
    source: { kind: 'estat' },
  };
}
const METRICS = [
  metric('metric-a', '指標A'),
  metric('metric-b', '指標B'),
  metric('metric-c', '指標C'),
  ...CONTROL_KEYS.map((k) => metric(k, `制御:${k}`)),
];
vi.mock('@stats47/data-configs', () => ({
  listAllMetrics: () => METRICS,
  getMetricConfig: (k: string) => METRICS.find((m) => m.key === k),
  // 本物と同じ判定 (packages/data-configs/src/metric-meta.ts の yearInSpec)
  yearInSpec: (yearCode: string, spec: unknown) => {
    if (spec === 'all') return true;
    const y = parseInt(yearCode, 10);
    const s = spec as { from?: number; to?: number; years?: number[] };
    if (s.years) return s.years.includes(y);
    return y >= (s.from ?? 0) && y <= (s.to ?? 0);
  },
  getMetricMeta: (k: string) =>
    METRICS.some((m) => m.key === k)
      ? {
          latestYear: { yearCode: '2020', yearName: '2020年度' },
          availableYears: [],
          entities: ['prefecture'],
        }
      : null,
}));

// ── ThemeCatalog: metric-a だけのテーマと、全指標を含む (テーマ外の候補が無い) テーマ ──────
vi.mock('@stats47/data-configs/theme-catalog', () => ({
  THEME_CATALOGS: {
    'theme-a': { metrics: [{ rankingKey: 'metric-a' }] },
    'theme-all': {
      metrics: [
        'metric-a', 'metric-b', 'metric-c',
        'total-area-excluding-northern-territories-and-takeshima',
        'ratio-65-plus', 'population-density-per-km2-total-area',
      ].map((rankingKey) => ({ rankingKey })),
    },
  },
}));

// ── stats-r2: 47 県の合成観測値。a と b は強相関、c は無相関気味 ──────────────────
function makeRows(fn: (i: number) => number) {
  return Array.from({ length: 47 }, (_, i) => ({
    areaCode: String(i + 1).padStart(2, '0') + '000',
    areaName: `pref-${i + 1}`,
    yearCode: '2020',
    yearName: '2020年度',
    value: fn(i),
    unit: '件',
    rank: null,
  }));
}
const STATS: Record<string, ReturnType<typeof makeRows>> = {
  'metric-a': makeRows((i) => i + 1),
  // a と強相関だが完全線形ではない (ノイズ付与) → r≈0.9 で 0.99 フィルタを通過し top に出る
  'metric-b': makeRows((i) => (i + 1) * 2 + 3 + ((i * 13) % 7)),
  'metric-c': makeRows((i) => ((i * 7) % 47) + 1), // 疑似ランダム
  'total-population': makeRows((i) => 1000 + i * 13),
  'total-area-excluding-northern-territories-and-takeshima': makeRows(
    (i) => 500 + ((i * 11) % 40)
  ),
  'ratio-65-plus': makeRows((i) => 20 + ((i * 3) % 15)),
  'population-density-per-km2-total-area': makeRows(
    (i) => 100 + ((i * 5) % 60)
  ),
};
vi.mock('@stats47/stats-r2/readers', () => ({
  readStatsValues: vi.fn(async (key: string) => {
    const rows = STATS[key];
    if (!rows) return null;
    return {
      metricKey: key,
      entityKind: 'prefecture',
      rows,
      meta: {
        rowCount: rows.length,
        yearRange: ['2020', '2020'],
        areaCount: 47,
        generatedAt: 'x',
      },
    };
  }),
}));

describe('buildCorrelationSnapshot shape', () => {
  beforeEach(() => {
    saved.clear();
    // all.json メタ (title/subtitle/unit/normalizationBasis)
    fetchFromR2AsJsonMock.mockReset();
    fetchFromR2AsJsonMock.mockImplementation((key: string) => {
      if (key === 'app/ranking-items/all.json') {
        return {
          generatedAt: 'x',
          count: METRICS.length,
          items: METRICS.map((m) => ({
            rankingKey: m.key,
            title: m.title,
            subtitle: null,
            unit: m.unit,
            normalizationBasis: null,
          })),
        };
      }
      return null;
    });
  });

  it('writes top-pairs / stats / by-key with reader-expected field shapes', async () => {
    const { buildCorrelationSnapshot } =
      await import('../build-correlation-snapshot');
    const result = await buildCorrelationSnapshot({ dryRun: false });

    // 7 configs のうち相関ランキング除外キーは total-population のみ (trivial-pairs.ts の
    // EXCLUDED_CORRELATION_KEYS に含まれるのは total-population だけ) → 6 が pair 対象。
    expect(result.consideredMetrics).toBe(6);

    // top-pairs snapshot の field 名・型が reader 期待 (TopCorrelation) と一致
    const topRaw = saved.get('app/correlation/top-pairs.json');
    expect(topRaw).toBeTruthy();
    const top = JSON.parse(topRaw!) as CorrelationTopPairsSnapshot;
    expect(typeof top.generatedAt).toBe('string');
    expect(Array.isArray(top.pairs)).toBe(true);
    expect(top.pairs.length).toBeGreaterThan(0);
    const pair = top.pairs[0];
    for (const f of [
      'rankingKeyX',
      'rankingKeyY',
      'titleX',
      'titleY',
      'normalizationBasisX',
      'normalizationBasisY',
      'pearsonR',
      'effectiveR',
      'partialRPopulation',
      'partialRArea',
      'partialRAging',
      'partialRDensity',
    ]) {
      expect(pair).toHaveProperty(f);
    }
    // stats snapshot
    const stats = JSON.parse(
      saved.get('app/correlation/stats.json')!
    ) as CorrelationStatsSnapshot;
    expect(typeof stats.generatedAt).toBe('string');
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.strong).toBe('number');
    expect(stats.total).toBeGreaterThanOrEqual(stats.strong);

    // per-key snapshot (metric-a)
    const byKeyRaw = saved.get('app/correlation/by-ranking-key/metric-a.json');
    expect(byKeyRaw).toBeTruthy();
    const byKey = JSON.parse(byKeyRaw!) as CorrelationByKeySnapshot;
    expect(byKey.rankingKey).toBe('metric-a');
    expect(Array.isArray(byKey.pairs)).toBe(true);
    const item = byKey.pairs[0];
    for (const f of [
      'rankingKey',
      'title',
      'subtitle',
      'unit',
      'pearsonR',
      'scatterData',
    ]) {
      expect(item).toHaveProperty(f);
    }
    // by-key の counterpart は自身ではない & scatter の x は自身軸
    expect(item.rankingKey).not.toBe('metric-a');
    expect(item.scatterData.length).toBeGreaterThanOrEqual(30);

    // by-key は人口補正後の順位相関 (絶対値) の降順。この合成データでは metric-a と metric-b (r≈0.9) の
    // 連動は人口では説明されないので、補正後も先頭に残る。
    expect(byKey.pairs[0].rankingKey).toBe('metric-b');
    expect(Math.abs(byKey.pairs[0].pearsonR)).toBeGreaterThan(0.7);
  });
});

// ランキングページの「相関が高い指標」は by-key の先頭 10 件をそのまま出す。生の |r| 順だと
// 件数系指標は「人口の多い県ほど両方大きい」だけのペアで埋まるため、人口規模の影響を除いた
// populationAdjustedR 順で選び・並べる (2026-09-23)。
describe('buildCorrelationSnapshot by-key order', () => {
  beforeEach(() => {
    saved.clear();
    fetchFromR2AsJsonMock.mockReset();
    fetchFromR2AsJsonMock.mockImplementation(() => null);
  });

  it('人口規模だけで連動するペアより、人口の影響を除いても残る相関を上に並べる', async () => {
    const population = STATS['total-population'].map((row) => row.value);
    const own = (i: number) => (((i * 37) % 47) - 23) * 8; // 人口と無関係な県ごとの差
    const noise = (i: number) => (((i * 29) % 47) - 23) * 3;
    const original = { a: STATS['metric-a'], b: STATS['metric-b'], c: STATS['metric-c'] };
    STATS['metric-a'] = makeRows((i) => population[i] + own(i));
    STATS['metric-b'] = makeRows((i) => population[i] * 2 + noise(i)); // 人口の代理
    STATS['metric-c'] = makeRows((i) => own(i) + (i % 3)); // 人口を除いた部分と連動
    try {
      const { buildCorrelationSnapshot } = await import('../build-correlation-snapshot');
      await buildCorrelationSnapshot({ dryRun: false });
      const byKey = JSON.parse(
        saved.get('app/correlation/by-ranking-key/metric-a.json')!
      ) as CorrelationByKeySnapshot;
      const b = byKey.pairs.find((p) => p.rankingKey === 'metric-b')!;
      const c = byKey.pairs.find((p) => p.rankingKey === 'metric-c')!;

      // 前提: 生の r なら人口の代理 (b) が上に来る
      expect(Math.abs(b.pearsonR)).toBeGreaterThan(Math.abs(c.pearsonR));
      expect(Math.abs(b.partialRPopulation!)).toBeLessThan(0.3);

      const order = byKey.pairs.map((p) => p.rankingKey);
      expect(order.indexOf('metric-c')).toBeLessThan(order.indexOf('metric-b'));
      expect(Math.abs(c.populationAdjustedR)).toBeGreaterThan(Math.abs(b.populationAdjustedR));
      // 画面は先頭から出すので、並びは表示値 (populationAdjustedR) の絶対値の降順でなければならない
      const shown = byKey.pairs.map((p) => Math.abs(p.populationAdjustedR));
      expect(shown).toEqual([...shown].sort((x, y) => y - x));
    } finally {
      STATS['metric-a'] = original.a;
      STATS['metric-b'] = original.b;
      STATS['metric-c'] = original.c;
    }
  });
});

// 相関 workflow は毎日・データ更新直後に起動される。変更が無ければ 2,000 件の by-key を
// 書き直さず、部分更新で 1 指標でも値が変われば必ず全件を再計算する、が契約。
describe('buildCorrelationSnapshot --skip-if-unchanged', () => {
  const publishedStats = (): string | null => saved.get('app/correlation/stats.json') ?? null;

  beforeEach(() => {
    saved.clear();
    fetchFromR2AsJsonMock.mockReset();
  });

  async function publishOnce() {
    const allJson = {
      generatedAt: 'x',
      count: METRICS.length,
      items: METRICS.map((m) => ({
        rankingKey: m.key,
        title: m.title,
        subtitle: null,
        unit: m.unit,
        normalizationBasis: null,
      })),
    };
    fetchFromR2AsJsonMock.mockImplementation((key: string) =>
      key === 'app/ranking-items/all.json' ? allJson : null
    );
    const { buildCorrelationSnapshot } = await import('../build-correlation-snapshot');
    await buildCorrelationSnapshot({ dryRun: false });
    const stats = JSON.parse(publishedStats()!) as CorrelationStatsSnapshot;
    // 前回公開分として R2 から stats.json が読める状態にする
    fetchFromR2AsJsonMock.mockImplementation((key: string) => {
      if (key === 'app/ranking-items/all.json') return allJson;
      if (key === 'app/correlation/stats.json') return stats;
      return null;
    });
    saved.clear();
    return { buildCorrelationSnapshot, stats };
  }

  it('入力が前回公開と同じなら何も書かずに skipped を返す', async () => {
    const { buildCorrelationSnapshot, stats } = await publishOnce();
    expect(stats.inputFingerprint).toMatch(/^[0-9a-f]{64}$/);

    const result = await buildCorrelationSnapshot({ dryRun: false, skipIfUnchanged: true });

    expect(result.skipped).toBe(true);
    expect(result.inputFingerprint).toBe(stats.inputFingerprint);
    expect(saved.size).toBe(0);
  });

  it('部分更新で 1 指標の値が変わったら再計算して全ファイルを書く', async () => {
    const { buildCorrelationSnapshot, stats } = await publishOnce();
    const original = STATS['metric-c'];
    STATS['metric-c'] = original.map((row, i) => (i === 0 ? { ...row, value: row.value + 1 } : row));
    try {
      const result = await buildCorrelationSnapshot({ dryRun: false, skipIfUnchanged: true });

      expect(result.skipped).toBe(false);
      expect(result.inputFingerprint).not.toBe(stats.inputFingerprint);
      expect(saved.has('app/correlation/by-ranking-key/metric-a.json')).toBe(true);
      const next = JSON.parse(publishedStats()!) as CorrelationStatsSnapshot;
      expect(next.inputFingerprint).toBe(result.inputFingerprint);
    } finally {
      STATS['metric-c'] = original;
    }
  });

  it('skipIfUnchanged を付けなければ入力が同じでも書き直す (手動 force 用)', async () => {
    const { buildCorrelationSnapshot } = await publishOnce();

    const result = await buildCorrelationSnapshot({ dryRun: false });

    expect(result.skipped).toBe(false);
    expect(saved.has('app/correlation/stats.json')).toBe(true);
  });
});

describe('computeInputFingerprint', () => {
  const rows = (values: number[], name = 'pref') =>
    values.map((value, i) => ({ areaCode: `0${i + 1}000`, areaName: `${name}-${i + 1}`, value }));
  const meta = (title: string) =>
    new Map([['metric-a', { title, subtitle: null, unit: '件', normalizationBasis: null }]]);

  it('並列 fetch の完了順 (Map の挿入順・行順) に依存しない', async () => {
    const { computeInputFingerprint } = await import('../build-correlation-snapshot');
    const a = { latestYear: '2020', rows: rows([1, 2, 3]) };
    const b = { latestYear: '2020', rows: rows([4, 5, 6]) };
    const forward = new Map([['metric-a', a], ['metric-b', b]]);
    const reversed = new Map([['metric-b', { ...b, rows: [...b.rows].reverse() }], ['metric-a', a]]);

    expect(computeInputFingerprint(forward, ['metric-a'], meta('A'), 'src')).toBe(
      computeInputFingerprint(reversed, ['metric-a'], meta('A'), 'src')
    );
  });

  it('値・県名・表示タイトル・コードのどれが変わっても別の値になる', async () => {
    const { computeInputFingerprint } = await import('../build-correlation-snapshot');
    const base = new Map([['metric-a', { latestYear: '2020', rows: rows([1, 2, 3]) }]]);
    const fp = computeInputFingerprint(base, ['metric-a'], meta('A'), 'src');

    const changedValue = new Map([['metric-a', { latestYear: '2020', rows: rows([1, 2, 4]) }]]);
    const changedName = new Map([['metric-a', { latestYear: '2020', rows: rows([1, 2, 3], 'x') }]]);
    const changedYear = new Map([['metric-a', { latestYear: '2021', rows: rows([1, 2, 3]) }]]);
    for (const other of [
      computeInputFingerprint(changedValue, ['metric-a'], meta('A'), 'src'),
      computeInputFingerprint(changedName, ['metric-a'], meta('A'), 'src'),
      computeInputFingerprint(changedYear, ['metric-a'], meta('A'), 'src'),
      computeInputFingerprint(base, ['metric-a'], meta('B'), 'src'),
      computeInputFingerprint(base, ['metric-a'], meta('A'), 'src2'),
    ]) {
      expect(other).not.toBe(fp);
    }
  });
});

// ランキングページは観測値にある最新年を表示する。相関がそれと違う年 (や存在しない年) を見ると、
// 相関が作られないか、古い相関がページに残り続ける (2026-09-23 に 90 指標・54 ページで実測)。
describe('buildCorrelationSnapshot の対象年と空ファイル', () => {
  beforeEach(() => {
    saved.clear();
    fetchFromR2AsJsonMock.mockReset();
    fetchFromR2AsJsonMock.mockImplementation(() => null);
  });

  const byKey = (key: string) => {
    const raw = saved.get(`app/correlation/by-ranking-key/${key}.json`);
    return raw ? (JSON.parse(raw) as CorrelationByKeySnapshot) : null;
  };

  it.each([
    ['config.years がデータより先の年まである', { from: 2020, to: 2023 }],
    ['config.years が all', 'all'],
  ])('%s指標も、観測値にある最新年で計算する', async (_label, years) => {
    const target = METRICS.find((m) => m.key === 'metric-a')!;
    const original = target.years;
    target.years = years;
    try {
      const { buildCorrelationSnapshot } = await import('../build-correlation-snapshot');
      const result = await buildCorrelationSnapshot({ dryRun: false });

      expect(result.consideredMetrics).toBe(6);
      expect(byKey('metric-a')?.pairs.length).toBeGreaterThan(0);
    } finally {
      target.years = original;
    }
  });

  it('計算できない有効指標には空の by-key を書き、--limit-metrics では書かない', async () => {
    const original = STATS['metric-c'];
    STATS['metric-c'] = original.slice(0, 10); // 30 県未満
    try {
      const { buildCorrelationSnapshot } = await import('../build-correlation-snapshot');
      const result = await buildCorrelationSnapshot({ dryRun: false });

      // 30 県未満の metric-c と、相関除外キーの total-population
      expect(byKey('metric-c')?.pairs).toEqual([]);
      expect(byKey('total-population')?.pairs).toEqual([]);
      expect(result.emptyKeyFiles).toBe(2);
      expect(byKey('metric-a')?.pairs.length).toBeGreaterThan(0);

      saved.clear();
      await buildCorrelationSnapshot({ dryRun: false, limitMetrics: 3 });
      expect(byKey('total-population')).toBeNull();
    } finally {
      STATS['metric-c'] = original;
    }
  });
});

// テーマページ「このテーマと関連の深い指標」はテーマの外へ出る導線。テーマ内の指標や
// 弱い相関を出すと導線にならないので、外の指標だけを人口補正後の順位相関 |r| >= 0.5 で並べる。
describe('buildCorrelationSnapshot by-theme', () => {
  beforeEach(() => {
    saved.clear();
    fetchFromR2AsJsonMock.mockReset();
    fetchFromR2AsJsonMock.mockImplementation(() => null);
  });

  const byTheme = (themeKey: string) => {
    const raw = saved.get(`app/correlation/by-theme/${themeKey}.json`);
    return raw ? JSON.parse(raw) : null;
  };

  it('テーマ外で最も強く相関する指標を、経由したテーマ内の指標つきで並べる', async () => {
    const { buildCorrelationSnapshot } = await import('../build-correlation-snapshot');
    const result = await buildCorrelationSnapshot({ dryRun: false });

    const items = byTheme('theme-a').items as Array<{
      rankingKey: string;
      populationAdjustedR: number;
      via: { rankingKey: string };
    }>;
    expect(items[0]).toMatchObject({ rankingKey: 'metric-b', via: { rankingKey: 'metric-a' } });
    expect(items.map((item) => item.rankingKey)).not.toContain('metric-a');
    expect(items.every((item) => Math.abs(item.populationAdjustedR) >= 0.5)).toBe(true);
    const shown = items.map((item) => Math.abs(item.populationAdjustedR));
    expect(shown).toEqual([...shown].sort((a, b) => b - a));

    // テーマ外の候補が無いテーマも空で書き、古い一覧を残さない
    expect(byTheme('theme-all').items).toEqual([]);
    expect(result.themeFiles).toBe(2);
  });
});

// 1 県 (北海道の乳用牛・耕地面積のような) の極端な値だけで r≈1 になる組は、順位にすると関係が消える。
// Pearson の値で並べ・表示すると「無関係な指標が最も関連が深い」と案内してしまう。
describe('buildCorrelationSnapshot の順位相関', () => {
  beforeEach(() => {
    saved.clear();
    fetchFromR2AsJsonMock.mockReset();
    fetchFromR2AsJsonMock.mockImplementation(() => null);
  });

  it('1 県の外れ値だけで相関する組は、表示値が低く上位に来ない', async () => {
    const original = { b: STATS['metric-b'], c: STATS['metric-c'] };
    STATS['metric-b'] = makeRows((i) => (i === 0 ? 100000 : (i * 17) % 47));
    STATS['metric-c'] = makeRows((i) => (i === 0 ? 100000 : (i * 23) % 47));
    try {
      const { buildCorrelationSnapshot } = await import('../build-correlation-snapshot');
      await buildCorrelationSnapshot({ dryRun: false });
      const byKey = JSON.parse(saved.get('app/correlation/by-ranking-key/metric-b.json')!) as CorrelationByKeySnapshot;
      const c = byKey.pairs.find((pair) => pair.rankingKey === 'metric-c')!;

      // 前提: Pearson は 1 に近い
      expect(c.pearsonR).toBeGreaterThan(0.99);
      expect(Math.abs(c.populationAdjustedR)).toBeLessThan(0.4);
      expect(byKey.pairs[0].rankingKey).not.toBe('metric-c');
    } finally {
      STATS['metric-b'] = original.b;
      STATS['metric-c'] = original.c;
    }
  });
});
