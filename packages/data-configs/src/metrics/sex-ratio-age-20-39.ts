import type { MetricConfig } from '../types';

export const sexRatioAge2039: MetricConfig = {
  key: 'sex-ratio-age-20-39',
  title: '人口性比',
  subtitle: '20〜39歳人口',
  description: '20〜39歳の男性人口を女性人口で割り、100を掛けた値（女性100人あたりの男性の数）。国勢調査の5歳階級別人口（20〜24・25〜29・30〜34・35〜39歳）を男女別に合算して求める。',
  note: '100を超えると男性が多く、100を下回ると女性が多い。国勢調査年（2015年・2020年）のみ。年齢不詳を按分する前の原数値で、総務省統計局が公表する補完前の5歳階級別全国値と47県合計が一致することを確認した。外国人を含む総人口ベースで、学生や転勤による一時的な居住地の偏りも含む。',
  unit: '（女=100）',
  category: 'population',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '総務省統計局「国勢調査」（社会・人口統計体系の5歳階級別人口から算出）',
    url: 'https://www.stat.go.jp/data/kokusei/2020/kekka/pdf/outline_01.pdf',
    config: {
      source: {
        name: '総務省統計局「国勢調査」（社会・人口統計体系 A120501〜A120802）',
        url: 'https://www.stat.go.jp/data/kokusei/2020/kekka/pdf/outline_01.pdf',
      },
      provenance: {
        url: 'https://www.stat.go.jp/data/kokusei/2020/kekka/pdf/outline_01.pdf',
        publicationIndexUrl: 'https://www.stat.go.jp/data/kokusei/2020/kekka/index.html',
        table:
          '令和2年国勢調査 人口等基本集計 結果の概要「補完前の集計結果（原数値）年齢（5歳階級）別人口」（全国値の照合）／社会・人口統計体系（e-Stat 0000010101）A120501・A120502・A120601・A120602・A120701・A120702・A120801・A120802（県別値）',
        valueColumn: '20〜39歳の男性人口（4階級合計）÷女性人口（4階級合計）×100、小数第1位',
        dataYear: '2015年・2020年（国勢調査）',
        accessedAt: '2026-10-08',
        extraction:
          '既存metric theme-population-pyramid-{20-24,25-29,30-34,35-39}-{male,female}（社会・人口統計体系、e-Stat 0000010101）の県別観測値を2015年と2020年について合算し、男性合計÷女性合計×100を小数第1位で丸める。',
        verification:
          '2015年・2020年とも、4つの5歳階級それぞれで男女計の47県合計が、国勢調査の結果の概要にある補完前の全国値（2020年: 5,931,306 / 6,031,964 / 6,484,594 / 7,311,567、2015年: 5,968,127 / 6,409,612 / 7,290,878 / 8,316,157）と完全一致。47県に欠測なし。',
        restore: 'node .claude/scripts/data/fetch-census-sex-ratio-20-39.mjs',
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2015,
    to: 2020,
  },
  yearFormat: 'calendar',
  visualization: {
    colorScheme: 'interpolatePiYG',
    colorSchemeType: 'diverging',
    divergingMidpoint: 'custom',
    divergingMidpointValue: 100,
    isReversed: false,
    isSymmetrized: false,
  },
  display: {
    conversionFactor: 1,
    decimalPlaces: 1,
  },
  surveyId: 'census',
  isActive: true,
};
