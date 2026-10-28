import { describe, expect, it } from 'vitest';

import { parseCityDatabookSnapshot } from '../../repositories/schemas/municipality-ranking.schemas';
import { buildCityDatabooks, buildWardBreakdowns } from '../build-city-databooks';
import { buildCityPageMeta, buildMunicipalityRankingMeta } from '../municipality-page-meta';
import {
  buildMunicipalityListNames,
  municipalityFullName,
  municipalityLeafName,
  municipalityRankingDisplayTitle,
  prefectureInsideLabel,
} from '../municipality-names';

import type {
  MunicipalityRankingItemSnapshot,
  MunicipalityRankingValuesSnapshot,
} from '../../types/municipality-snapshot';

function ranking(
  key: string,
  title: string,
  unit: string,
  rows: Array<[code: string, name: string, pref: string, value: number, rank: number]>,
  subtitle?: string
): { item: MunicipalityRankingItemSnapshot; values: MunicipalityRankingValuesSnapshot } {
  return {
    item: { rankingKey: key, title, subtitle } as MunicipalityRankingItemSnapshot,
    values: {
      rankingKey: key,
      yearCode: '2020',
      yearName: '2020年',
      unit,
      count: rows.length,
      values: rows.map(([areaCode, areaName, prefectureCode, value, rank]) => ({
        areaCode,
        areaName,
        prefectureCode,
        value,
        rank,
      })),
    } as MunicipalityRankingValuesSnapshot,
  };
}

const entities = [
  { code: '13101', name: '東京都 千代田区', prefectureCode: '13000' },
  { code: '13102', name: '東京都 中央区', prefectureCode: '13000' },
  { code: '27128', name: '大阪府 大阪市 中央区', prefectureCode: '27000' },
  { code: '14100', name: '神奈川県 横浜市', prefectureCode: '14000' },
];

const rankings = new Map([
  [
    'total-population',
    ranking('total-population', '総人口', '人', [
      ['14100', '神奈川県 横浜市', '14000', 3_777_491, 1],
      ['13102', '東京都 中央区', '13000', 169_179, 2],
      ['13101', '東京都 千代田区', '13000', 66_680, 3],
    ]),
  ],
  [
    'elderly-population-ratio',
    ranking('elderly-population-ratio', '高齢化率', '%', [
      ['14100', '神奈川県 横浜市', '14000', 25, 1],
      ['13101', '東京都 千代田区', '13000', 17, 2],
      ['13102', '東京都 中央区', '13000', 17, 2],
    ]),
  ],
  [
    'retail-stores',
    ranking('retail-stores', '小売店数', '店', [['13101', '東京都 千代田区', '13000', 2_000, 1]], '飲食料品'),
  ],
]);

const themes = [
  { slug: 'population', title: '人口', metricKeys: ['total-population', 'elderly-population-ratio'] },
  { slug: 'aging-society', title: '高齢化', metricKeys: ['elderly-population-ratio'] },
  { slug: 'commerce', title: '商業', metricKeys: ['retail-stores', 'unpublished-key'] },
];

function build() {
  return buildCityDatabooks({
    entities,
    themes,
    headlineMetricKeys: ['total-population', 'elderly-population-ratio', 'households'],
    populationMetricKey: 'total-population',
    rankings,
    basisOf: (key) => (key === 'elderly-population-ratio' ? 'rate' : 'total'),
    populationHistory: [
      { areaCode: '13101', yearCode: '2015', yearName: '2015年', value: 58_406 },
      { areaCode: '13101', yearCode: '2010', yearName: '2010年', value: 47_115 },
      { areaCode: '13101', yearCode: '2020', yearName: '2020年', value: 66_680 },
      { areaCode: '13102', yearCode: '2015', value: null },
    ],
  });
}

describe('buildCityDatabooks', () => {
  it('値と全国順位はランキングの配信値をそのまま写し、県内順位は県ごとに数える', () => {
    const chiyoda = build().get('13101')!;
    expect(chiyoda.metrics['total-population']).toMatchObject({
      value: 66_680,
      nationalRank: 3,
      nationalCount: 3,
      prefectureRank: 2,
      prefectureCount: 2,
      basis: 'total',
    });
  });

  it('全国で同順位の値は県内でも同順位にする', () => {
    const books = build();
    expect(books.get('13101')!.metrics['elderly-population-ratio']!.prefectureRank).toBe(1);
    expect(books.get('13102')!.metrics['elderly-population-ratio']!.prefectureRank).toBe(1);
  });

  it('先に出た節の指標を重ねず、指標の無い節は出さない', () => {
    const chiyoda = build().get('13101')!;
    expect(chiyoda.sections).toEqual([
      { themeSlug: 'population', title: '人口', metricKeys: ['total-population', 'elderly-population-ratio'] },
      { themeSlug: 'commerce', title: '商業', metricKeys: ['retail-stores'] },
    ]);
    expect(build().get('13102')!.sections.map((section) => section.themeSlug)).toEqual(['population']);
  });

  it('同名の指標は限定子付きの表示名にする', () => {
    expect(build().get('13101')!.metrics['retail-stores']!.label).toBe('小売店数（飲食料品）');
  });

  it('見出しは値のある指標だけを残す', () => {
    expect(build().get('13101')!.headlineKeys).toEqual(['total-population', 'elderly-population-ratio']);
  });

  it('前回の人口はランキングの年より前で最も新しい年を使い、値の無い年は使わない', () => {
    const books = build();
    expect(books.get('13101')!.previousPopulation).toEqual({ value: 58_406, yearCode: '2015', yearName: '2015年' });
    expect(books.get('13102')!.previousPopulation).toBeNull();
  });

  it('人口の値が無い市区町村は作らない (title が人口を使う)', () => {
    expect(build().has('27128')).toBe(false);
  });

  it('作ったデータブックは配信の schema を通る', () => {
    for (const book of build().values()) {
      expect(() => parseCityDatabookSnapshot(JSON.parse(JSON.stringify(book)))).not.toThrow();
    }
  });

  it('schema は見出し・節が指す指標の欠落を拒否する', () => {
    const book = JSON.parse(JSON.stringify(build().get('13101')!));
    delete book.metrics['retail-stores'];
    expect(() => parseCityDatabookSnapshot(book)).toThrow(/retail-stores/);
  });
});

describe('市区町村の表示名', () => {
  it('配信値の名前から末尾の名前と県名付きの名前を作る', () => {
    expect(municipalityLeafName('愛知県 豊田市')).toBe('豊田市');
    expect(municipalityLeafName('大阪府 大阪市 中央区')).toBe('中央区');
    expect(municipalityFullName('愛知県 豊田市')).toBe('愛知県豊田市');
    expect(['東京都', '北海道', '大阪府', '香川県'].map(prefectureInsideLabel)).toEqual(['都内', '道内', '府内', '県内']);
  });

  it('一覧では同名の自治体だけに県名を添える', () => {
    const listName = buildMunicipalityListNames(['東京都 府中市', '広島県 府中市', '愛知県 豊田市']);
    expect(listName('東京都 府中市')).toBe('府中市（東京都）');
    expect(listName('広島県 府中市')).toBe('府中市（広島県）');
    expect(listName('愛知県 豊田市')).toBe('豊田市');
  });

  it('同名 title の指標は subtitle を併記する', () => {
    expect(municipalityRankingDisplayTitle({ title: '事業所数', subtitle: '製造業' })).toBe('事業所数（製造業）');
    expect(municipalityRankingDisplayTitle({ title: '総人口', subtitle: null })).toBe('総人口');
  });
});

describe('title・説明文', () => {
  it('市区町村ランキングの title は 1 位と値を読める単位で書く', () => {
    const { item, values } = rankings.get('total-population')!;
    const meta = buildMunicipalityRankingMeta(item, values);
    expect(meta.title).toBe('総人口 市区町村ランキング【2020年】｜1位 神奈川県横浜市（378万人）');
    expect(meta.description).toContain('全国3市区町村で比較。1位は神奈川県横浜市（378万人）、2位は東京都中央区（16.9万人）');
  });

  it('市区町村ページの title は人口と県内順位を先頭に置く', () => {
    const meta = buildCityPageMeta(build().get('13101')!, '東京都');
    expect(meta.title).toBe('千代田区（東京都）の人口・統計データ｜6.7万人（2020年）・都内2位');
    expect(meta.description).toContain('2015年の5.8万人から14.2%増えました');
    expect(meta.description).toContain('高齢化率17%');
  });
});

describe('政令指定都市の行政区の内訳', () => {
  const rankings = new Map([
    ['total-population', ranking('total-population', '総人口', '人', [['14100', '神奈川県 横浜市', '14000', 3_750_000, 1]])],
    ['fiscal-strength-index', ranking('fiscal-strength-index', '財政力指数', '指数', [['14100', '神奈川県 横浜市', '14000', 0.96, 1]])],
  ]);
  const wardsByCity = new Map([
    ['14100', [
      { code: '14102', name: '神奈川県 横浜市 神奈川区' },
      { code: '14101', name: '神奈川県 横浜市 鶴見区' },
    ]],
  ]);
  const observations = new Map([
    ['total-population', [
      { areaCode: '14101', yearCode: '2020', value: 290_000 },
      { areaCode: '14102', yearCode: '2020', value: 250_000 },
      { areaCode: '14102', yearCode: '2015', value: 999_999 }, // 市全体と違う年は使わない
      { areaCode: '14100', yearCode: '2020', value: 3_750_000 }, // 市全体の行は内訳に入れない
    ]],
    // e-Stat で行政区が 0 の指標 (行政区の値が集計されていない)
    ['fiscal-strength-index', [
      { areaCode: '14101', yearCode: '2020', value: 0 },
      { areaCode: '14102', yearCode: '2020', value: 0 },
    ]],
  ]);

  const breakdowns = buildWardBreakdowns({
    wardsByCity,
    headlineMetricKeys: ['total-population', 'fiscal-strength-index'],
    rankings,
    observations,
    valuePolicyOf: (key) => (key === 'fiscal-strength-index' ? { minExclusive: 0 } : undefined),
  });

  it('市全体と同じ年の行政区の値だけを、市の中の順位付きで束ねる (行政区はコード順)', () => {
    const yokohama = breakdowns.get('14100')!;
    expect(yokohama.wards.map((ward) => ward.areaCode)).toEqual(['14101', '14102']);
    expect(yokohama.metrics['total-population']!.values).toEqual([
      { areaCode: '14101', value: 290_000, cityRank: 1 },
      { areaCode: '14102', value: 250_000, cityRank: 2 },
    ]);
  });

  it('値の範囲 (valuePolicy) を外れる値・全区 0 の指標は載せない (財政力指数は行政区が集計されていない)', () => {
    expect(breakdowns.get('14100')!.metrics['fiscal-strength-index']).toBeUndefined();
  });

  it('作った内訳はデータブックの形 (schema) を満たす', () => {
    const databook = buildCityDatabooks({
      entities: [{ code: '14100', name: '神奈川県 横浜市', prefectureCode: '14000' }],
      themes: [],
      headlineMetricKeys: ['total-population'],
      populationMetricKey: 'total-population',
      rankings,
      basisOf: () => 'total',
      populationHistory: [],
      wardBreakdowns: breakdowns,
    }).get('14100')!;
    expect(parseCityDatabookSnapshot(databook).wardBreakdown?.wards).toHaveLength(2);
  });
});
