import { describe, expect, it } from 'vitest';

import {
  buildMunicipalityPrefectureRanking,
  buildMunicipalityPrefectureRankingMeta,
  buildMunicipalityPrefectureRankingSummary,
  isSpecialWardRow,
  lacksSpecialWards,
  municipalityPrefectureAreaLabel,
} from '../municipality-prefecture-ranking';

import type { MunicipalityRankingValue } from '../../types/municipality-snapshot';

function row(
  areaCode: string,
  areaName: string,
  prefectureCode: string,
  value: number,
  rank: number
): MunicipalityRankingValue {
  return { areaCode, areaName, prefectureCode, value, rank };
}

const VALUES: MunicipalityRankingValue[] = [
  row('23211', '愛知県 豊田市', '23000', 1500, 1),
  row('14100', '神奈川県 横浜市', '14000', 900, 2),
  row('23100', '愛知県 名古屋市', '23000', 800, 3),
  row('23202', '愛知県 岡崎市', '23000', 300, 4),
  row('14130', '神奈川県 川崎市', '14000', 200, 5),
  row('23561', '愛知県 豊根村', '23000', 0, 6),
  row('23563', '愛知県 飛島村', '23000', 0, 6),
];

describe('buildMunicipalityPrefectureRanking', () => {
  it('県内の自治体だけを全国順位の順に並べ、県内順位を振り直す', () => {
    const ranking = buildMunicipalityPrefectureRanking(VALUES, '23000');
    expect(ranking?.rows.map((r) => [r.areaName, r.prefectureRank])).toEqual([
      ['愛知県 豊田市', 1],
      ['愛知県 名古屋市', 2],
      ['愛知県 岡崎市', 3],
      ['愛知県 豊根村', 4],
      ['愛知県 飛島村', 4],
    ]);
  });

  it('全国の同順位は県内でも同順位のまま (片方だけ最下位にしない)', () => {
    const ranking = buildMunicipalityPrefectureRanking(VALUES, '23000')!;
    const last = ranking.rows.slice(-2).map((r) => r.prefectureRank);
    expect(last).toEqual([4, 4]);
  });

  it('県内・全国とも全国版と同じ下側中央値を使う', () => {
    const ranking = buildMunicipalityPrefectureRanking(VALUES, '23000')!;
    expect(ranking.median).toBe(300);
    expect(ranking.nationalMedian).toBe(300);
    expect(ranking.nationalCount).toBe(7);
  });

  it('県内に値が無いときは null (空のページを作らない)', () => {
    expect(buildMunicipalityPrefectureRanking(VALUES, '01000')).toBeNull();
  });
});

describe('特別区の有無', () => {
  it('東京都の「〜区」だけを特別区とみなす (他県の「〜区」は配信値に無いが、あっても数えない)', () => {
    expect(isSpecialWardRow({ prefectureCode: '13000', areaName: '東京都 千代田区' })).toBe(true);
    expect(isSpecialWardRow({ prefectureCode: '13000', areaName: '東京都 八王子市' })).toBe(false);
    expect(isSpecialWardRow({ prefectureCode: '14000', areaName: '神奈川県 横浜市 西区' })).toBe(false);
  });

  it('東京都の市町村に値があり特別区が 1 つも無い指標だけ、区が欠けていると判定する', () => {
    const cities = [row('13201', '東京都 八王子市', '13000', 1, 1)];
    expect(lacksSpecialWards(cities)).toBe(true);
    expect(lacksSpecialWards([...cities, row('13101', '東京都 千代田区', '13000', 2, 2)])).toBe(false);
    // 東京都に 1 行も無い指標 (湖沼の面積など) は区の欠けとして扱わない
    expect(lacksSpecialWards([row('23211', '愛知県 豊田市', '23000', 1, 1)])).toBe(false);
  });
});

describe('buildMunicipalityPrefectureRankingSummary', () => {
  it('1位・最下位・中央値・全国上位の数を配信値から組む', () => {
    const ranking = buildMunicipalityPrefectureRanking(VALUES, '23000')!;
    const sentences = buildMunicipalityPrefectureRankingSummary(ranking, {
      prefectureName: '愛知県',
      unit: '人',
      metricLabel: '出生数',
    });
    expect(sentences[0]).toBe(
      '愛知県の5市町村の出生数で、1位は豊田市（1,500人）、最下位は豊根村など2市町村（0人）です。'
    );
    expect(sentences[1]).toBe('県内の中央値は300人で、全国7市区町村の中央値（300人）と同じです。');
    expect(sentences[2]).toBe('全国100位以内に入るのは5市町村です。');
  });

  it('全国の中央値との差の向きを値の大小で書く (順位の向きに依存しない)', () => {
    const ranking = buildMunicipalityPrefectureRanking(VALUES, '14000')!;
    const [, median] = buildMunicipalityPrefectureRankingSummary(ranking, {
      prefectureName: '神奈川県',
      unit: '人',
      metricLabel: '出生数',
    });
    expect(median).toContain('より低い値です');
  });
});

describe('県名×市区町村ランキングの title', () => {
  it('県内に特別区の行があるときだけ「市区町村」、無ければ検索語の多い「市町村」と書く', () => {
    expect(municipalityPrefectureAreaLabel(true)).toBe('市区町村');
    expect(municipalityPrefectureAreaLabel(false)).toBe('市町村');
  });

  it('東京都でも特別区に値の無い指標は「市町村」と書く (財政力指数の東京都で「39市区町村」と出ていた)', () => {
    const fiscal = [row('13201', '東京都 八王子市', '13000', 0.9, 1), row('13202', '東京都 立川市', '13000', 1.1, 2)];
    expect(buildMunicipalityPrefectureRanking(fiscal, '13000')?.hasSpecialWards).toBe(false);
    const income = [row('13103', '東京都 港区', '13000', 13968, 1), ...fiscal];
    expect(buildMunicipalityPrefectureRanking(income, '13000')?.hasSpecialWards).toBe(true);
  });

  it('title に県名・年・県内 1 位を入れ、全国版の title と別にする', () => {
    const ranking = buildMunicipalityPrefectureRanking(VALUES, '23000')!;
    const meta = buildMunicipalityPrefectureRankingMeta(
      { title: '出生数' },
      { yearName: '2023年', unit: '人' },
      ranking,
      '愛知県'
    );
    expect(meta.title).toBe('愛知県の市町村出生数ランキング【2023年】｜1位 豊田市（1,500人）');
    expect(meta.description).toContain('1位は豊田市（1,500人）、2位は名古屋市（800人）、3位は岡崎市（300人）');
  });
});
