import type { MetricConfig } from '../types';

export const publicSchoolClosuresCumulative: MetricConfig = {
  key: 'public-school-closures-cumulative',
  title: '公立学校の廃校発生延べ数',
  subtitle: '2004〜2023年度累計',
  description: '公立学校の廃校発生延べ数を所在地の都道府県別に比較する。',
  note: '2024年5月1日現在に把握した、2004年度から2023年度までの公立学校の廃校発生延べ数。小学校・中学校・義務教育学校・高等学校・中等教育学校・特別支援学校を対象とする。単年度の廃校数、現存廃校施設数、学校数の前年差ではない。県別の廃校活用率はこの原表にないため算出しない。',
  unit: '校',
  category: 'educationsports',
  source: {
    kind: 'external',
    fetcherKey: 'manual',
    displayName: '文部科学省「廃校施設活用状況実態調査」',
    url: 'https://www.mext.go.jp/content/20250331-mxt_sisetujo-000012748_9.pdf',
    config: {
      source: {
        name: '文部科学省「廃校施設活用状況実態調査」',
        url: 'https://www.mext.go.jp/content/20250331-mxt_sisetujo-000012748_9.pdf',
      },
      provenance: {
        url: 'https://www.mext.go.jp/content/20250331-mxt_sisetujo-000012748_9.pdf',
        sourceSha256:
          '467cd6026518774cad3182949d63caf8bd94fd92335a05346f31776408fb790f',
        publicationIndexUrl:
          'https://www.mext.go.jp/a_menu/shotou/zyosei/yoyuu_00002.htm',
        table: '資料2 公立学校の都道府県別廃校発生数',
        valueColumn: 'PDF4ページ 廃校数列',
        dataYear: '2004〜2023年度累計（2024年5月1日把握）',
        accessedAt: '2026-09-10',
        extraction:
          'SHA固定PDF4ページをpdftotext -rawと-layoutの2通りで抽出。47県の廃校発生数と3校種内訳を照合。',
        verification:
          '47県一意・整数・全県の3校種合計=総数。全国総数8850、校種別5799/1835/1216と一致。単年度との差分は生成しない。',
        restore:
          'node --import tsx .claude/scripts/themes/ingest-education-core.mjs --write-local',
        releaseStatus: 'published-survey',
        geography: '施設・学校所在地の都道府県',
        periodStart: '2004-04-01',
        periodEnd: '2024-03-31',
        asOf: '2024-05-01',
        releasedAt: '2025-03-31',
        timeScope: 'cumulative-2004-2023-fiscal',
        pdfPage: 4,
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
