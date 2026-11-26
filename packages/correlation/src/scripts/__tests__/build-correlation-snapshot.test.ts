import { beforeEach, describe, expect, it, vi } from 'vitest';

import { compareCorrelation } from '../../selection-policy';
import { AREA_CODES, buildYearSeries } from '../../utils/year-slices';
import type {
  CorrelationByKeySnapshot,
  CorrelationStatsSnapshot,
  CorrelationTopPairsSnapshot,
} from '../../types/snapshot';

function flatPairs(snapshot: CorrelationByKeySnapshot) {
  return [...snapshot.groups.positive, ...snapshot.groups.negative].sort(compareCorrelation);
}

// ── server-only / logger は no-op ──────────────────────────────────────────────
vi.mock('server-only', () => ({}));
vi.mock('@stats47/logger/server', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

// ── R2: writeR2Staging は呼び出しを記録、fetch は all.json メタを返す ──────────────────
const saved = new Map<string, string>();
const fetchFromR2AsJsonMock = vi.fn();
vi.mock('@stats47/r2-storage/server', () => ({
  assertR2WriteAllowed: vi.fn(),
  writeR2Staging: vi.fn(async (key: string, body: string) => {
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
  'metric-b': makeRows((i) => (i + 1) * 2 + 3 + ((i * 13) % 17) * 2), // r≈0.94 (0.99 以上は同じデータとして外れる)
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

describe('候補保持の段階で正負の枠を確保する', () => {
  it('絶対値上位を正が占めても負の候補10件を残す', async () => {
    const { TopByPopulationAdjusted } = await import('../build-correlation-snapshot');
    const top = new TopByPopulationAdjusted('self');
    for (let i = 0; i < 30; i++) {
      for (const sign of [1, -1]) {
        top.add({ keyX: 'self', keyY: `${sign}-${i}`, pearsonR: 0.8,
          populationAdjustedRankR: sign * ((sign > 0 ? 0.99 : 0.6) - i / 1000),
          effectiveAbsR: 0.5, partialRPopulation: null, partialRArea: null, partialRAging: null, partialRDensity: null });
      }
    }
    expect(top.values().filter(item => item.populationAdjustedRankR > 0)).toHaveLength(10);
    expect(top.values().filter(item => item.populationAdjustedRankR < 0)).toHaveLength(10);
  });
});

describe('buildCorrelationSnapshot shape', () => {
  beforeEach(() => {
    saved.clear();
    // all.json メタ (title/subtitle/unit)
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
    const byKeyRaw = saved.get('app/correlation/by-ranking-key-v2/metric-a.json');
    expect(byKeyRaw).toBeTruthy();
    const byKey = JSON.parse(byKeyRaw!) as CorrelationByKeySnapshot;
    expect(byKey.rankingKey).toBe('metric-a');
    expect(Array.isArray(flatPairs(byKey))).toBe(true);
    const item = flatPairs(byKey)[0];
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
    expect(flatPairs(byKey)[0].rankingKey).toBe('metric-b');
    expect(Math.abs(flatPairs(byKey)[0].pearsonR)).toBeGreaterThan(0.7);
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
        saved.get('app/correlation/by-ranking-key-v2/metric-a.json')!
      ) as CorrelationByKeySnapshot;
      const b = flatPairs(byKey).find((p) => p.rankingKey === 'metric-b')!;
      const c = flatPairs(byKey).find((p) => p.rankingKey === 'metric-c')!;

      // 前提: 生の r なら人口の代理 (b) が上に来る
      expect(Math.abs(b.pearsonR)).toBeGreaterThan(Math.abs(c.pearsonR));
      expect(Math.abs(b.partialRPopulation!)).toBeLessThan(0.3);

      const order = flatPairs(byKey).map((p) => p.rankingKey);
      expect(order.indexOf('metric-c')).toBeLessThan(order.indexOf('metric-b'));
      expect(Math.abs(c.populationAdjustedR)).toBeGreaterThan(Math.abs(b.populationAdjustedR));
      // 画面は先頭から出すので、並びは表示値 (populationAdjustedR) の絶対値の降順でなければならない
      const shown = flatPairs(byKey).map((p) => Math.abs(p.populationAdjustedR));
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
      expect(saved.has('app/correlation/by-ranking-key-v2/metric-a.json')).toBe(true);
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
  const series = (values: number[], year = '2020') =>
    buildYearSeries(values.map((value, i) => ({ areaCode: AREA_CODES[i], yearCode: year, value })), () => true, 1);
  const names = (name = 'pref') => new Map(AREA_CODES.slice(0, 3).map((code, i) => [code, `${name}-${i + 1}`]));
  const meta = (title: string) =>
    new Map([['metric-a', { title, subtitle: null, unit: '件' }]]);

  it('並列 fetch の完了順 (Map の挿入順) に依存しない', async () => {
    const { computeInputFingerprint } = await import('../build-correlation-snapshot');
    const a = series([1, 2, 3]);
    const b = series([4, 5, 6]);
    const forward = new Map([['metric-a', a], ['metric-b', b]]);
    const reversed = new Map([['metric-b', b], ['metric-a', a]]);

    expect(computeInputFingerprint(forward, ['metric-a'], meta('A'), 'src', names())).toBe(
      computeInputFingerprint(reversed, ['metric-a'], meta('A'), 'src', names())
    );
  });

  it('値・県名・年・表示タイトル・コードのどれが変わっても別の値になる', async () => {
    const { computeInputFingerprint } = await import('../build-correlation-snapshot');
    const base = new Map([['metric-a', series([1, 2, 3])]]);
    const fp = computeInputFingerprint(base, ['metric-a'], meta('A'), 'src', names());

    const changedValue = new Map([['metric-a', series([1, 2, 4])]]);
    const changedYear = new Map([['metric-a', series([1, 2, 3], '2021')]]);
    for (const other of [
      computeInputFingerprint(changedValue, ['metric-a'], meta('A'), 'src', names()),
      computeInputFingerprint(base, ['metric-a'], meta('A'), 'src', names('x')),
      computeInputFingerprint(changedYear, ['metric-a'], meta('A'), 'src', names()),
      computeInputFingerprint(base, ['metric-a'], meta('B'), 'src', names()),
      computeInputFingerprint(base, ['metric-a'], meta('A'), 'src2', names()),
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
    const raw = saved.get(`app/correlation/by-ranking-key-v2/${key}.json`);
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
      expect(flatPairs(byKey('metric-a')!).length).toBeGreaterThan(0);
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
      expect(flatPairs(byKey('metric-c')!)).toEqual([]);
      expect(flatPairs(byKey('total-population')!)).toEqual([]);
      expect(result.emptyKeyFiles).toBe(2);
      expect(flatPairs(byKey('metric-a')!).length).toBeGreaterThan(0);

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
      const byKey = JSON.parse(saved.get('app/correlation/by-ranking-key-v2/metric-b.json')!) as CorrelationByKeySnapshot;
      const c = flatPairs(byKey).find((pair) => pair.rankingKey === 'metric-c')!;

      // 前提: Pearson は 1 に近い
      expect(c.pearsonR).toBeGreaterThan(0.99);
      expect(Math.abs(c.populationAdjustedR)).toBeLessThan(0.4);
      expect(flatPairs(byKey)[0].rankingKey).not.toBe('metric-c');
    } finally {
      STATS['metric-b'] = original.b;
      STATS['metric-c'] = original.c;
    }
  });
});

describe('buildThemeLinks', () => {
  const candidate = (keyY: string, pearsonR: number, populationAdjustedRankR: number) => ({
    keyX: 'member',
    keyY,
    pearsonR,
    partialRPopulation: null,
    partialRArea: null,
    partialRAging: null,
    partialRDensity: null,
    effectiveAbsR: Math.abs(pearsonR),
    populationAdjustedRankR,
  });
  const meta = (title: string) => ({ title, subtitle: null, unit: '' });

  it('|pearsonR| が 0.99 以上の組は同じデータの別名とみなして出さず、それ未満は残す', async () => {
    const { buildThemeLinks } = await import('../build-correlation-snapshot');
    const perKeyTop = new Map([
      ['member', { values: () => [candidate('same-data', 0.999, 1), candidate('related', 0.8, 0.7)] }],
    ]);
    const metaMap = new Map([
      ['member', meta('テーマ内')],
      ['same-data', meta('別名')],
      ['related', meta('関連')],
    ]);

    const links = buildThemeLinks(
      ['member'],
      perKeyTop as unknown as Parameters<typeof buildThemeLinks>[1],
      metaMap
    );

    expect(links.map((link) => link.rankingKey)).toEqual(['related']);
  });
});

// 指標ごとの最新年どうしで組むと、年の違う値の相関を出してしまう
// (2026-10-09: 農業産出額 2024 年 × 農業就業人口 2014 年で r=0.762。CORRELATION-SNAPSHOT-YEAR-ALIGN-01)。
describe('buildCorrelationSnapshot の共通年', () => {
  beforeEach(() => {
    saved.clear();
    fetchFromR2AsJsonMock.mockReset();
    fetchFromR2AsJsonMock.mockImplementation(() => null);
  });

  const atYear = (rows: ReturnType<typeof makeRows>, yearCode: string) =>
    rows.map((row) => ({ ...row, yearCode, yearName: `${yearCode}年` }));

  it('ペアは両方に値のある最新の共通年で計算し、統制変数も同じ年の値だけを使う', async () => {
    const a = METRICS.find((m) => m.key === 'metric-a')!;
    const b = METRICS.find((m) => m.key === 'metric-b')!;
    const pop = METRICS.find((m) => m.key === 'total-population')!;
    const original = { a: STATS['metric-a'], b: STATS['metric-b'], pop: STATS['total-population'], aYears: a.years, bYears: b.years, popYears: pop.years };
    a.years = 'all';
    b.years = 'all';
    pop.years = 'all';
    // metric-a の 2024 年は b の 2014 年と逆向き。最新年どうしで組むと強い負の相関になる
    STATS['metric-a'] = [...atYear(makeRows((i) => 47 - i), '2024'), ...atYear(makeRows((i) => i + 1), '2014')];
    STATS['metric-b'] = atYear(makeRows((i) => (i + 1) * 2 + ((i * 13) % 17)), '2014');
    // 総人口だけ 2014 年の値を持つ。ほかの統制変数は 2020 年だけなので、2014 年のペアには使わない
    STATS['total-population'] = [...original.pop, ...atYear(makeRows((i) => 1000 + ((i * 19) % 47) * 7), '2014')];
    try {
      const { buildCorrelationSnapshot } = await import('../build-correlation-snapshot');
      await buildCorrelationSnapshot({ dryRun: false });
      const byKey = JSON.parse(saved.get('app/correlation/by-ranking-key-v2/metric-a.json')!) as CorrelationByKeySnapshot;
      const pair = flatPairs(byKey).find((p) => p.rankingKey === 'metric-b')!;

      expect(byKey.latestYear).toBe('2024');
      expect(pair.year).toBe('2014');
      expect(pair.pearsonR).toBeGreaterThan(0.9);
      expect(pair.partialRPopulation).not.toBeNull();
      expect(pair.partialRAging).toBeNull();
      expect(pair.partialRArea).toBeNull();
      // 散布図も同じ年の値
      expect(pair.scatterData.find((p) => p.areaCode === '01000')).toMatchObject({ x: 1, y: 2 });

      const top = JSON.parse(saved.get('app/correlation/top-pairs.json')!) as CorrelationTopPairsSnapshot;
      const topPair = top.pairs.find((p) => [p.rankingKeyX, p.rankingKeyY].sort().join() === 'metric-a,metric-b');
      expect(topPair?.year).toBe('2014');
    } finally {
      STATS['metric-a'] = original.a;
      STATS['metric-b'] = original.b;
      STATS['total-population'] = original.pop;
      a.years = original.aYears;
      b.years = original.bYears;
      pop.years = original.popYears;
    }
  });
});

