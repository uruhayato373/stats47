import type { MetricConfig } from '../types';

export const naturalDisasterPartiallyDamagedHouses: MetricConfig = {
  key: 'natural-disaster-partially-damaged-houses',
  title: '自然災害による一部破損住家棟数',
  subtitle: '2024年（2025年4月1日現在）',
  description: '自然災害による一部破損住家棟数を都道府県別に比較する。',
  note: '2024年1月1日〜12月31日に発生した自然災害等の都道府県別被害。2025年4月1日現在に固定した消防白書の集計で、後の災害関連死認定等を反映した最新被害速報とは一致しない場合がある。自然災害は暴風・竜巻・豪雨・豪雪・洪水・崖崩れ・土石流・高潮・地震・津波・噴火・地滑り等。人数と住家棟数は合算しない。 住家の棟数であり、世帯数・非住家棟数とは異なる。全壊・半壊・一部破損の3区分だけを住家被害総数とは呼ばず、床上・床下浸水はこの指標に含めない。',
  unit: '棟',
  category: 'safetyenvironment',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '消防庁「消防白書」自然災害等の被害状況',
    url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
    config: {
      source: {
        name: '消防庁「消防白書」自然災害等の被害状況',
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
      },
      provenance: {
        url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.xlsx',
        sourceSha256:
          '7692f0d1b174c961dc4664b06ae3bb3368b2002064968d3c45bff60ae8f58162',
        publicationIndexUrl:
          'https://www.fdma.go.jp/publication/hakusho/r7/document/69468.html',
        table:
          '資料1-5-2 令和6年中に発生した自然災害等による都道府県別被害状況',
        valueColumn: 'I6:I52 一部破損',
        dataYear: '2024年（2025年4月1日現在）',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定XLSXの47県6〜52行と公式CSVの同セルを照合。負傷者のみ重傷E列+軽傷F列を合算。空欄を0へ変換しない。',
        verification:
          '人的/住家B:Kの480セルがXLSX/CSV一致。各列47県計=全国、関連死<=死者。欠測・重複・単位・原表年度を検査。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-fdma-core.mjs --write-local',
        releaseStatus: 'published-as-of',
        asOf: '2025-04-01',
        corroboration: {
          url: 'https://www.fdma.go.jp/publication/hakusho/r7/files/excel/siryo1-5-2.csv',
          sha256:
            '7bcb7d351971dd98fffacbddcaccc8c8903123b006929b4deb2c15a9e3246c38',
        },
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
  surveyScope: 'not-applicable',
  surveyScopeReason:
    '都道府県の自然災害による被害報告を消防白書に集計した行政業務報告',
  isActive: true,
};
