import type { MetricConfig } from '../types';

export const dailyStepsFemale20to64AgeAdjusted: MetricConfig = {
  key: 'daily-steps-female-20to64-age-adjusted',
  title: '女性の歩数（20〜64歳・年齢調整値）',
  description: '国民健康・栄養調査の20〜64歳女性の1日当たり歩数。',
  note: '2024年10〜11月の国民健康・栄養調査。20〜64歳を対象に、男女とも46歳の平均年齢へ調整した歩数。歩数計で測定した1日の歩数で、年間運動参加率ではない。標本調査のため95%信頼区間と指標別集計人数を専用表に併記し、順位差を有意差とみなさない。通常1道府県10地区、東京都15地区、石川県8地区（能登半島地震の影響）。20歳以上・59歳調整の野菜/食塩摂取量と母集団を混ぜない。',
  unit: '歩/日',
  category: 'socialsecurity',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '国民健康・栄養調査',
    url: 'https://www.mhlw.go.jp/content/001675215.pdf',
    config: {
      source: {
        name: '国民健康・栄養調査',
        url: 'https://www.mhlw.go.jp/content/001675215.pdf',
      },
      provenance: {
        url: 'https://www.mhlw.go.jp/content/001675215.pdf',
        sourceSha256:
          'ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1',
        publicationIndexUrl:
          'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/r6-houkoku_00001.html',
        table: '第69表 歩数の平均値（20〜64歳・性・都道府県別、年齢調整値）',
        valueColumn: 'PDF5頁 女性の平均値列（人数・95%CIは専用snapshotへ保持）',
        dataYear: '2024年10〜11月調査',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定の原表を県名・列・単位・期日を検査して抽出。全国行と再掲は47県系列に含めない。',
        verification:
          '47県欠測0。男女別の人数/平均/95%CIを抽出。CI下限<=平均<=上限、人数47県計=男性3365女性4032。全国平均は男性8564/女性7291の公式行を保持、県平均から計算しない。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-healthcare-core.mjs --write-local',
        governmentStatisticsCode: '00450171',
        sourceUnit: '歩/日',
        pdfPage: 5,
        ageAdjustment: '20〜64歳・男女とも46歳に調整',
        profileKey: 'app/themes/sports-participation/physical-activity.json',
        definitionUrl: 'https://www.mhlw.go.jp/content/001675210.pdf',
        definitionSha256:
          'f9062112308938b88e542656e872c0912ebe1e11750f583c1872d60f427c5643',
        denominator:
          '第69表20〜64歳男女別の当該指標集計人数（調整人口ではない）',
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2024,
    to: 2024,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  isActive: true,
};
