import { describe, expect, it } from 'vitest';

import {
  auditMunicipalityAiContent,
  buildMunicipalityAiFacts,
  isMunicipalityAiContentCurrent,
  parseMunicipalityAiContent,
  parseMunicipalityAiContentSnapshot,
  type MunicipalityAiContent,
} from '../municipality-ai-content';

import type {
  MunicipalityRankingItemSnapshot,
  MunicipalityRankingValuesSnapshot,
} from '../../types/municipality-snapshot';

const rows = [
  { areaCode: '07545', areaName: '福島県 大熊町', prefectureCode: '07000', value: 81.0, rank: 1 },
  { areaCode: '13101', areaName: '東京都 千代田区', prefectureCode: '13000', value: 12.3, rank: 2 },
  { areaCode: '01100', areaName: '北海道 札幌市', prefectureCode: '01000', value: -0.4, rank: 3 },
  { areaCode: '17204', areaName: '石川県 輪島市', prefectureCode: '17000', value: -28.3, rank: 4 },
  { areaCode: '17205', areaName: '石川県 珠洲市', prefectureCode: '17000', value: -34.6, rank: 5 },
];
const values: MunicipalityRankingValuesSnapshot = {
  schemaVersion: 1, generatedAt: '2026-10-22T00:00:00.000Z', rankingKey: 'census-population-change-rate-5y',
  yearCode: '2025', yearName: '2025年', unit: '％', count: rows.length, values: rows,
};
const item = {
  schemaVersion: 1, generatedAt: '2026-10-22T00:00:00.000Z', rankingKey: 'census-population-change-rate-5y',
  title: '5年間の人口増減率', unit: '％', description: '', latestYear: { yearCode: '2025', yearName: '2025年' },
  entityPolicyKey: 'standard-municipality-v1', entityCount: 6, valueCount: 5, excludedEntityCount: 1,
  source: { name: '国勢調査', url: 'https://example.invalid' }, visualization: {} as never,
} as MunicipalityRankingItemSnapshot;

const content: MunicipalityAiContent = {
  schemaVersion: 1,
  rankingKey: 'census-population-change-rate-5y',
  basedOn: { yearCode: '2025', valueCount: 5 },
  summary:
    '2020年から2025年の5年間で人口が最も増えたのは大熊町で、増加率は81.0％でした。2位は千代田区の12.3％です。' +
    '反対に最も減ったのは珠洲市の34.6％減で、輪島市の28.3％減が続きます。比べた5自治体のうち、増えたのは2自治体です。',
  prefectureDistribution:
    '上位100位に入った自治体を県ごとに数えると、石川県が2自治体で最も多く、福島県・東京都・北海道が1自治体ずつでした。下位も同じ顔ぶれです。比べた自治体が少ないので、県ごとの傾向を読むには件数が足りません。',
  population: '順位を付けたのは5自治体です。政令指定都市の区など1自治体は、市全体の値と重なるため順位から外しています。値の欠けている自治体はありません。',
  faq: [
    { question: '人口が最も増えた市区町村は？', answer: '大熊町で、5年間の増加率は81.0％でした。' },
    { question: '人口が最も減った市区町村は？', answer: '珠洲市で、34.6％減でした。' },
    { question: '中央値はどれくらい？', answer: '比べた5自治体の中央値は-0.4％です。' },
  ],
};

describe('市区町村ランキングの解説の監査', () => {
  it('事実と本文に名前の出る自治体の値だけで書いた解説は通る', () => {
    expect(auditMunicipalityAiContent(content, item, values, ['5年間の人口増減率', '2020年→2025年']).blockers).toEqual([]);
  });

  it('値を 1 つ書き換えると根拠の無い数として止める', () => {
    const broken = { ...content, summary: content.summary.replace('81.0％', '18.0％') };
    expect(auditMunicipalityAiContent(broken, item, values, ['2020年→2025年']).blockers.join()).toContain('根拠の無い数「18.0」');
  });

  it('配信値の年か件数が変わったら書き直すまで公開しない', () => {
    const stale = { ...content, basedOn: { yearCode: '2020', valueCount: 5 } };
    expect(auditMunicipalityAiContent(stale, item, values).blockers.join()).toContain('書き直しが要る');
  });

  it('推測の表現を止める', () => {
    const speculative = { ...content, population: content.population + '多くは移住のためだろう。' };
    expect(auditMunicipalityAiContent(speculative, item, values, ['2020年→2025年']).blockers.join()).toContain('推測の表現');
  });

  it('事実は配信値だけから決まる (上位・下位・県の分布・増減の数)', () => {
    const facts = buildMunicipalityAiFacts(item, values);
    expect(facts.top[0]).toEqual({ rank: 1, areaName: '福島県 大熊町', value: 81 });
    expect(facts.bottom[facts.bottom.length - 1]?.areaName).toBe('石川県 珠洲市');
    expect(facts.positiveCount).toBe(2);
    expect(facts.prefectureInTop[0]).toEqual({ prefecture: '石川県', count: 2 });
    expect(facts.median).toBe(-0.4);
  });

  it('形の違う JSON を受け付けない', () => {
    expect(() => parseMunicipalityAiContent({ ...content, faq: [{ question: 'Q' }] })).toThrow();
    expect(parseMunicipalityAiContent(JSON.parse(JSON.stringify(content))).rankingKey).toBe(content.rankingKey);
  });

  it('R2 の解説は監査したときの values.json と同じ版のときだけ表示する', () => {
    const snapshot = parseMunicipalityAiContentSnapshot({ ...content, valuesGeneratedAt: values.generatedAt });
    expect(isMunicipalityAiContentCurrent(snapshot, values)).toBe(true);
    expect(isMunicipalityAiContentCurrent(snapshot, { ...values, generatedAt: '2026-11-01T00:00:00.000Z' })).toBe(false);
    expect(() => parseMunicipalityAiContentSnapshot(content)).toThrow();
  });
});
