import type { MetricConfig } from '../types';

export const heatstrokeEmergencyTransports: MetricConfig = {
  key: 'heatstroke-emergency-transports',
  title: '熱中症救急搬送人員',
  subtitle: '2025年5〜9月',
  description: '熱中症救急搬送人員を都道府県別に比較する。',
  note: '2025年5月1日〜9月30日の確定値。消防機関が熱中症として救急搬送した人員を都道府県別に集計したもので、発症者全数、死亡者全数、居住人口の割合ではない。通年値や速報値を混ぜない。既存の年間気温・日照時間とは観測期間と地理単位が異なるため、同期間の因果比較にはしない。',
  unit: '人',
  category: 'safetyenvironment',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「熱中症による救急搬送状況」',
    url: 'https://www.fdma.go.jp/disaster/heatstroke/items/r7/heatstroke_nenpou_r7.pdf',
    config: {
      source: {
        name: '消防庁「熱中症による救急搬送状況」',
        url: 'https://www.fdma.go.jp/disaster/heatstroke/items/r7/heatstroke_nenpou_r7.pdf',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/disaster/heatstroke/items/r7/heatstroke_nenpou_r7.pdf',
        sourceSha256:
          '9b35222aedb8496f6292b5057106b916b7ac234cbfd0f4d5c1ea29e6dbcfaa47',
        publicationIndexUrl:
          'https://www.fdma.go.jp/disaster/heatstroke/post1.html',
        table:
          '資料4-2 都道府県別の年齢区分別、初診時における傷病程度別救急搬送人員',
        valueColumn: '資料4-2 年齢区分別の合計列',
        dataYear: '2025年5〜9月',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDFの資料4-2（PDF10ページ）をpdftotext -layoutで抽出。47県の年齢5区分合計と初診時傷病5区分合計が一致する搬送総数を取得。',
        verification:
          '全県/全国の年齢及び傷病区分合計、12列の47県計=全国、確定期間、単位、47県一意、欠測を検査。全国100510人。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        releaseStatus: 'final',
        asOf: '2025-09-30',
        pdfPage: 10,
        periodStart: '2025-05-01',
        periodEnd: '2025-09-30',
        releasedAt: '2025-10-29',
        timeScope: 'seasonal-May-September',
      },
    },
  },
  entities: ['prefecture'],
  years: {
    from: 2025,
    to: 2025,
  },
  yearFormat: 'calendar',
  display: {
    conversionFactor: 1,
    decimalPlaces: 0,
  },
  surveyScope: 'not-applicable',
  surveyScopeReason: '消防機関の熱中症救急搬送実績を集計した行政業務報告',
  isActive: true,
};
